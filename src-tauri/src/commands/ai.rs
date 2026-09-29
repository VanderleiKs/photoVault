use super::AppStateRef;
use crate::error::ApiResult;
use photovault_core::ai::{self, download::DownloadState};
use serde::Serialize;
use specta::Type;

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AiStatus {
    /// Files downloaded.
    pub installed: bool,
    /// Loaded and in use (installed + enabled + loaded fine).
    pub ready: bool,
    /// Download size of the models.
    #[specta(type = specta_typescript::Number)]
    pub size_bytes: u64,
    /// Photos with a content analysis / still waiting (all libraries).
    pub indexed: u32,
    pub pending: u32,
    pub download: DownloadState,
    /// Why the model couldn't be loaded.
    pub error: Option<String>,
}

/// Settings → IA local.
#[tauri::command]
#[specta::specta]
pub async fn get_ai_status(state: AppStateRef<'_>) -> ApiResult<AiStatus> {
    let ready = ai::engine().is_some();
    Ok(AiStatus {
        installed: ai::installed(&state.paths.models_dir),
        ready,
        size_bytes: ai::total_size(),
        indexed: ai::index::indexed_count(&state.pool).await?,
        pending: if ready {
            ai::index::pending_count(&state.pool).await?
        } else {
            0
        },
        download: ai::download::state(),
        error: ai::load_error(),
    })
}

/// The user agreed: download the models (the app's only network access), then load them
/// and start the content analysis.
#[tauri::command]
#[specta::specta]
pub async fn download_ai_models(state: AppStateRef<'_>) -> ApiResult<()> {
    let (pool, dir, jobs) = (
        state.pool.clone(),
        state.paths.models_dir.clone(),
        state.jobs.clone(),
    );
    let handle = tokio::runtime::Handle::current();
    ai::download::start(dir.clone(), move |result| {
        if result.is_ok() {
            handle.spawn(async move {
                if matches!(ai::sync(&pool, &dir).await, Ok(true)) {
                    jobs.wake();
                }
            });
        }
    })?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn cancel_ai_download() -> ApiResult<()> {
    ai::download::cancel();
    Ok(())
}

/// Delete the models and the content analysis; the app goes back to working without them.
#[tauri::command]
#[specta::specta]
pub async fn remove_ai_models(state: AppStateRef<'_>) -> ApiResult<()> {
    Ok(ai::remove(&state.pool, &state.paths.models_dir).await?)
}
