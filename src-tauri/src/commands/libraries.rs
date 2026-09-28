use super::AppStateRef;
use crate::error::ApiResult;
use photovault_core::catalog::{Library, LibraryStats, libraries};
use photovault_core::thumbnails;

#[tauri::command]
#[specta::specta]
pub async fn list_libraries(state: AppStateRef<'_>) -> ApiResult<Vec<Library>> {
    Ok(libraries::list(&state.pool).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn create_library(
    name: String,
    root_path: String,
    state: AppStateRef<'_>,
) -> ApiResult<Library> {
    Ok(libraries::create(&state.pool, &name, &root_path).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn rename_library(
    library_id: String,
    name: String,
    state: AppStateRef<'_>,
) -> ApiResult<Library> {
    Ok(libraries::rename(&state.pool, &library_id, &name).await?)
}

/// Point a library at its folder's new location (drive letter / mount point changed).
#[tauri::command]
#[specta::specta]
pub async fn relocate_library(
    library_id: String,
    root_path: String,
    state: AppStateRef<'_>,
) -> ApiResult<Library> {
    Ok(libraries::relocate(&state.pool, &library_id, &root_path).await?)
}

/// Remove a library from the catalog (and its thumbnails). Photos on disk are untouched.
#[tauri::command]
#[specta::specta]
pub async fn delete_library(library_id: String, state: AppStateRef<'_>) -> ApiResult<()> {
    let media_ids = libraries::delete(&state.pool, &library_id).await?;
    let dir = state.paths.thumbnails_dir.clone();
    tokio::task::spawn_blocking(move || thumbnails::remove(&dir, &media_ids));
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn get_library_stats(
    library_id: String,
    state: AppStateRef<'_>,
) -> ApiResult<LibraryStats> {
    Ok(libraries::stats(&state.pool, &library_id).await?)
}
