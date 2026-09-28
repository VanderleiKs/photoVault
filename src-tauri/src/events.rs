//! Typed events (exported to TypeScript by tauri-specta).

use crate::error::ApiError;
use photovault_core::ingestion::{ScanObserver, ScanProgress, ScanSummary};
use serde::Serialize;
use specta::Type;
use tauri::AppHandle;
use tauri_specta::Event;

#[derive(Debug, Clone, Serialize, Type, Event)]
pub struct ScanProgressEvent(pub ScanProgress);

#[derive(Debug, Clone, Serialize, Type, Event)]
pub struct ScanCompleteEvent(pub ScanSummary);

#[derive(Debug, Clone, Serialize, Type, Event)]
#[serde(rename_all = "camelCase")]
pub struct ScanErrorEvent {
    pub library_id: String,
    pub error: ApiError,
}

/// Forwards core scan progress to the WebView.
pub struct TauriScanObserver(pub AppHandle);

impl ScanObserver for TauriScanObserver {
    fn on_progress(&self, progress: &ScanProgress) {
        let _ = ScanProgressEvent(progress.clone()).emit(&self.0);
    }
}
