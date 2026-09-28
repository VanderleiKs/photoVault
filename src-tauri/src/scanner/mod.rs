use crate::app::AppState;
use crate::catalog;
use crate::metadata;
use crate::thumbnails;
use chrono::Utc;
use serde::Serialize;
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::path::{Component, Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Runtime};
use walkdir::WalkDir;

const SUPPORTED_IMAGE_EXTENSIONS: &[&str] = &[
    "jpg", "jpeg", "png", "webp", "heic", "heif", "tif", "tiff", "gif", "bmp",
];

const SUPPORTED_VIDEO_EXTENSIONS: &[&str] = &["mp4", "mov", "mkv", "avi", "webm"];

/// Directories that are never indexed (system folders, PhotoVault's own trash).
const IGNORED_DIR_NAMES: &[&str] = &[
    ".photovault-trash",
    "$RECYCLE.BIN",
    "System Volume Information",
    "@eaDir",
];

const PROGRESS_INTERVAL: Duration = Duration::from_millis(150);

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ScanPhase {
    Discovering,
    Indexing,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanProgress {
    pub library_id: String,
    pub phase: ScanPhase,
    pub processed: u64,
    /// 0 while discovering (total still unknown).
    pub total: u64,
    pub current_path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanComplete {
    pub library_id: String,
    pub total_processed: u64,
    pub new_files: u64,
    pub modified_files: u64,
    pub errors: u64,
    pub cancelled: bool,
}

struct DiscoveredFile {
    full_path: PathBuf,
    /// Relative to the library root, always with `/` separators.
    relative_path: String,
    filename: String,
    size: u64,
    media_type: &'static str,
}

/// Emits `scan_progress` at most every `PROGRESS_INTERVAL`.
struct ProgressEmitter<'a, R: Runtime> {
    app: &'a AppHandle<R>,
    library_id: &'a str,
    last: Option<Instant>,
}

impl<R: Runtime> ProgressEmitter<'_, R> {
    fn emit(&mut self, phase: ScanPhase, processed: u64, total: u64, current: &str, force: bool) {
        if !force && self.last.is_some_and(|t| t.elapsed() < PROGRESS_INTERVAL) {
            return;
        }
        self.last = Some(Instant::now());
        let _ = self.app.emit(
            "scan_progress",
            ScanProgress {
                library_id: self.library_id.to_string(),
                phase,
                processed,
                total,
                current_path: current.to_string(),
            },
        );
    }
}

/// Scan a library directory and index all media files.
/// Always emits `scan_complete` unless an error is returned.
pub async fn scan_library<R: Runtime>(
    app: &AppHandle<R>,
    state: &Arc<AppState>,
    library_id: &str,
    root_path: &str,
) -> Result<(), String> {
    let root = PathBuf::from(root_path);
    if !root.is_dir() {
        return Err(format!(
            "A pasta da biblioteca não existe ou não está acessível: {root_path}"
        ));
    }

    tracing::info!("Starting scan of library {} at {}", library_id, root_path);
    let mut progress = ProgressEmitter {
        app,
        library_id,
        last: None,
    };
    progress.emit(ScanPhase::Discovering, 0, 0, "", true);

    // Pass 1: discovery (blocking filesystem walk).
    let discover_root = root.clone();
    let discover_app = app.clone();
    let discover_state = Arc::clone(state);
    let discover_library_id = library_id.to_string();
    let discovered = tauri::async_runtime::spawn_blocking(move || {
        let mut emitter = ProgressEmitter {
            app: &discover_app,
            library_id: &discover_library_id,
            last: None,
        };
        discover_files(&discover_root, &discover_state, &mut emitter)
    })
    .await
    .map_err(|e| e.to_string())?;

    let Some(files) = discovered else {
        return finish(app, state, library_id, 0, 0, 0, 0, true).await;
    };

    let total = files.len() as u64;
    tracing::info!("Found {} media files", total);

    // Known files for the incremental diff: relative_path -> (id, size).
    let known: HashMap<String, (String, i64)> = sqlx::query_as::<_, (String, String, i64)>(
        "SELECT relative_path, id, file_size FROM photos WHERE library_id = ?1",
    )
    .bind(library_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())?
    .into_iter()
    .map(|(path, id, size)| (path, (id, size)))
    .collect();

    // Pass 2: indexing.
    let mut processed = 0u64;
    let mut new_count = 0u64;
    let mut modified_count = 0u64;
    let mut error_count = 0u64;
    let mut cancelled = false;

    for file in files {
        if state.scan.is_cancelled() {
            cancelled = true;
            break;
        }

        processed += 1;
        progress.emit(
            ScanPhase::Indexing,
            processed,
            total,
            &file.relative_path,
            false,
        );

        let result = match known.get(&file.relative_path) {
            Some((id, size)) if *size == file.size as i64 => {
                // Unchanged: only repair a missing thumbnail.
                ensure_thumbnail(state, id, &file, false).await;
                Ok(false)
            }
            Some((id, _)) => update_photo(state, id, &file).await.map(|_| {
                modified_count += 1;
                true
            }),
            None => insert_photo(state, library_id, &file).await.map(|_| {
                new_count += 1;
                true
            }),
        };

        if let Err(e) = result {
            tracing::warn!("Failed to index {}: {}", file.relative_path, e);
            error_count += 1;
        }
    }

    progress.emit(ScanPhase::Indexing, processed, total, "", true);

    tracing::info!(
        "Scan {}. Total: {}, New: {}, Modified: {}, Errors: {}",
        if cancelled { "cancelled" } else { "complete" },
        total,
        new_count,
        modified_count,
        error_count
    );

    finish(
        app,
        state,
        library_id,
        processed,
        new_count,
        modified_count,
        error_count,
        cancelled,
    )
    .await
}

