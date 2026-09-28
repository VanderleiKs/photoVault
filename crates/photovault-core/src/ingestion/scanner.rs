//! Discovery + incremental indexing of a library (PRD §8).
//!
//! Read-only on the library: nothing is ever written inside the source folder.

use super::control::ScanControl;
use super::local::LocalFolderSource;
use super::metadata;
use super::source::{MediaSource, SourceEntry};
use crate::catalog::{Library, MediaType, libraries};
use crate::error::Result;
use crate::thumbnails;
use chrono::{DateTime, Utc};
use serde::Serialize;
use specta::Type;
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

const PROGRESS_INTERVAL: Duration = Duration::from_millis(150);
/// exFAT/FAT32 store mtime with 10 ms / 2 s granularity.
const MTIME_TOLERANCE_SECS: i64 = 2;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum ScanPhase {
    Discovering,
    Indexing,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ScanProgress {
    pub library_id: String,
    pub phase: ScanPhase,
    pub processed: u32,
    /// 0 while discovering (total still unknown).
    pub total: u32,
    pub current_path: String,
}

#[derive(Debug, Clone, Default, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ScanSummary {
    pub library_id: String,
    pub total: u32,
    pub processed: u32,
    pub new_files: u32,
    pub modified_files: u32,
    pub errors: u32,
    pub cancelled: bool,
}

/// Receives progress updates (already throttled).
pub trait ScanObserver: Send + Sync {
    fn on_progress(&self, progress: &ScanProgress);
}

/// Everything a scan needs besides the library itself.
#[derive(Clone)]
pub struct ScanContext {
    pub pool: SqlitePool,
    pub thumbnails_dir: PathBuf,
    pub control: Arc<ScanControl>,
}

/// Throttles observer calls to at most one per `PROGRESS_INTERVAL`.
struct Throttle {
    observer: Arc<dyn ScanObserver>,
    library_id: String,
    last: Mutex<Option<Instant>>,
}

impl Throttle {
    fn emit(&self, phase: ScanPhase, processed: u32, total: u32, current: &str, force: bool) {
        let mut last = self.last.lock().unwrap_or_else(|e| e.into_inner());
        if !force && last.is_some_and(|t| t.elapsed() < PROGRESS_INTERVAL) {
            return;
        }
        *last = Some(Instant::now());
        self.observer.on_progress(&ScanProgress {
            library_id: self.library_id.clone(),
            phase,
            processed,
            total,
            current_path: current.to_string(),
        });
    }
}

