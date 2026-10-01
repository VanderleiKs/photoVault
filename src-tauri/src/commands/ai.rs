use super::AppStateRef;
use crate::error::ApiResult;
use photovault_core::ai::{self, Package, download::DownloadState};
use photovault_core::{Error, people};
use serde::Serialize;
use specta::Type;

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AiStatus {
    /// Content search and scenes (CLIP): files downloaded.
    pub installed: bool,
    /// Loaded and in use (installed + enabled + loaded fine).
    pub ready: bool,
    /// Download size of the models.
    #[specta(type = specta_typescript::Number)]
    pub size_bytes: u64,
    /// Photos with a content analysis / still waiting (all libraries).
    pub indexed: u32,
    pub pending: u32,
    /// People (face models, phase 7b).
    pub faces: FaceStatus,
    pub download: DownloadState,
    /// Why a model couldn't be loaded.
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FaceStatus {
    pub installed: bool,
    pub ready: bool,
    #[specta(type = specta_typescript::Number)]
    pub size_bytes: u64,
    /// Photos already searched for faces / faces found / photos still waiting.
    pub scanned: u32,
    pub found: u32,
    pub pending: u32,
}

/// Which set of models: "content" (search and scenes) or "faces" (people).
#[derive(Debug, Clone, Copy, serde::Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum AiPackage {
    Content,
    Faces,
}

impl AiPackage {
    fn package(self) -> &'static Package {
        match self {
            AiPackage::Content => &ai::CONTENT,
            AiPackage::Faces => &ai::FACES,
        }
    }
}

/// Settings → IA local.
#[tauri::command]
#[specta::specta]
pub async fn get_ai_status(state: AppStateRef<'_>) -> ApiResult<AiStatus> {
    let dir = &state.paths.models_dir;
    let ready = ai::engine().is_some();
    let faces_ready = ai::face_engine().is_some();
    let (scanned, found) = people::scanned_counts(&state.pool).await?;
    Ok(AiStatus {
        installed: ai::CONTENT.installed(dir),
        ready,
        size_bytes: ai::CONTENT.size(),
        indexed: ai::index::indexed_count(&state.pool).await?,
        pending: if ready {
            ai::index::pending_count(&state.pool).await?
        } else {
            0
        },
        faces: FaceStatus {
            installed: ai::FACES.installed(dir),
            ready: faces_ready,
            size_bytes: ai::FACES.size(),
            scanned,
            found,
            pending: if faces_ready {
                people::pending_count(&state.pool).await?
            } else {
                0
            },
        },
        download: ai::download::state(),
        error: ai::load_error(),
    })
}

/// The user agreed: download the models (the app's only network access), then load them
/// and start the analysis. Several packages (first run) go one after the other.
#[tauri::command]
#[specta::specta]
pub async fn download_ai_models(state: AppStateRef<'_>, models: Vec<AiPackage>) -> ApiResult<()> {
    let (pool, dir, jobs) = (
        state.pool.clone(),
        state.paths.models_dir.clone(),
        state.jobs.clone(),
    );
    let handle = tokio::runtime::Handle::current();
    let packages = models.into_iter().map(AiPackage::package).collect();
    ai::download::start(dir.clone(), packages, move |result| {
        if result.is_ok() {
            handle.spawn(async move {
                if ai::sync(&pool, &dir).await.is_ok() {
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

/// Delete the models and what they produced; the app goes back to working without them.
#[tauri::command]
#[specta::specta]
pub async fn remove_ai_models(state: AppStateRef<'_>, models: AiPackage) -> ApiResult<()> {
    if ai::download::state().running {
        return Err(Error::InvalidInput("Aguarde o download terminar.".into()).into());
    }
    Ok(ai::remove(&state.pool, &state.paths.models_dir, models.package()).await?)
}
