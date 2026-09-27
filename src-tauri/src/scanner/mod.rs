use crate::app::AppState;
use crate::catalog;
use crate::metadata;
use crate::thumbnails;
use chrono::Utc;
use sqlx::SqlitePool;
use std::path::Path;
use tauri::Emitter;
use tokio::sync::mpsc;
use walkdir::WalkDir;
use serde::Serialize;

const SUPPORTED_IMAGE_EXTENSIONS: &[&str] = &[
    "jpg", "jpeg", "png", "webp", "heic", "heif", "tif", "tiff", "gif", "bmp",
];

const SUPPORTED_VIDEO_EXTENSIONS: &[&str] = &["mp4", "mov", "mkv", "avi", "webm"];

#[derive(Debug, Clone, Serialize)]
pub struct ScanProgress {
    pub processed: u64,
    pub total: u64,
    pub current_path: String,
}

/// Scan a library directory and index all media files
pub async fn scan_library(
    pool: &SqlitePool,
    app_state: &AppState,
    library_id: &str,
    root_path: &str,
) -> Result<(), String> {
    // Reset cancel flag
    app_state.reset_scan_flag().await;

    let root = Path::new(root_path);
    if !root.exists() {
        return Err(format!("Directory does not exist: {}", root_path));
    }

    // First pass: collect all files
    tracing::info!("Starting scan of library {} at {}", library_id, root_path);
    let mut files_to_process: Vec<(String, String, u64, String)> = Vec::new();

    for entry in WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if app_state.is_scan_cancelled().await {
            tracing::info!("Scan cancelled by user");
            return Ok(());
        }

        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            let ext_lower = ext.to_lowercase();
            let is_image = SUPPORTED_IMAGE_EXTENSIONS.contains(&ext_lower.as_str());
            let is_video = SUPPORTED_VIDEO_EXTENSIONS.contains(&ext_lower.as_str());

            if !is_image && !is_video {
                continue;
            }

            let relative_path = path
                .strip_prefix(root)
                .unwrap_or(path)
                .to_string_lossy()
                .to_string();
            let filename = path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            let metadata = entry.metadata().map_err(|e| e.to_string())?;
            let size = metadata.len();

            files_to_process.push((relative_path, filename, size, ext_lower));
        }
    }

    let total_files = files_to_process.len() as u64;
    tracing::info!("Found {} media files to process", total_files);

    // Channel for progress updates
    let (tx, mut rx) = mpsc::channel::<ScanProgress>(100);
    let app_handle = app_state.app_handle.clone();

    // Spawn progress reporter
    let progress_handle = tokio::spawn(async move {
        while let Some(progress) = rx.recv().await {
            let _ = app_handle.emit("scan_progress", progress);
        }
    });

    // Process files
    let mut processed: u64 = 0;
    let mut new_count: u64 = 0;
    let mut modified_count: u64 = 0;
    let mut error_count: u64 = 0;

    for (relative_path, filename, file_size, ext) in files_to_process {
        if app_state.is_scan_cancelled().await {
            tracing::info!("Scan cancelled by user");
            break;
        }

        processed += 1;

        // Send progress every 10 files
        if processed % 10 == 0 {
            let progress = ScanProgress {
                processed,
                total: total_files,
                current_path: relative_path.clone(),
            };
            let _ = tx.send(progress).await;
        }

        // Determine media type
        let media_type = if SUPPORTED_IMAGE_EXTENSIONS.contains(&ext.as_str()) {
            "image"
        } else {
            "video"
        };

        // Check if file already exists in database
        let existing: Option<(String, i64, String)> = sqlx::query_as(
            "SELECT id, file_size, relative_path FROM photos WHERE library_id = ?1 AND relative_path = ?2",
        )
        .bind(library_id)
        .bind(&relative_path)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;

        let full_path = root.join(&relative_path);

        match existing {
            Some((id, existing_size, _)) => {
                // File exists - check if modified
                if existing_size != file_size as i64 {
                    // File was modified - update metadata
                    if let Err(e) = update_photo_metadata(pool, &id, &full_path, file_size).await {
                        tracing::warn!("Failed to update metadata for {}: {}", relative_path, e);
                        error_count += 1;
                    } else {
                        modified_count += 1;
                    }
                }
                // If size matches, skip (incremental indexing)
            }
            None => {
                // New file - insert into database
                match insert_photo(pool, library_id, &relative_path, &filename, media_type, file_size, &full_path).await {
                    Ok(photo_id) => {
                        new_count += 1;
                        // Generate thumbnail for images
                        if media_type == "image" {
                            if let Err(e) = thumbnails::generate_thumbnail(&app_handle, &photo_id, &full_path).await {
                                tracing::warn!("Failed to generate thumbnail for {}: {}", relative_path, e);
                            }
                        }
                    }
                    Err(e) => {
                        tracing::warn!("Failed to insert photo {}: {}", relative_path, e);
                        error_count += 1;
                    }
                }
            }
        }
    }

    // Send final progress
    let final_progress = ScanProgress {
        processed,
        total: total_files,
        current_path: String::new(),
    };
    let _ = tx.send(final_progress).await;
    drop(tx);
    let _ = progress_handle.await;

    // Update last scan timestamp
    catalog::update_last_scan(pool, library_id)
        .await
        .map_err(|e| e.to_string())?;

    tracing::info!(
        "Scan complete. Total: {}, New: {}, Modified: {}, Errors: {}",
        total_files,
        new_count,
        modified_count,
        error_count
    );

    // Emit scan complete event
    let _ = app_handle.emit(
        "scan_complete",
        serde_json::json!({
            "library_id": library_id,
            "total_processed": processed,
            "new_files": new_count,
            "modified_files": modified_count,
            "errors": error_count,
        }),
    );

    Ok(())
}

async fn insert_photo(
    pool: &SqlitePool,
    library_id: &str,
    relative_path: &str,
    filename: &str,
    media_type: &str,
    file_size: u64,
    full_path: &Path,
) -> Result<String, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    // Extract basic metadata
    let (width, height, captured_at) = if media_type == "image" {
        metadata::extract_image_metadata(full_path).await
    } else {
        (None, None, None)
    };

    sqlx::query(
        r#"
        INSERT INTO photos (
            id, library_id, relative_path, filename, media_type,
            file_size, width, height, captured_at,
            sha256, perceptual_hash, quality_score,
            created_at, updated_at
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, NULL, NULL, NULL, ?10, ?10)
        "#,
    )
    .bind(&id)
    .bind(library_id)
    .bind(relative_path)
    .bind(filename)
    .bind(media_type)
    .bind(file_size as i64)
    .bind(width)
    .bind(height)
    .bind(captured_at)
    .bind(&now)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

async fn update_photo_metadata(
    pool: &SqlitePool,
    photo_id: &str,
    full_path: &Path,
    file_size: u64,
) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    let (width, height, captured_at) = metadata::extract_image_metadata(full_path).await;

    sqlx::query(
        r#"
        UPDATE photos
        SET file_size = ?1, width = ?2, height = ?3, captured_at = ?4, updated_at = ?5
        WHERE id = ?6
        "#,
    )
    .bind(file_size as i64)
    .bind(width)
    .bind(height)
    .bind(captured_at)
    .bind(&now)
    .bind(photo_id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}
