use crate::app::{get_db_path, AppState};
use crate::catalog::{self, Library, LibraryStats};
use crate::scanner;
use crate::thumbnails;
use sqlx::{Row, SqlitePool};
use tauri::{Emitter, State};

/// Create a new library
#[tauri::command]
pub async fn create_library(
    name: String,
    root_path: String,
    app_handle: tauri::AppHandle,
) -> Result<Library, String> {
    let db_path = get_db_path(&app_handle)?;
    let db_url = format!("sqlite://{}", db_path.display());

    let pool = SqlitePool::connect(&db_url).await.map_err(|e| e.to_string())?;

    let id = catalog::create_library(&pool, &name, &root_path)
        .await
        .map_err(|e| e.to_string())?;

    let library = catalog::get_library(&pool, &id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Library not found after creation".to_string())?;

    Ok(library)
}

/// List all libraries
#[tauri::command]
pub async fn list_libraries(app_handle: tauri::AppHandle) -> Result<Vec<Library>, String> {
    let db_path = get_db_path(&app_handle)?;
    let db_url = format!("sqlite://{}", db_path.display());

    let pool = SqlitePool::connect(&db_url).await.map_err(|e| e.to_string())?;

    catalog::list_libraries(&pool)
        .await
        .map_err(|e| e.to_string())
}

/// Get library statistics
#[tauri::command]
pub async fn get_library_stats(
    library_id: String,
    app_handle: tauri::AppHandle,
) -> Result<LibraryStats, String> {
    let db_path = get_db_path(&app_handle)?;
    let db_url = format!("sqlite://{}", db_path.display());

    let pool = SqlitePool::connect(&db_url).await.map_err(|e| e.to_string())?;

    catalog::get_library_stats(&pool, &library_id)
        .await
        .map_err(|e| e.to_string())
}

/// Start scanning a library
#[tauri::command]
pub async fn scan_library(
    library_id: String,
    app_handle: tauri::AppHandle,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    let db_path = get_db_path(&app_handle)?;
    let db_url = format!("sqlite://{}", db_path.display());

    let pool = SqlitePool::connect(&db_url).await.map_err(|e| e.to_string())?;

    // Get library root path
    let library = catalog::get_library(&pool, &library_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Library not found".to_string())?;

    // Run scan in background
    let app_state = app_state.inner().clone();
    tauri::async_runtime::spawn(async move {
        if let Err(e) = scanner::scan_library(&pool, &app_state, &library_id, &library.root_path).await {
            tracing::error!("Scan failed: {}", e);
            let _ = app_handle.emit("scan_error", serde_json::json!({ "error": e }));
        }
    });

    Ok(())
}

/// Cancel ongoing scan
#[tauri::command]
pub async fn cancel_scan(app_state: State<'_, AppState>) -> Result<(), String> {
    app_state.cancel_scan().await;
    Ok(())
}

/// Get photos with pagination
#[tauri::command]
pub async fn get_photos(
    library_id: String,
    page: i64,
    limit: i64,
    app_handle: tauri::AppHandle,
) -> Result<Vec<serde_json::Value>, String> {
    let db_path = get_db_path(&app_handle)?;
    let db_url = format!("sqlite://{}", db_path.display());

    let pool = SqlitePool::connect(&db_url).await.map_err(|e| e.to_string())?;

    let offset = (page - 1) * limit;

    let photos = sqlx::query(
        r#"
        SELECT
            id, library_id, relative_path, filename, media_type,
            file_size, width, height, captured_at,
            sha256, perceptual_hash, quality_score,
            created_at, updated_at
        FROM photos
        WHERE library_id = ?1
        ORDER BY captured_at DESC
        LIMIT ?2 OFFSET ?3
        "#,
    )
    .bind(&library_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;

    let result: Vec<serde_json::Value> = photos
        .into_iter()
        .map(|row| {
            serde_json::json!({
                "id": row.get::<String, _>("id"),
                "library_id": row.get::<String, _>("library_id"),
                "relative_path": row.get::<String, _>("relative_path"),
                "filename": row.get::<String, _>("filename"),
                "media_type": row.get::<String, _>("media_type"),
                "file_size": row.get::<i64, _>("file_size"),
                "width": row.get::<Option<i64>, _>("width"),
                "height": row.get::<Option<i64>, _>("height"),
                "captured_at": row.get::<Option<String>, _>("captured_at"),
                "sha256": row.get::<Option<String>, _>("sha256"),
                "perceptual_hash": row.get::<Option<String>, _>("perceptual_hash"),
                "quality_score": row.get::<Option<f64>, _>("quality_score"),
                "created_at": row.get::<String, _>("created_at"),
                "updated_at": row.get::<String, _>("updated_at"),
            })
        })
        .collect();

    Ok(result)
}

/// Get a single photo by ID
#[tauri::command]
pub async fn get_photo(
    photo_id: String,
    app_handle: tauri::AppHandle,
) -> Result<Option<serde_json::Value>, String> {
    let db_path = get_db_path(&app_handle)?;
    let db_url = format!("sqlite://{}", db_path.display());

    let pool = SqlitePool::connect(&db_url).await.map_err(|e| e.to_string())?;

    let photo = sqlx::query(
        r#"
        SELECT
            id, library_id, relative_path, filename, media_type,
            file_size, width, height, captured_at,
            sha256, perceptual_hash, quality_score,
            created_at, updated_at
        FROM photos
        WHERE id = ?1
        "#,
    )
    .bind(&photo_id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(photo.map(|row| {
        serde_json::json!({
            "id": row.get::<String, _>("id"),
            "library_id": row.get::<String, _>("library_id"),
            "relative_path": row.get::<String, _>("relative_path"),
            "filename": row.get::<String, _>("filename"),
            "media_type": row.get::<String, _>("media_type"),
            "file_size": row.get::<i64, _>("file_size"),
            "width": row.get::<Option<i64>, _>("width"),
            "height": row.get::<Option<i64>, _>("height"),
            "captured_at": row.get::<Option<String>, _>("captured_at"),
            "sha256": row.get::<Option<String>, _>("sha256"),
            "perceptual_hash": row.get::<Option<String>, _>("perceptual_hash"),
            "quality_score": row.get::<Option<f64>, _>("quality_score"),
            "created_at": row.get::<String, _>("created_at"),
            "updated_at": row.get::<String, _>("updated_at"),
        })
    }))
}

/// Get thumbnail path for a photo
#[tauri::command]
pub async fn get_thumbnail(
    photo_id: String,
    app_handle: tauri::AppHandle,
) -> Result<Option<String>, String> {
    let thumb_path = thumbnails::get_thumbnail_path(&app_handle, &photo_id)?;

    if thumb_path.exists() {
        Ok(Some(thumb_path.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}

/// Delete a library (does NOT delete photos from disk)
#[tauri::command]
pub async fn delete_library(
    library_id: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let db_path = get_db_path(&app_handle)?;
    let db_url = format!("sqlite://{}", db_path.display());

    let pool = SqlitePool::connect(&db_url).await.map_err(|e| e.to_string())?;

    catalog::delete_library(&pool, &library_id)
        .await
        .map_err(|e| e.to_string())
}