/// Scan a library. The caller must hold the `ScanGuard` from `ctx.control`.
/// Per-file failures are counted in `errors` and never stop the scan.
pub async fn scan(
    ctx: &ScanContext,
    library: &Library,
    observer: Arc<dyn ScanObserver>,
) -> Result<ScanSummary> {
    let source = LocalFolderSource::new(&library.root_path)?;
    tracing::info!("Starting scan of {} at {}", library.id, library.root_path);

    let progress = Arc::new(Throttle {
        observer,
        library_id: library.id.clone(),
        last: Mutex::new(None),
    });
    progress.emit(ScanPhase::Discovering, 0, 0, "", true);

    let mut summary = ScanSummary {
        library_id: library.id.clone(),
        ..Default::default()
    };

    // Pass 1: discovery (blocking filesystem walk).
    let discovered = {
        let control = Arc::clone(&ctx.control);
        let progress = Arc::clone(&progress);
        tokio::task::spawn_blocking(move || {
            let mut entries = Vec::new();
            for entry in source.entries() {
                if control.is_cancelled() {
                    return None;
                }
                progress.emit(
                    ScanPhase::Discovering,
                    entries.len() as u32,
                    0,
                    &entry.relative_path,
                    false,
                );
                entries.push(entry);
            }
            Some(entries)
        })
        .await?
    };

    let Some(entries) = discovered else {
        summary.cancelled = true;
        return Ok(summary);
    };
    summary.total = entries.len() as u32;
    tracing::info!("Found {} media files", summary.total);

    let known = known_files(&ctx.pool, &library.id).await?;

    // Pass 2: incremental indexing.
    for entry in entries {
        if ctx.control.is_cancelled() {
            summary.cancelled = true;
            break;
        }
        summary.processed += 1;
        progress.emit(
            ScanPhase::Indexing,
            summary.processed,
            summary.total,
            &entry.relative_path,
            false,
        );

        let result = match known.get(&entry.relative_path) {
            Some(k) if !k.changed(&entry) => {
                // Unchanged: only repair a missing thumbnail.
                ensure_thumbnail(ctx, &k.id, &entry, false).await;
                Ok(())
            }
            Some(k) => update(ctx, &k.id, &entry)
                .await
                .map(|_| summary.modified_files += 1),
            None => insert(ctx, &library.id, &entry)
                .await
                .map(|_| summary.new_files += 1),
        };

        if let Err(e) = result {
            tracing::warn!("Failed to index {}: {e}", entry.relative_path);
            summary.errors += 1;
        }
    }

    progress.emit(
        ScanPhase::Indexing,
        summary.processed,
        summary.total,
        "",
        true,
    );
    if !summary.cancelled {
        libraries::touch_last_scan(&ctx.pool, &library.id).await?;
    }

    tracing::info!(
        "Scan {}: total {}, new {}, modified {}, errors {}",
        if summary.cancelled {
            "cancelled"
        } else {
            "complete"
        },
        summary.total,
        summary.new_files,
        summary.modified_files,
        summary.errors
    );
    Ok(summary)
}

struct Known {
    id: String,
    size: i64,
    mtime: Option<String>,
}

impl Known {
    fn changed(&self, entry: &SourceEntry) -> bool {
        if self.size != entry.size as i64 {
            return true;
        }
        match (
            self.mtime.as_deref().and_then(parse),
            entry.modified.as_deref().and_then(parse),
        ) {
            (Some(a), Some(b)) => (a - b).num_seconds().abs() > MTIME_TOLERANCE_SECS,
            _ => false,
        }
    }
}

fn parse(s: &str) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(s)
        .ok()
        .map(|d| d.with_timezone(&Utc))
}

async fn known_files(pool: &SqlitePool, library_id: &str) -> Result<HashMap<String, Known>> {
    let rows: Vec<(String, String, i64, Option<String>)> = sqlx::query_as(
        "SELECT relative_path, id, file_size, file_mtime FROM media WHERE library_id = ?1",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|(path, id, size, mtime)| (path, Known { id, size, mtime }))
        .collect())
}

/// Dimensions off the async runtime.
async fn dimensions(entry: &SourceEntry) -> (Option<i64>, Option<i64>) {
    match (&entry.local_path, entry.media_type) {
        (Some(path), MediaType::Image) => {
            let path = path.clone();
            tokio::task::spawn_blocking(move || metadata::image_dimensions(&path))
                .await
                .unwrap_or((None, None))
        }
        _ => (None, None),
    }
}

/// Thumbnail off the async runtime. Failures (corrupt/unsupported files) are logged, not fatal.
async fn ensure_thumbnail(ctx: &ScanContext, media_id: &str, entry: &SourceEntry, force: bool) {
    let (Some(path), MediaType::Image) = (&entry.local_path, entry.media_type) else {
        return;
    };
    let (dir, id, path) = (
        ctx.thumbnails_dir.clone(),
        media_id.to_string(),
        path.clone(),
    );
    let result = tokio::task::spawn_blocking(move || {
        thumbnails::generate(&dir, &id, &path, thumbnails::GRID_SIZE, force)
    })
    .await;

    match result {
        Ok(Ok(())) => {}
        Ok(Err(e)) => tracing::warn!("No thumbnail for {}: {e}", entry.relative_path),
        Err(e) => tracing::warn!("Thumbnail task failed for {}: {e}", entry.relative_path),
    }
}