#[allow(clippy::too_many_arguments)]
async fn finish<R: Runtime>(
    app: &AppHandle<R>,
    state: &AppState,
    library_id: &str,
    processed: u64,
    new_files: u64,
    modified_files: u64,
    errors: u64,
    cancelled: bool,
) -> Result<(), String> {
    if !cancelled {
        catalog::update_last_scan(&state.pool, library_id)
            .await
            .map_err(|e| e.to_string())?;
    }

    let _ = app.emit(
        "scan_complete",
        ScanComplete {
            library_id: library_id.to_string(),
            total_processed: processed,
            new_files,
            modified_files,
            errors,
            cancelled,
        },
    );
    Ok(())
}

/// Walk the library. Returns `None` if the scan was cancelled.
fn discover_files<R: Runtime>(
    root: &Path,
    state: &AppState,
    progress: &mut ProgressEmitter<'_, R>,
) -> Option<Vec<DiscoveredFile>> {
    let mut files = Vec::new();

    let walker = WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| {
            !(e.file_type().is_dir()
                && IGNORED_DIR_NAMES
                    .iter()
                    .any(|n| e.file_name().eq_ignore_ascii_case(n)))
        });

    for entry in walker {
        if state.scan.is_cancelled() {
            return None;
        }

        let entry = match entry {
            Ok(entry) => entry,
            Err(e) => {
                tracing::warn!("Skipping unreadable entry: {}", e);
                continue;
            }
        };
        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();
        let Some(media_type) = media_type_of(path) else {
            continue;
        };
        let Some(relative_path) = normalize_relative_path(root, path) else {
            continue;
        };
        let size = match entry.metadata() {
            Ok(m) => m.len(),
            Err(e) => {
                tracing::warn!("Skipping {}: {}", path.display(), e);
                continue;
            }
        };

        progress.emit(
            ScanPhase::Discovering,
            files.len() as u64,
            0,
            &relative_path,
            false,
        );

        files.push(DiscoveredFile {
            full_path: path.to_path_buf(),
            filename: entry.file_name().to_string_lossy().into_owned(),
            relative_path,
            size,
            media_type,
        });
    }

    Some(files)
}

fn media_type_of(path: &Path) -> Option<&'static str> {
    let ext = path.extension()?.to_str()?.to_ascii_lowercase();
    if SUPPORTED_IMAGE_EXTENSIONS.contains(&ext.as_str()) {
        Some("image")
    } else if SUPPORTED_VIDEO_EXTENSIONS.contains(&ext.as_str()) {
        Some("video")
    } else {
        None
    }
}

/// Path relative to `root` with `/` separators on every OS, so a catalog
/// created on Windows still matches when the drive is opened on Linux.
fn normalize_relative_path(root: &Path, path: &Path) -> Option<String> {
    let relative = path.strip_prefix(root).ok()?;
    let parts: Vec<String> = relative
        .components()
        .map(|c| match c {
            Component::Normal(part) => Some(part.to_string_lossy().into_owned()),
            _ => None,
        })
        .collect::<Option<_>>()?;
    Some(parts.join("/"))
}

/// Read metadata off the async runtime.
async fn read_metadata(file: &DiscoveredFile) -> (Option<i64>, Option<i64>, Option<String>) {
    let path = file.full_path.clone();
    let is_image = file.media_type == "image";
    tauri::async_runtime::spawn_blocking(move || {
        if is_image {
            metadata::extract_image_metadata(&path)
        } else {
            (None, None, metadata::file_modified_at(&path))
        }
    })
    .await
    .unwrap_or((None, None, None))
}

