use super::AppStateRef;
use crate::error::ApiResult;
use photovault_core::Error;
use photovault_core::arrange::{
    self, ArrangeBatch, ArrangeItem, ArrangePreview, ArrangeRule, ArrangeScope, run,
};

/// Before → after of every file, nothing touched (Organizar pastas).
#[tauri::command]
#[specta::specta]
pub async fn preview_arrange(
    state: AppStateRef<'_>,
    library_id: String,
    rule: ArrangeRule,
    scope: ArrangeScope,
    limit: u32,
) -> ApiResult<ArrangePreview> {
    Ok(arrange::preview(&state.pool, &library_id, &rule, &scope, limit.min(2000)).await?)
}

/// The plan, kept and waiting for the confirmation (counts for the dialog).
#[tauri::command]
#[specta::specta]
pub async fn create_arrange(
    state: AppStateRef<'_>,
    library_id: String,
    rule: ArrangeRule,
    scope: ArrangeScope,
) -> ApiResult<ArrangeBatch> {
    Ok(arrange::create_batch(&state.pool, &library_id, &rule, &scope).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn discard_arrange(state: AppStateRef<'_>, batch_id: String) -> ApiResult<()> {
    Ok(arrange::discard(&state.pool, &batch_id).await?)
}

/// Confirmed: move the files (or resume), in the background. No scan runs meanwhile.
#[tauri::command]
#[specta::specta]
pub async fn start_arrange(state: AppStateRef<'_>, batch_id: String) -> ApiResult<()> {
    spawn(&state, batch_id, false)
}

/// Put the files back where they were (or resume undoing).
#[tauri::command]
#[specta::specta]
pub async fn undo_arrange(state: AppStateRef<'_>, batch_id: String) -> ApiResult<()> {
    spawn(&state, batch_id, true)
}

fn spawn(state: &AppStateRef<'_>, batch_id: String, undo: bool) -> ApiResult<()> {
    if run::is_running(&batch_id) {
        return Ok(());
    }
    let guard = state.scan.try_start().ok_or_else(|| {
        Error::InvalidInput(
            "Há um scan em andamento: espere terminar para organizar os arquivos.".into(),
        )
    })?;
    let pool = state.pool.clone();
    tauri::async_runtime::spawn(async move {
        let result = if undo {
            run::undo(&pool, &batch_id).await
        } else {
            run::execute(&pool, &batch_id).await
        };
        if let Err(e) = result {
            tracing::error!("Arrange {batch_id} stopped: {e}");
        }
        drop(guard);
    });
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn pause_arrange(batch_id: String) -> ApiResult<()> {
    run::pause(&batch_id);
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn get_arrange_batch(
    state: AppStateRef<'_>,
    batch_id: String,
) -> ApiResult<ArrangeBatch> {
    Ok(arrange::get(&state.pool, &batch_id).await?)
}

/// History of a library, newest first.
#[tauri::command]
#[specta::specta]
pub async fn list_arrange_batches(
    state: AppStateRef<'_>,
    library_id: String,
) -> ApiResult<Vec<ArrangeBatch>> {
    Ok(arrange::list(&state.pool, &library_id, 20).await?)
}

/// Files of a batch (`status`: e.g. "failed").
#[tauri::command]
#[specta::specta]
pub async fn list_arrange_items(
    state: AppStateRef<'_>,
    batch_id: String,
    status: Option<String>,
    offset: u32,
    limit: u32,
) -> ApiResult<Vec<ArrangeItem>> {
    Ok(arrange::items(
        &state.pool,
        &batch_id,
        status.as_deref(),
        offset,
        limit.min(1000),
    )
    .await?)
}
