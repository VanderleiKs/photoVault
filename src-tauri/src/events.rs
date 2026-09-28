//! Typed events (exported to TypeScript by tauri-specta).

use crate::error::ApiError;
use photovault_core::catalog::MediaItem;
use photovault_core::ingestion::{ScanObserver, ScanProgress, ScanSummary};
use photovault_core::jobs::{JobObserver, JobProgress};
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

#[derive(Debug, Clone, Serialize, Type, Event)]
pub struct JobProgressEvent(pub JobProgress);

/// Items whose metadata/thumbnails changed; `removedIds` were merged into another
/// record (moved files).
#[derive(Debug, Clone, Serialize, Type, Event)]
#[serde(rename_all = "camelCase")]
pub struct MediaUpdatedEvent {
    pub items: Vec<MediaItem>,
    pub removed_ids: Vec<String>,
}

/// Forwards pipeline updates to the WebView.
pub struct TauriJobObserver(pub AppHandle);

impl JobObserver for TauriJobObserver {
    fn on_progress(&self, progress: &JobProgress) {
        let _ = JobProgressEvent(progress.clone()).emit(&self.0);
    }

    fn on_media_updated(&self, items: Vec<MediaItem>, removed_ids: Vec<String>) {
        let _ = MediaUpdatedEvent { items, removed_ids }.emit(&self.0);
    }
}