/// Generate the thumbnail off the async runtime. Failures are logged, not fatal.
async fn ensure_thumbnail(state: &AppState, photo_id: &str, file: &DiscoveredFile, force: bool) {
    if file.media_type != "image" {
        return;
    }
    let dir = state.paths.thumbnails_dir.clone();
    let id = photo_id.to_string();
    let path = file.full_path.clone();
    let result = tauri::async_runtime::spawn_blocking(move || {
        thumbnails::generate_thumbnail(&dir, &id, &path, force)
    })
    .await
    .map_err(|e| e.to_string())
    .and_then(|r| r);

    if let Err(e) = result {
        tracing::warn!(
            "Failed to generate thumbnail for {}: {}",
            file.relative_path,
            e
        );
    }
}

async fn insert_photo(
    state: &AppState,
    library_id: &str,
    file: &DiscoveredFile,
) -> Result<(), String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let (width, height, captured_at) = read_metadata(file).await;

    insert_row(
        &state.pool,
        &id,
        library_id,
        file,
        width,
        height,
        captured_at,
        &now,
    )
    .await?;

    ensure_thumbnail(state, &id, file, false).await;
    Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn insert_row(
    pool: &SqlitePool,
    id: &str,
    library_id: &str,
    file: &DiscoveredFile,
    width: Option<i64>,
    height: Option<i64>,
    captured_at: Option<String>,
    now: &str,
) -> Result<(), String> {
    sqlx::query(
        "INSERT INTO photos (
            id, library_id, relative_path, filename, media_type,
            file_size, width, height, captured_at,
            sha256, perceptual_hash, quality_score,
            created_at, updated_at
         )
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, NULL, NULL, NULL, ?10, ?10)",
    )
    .bind(id)
    .bind(library_id)
    .bind(&file.relative_path)
    .bind(&file.filename)
    .bind(file.media_type)
    .bind(file.size as i64)
    .bind(width)
    .bind(height)
    .bind(captured_at)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