async fn insert(ctx: &ScanContext, library_id: &str, entry: &SourceEntry) -> Result<()> {
    let id = uuid::Uuid::now_v7().to_string();
    let now = Utc::now().to_rfc3339();
    let (width, height) = dimensions(entry).await;

    // Until EXIF lands (phase 2) the capture date is the file's mtime.
    sqlx::query(
        "INSERT INTO media (
            id, library_id, relative_path, filename, extension, media_type,
            file_size, file_mtime, width, height, captured_at, date_source,
            indexed_at, updated_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?8, 'mtime', ?11, ?11)",
    )
    .bind(&id)
    .bind(library_id)
    .bind(&entry.relative_path)
    .bind(&entry.filename)
    .bind(&entry.extension)
    .bind(entry.media_type.as_str())
    .bind(entry.size as i64)
    .bind(&entry.modified)
    .bind(width)
    .bind(height)
    .bind(&now)
    .execute(&ctx.pool)
    .await?;

    ensure_thumbnail(ctx, &id, entry, false).await;
    Ok(())
}

async fn update(ctx: &ScanContext, media_id: &str, entry: &SourceEntry) -> Result<()> {
    let (width, height) = dimensions(entry).await;

    // Content changed: derived data (hashes) is no longer valid.
    sqlx::query(
        "UPDATE media
         SET file_size = ?1, file_mtime = ?2, width = ?3, height = ?4,
             captured_at = CASE WHEN date_source = 'mtime' THEN ?2 ELSE captured_at END,
             sha256 = NULL, phash = NULL, status = 'active', updated_at = ?5
         WHERE id = ?6",
    )
    .bind(entry.size as i64)
    .bind(&entry.modified)
    .bind(width)
    .bind(height)
    .bind(Utc::now().to_rfc3339())
    .bind(media_id)
    .execute(&ctx.pool)
    .await?;

    ensure_thumbnail(ctx, media_id, entry, true).await;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::tests::{temp_dir, test_db};
    use std::collections::BTreeMap;
    use std::path::Path;

    #[derive(Default)]
    struct Recorder(Mutex<Vec<ScanProgress>>);

    impl ScanObserver for Recorder {
        fn on_progress(&self, p: &ScanProgress) {
            self.0.lock().unwrap().push(p.clone());
        }
    }

    fn write_jpeg(path: &Path, w: u32, h: u32) {
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        image::RgbImage::from_fn(w, h, |x, y| image::Rgb([x as u8, y as u8, 128]))
            .save(path)
            .unwrap();
    }

    fn write_bytes(path: &Path, bytes: &[u8]) {
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(path, bytes).unwrap();
    }

    /// Every file under `root` with its content, to prove originals are untouched.
    fn snapshot(root: &Path) -> BTreeMap<PathBuf, Vec<u8>> {
        walkdir::WalkDir::new(root)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
            .map(|e| (e.path().to_path_buf(), std::fs::read(e.path()).unwrap()))
            .collect()
    }

    async fn paths(pool: &SqlitePool, library_id: &str) -> Vec<String> {
        sqlx::query_scalar(
            "SELECT relative_path FROM media WHERE library_id = ?1 ORDER BY relative_path",
        )
        .bind(library_id)
        .fetch_all(pool)
        .await
        .unwrap()
    }

    async fn id_of(pool: &SqlitePool, relative_path: &str) -> String {
        sqlx::query_scalar("SELECT id FROM media WHERE relative_path = ?1")
            .bind(relative_path)
            .fetch_one(pool)
            .await
            .unwrap()
    }

    #[tokio::test]
    async fn scan_is_incremental_and_never_touches_originals() {
        let (pool, dir) = test_db().await;
        let root = temp_dir();
        write_jpeg(&root.join("celular/2024/IMG_0001.jpg"), 64, 48);
        write_jpeg(&root.join("camera/foto.png"), 32, 32);
        write_bytes(&root.join("corrompida.jpg"), b"not really a jpeg");
        write_bytes(&root.join("video.mp4"), b"fake video");
        write_bytes(&root.join("notas.txt"), b"ignored extension");
        write_jpeg(&root.join(".photovault-trash/antiga.jpg"), 8, 8);
        let original = snapshot(&root);

        let ctx = ScanContext {
            pool: pool.clone(),
            thumbnails_dir: dir.join("thumbnails"),
            control: Arc::new(ScanControl::default()),
        };
        let lib = libraries::create(&pool, "Teste", root.to_str().unwrap())
            .await
            .unwrap();
        let recorder = Arc::new(Recorder::default());

        // First scan: supported files only, ignored dirs skipped, corrupt file not fatal.
        let s = scan(&ctx, &lib, recorder.clone()).await.unwrap();
        assert_eq!(
            (s.total, s.new_files, s.errors, s.cancelled),
            (4, 4, 0, false)
        );
        assert_eq!(
            paths(&pool, &lib.id).await,
            [
                "camera/foto.png",
                "celular/2024/IMG_0001.jpg",
                "corrompida.jpg",
                "video.mp4"
            ]
        );
        let img = id_of(&pool, "celular/2024/IMG_0001.jpg").await;
        let img_thumb = thumbnails::path(&ctx.thumbnails_dir, &img, thumbnails::GRID_SIZE);
        assert!(img_thumb.exists());
        let bad = id_of(&pool, "corrompida.jpg").await;
        assert!(!thumbnails::path(&ctx.thumbnails_dir, &bad, thumbnails::GRID_SIZE).exists());
        assert_eq!(snapshot(&root), original, "scan modified the library");

        let progress = recorder.0.lock().unwrap().clone();
        assert_eq!(progress.first().unwrap().phase, ScanPhase::Discovering);
        let last = progress.last().unwrap();
        assert_eq!(
            (last.phase, last.processed, last.total),
            (ScanPhase::Indexing, 4, 4)
        );

        // Second scan: nothing new; a deleted thumbnail is regenerated.
        std::fs::remove_file(&img_thumb).unwrap();
        let s = scan(&ctx, &lib, recorder.clone()).await.unwrap();
        assert_eq!((s.new_files, s.modified_files), (0, 0));
        assert!(img_thumb.exists());
        assert_eq!(id_of(&pool, "celular/2024/IMG_0001.jpg").await, img);

        // Changed content (size) is updated in place, keeping the id.
        write_jpeg(&root.join("celular/2024/IMG_0001.jpg"), 200, 150);
        let s = scan(&ctx, &lib, recorder.clone()).await.unwrap();
        assert_eq!((s.new_files, s.modified_files), (0, 1));
        let width: Option<i64> = sqlx::query_scalar("SELECT width FROM media WHERE id = ?1")
            .bind(&img)
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(width, Some(200));

        // Cancelled scan reports it and does not bump last_scan_at.
        let before = libraries::get(&pool, &lib.id).await.unwrap().last_scan_at;
        ctx.control.cancel();
        let s = scan(&ctx, &lib, recorder).await.unwrap();
        assert!(s.cancelled);
        assert_eq!(
            libraries::get(&pool, &lib.id).await.unwrap().last_scan_at,
            before
        );

        let _ = std::fs::remove_dir_all(dir);
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn mtime_within_tolerance_is_unchanged() {
        let known = Known {
            id: "x".into(),
            size: 10,
            mtime: Some("2025-01-01T10:00:00Z".into()),
        };
        let entry = |size, modified: &str| SourceEntry {
            relative_path: "a.jpg".into(),
            filename: "a.jpg".into(),
            extension: "jpg".into(),
            media_type: MediaType::Image,
            size,
            modified: Some(modified.into()),
            local_path: None,
        };
        assert!(!known.changed(&entry(10, "2025-01-01T10:00:01.500Z")));
        assert!(known.changed(&entry(10, "2025-01-01T10:00:05Z")));
        assert!(known.changed(&entry(11, "2025-01-01T10:00:00Z")));
    }
}
