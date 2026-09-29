use super::AppStateRef;
use crate::error::ApiResult;
use photovault_core::catalog::albums::{self, AlbumRef};
use photovault_core::catalog::overview::{
    self, CameraOption, LibraryOverview, PlaceOption, TimelineBucket,
};
use photovault_core::catalog::{
    MediaContext, MediaCount, MediaFilter, MediaItem, MediaPage, MediaQuery, media,
};
use photovault_core::ingestion::frames;

/// A page of the gallery. Pass `nextCursor` from the previous page to continue
/// (with the same query).
#[tauri::command]
#[specta::specta]
pub async fn list_media(
    library_id: String,
    query: MediaQuery,
    cursor: Option<String>,
    limit: u32,
    state: AppStateRef<'_>,
) -> ApiResult<MediaPage> {
    Ok(media::list(&state.pool, &library_id, &query, cursor.as_deref(), limit).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn count_media(
    library_id: String,
    filter: MediaFilter,
    state: AppStateRef<'_>,
) -> ApiResult<MediaCount> {
    Ok(media::count(&state.pool, &library_id, &filter).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn get_media(media_id: String, state: AppStateRef<'_>) -> ApiResult<MediaItem> {
    Ok(media::get(&state.pool, &media_id).await?)
}

/// Position, total and neighbours of an item inside a gallery context (viewer).
#[tauri::command]
#[specta::specta]
pub async fn get_media_context(
    media_id: String,
    query: MediaQuery,
    radius: u32,
    state: AppStateRef<'_>,
) -> ApiResult<MediaContext> {
    Ok(media::context(&state.pool, &media_id, &query, radius).await?)
}

/// Returns the updated items.
#[tauri::command]
#[specta::specta]
pub async fn set_favorite(
    media_ids: Vec<String>,
    favorite: bool,
    state: AppStateRef<'_>,
) -> ApiResult<Vec<MediaItem>> {
    let items = media::set_favorite(&state.pool, &media_ids, favorite).await?;
    // Favorites break ties for "best candidate": regroup soon.
    state.jobs.wake();
    Ok(items)
}

/// Manual albums containing the item.
#[tauri::command]
#[specta::specta]
pub async fn get_media_albums(
    media_id: String,
    state: AppStateRef<'_>,
) -> ApiResult<Vec<AlbumRef>> {
    Ok(albums::containing(&state.pool, &media_id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn get_overview(
    library_id: String,
    state: AppStateRef<'_>,
) -> ApiResult<LibraryOverview> {
    Ok(overview::overview(&state.pool, &library_id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn get_timeline(
    library_id: String,
    filter: MediaFilter,
    state: AppStateRef<'_>,
) -> ApiResult<Vec<TimelineBucket>> {
    Ok(overview::timeline(&state.pool, &library_id, &filter).await?)
}

/// Filter menu options.
#[tauri::command]
#[specta::specta]
pub async fn list_places(
    library_id: String,
    state: AppStateRef<'_>,
) -> ApiResult<Vec<PlaceOption>> {
    Ok(overview::places(&state.pool, &library_id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn list_cameras(
    library_id: String,
    state: AppStateRef<'_>,
) -> ApiResult<Vec<CameraOption>> {
    Ok(overview::cameras(&state.pool, &library_id).await?)
}

/// Videos waiting for a thumbnail frame (captured by the WebView).
#[tauri::command]
#[specta::specta]
pub async fn list_pending_video_frames(
    limit: u32,
    state: AppStateRef<'_>,
) -> ApiResult<Vec<String>> {
    Ok(frames::pending(&state.pool, limit.min(100)).await?)
}

/// A frame of the video (`data:image/jpeg;base64,…`) becomes its thumbnails.
#[tauri::command]
#[specta::specta]
pub async fn save_video_frame(
    media_id: String,
    frame: String,
    state: AppStateRef<'_>,
) -> ApiResult<MediaItem> {
    let bytes = frames::from_data_url(&frame)?;
    Ok(frames::store(
        &state.pool,
        state.paths.thumbnails_dir.clone(),
        &media_id,
        bytes,
    )
    .await?)
}

/// The WebView can't play this video: keep the icon.
#[tauri::command]
#[specta::specta]
pub async fn fail_video_frame(
    media_id: String,
    reason: String,
    state: AppStateRef<'_>,
) -> ApiResult<()> {
    Ok(frames::fail(&state.pool, &media_id, &reason).await?)
}
