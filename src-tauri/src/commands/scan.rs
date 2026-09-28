use super::AppStateRef;
use crate::error::{ApiError, ApiResult};
use crate::events::{ScanCompleteEvent, ScanErrorEvent, TauriScanObserver};
use photovault_core::Error;
use photovault_core::catalog::libraries;
use photovault_core::ingestion::{ScanContext, scanner};
use std::sync::Arc;
use tauri_specta::Event;

/// Start scanning a library in the background.
/// Progress: `scanProgressEvent`; end: `scanCompleteEvent` or `scanErrorEvent`.
#[tauri::command]
#[specta::specta]
pub async fn scan_library(
    library_id: String,
    app: tauri::AppHandle,
    state: AppStateRef<'_>,
) -> ApiResult<()> {
    let library = libraries::get(&state.pool, &library_id).await?;
    if !library.connected {
        return Err(Error::PathNotAccessible(library.root_path).into());
    }
    let guard = state.scan.try_start().ok_or(Error::ScanInProgress)?;
    let state = Arc::clone(state.inner());
    *state
        .scanning_library
        .lock()
        .unwrap_or_else(|e| e.into_inner()) = Some(library.id.clone());

    tauri::async_runtime::spawn(async move {
        let _guard = guard;
        let ctx = ScanContext {
            pool: state.pool.clone(),
            control: Arc::clone(&state.scan),
        };
        let observer = Arc::new(TauriScanObserver(app.clone()));

        match scanner::scan(&ctx, &library, observer).await {
            Ok(summary) => {
                // New/modified files were queued for EXIF, thumbnails and hashes.
                state.jobs.wake();
                let _ = ScanCompleteEvent(summary).emit(&app);
            }
            Err(e) => {
                let _ = ScanErrorEvent {
                    library_id: library.id.clone(),
                    error: ApiError::from(e),
                }
                .emit(&app);
            }
        }
        *state
            .scanning_library
            .lock()
            .unwrap_or_else(|e| e.into_inner()) = None;
    });

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn cancel_scan(state: AppStateRef<'_>) -> ApiResult<()> {
    state.scan.cancel();
    Ok(())
}

/// Library being scanned right now, if any.
#[tauri::command]
#[specta::specta]
pub async fn get_scanning_library(state: AppStateRef<'_>) -> ApiResult<Option<String>> {
    Ok(state
        .scanning_library
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .clone())
}
