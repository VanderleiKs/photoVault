use super::AppStateRef;
use crate::error::{ApiError, ApiResult};
use photovault_core::catalog::MediaItem;
use photovault_core::catalog::libraries;
use photovault_core::catalog::settings::{self, Home};
use photovault_core::events::{
    self, EventCounts, EventDay, EventMerge, EventSummary, EventUpdate, ReclassifyOptions,
};

/// Trips and events of a library, newest first (`ignored = true`: only the ignored ones).
#[tauri::command]
#[specta::specta]
pub async fn list_events(
    library_id: String,
    ignored: bool,
    state: AppStateRef<'_>,
) -> ApiResult<Vec<EventSummary>> {
    Ok(events::list(&state.pool, &library_id, ignored).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn get_event(event_id: String, state: AppStateRef<'_>) -> ApiResult<EventSummary> {
    Ok(events::get(&state.pool, &event_id).await?)
}

/// One card per day of the event.
#[tauri::command]
#[specta::specta]
pub async fn get_event_days(event_id: String, state: AppStateRef<'_>) -> ApiResult<Vec<EventDay>> {
    Ok(events::days(&state.pool, &event_id).await?)
}

/// Best photos of the event (highlight carousel).
#[tauri::command]
#[specta::specta]
pub async fn get_event_highlights(
    event_id: String,
    limit: u32,
    state: AppStateRef<'_>,
) -> ApiResult<Vec<MediaItem>> {
    Ok(events::best(&state.pool, &event_id, limit).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn accept_event(event_id: String, state: AppStateRef<'_>) -> ApiResult<EventSummary> {
    Ok(events::accept(&state.pool, &event_id).await?)
}

/// Hide a suggestion; it is not suggested again.
#[tauri::command]
#[specta::specta]
pub async fn ignore_event(event_id: String, state: AppStateRef<'_>) -> ApiResult<EventSummary> {
    Ok(events::ignore(&state.pool, &event_id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn restore_event(event_id: String, state: AppStateRef<'_>) -> ApiResult<EventSummary> {
    Ok(events::restore(&state.pool, &event_id).await?)
}

/// Title and/or dates; the event becomes "edited" (not changed by the app anymore).
#[tauri::command]
#[specta::specta]
pub async fn update_event(
    event_id: String,
    change: EventUpdate,
    state: AppStateRef<'_>,
) -> ApiResult<EventSummary> {
    Ok(events::update(&state.pool, &event_id, &change).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn remove_from_event(
    event_id: String,
    media_ids: Vec<String>,
    state: AppStateRef<'_>,
) -> ApiResult<EventSummary> {
    Ok(events::remove_media(&state.pool, &event_id, &media_ids).await?)
}

/// Several events become one (a trip without GPS split into days).
#[tauri::command]
#[specta::specta]
pub async fn merge_events(merge: EventMerge, state: AppStateRef<'_>) -> ApiResult<EventSummary> {
    Ok(events::merge(&state.pool, &merge).await?)
}

/// Detect trips and events again in every library, now, with the current settings.
#[tauri::command]
#[specta::specta]
pub async fn reclassify_events(
    options: ReclassifyOptions,
    state: AppStateRef<'_>,
) -> ApiResult<EventCounts> {
    let s = settings::get(&state.pool).await?;
    let mut total = EventCounts::default();
    for lib in libraries::list(&state.pool).await? {
        let c = events::reclassify(&state.pool, &lib.id, &s, options).await?;
        total.trips += c.trips;
        total.events += c.events;
        total.suggested += c.suggested;
    }
    Ok(total)
}

/// Homes the photos point to, one per library (Settings: "Sua casa parece ser…").
#[tauri::command]
#[specta::specta]
pub async fn get_detected_homes(state: AppStateRef<'_>) -> ApiResult<Vec<Home>> {
    let mut homes: Vec<Home> = Vec::new();
    for lib in libraries::list(&state.pool).await? {
        if let Some(h) = events::detected_home(&state.pool, &lib.id).await?
            && !homes.iter().any(|o| o.name == h.name)
        {
            homes.push(h);
        }
    }
    Ok(homes)
}

/// Cities of the embedded GeoNames table, for choosing a home.
#[tauri::command]
#[specta::specta]
pub async fn search_home_places(query: String) -> ApiResult<Vec<Home>> {
    tokio::task::spawn_blocking(move || events::search_homes(&query))
        .await
        .map_err(|e| ApiError::internal(e.to_string()))
}
