use super::AppStateRef;
use crate::error::{ApiError, ApiResult};
use crate::events::MediaUpdatedEvent;
use photovault_core::catalog::{MediaItem, media, settings};
use photovault_core::review::examples::{self, ExampleIntent, ReviewExample};
use photovault_core::review::{
    self, Decision, HistoryPage, MediaReasons, ReviewEntry, ReviewReason, ReviewSummary,
};
use photovault_core::trash::{
    self, OnConflict, RestoreResult, TrashEntry, TrashResult, TrashSummary,
};
use tauri_plugin_dialog::DialogExt;
use tauri_specta::Event;

/// Counters of the Review screen (pending photos, per reason).
#[tauri::command]
#[specta::specta]
pub async fn get_review_summary(
    library_id: String,
    state: AppStateRef<'_>,
) -> ApiResult<ReviewSummary> {
    Ok(review::summary(&state.pool, &library_id).await?)
}

/// Every suggestion of one photo, decided or not (info panel).
#[tauri::command]
#[specta::specta]
pub async fn get_media_review(
    media_id: String,
    state: AppStateRef<'_>,
) -> ApiResult<Vec<ReviewEntry>> {
    Ok(review::for_media(&state.pool, &media_id).await?)
}

/// Pending reasons of the photos on screen (chips on the Review tiles).
#[tauri::command]
#[specta::specta]
pub async fn get_pending_reasons(
    media_ids: Vec<String>,
    state: AppStateRef<'_>,
) -> ApiResult<Vec<MediaReasons>> {
    let weights = settings::get(&state.pool).await?.review.weights;
    Ok(review::pending_reasons(&state.pool, &media_ids, &weights).await?)
}

