use super::AppStateRef;
use crate::error::{ApiError, ApiResult};
use photovault_core::catalog::{AppSettings, settings};
use photovault_core::paths::DataMode;
use photovault_core::volume::{self, VolumeInfo};
use serde::Serialize;
use specta::Type;
use std::path::Path;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub version: String,
    pub data_mode: DataMode,
    pub base_dir: String,
    pub logs_dir: String,
    /// Path of the archived v0.x catalog, when it was archived on this start.
    pub archived_legacy_catalog: Option<String>,
}

#[tauri::command]
#[specta::specta]
pub async fn get_app_info(app: tauri::AppHandle, state: AppStateRef<'_>) -> ApiResult<AppInfo> {
    let display = |p: &Path| p.display().to_string();
    Ok(AppInfo {
        version: app.package_info().version.to_string(),
        data_mode: state.paths.mode,
        base_dir: display(&state.paths.base_dir),
        logs_dir: display(&state.paths.logs_dir),
        archived_legacy_catalog: state.archived_legacy_catalog.as_deref().map(display),
    })
}

#[tauri::command]
#[specta::specta]
pub async fn get_settings(state: AppStateRef<'_>) -> ApiResult<AppSettings> {
    Ok(settings::get(&state.pool).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn save_settings(
    settings: AppSettings,
    state: AppStateRef<'_>,
) -> ApiResult<AppSettings> {
    Ok(settings::save(&state.pool, &settings).await?)
}

/// Volume containing `path` (free/total space for the sidebar footer).
#[tauri::command]
#[specta::specta]
pub async fn get_volume_info(path: String) -> ApiResult<Option<VolumeInfo>> {
    tokio::task::spawn_blocking(move || volume::for_path(Path::new(&path)))
        .await
        .map_err(|e| ApiError::internal(e.to_string()))
}

/// Native folder picker. `None` when the user cancels.
#[tauri::command]
#[specta::specta]
pub async fn pick_folder(app: tauri::AppHandle) -> ApiResult<Option<String>> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog().file().pick_folder(move |path| {
        let _ = tx.send(path.and_then(|p| p.into_path().ok()));
    });
    rx.await
        .map(|path| path.map(|p| p.display().to_string()))
        .map_err(|e| ApiError::internal(e.to_string()))
}

#[tauri::command]
#[specta::specta]
pub async fn open_logs_dir(app: tauri::AppHandle, state: AppStateRef<'_>) -> ApiResult<()> {
    app.opener()
        .open_path(state.paths.logs_dir.display().to_string(), None::<&str>)
        .map_err(|e| ApiError::internal(e.to_string()))
}
