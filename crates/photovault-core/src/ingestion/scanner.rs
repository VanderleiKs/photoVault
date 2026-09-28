//! Discovery + incremental diff of a library (PRD §8).
//!
//! Fast by design: no file is decoded here. New/modified files are queued for the
//! background ingest pipeline (`jobs`). Read-only on the library folder.

use super::control::ScanControl;
use super::local::LocalFolderSource;
use super::metadata;
use super::source::{MediaSource, SourceEntry};
use crate::catalog::{Library, libraries};
use crate::error::{Error, Result};
use crate::jobs;
use chrono::{DateTime, Utc};
use serde::Serialize;
use specta::Type;
use sqlx::{Sqlite, SqlitePool, Transaction};
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

const PROGRESS_INTERVAL: Duration = Duration::from_millis(150);
/// exFAT/FAT32 store mtime with 10 ms / 2 s granularity.
const MTIME_TOLERANCE_SECS: i64 = 2;
/// Rows written per transaction.
const BATCH: usize = 500;

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
    /// Catalogued files no longer found (kept as `missing`, never deleted).
    pub missing_files: u32,
    /// Previously missing files that are back.
    pub restored_files: u32,
    pub errors: u32,
    pub cancelled: bool,
}

/// Receives progress updates (already throttled).
pub trait ScanObserver: Send + Sync {
    fn on_progress(&self, progress: &ScanProgress);
}

#[derive(Clone)]
pub struct ScanContext {
    pub pool: SqlitePool,
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

/// Scan a library. The caller must hold the `ScanGuard` from `ctx.control`
/// and should wake the job runner afterwards.
pub async fn scan(
    ctx: &ScanContext,
    library: &Library,
    observer: Arc<dyn ScanObserver>,
) -> Result<ScanSummary> {
    let source = LocalFolderSource::new(&library.root_path)?;
    tracing::info!("Starting scan of {} at {}", library.id, library.root_path);
    let started = Instant::now();

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
    tracing::info!(
        "Found {} media files in {:?}",
        summary.total,
        started.elapsed()
    );

    // Pass 2: diff against the catalog, written in batches.
    let known = known_files(&ctx.pool, &library.id).await?;

    // An unmounted drive often leaves an empty mount-point folder behind: never
    // turn a whole library into "missing" because of that.
    if entries.is_empty() && known.values().any(|k| !k.missing) {
        return Err(Error::PathNotAccessible(format!(
            "{} (a pasta está vazia; o disco pode não estar montado)",
            library.root_path
        )));
    }
    let mut seen: HashSet<&str> = HashSet::with_capacity(entries.len());
    let mut tx = ctx.pool.begin().await?;

    for (index, entry) in entries.iter().enumerate() {
        if ctx.control.is_cancelled() {
            summary.cancelled = true;
            break;
        }
        summary.processed += 1;
        seen.insert(&entry.relative_path);
        progress.emit(
            ScanPhase::Indexing,
            summary.processed,
            summary.total,
            &entry.relative_path,
            false,
        );

        let result = match known.get(&entry.relative_path) {
            Some(k) if !k.changed(entry) => {
                if k.missing {
                    summary.restored_files += 1;
                    restore(&mut tx, &k.id).await
                } else {
                    Ok(())
                }
            }
            Some(k) => {
                summary.modified_files += 1;
                if k.missing {
                    summary.restored_files += 1;
                }
                update(&mut tx, &library.id, &k.id, entry).await
            }
            None => {
                summary.new_files += 1;
                insert(&mut tx, &library.id, entry).await
            }
        };
        if let Err(e) = result {
            tracing::warn!("Failed to index {}: {e}", entry.relative_path);
            summary.errors += 1;
        }

        if (index + 1) % BATCH == 0 {
            tx.commit().await?;
            tx = ctx.pool.begin().await?;
        }
    }

    // Files that disappeared. Only on a complete scan: a cancelled one saw a subset.
    if !summary.cancelled {
        let gone: Vec<&str> = known
            .iter()
            .filter(|(path, k)| !k.missing && !seen.contains(path.as_str()))
            .map(|(_, k)| k.id.as_str())
            .collect();
        for id in &gone {
            sqlx::query("UPDATE media SET status = 'missing', updated_at = ?1 WHERE id = ?2")
                .bind(Utc::now().to_rfc3339())
                .bind(id)
                .execute(&mut *tx)
                .await?;
        }
        summary.missing_files = gone.len() as u32;
    }
    tx.commit().await?;

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
        "Scan {} in {:?}: total {}, new {}, modified {}, missing {}, restored {}, errors {}",
        if summary.cancelled {
            "cancelled"
        } else {
            "complete"
        },
        started.elapsed(),
        summary.total,
        summary.new_files,
        summary.modified_files,
        summary.missing_files,
        summary.restored_files,
        summary.errors
    );
    Ok(summary)
}