/// Keep / ignore (or reopen) the suggestions of some photos, for every reason or one.
/// Returns the updated items (their review priority changed).
#[tauri::command]
#[specta::specta]
pub async fn decide_review(
    media_ids: Vec<String>,
    decision: Decision,
    reason: Option<ReviewReason>,
    state: AppStateRef<'_>,
) -> ApiResult<Vec<MediaItem>> {
    let weights = settings::get(&state.pool).await?.review.weights;
    review::decide(&state.pool, &media_ids, decision, reason, &weights).await?;
    state.jobs.wake();
    Ok(media::get_many(&state.pool, &media_ids).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn list_review_history(
    library_id: String,
    cursor: Option<String>,
    limit: u32,
    state: AppStateRef<'_>,
) -> ApiResult<HistoryPage> {
    Ok(review::history(&state.pool, &library_id, cursor.as_deref(), limit).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn list_examples(state: AppStateRef<'_>) -> ApiResult<Vec<ReviewExample>> {
    Ok(examples::list(&state.pool).await?)
}

/// Photos of the catalog as examples. Returns how many were added.
#[tauri::command]
#[specta::specta]
pub async fn add_examples(
    media_ids: Vec<String>,
    intent: ExampleIntent,
    state: AppStateRef<'_>,
) -> ApiResult<u32> {
    let added =
        examples::add_from_media(&state.pool, &state.paths.thumbnails_dir, &media_ids, intent)
            .await?;
    state.jobs.wake();
    Ok(added)
}

/// Pick an image anywhere on disk as an example. `None` when the user cancels.
#[tauri::command]
#[specta::specta]
pub async fn add_example_from_file(
    intent: ExampleIntent,
    app: tauri::AppHandle,
    state: AppStateRef<'_>,
) -> ApiResult<Option<ReviewExample>> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog()
        .file()
        .add_filter(
            "Imagens",
            &["jpg", "jpeg", "png", "webp", "gif", "bmp", "tif", "tiff"],
        )
        .pick_file(move |path| {
            let _ = tx.send(path.and_then(|p| p.into_path().ok()));
        });
    let Some(path) = rx.await.map_err(|e| ApiError::internal(e.to_string()))? else {
        return Ok(None);
    };
    let thresholds = settings::get(&state.pool).await?.analysis;
    let example = examples::add_from_file(&state.pool, &path, intent, &thresholds).await?;
    state.jobs.wake();
    Ok(Some(example))
}

#[tauri::command]
#[specta::specta]
pub async fn set_example_intent(
    example_id: String,
    intent: ExampleIntent,
    state: AppStateRef<'_>,
) -> ApiResult<()> {
    examples::set_intent(&state.pool, &example_id, intent).await?;
    state.jobs.wake();
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn remove_example(example_id: String, state: AppStateRef<'_>) -> ApiResult<()> {
    examples::remove(&state.pool, &example_id).await?;
    state.jobs.wake();
    Ok(())
}

/// Send photos to the trash (library trash, or the system's if configured).
#[tauri::command]
#[specta::specta]
pub async fn trash_media(
    media_ids: Vec<String>,
    app: tauri::AppHandle,
    state: AppStateRef<'_>,
) -> ApiResult<TrashResult> {
    let system = settings::get(&state.pool).await?.review.use_system_trash;
    let result = trash::send(&state.pool, &state.paths.thumbnails_dir, &media_ids, system).await?;
    // Library trash: the rows stay (now `inTrash`); system trash: they are gone.
    let items = media::get_many(&state.pool, &result.done).await?;
    let gone = result
        .done
        .iter()
        .filter(|id| !items.iter().any(|m| &m.id == *id))
        .cloned()
        .collect();
    let _ = MediaUpdatedEvent {
        items,
        removed_ids: gone,
    }
    .emit(&app);
    state.jobs.wake();
    Ok(result)
}

#[tauri::command]
#[specta::specta]
pub async fn restore_media(
    media_ids: Vec<String>,
    on_conflict: OnConflict,
    app: tauri::AppHandle,
    state: AppStateRef<'_>,
) -> ApiResult<RestoreResult> {
    let result = trash::restore(&state.pool, &media_ids, on_conflict).await?;
    let items = media::get_many(&state.pool, &result.restored).await?;
    let _ = MediaUpdatedEvent {
        items,
        removed_ids: Vec::new(),
    }
    .emit(&app);
    state.jobs.wake();
    Ok(result)
}

/// Delete trashed photos for good (the UI confirms twice).
#[tauri::command]
#[specta::specta]
pub async fn purge_media(
    media_ids: Vec<String>,
    app: tauri::AppHandle,
    state: AppStateRef<'_>,
) -> ApiResult<TrashResult> {
    let result = trash::purge(&state.pool, &state.paths.thumbnails_dir, &media_ids).await?;
    removed(&app, result.done.clone());
    Ok(result)
}

#[tauri::command]
#[specta::specta]
pub async fn empty_trash(
    library_id: String,
    app: tauri::AppHandle,
    state: AppStateRef<'_>,
) -> ApiResult<TrashResult> {
    let result = trash::empty(&state.pool, &state.paths.thumbnails_dir, &library_id).await?;
    removed(&app, result.done.clone());
    Ok(result)
}

#[tauri::command]
#[specta::specta]
pub async fn get_trash_summary(
    library_id: String,
    state: AppStateRef<'_>,
) -> ApiResult<TrashSummary> {
    Ok(trash::summary(&state.pool, &library_id).await?)
}

/// Original place and date of a trashed photo.
#[tauri::command]
#[specta::specta]
pub async fn get_trash_entry(
    media_id: String,
    state: AppStateRef<'_>,
) -> ApiResult<Option<TrashEntry>> {
    Ok(trash::entry(&state.pool, &media_id).await?)
}

/// Galleries drop these items (deleted for good).
fn removed(app: &tauri::AppHandle, ids: Vec<String>) {
    if !ids.is_empty() {
        let _ = MediaUpdatedEvent {
            items: Vec::new(),
            removed_ids: ids,
        }
        .emit(app);
    }
}
