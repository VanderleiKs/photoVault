//! "Melhorar fotos" (phase 9): automatic improvement of a scope, fine tuning of one
//! photo and undo. The live preview itself is served by `pv://…/edit/<id>`.

use super::AppStateRef;
use crate::error::ApiResult;
use crate::events::MediaUpdatedEvent;
use photovault_core::arrange::ArrangeScope;
use photovault_core::catalog::media;
use photovault_core::edit::store::{self, EditBatch, EnhanceSummary, MediaEdit};
use photovault_core::edit::{AutoOptions, EditRecipe};
use tauri_specta::Event;

/// Photos the improvement would touch in a scope, and a sample for before/after.
#[tauri::command]
#[specta::specta]
pub async fn summarize_enhance(
    state: AppStateRef<'_>,
    library_id: String,
    scope: ArrangeScope,
    sample: u32,
) -> ApiResult<EnhanceSummary> {
    Ok(store::summarize(&state.pool, &library_id, &scope, sample.min(60)).await?)
}

/// "Aplicar": saves the automatic improvement on every photo of the scope (nothing is
/// written to the files); the edited thumbnails follow in the background.
#[tauri::command]
#[specta::specta]
pub async fn apply_enhance(
    state: AppStateRef<'_>,
    app: tauri::AppHandle,
    library_id: String,
    scope: ArrangeScope,
    auto: AutoOptions,
) -> ApiResult<EditBatch> {
    let batch = store::apply(&state.pool, &library_id, &scope, &auto).await?;
    state.jobs.wake();
    let ids = store::batch_media(&state.pool, &batch.id).await?;
    announce(&app, &state, &ids).await;
    Ok(batch)
}

/// Everything of a batch back as it was before it.
#[tauri::command]
#[specta::specta]
pub async fn undo_enhance(
    state: AppStateRef<'_>,
    app: tauri::AppHandle,
    batch_id: String,
) -> ApiResult<u32> {
    let ids = store::batch_media(&state.pool, &batch_id).await?;
    let n = store::undo_batch(&state.pool, &state.paths.thumbnails_dir, &batch_id).await?;
    state.jobs.wake();
    announce(&app, &state, &ids).await;
    Ok(n)
}

#[tauri::command]
#[specta::specta]
pub async fn list_enhance_batches(
    state: AppStateRef<'_>,
    library_id: String,
) -> ApiResult<Vec<EditBatch>> {
    Ok(store::batches(&state.pool, &library_id, 20).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn get_edit(state: AppStateRef<'_>, media_id: String) -> ApiResult<Option<MediaEdit>> {
    Ok(store::get(&state.pool, &media_id).await?)
}

/// Decodes the photo for the live preview (the editor opened it).
#[tauri::command]
#[specta::specta]
pub async fn open_edit(state: AppStateRef<'_>, media_id: String) -> ApiResult<()> {
    state
        .edit
        .open(
            &state.pool,
            &media_id,
            photovault_core::edit::session::MAX_EDGE,
        )
        .await?;
    Ok(())
}

/// The recipe being tried; returns the version for the preview URL (`?v=`).
#[tauri::command]
#[specta::specta]
pub async fn set_edit_draft(
    state: AppStateRef<'_>,
    media_id: String,
    recipe: EditRecipe,
) -> ApiResult<u32> {
    Ok(state.edit.set_draft(&media_id, recipe))
}

#[tauri::command]
#[specta::specta]
pub async fn close_edit(state: AppStateRef<'_>, media_id: String) -> ApiResult<()> {
    state.edit.close(&media_id);
    Ok(())
}

/// Fine tuning of one photo.
#[tauri::command]
#[specta::specta]
pub async fn save_edit(
    state: AppStateRef<'_>,
    app: tauri::AppHandle,
    media_id: String,
    recipe: EditRecipe,
) -> ApiResult<MediaEdit> {
    let edit = store::save(&state.pool, &media_id, &recipe).await?;
    state.jobs.wake();
    announce(&app, &state, std::slice::from_ref(&media_id)).await;
    Ok(edit)
}

/// Back to the original (the edits are removed).
#[tauri::command]
#[specta::specta]
pub async fn reset_edits(
    state: AppStateRef<'_>,
    app: tauri::AppHandle,
    media_ids: Vec<String>,
) -> ApiResult<u32> {
    let n = store::reset(&state.pool, &state.paths.thumbnails_dir, &media_ids).await?;
    for id in &media_ids {
        state.edit.close(id);
    }
    announce(&app, &state, &media_ids).await;
    Ok(n)
}

/// Galleries, selection and viewer pick up the new `edited`/`editVersion`.
async fn announce(app: &tauri::AppHandle, state: &AppStateRef<'_>, ids: &[String]) {
    if ids.is_empty() {
        return;
    }
    match media::get_many(&state.pool, ids).await {
        Ok(items) => {
            let _ = MediaUpdatedEvent {
                items,
                removed_ids: Vec::new(),
            }
            .emit(app);
        }
        Err(e) => tracing::warn!("Could not announce edited photos: {e}"),
    }
}