struct Known {
    id: String,
    size: i64,
    mtime: Option<String>,
    missing: bool,
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
    let rows: Vec<(String, String, i64, Option<String>, String)> = sqlx::query_as(
        "SELECT relative_path, id, file_size, file_mtime, status FROM media
         WHERE library_id = ?1 AND status IN ('active', 'missing')",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|(path, id, size, mtime, status)| {
            let missing = status == "missing";
            (
                path,
                Known {
                    id,
                    size,
                    mtime,
                    missing,
                },
            )
        })
        .collect())
}

type Tx = Transaction<'static, Sqlite>;

async fn insert(tx: &mut Tx, library_id: &str, entry: &SourceEntry) -> Result<()> {
    let id = uuid::Uuid::now_v7().to_string();
    let now = Utc::now().to_rfc3339();
    // Provisional date until the ingest job reads EXIF.
    let captured_at = entry
        .modified
        .as_deref()
        .and_then(metadata::mtime_as_capture);

    sqlx::query(
        "INSERT INTO media (
            id, library_id, relative_path, filename, extension, media_type,
            file_size, file_mtime, captured_at, date_source, indexed_at, updated_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'mtime', ?10, ?10)",
    )
    .bind(&id)
    .bind(library_id)
    .bind(&entry.relative_path)
    .bind(&entry.filename)
    .bind(&entry.extension)
    .bind(entry.media_type.as_str())
    .bind(entry.size as i64)
    .bind(&entry.modified)
    .bind(captured_at)
    .bind(&now)
    .execute(&mut **tx)
    .await?;

    jobs::enqueue_ingest(&mut **tx, library_id, &id).await
}

async fn update(tx: &mut Tx, library_id: &str, media_id: &str, entry: &SourceEntry) -> Result<()> {
    // Content changed: hashes are stale until the job recomputes them.
    sqlx::query(
        "UPDATE media
         SET file_size = ?1, file_mtime = ?2, sha256 = NULL, phash = NULL,
             status = 'active', updated_at = ?3
         WHERE id = ?4",
    )
    .bind(entry.size as i64)
    .bind(&entry.modified)
    .bind(Utc::now().to_rfc3339())
    .bind(media_id)
    .execute(&mut **tx)
    .await?;

    jobs::enqueue_ingest(&mut **tx, library_id, media_id).await
}

