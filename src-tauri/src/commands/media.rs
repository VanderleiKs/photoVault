use super::AppStateRef;
use crate::error::ApiResult;
use photovault_core::catalog::{MediaItem, MediaNavigation, MediaPage, media};

/// A page of the gallery. Pass `nextCursor` from the previous page to continue.
#[tauri::command]
#[specta::specta]
pub async fn list_media(
    library_id: String,
    cursor: Option<String>,
    limit: u32,
    state: AppStateRef<'_>,
) -> ApiResult<MediaPage> {
    Ok(media::list(&state.pool, &library_id, cursor.as_deref(), limit).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn get_media(media_id: String, state: AppStateRef<'_>) -> ApiResult<MediaItem> {
    Ok(media::get(&state.pool, &media_id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn get_media_navigation(
    media_id: String,
    state: AppStateRef<'_>,
) -> ApiResult<MediaNavigation> {
    Ok(media::navigation(&state.pool, &media_id).await?)
}
