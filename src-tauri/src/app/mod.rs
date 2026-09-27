use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::{AppHandle, Manager};

/// Global application state
pub struct AppState {
    pub app_handle: AppHandle,
    pub scan_cancelled: Arc<RwLock<bool>>,
}

impl AppState {
    pub fn new(app_handle: AppHandle) -> Result<Self, String> {
        Ok(Self {
            app_handle,
            scan_cancelled: Arc::new(RwLock::new(false)),
        })
    }

    pub async fn is_scan_cancelled(&self) -> bool {
        *self.scan_cancelled.read().await
    }

    pub async fn cancel_scan(&self) {
        let mut cancelled = self.scan_cancelled.write().await;
        *cancelled = true;
    }

    pub async fn reset_scan_flag(&self) {
        let mut cancelled = self.scan_cancelled.write().await;
        *cancelled = false;
    }
}

/// Get the database path - stored alongside the executable for portability
pub fn get_db_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let exe_dir = get_exe_dir(app_handle)?;
    let data_dir = exe_dir.join("data");
    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    Ok(data_dir.join("catalog.db"))
}

/// Get the thumbnails directory - stored alongside the executable
pub fn get_thumbnails_dir(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let exe_dir = get_exe_dir(app_handle)?;
    let thumb_dir = exe_dir.join("thumbnails");
    std::fs::create_dir_all(&thumb_dir).map_err(|e| e.to_string())?;
    Ok(thumb_dir)
}

/// Get the logs directory - stored alongside the executable
pub fn get_logs_dir(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let exe_dir = get_exe_dir(app_handle)?;
    let logs_dir = exe_dir.join("logs");
    std::fs::create_dir_all(&logs_dir).map_err(|e| e.to_string())?;
    Ok(logs_dir)
}

/// Get the directory where the executable is located
fn get_exe_dir(_app_handle: &AppHandle) -> Result<PathBuf, String> {
    // For portable mode, we use the current executable's directory
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_dir = exe_path
        .parent()
        .ok_or_else(|| "Could not determine executable directory".to_string())?;
    Ok(exe_dir.to_path_buf())
}
