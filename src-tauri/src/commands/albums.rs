use super::AppStateRef;
use crate::error::ApiResult;
use photovault_core::catalog::albums::AlbumSuggestion;
use photovault_core::catalog::{Album, MediaFilter, albums};

#[tauri::command]
#[specta::specta]
pub async fn list_albums(library_id: String, state: AppStateRef<'_>) -> ApiResult<Vec<Album>> {
    Ok(albums::list(&state.pool, &library_id).await?)
}

/// Smart albums worth creating (trips, favorites/best per year, screenshots…).
#[tauri::command]
#[specta::specta]
pub async fn list_album_suggestions(
    library_id: String,
    state: AppStateRef<'_>,
) -> ApiResult<Vec<AlbumSuggestion>> {
    Ok(albums::suggestions(&state.pool, &library_id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn get_album(album_id: String, state: AppStateRef<'_>) -> ApiResult<Album> {
    Ok(albums::get(&state.pool, &album_id).await?)
}

/// `rule` set = smart album (filled by the rule); otherwise a manual album.
#[tauri::command]
#[specta::specta]
pub async fn create_album(
    library_id: String,
    name: String,
    rule: Option<MediaFilter>,
    state: AppStateRef<'_>,
) -> ApiResult<Album> {
    Ok(albums::create(&state.pool, &library_id, &name, rule.as_ref()).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn rename_album(
    album_id: String,
    name: String,
    state: AppStateRef<'_>,
) -> ApiResult<Album> {
    Ok(albums::rename(&state.pool, &album_id, &name).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn update_album_rule(
    album_id: String,
    rule: MediaFilter,
    state: AppStateRef<'_>,
) -> ApiResult<Album> {
    Ok(albums::update_rule(&state.pool, &album_id, &rule).await?)
}

/// Removes the album only; photos stay in the library.
#[tauri::command]
#[specta::specta]
pub async fn delete_album(album_id: String, state: AppStateRef<'_>) -> ApiResult<()> {
    Ok(albums::delete(&state.pool, &album_id).await?)
}

/// Returns how many items were added (already present ones are skipped).
#[tauri::command]
#[specta::specta]
pub async fn add_to_album(
    album_id: String,
    media_ids: Vec<String>,
    state: AppStateRef<'_>,
) -> ApiResult<u32> {
    Ok(albums::add_media(&state.pool, &album_id, &media_ids).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn remove_from_album(
    album_id: String,
    media_ids: Vec<String>,
    state: AppStateRef<'_>,
) -> ApiResult<u32> {
    Ok(albums::remove_media(&state.pool, &album_id, &media_ids).await?)
}

/// `mediaId` null = automatic cover (newest photo).
#[tauri::command]
#[specta::specta]
pub async fn set_album_cover(
    album_id: String,
    media_id: Option<String>,
    state: AppStateRef<'_>,
) -> ApiResult<Album> {
    Ok(albums::set_cover(&state.pool, &album_id, media_id.as_deref()).await?)
}