async fn update_photo(
    state: &AppState,
    photo_id: &str,
    file: &DiscoveredFile,
) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    let (width, height, captured_at) = read_metadata(file).await;

    sqlx::query(
        "UPDATE photos
         SET file_size = ?1, width = ?2, height = ?3, captured_at = ?4, updated_at = ?5,
             sha256 = NULL, perceptual_hash = NULL, quality_score = NULL
         WHERE id = ?6",
    )
    .bind(file.size as i64)
    .bind(width)
    .bind(height)
    .bind(captured_at)
    .bind(&now)
    .bind(photo_id)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    ensure_thumbnail(state, photo_id, file, true).await;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn relative_path_uses_forward_slashes() {
        let root = Path::new("fotos");
        let path = root.join("backup").join("2024").join("IMG_1234.jpg");
        assert_eq!(
            normalize_relative_path(root, &path).as_deref(),
            Some("backup/2024/IMG_1234.jpg")
        );
    }

    #[test]
    fn relative_path_outside_root_is_rejected() {
        assert_eq!(
            normalize_relative_path(Path::new("a"), Path::new("b/c.jpg")),
            None
        );
    }

    #[test]
    fn media_type_is_case_insensitive() {
        assert_eq!(media_type_of(Path::new("x/IMG.JPG")), Some("image"));
        assert_eq!(media_type_of(Path::new("x/clip.MOV")), Some("video"));
        assert_eq!(media_type_of(Path::new("x/notes.txt")), None);
    }

    mod integration {
        use super::super::*;
        use crate::app::{AppPaths, ScanControl};
        use std::collections::BTreeMap;
        use std::sync::Mutex;
        use tauri::Listener;

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
            WalkDir::new(root)
                .into_iter()
                .filter_map(Result::ok)
                .filter(|e| e.file_type().is_file())
                .map(|e| (e.path().to_path_buf(), std::fs::read(e.path()).unwrap()))
                .collect()
        }

        async fn relative_paths(state: &AppState, library_id: &str) -> Vec<String> {
            sqlx::query_scalar(
                "SELECT relative_path FROM photos WHERE library_id = ?1 ORDER BY relative_path",
            )
            .bind(library_id)
            .fetch_all(&state.pool)
            .await
            .unwrap()
        }

        async fn photo_id(state: &AppState, relative_path: &str) -> String {
            sqlx::query_scalar("SELECT id FROM photos WHERE relative_path = ?1")
                .bind(relative_path)
                .fetch_one(&state.pool)
                .await
                .unwrap()
        }

        #[tokio::test]
        async fn scan_is_incremental_and_never_touches_originals() {
            let tmp =
                std::env::temp_dir().join(format!("photovault-scan-{}", uuid::Uuid::new_v4()));
            let root = tmp.join("Fotos");
            write_jpeg(&root.join("celular/2024/IMG_0001.jpg"), 64, 48);
            write_jpeg(&root.join("camera/foto.png"), 32, 32);
            write_bytes(&root.join("corrompida.jpg"), b"not really a jpeg");
            write_bytes(&root.join("video.mp4"), b"fake video");
            write_bytes(&root.join("notas.txt"), b"ignored extension");
            write_jpeg(&root.join(".photovault-trash/antiga.jpg"), 8, 8);
            let original = snapshot(&root);

            let thumbnails_dir = tmp.join("thumbnails");
            std::fs::create_dir_all(&thumbnails_dir).unwrap();
            let state = Arc::new(AppState {
                pool: catalog::init_database(&tmp.join("catalog.db"))
                    .await
                    .unwrap(),
                paths: AppPaths {
                    base_dir: tmp.clone(),
                    db_path: tmp.join("catalog.db"),
                    thumbnails_dir: thumbnails_dir.clone(),
                    logs_dir: tmp.join("logs"),
                },
                scan: Arc::new(ScanControl::default()),
            });
            let app = tauri::test::mock_app();
            let completed: Arc<Mutex<Vec<serde_json::Value>>> = Default::default();
            let sink = Arc::clone(&completed);
            app.listen("scan_complete", move |event| {
                sink.lock()
                    .unwrap()
                    .push(serde_json::from_str(event.payload()).unwrap());
            });
            let last = || completed.lock().unwrap().last().cloned().unwrap();

            let root_str = root.to_str().unwrap();
            let lib = catalog::create_library(&state.pool, "Teste", root_str)
                .await
                .unwrap();

            // First scan: indexes supported files, skips ignored dirs and extensions,
            // and a corrupted file does not stop the others.
            scan_library(app.handle(), &state, &lib.id, root_str)
                .await
                .unwrap();
            assert_eq!(
                relative_paths(&state, &lib.id).await,
                [
                    "camera/foto.png",
                    "celular/2024/IMG_0001.jpg",
                    "corrompida.jpg",
                    "video.mp4"
                ]
            );
            assert_eq!(last()["newFiles"], 4);
            assert_eq!(last()["cancelled"], false);
            let img_id = photo_id(&state, "celular/2024/IMG_0001.jpg").await;
            let img_thumb = thumbnails::thumbnail_path(&thumbnails_dir, &img_id);
            assert!(img_thumb.exists());
            let corrupted = photo_id(&state, "corrompida.jpg").await;
            assert!(!thumbnails::thumbnail_path(&thumbnails_dir, &corrupted).exists());
            assert_eq!(snapshot(&root), original, "scan modified the library");

            // Second scan: nothing new; a deleted thumbnail is regenerated.
            std::fs::remove_file(&img_thumb).unwrap();
            scan_library(app.handle(), &state, &lib.id, root_str)
                .await
                .unwrap();
            assert_eq!(last()["newFiles"], 0);
            assert_eq!(last()["modifiedFiles"], 0);
            assert!(img_thumb.exists());
            assert_eq!(photo_id(&state, "celular/2024/IMG_0001.jpg").await, img_id);

            // A file whose size changed is updated in place (same id).
            write_jpeg(&root.join("celular/2024/IMG_0001.jpg"), 200, 150);
            scan_library(app.handle(), &state, &lib.id, root_str)
                .await
                .unwrap();
            assert_eq!(last()["newFiles"], 0);
            assert_eq!(last()["modifiedFiles"], 1);
            let width: Option<i64> = sqlx::query_scalar("SELECT width FROM photos WHERE id = ?1")
                .bind(&img_id)
                .fetch_one(&state.pool)
                .await
                .unwrap();
            assert_eq!(width, Some(200));

            // A cancelled scan still reports completion and does not bump last_scan_at.
            let before = catalog::get_library(&state.pool, &lib.id)
                .await
                .unwrap()
                .unwrap();
            state.scan.cancel();
            scan_library(app.handle(), &state, &lib.id, root_str)
                .await
                .unwrap();
            assert_eq!(last()["cancelled"], true);
            let after = catalog::get_library(&state.pool, &lib.id)
                .await
                .unwrap()
                .unwrap();
            assert_eq!(before.last_scan_at, after.last_scan_at);

            let _ = std::fs::remove_dir_all(tmp);
        }

        #[test]
        fn only_one_scan_at_a_time() {
            let control = Arc::new(ScanControl::default());
            let guard = control.try_start().expect("first scan starts");
            assert!(control.try_start().is_none());
            drop(guard);
            assert!(control.try_start().is_some());
        }
    }
}
