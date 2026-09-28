use photovault_core::db::SqlitePool;
use photovault_core::ingestion::ScanControl;
use photovault_core::jobs::JobRunner;
use photovault_core::paths::AppPaths;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

/// Global application state, managed by Tauri as `Arc<AppState>`.
pub struct AppState {
    pub pool: SqlitePool,
    pub paths: AppPaths,
    pub scan: Arc<ScanControl>,
    /// Background ingest pipeline (EXIF, thumbnails, hashes).
    pub jobs: Arc<JobRunner>,
    /// Library currently being scanned (lets a reloaded UI resume showing progress).
    pub scanning_library: Mutex<Option<String>>,
    /// v0.x catalog archived on this start, reported once to the UI.
    pub archived_legacy_catalog: Option<PathBuf>,
}