async fn restore(tx: &mut Tx, media_id: &str) -> Result<()> {
    sqlx::query("UPDATE media SET status = 'active', updated_at = ?1 WHERE id = ?2")
        .bind(Utc::now().to_rfc3339())
        .bind(media_id)
        .execute(&mut **tx)
        .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::catalog::MediaType;
    use crate::db::tests::{temp_dir, test_db};
    use std::path::Path;

    #[derive(Default)]
    pub(crate) struct Recorder(pub Mutex<Vec<ScanProgress>>);

    impl ScanObserver for Recorder {
        fn on_progress(&self, p: &ScanProgress) {
            self.0.lock().unwrap().push(p.clone());
        }
    }

    pub(crate) fn write_jpeg(path: &Path, w: u32, h: u32) {
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        // Noise keeps even small test images above `MIN_FILE_SIZE` once compressed.
        image::RgbImage::from_fn(w.max(96), h.max(96), |x, y| {
            let n = (x.wrapping_mul(7919) ^ y.wrapping_mul(104_729)).wrapping_mul(2_654_435_761);
            image::Rgb([(n >> 24) as u8, (n >> 16) as u8, (x + y) as u8])
        })
        .save(path)
        .unwrap();
    }

    pub(crate) fn write_bytes(path: &Path, bytes: &[u8]) {
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(path, bytes).unwrap();
    }

    async fn paths(pool: &SqlitePool, library_id: &str, status: &str) -> Vec<String> {
        sqlx::query_scalar(
            "SELECT relative_path FROM media WHERE library_id = ?1 AND status = ?2 ORDER BY relative_path",
        )
        .bind(library_id)
        .bind(status)
        .fetch_all(pool)
        .await
        .unwrap()
    }

    async fn queued(pool: &SqlitePool) -> i64 {
        sqlx::query_scalar("SELECT COUNT(*) FROM jobs WHERE status = 'queued'")
            .fetch_one(pool)
            .await
            .unwrap()
    }

    #[tokio::test]
    async fn diff_detects_new_modified_missing_and_restored() {
        let (pool, dir) = test_db().await;
        let root = temp_dir();
        write_jpeg(&root.join("celular/2024/IMG_0001.jpg"), 64, 48);
        write_jpeg(&root.join("camera/foto.png"), 32, 32);
        write_bytes(&root.join("corrompida.jpg"), &[7u8; 4096]);
        write_bytes(&root.join("video.mp4"), &[0u8; 2048]);
        write_bytes(&root.join("notas.txt"), &[1u8; 4096]); // unsupported extension
        write_bytes(&root.join("icone.png"), &[1u8; 100]); // too small
        write_bytes(&root.join("._IMG_0001.jpg"), &[1u8; 4096]); // AppleDouble
        write_jpeg(&root.join(".photovault-trash/antiga.jpg"), 64, 64);
        write_jpeg(&root.join(".thumbnails/x.jpg"), 64, 64);
        write_jpeg(&root.join("$RECYCLE.BIN/y.jpg"), 64, 64);

        let ctx = ScanContext {
            pool: pool.clone(),
            control: Arc::new(ScanControl::default()),
        };
        let lib = libraries::create(&pool, "Teste", root.to_str().unwrap())
            .await
            .unwrap();
        let recorder = Arc::new(Recorder::default());

        let s = scan(&ctx, &lib, recorder.clone()).await.unwrap();
        assert_eq!((s.total, s.new_files, s.errors), (4, 4, 0));
        assert_eq!(
            paths(&pool, &lib.id, "active").await,
            [
                "camera/foto.png",
                "celular/2024/IMG_0001.jpg",
                "corrompida.jpg",
                "video.mp4"
            ]
        );
        assert_eq!(
            queued(&pool).await,
            4,
            "every new file is queued for ingest"
        );
        let progress = recorder.0.lock().unwrap().clone();
        assert_eq!(progress.first().unwrap().phase, ScanPhase::Discovering);

        // Unchanged rescan: nothing to do.
        sqlx::query("UPDATE jobs SET status = 'done'")
            .execute(&pool)
            .await
            .unwrap();
        let s = scan(&ctx, &lib, recorder.clone()).await.unwrap();
        assert_eq!((s.new_files, s.modified_files, s.missing_files), (0, 0, 0));
        assert_eq!(queued(&pool).await, 0);

        // Modified (size) → requeued; deleted → missing (kept in the catalog).
        write_jpeg(&root.join("celular/2024/IMG_0001.jpg"), 200, 150);
        std::fs::remove_file(root.join("camera/foto.png")).unwrap();
        let s = scan(&ctx, &lib, recorder.clone()).await.unwrap();
        assert_eq!((s.modified_files, s.missing_files), (1, 1));
        assert_eq!(queued(&pool).await, 1);
        assert_eq!(paths(&pool, &lib.id, "missing").await, ["camera/foto.png"]);

        // Back again → restored with the same row.
        write_jpeg(&root.join("camera/foto.png"), 32, 32);
        let before: Vec<String> = sqlx::query_scalar("SELECT id FROM media ORDER BY id")
            .fetch_all(&pool)
            .await
            .unwrap();
        let s = scan(&ctx, &lib, recorder.clone()).await.unwrap();
        assert!(s.restored_files == 1 && s.missing_files == 0, "{s:?}");
        let after: Vec<String> = sqlx::query_scalar("SELECT id FROM media ORDER BY id")
            .fetch_all(&pool)
            .await
            .unwrap();
        assert_eq!(before, after);

        // An empty folder (unmounted drive) is refused instead of marking everything missing.
        let empty = temp_dir();
        let moved = libraries::relocate(&pool, &lib.id, empty.to_str().unwrap()).await;
        assert!(
            moved.is_err(),
            "relocation check already refuses empty folders"
        );
        let empty_lib = Library {
            root_path: empty.to_str().unwrap().into(),
            ..lib.clone()
        };
        assert!(matches!(
            scan(&ctx, &empty_lib, recorder.clone()).await,
            Err(Error::PathNotAccessible(_))
        ));
        assert!(paths(&pool, &lib.id, "missing").await.is_empty());

        // A cancelled scan never marks files missing and keeps last_scan_at.
        std::fs::remove_file(root.join("video.mp4")).unwrap();
        let last = libraries::get(&pool, &lib.id).await.unwrap().last_scan_at;
        ctx.control.cancel();
        let s = scan(&ctx, &lib, recorder).await.unwrap();
        assert!(s.cancelled);
        assert!(paths(&pool, &lib.id, "missing").await.is_empty());
        assert_eq!(
            libraries::get(&pool, &lib.id).await.unwrap().last_scan_at,
            last
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
            missing: false,
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
