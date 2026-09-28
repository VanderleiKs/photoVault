use sqlx::SqlitePool;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

/// Global application state, shared as `Arc<AppState>`.
pub struct AppState {
    pub pool: SqlitePool,
    pub paths: AppPaths,
    pub scan: Arc<ScanControl>,
}

/// Runtime directories, all resolved from the portable base directory.
#[derive(Debug, Clone)]
pub struct AppPaths {
    pub base_dir: PathBuf,
    pub db_path: PathBuf,
    pub thumbnails_dir: PathBuf,
    pub logs_dir: PathBuf,
}

impl AppPaths {
    /// Resolve and create the runtime directories.
    pub fn init() -> Result<Self, String> {
        let base_dir = resolve_base_dir()?;
        let data_dir = base_dir.join("data");
        let thumbnails_dir = base_dir.join("thumbnails");
        let logs_dir = base_dir.join("logs");

        for dir in [&data_dir, &thumbnails_dir, &logs_dir] {
            std::fs::create_dir_all(dir)
                .map_err(|e| format!("Failed to create {}: {}", dir.display(), e))?;
        }
        ensure_writable(&data_dir)?;

        Ok(Self {
            db_path: data_dir.join("catalog.db"),
            base_dir,
            thumbnails_dir,
            logs_dir,
        })
    }
}

/// Single-scan guard plus cancellation flag.
#[derive(Default)]
pub struct ScanControl {
    running: AtomicBool,
    cancelled: AtomicBool,
}

impl ScanControl {
    /// Try to start a scan. Returns `None` if one is already running.
    pub fn try_start(self: &Arc<Self>) -> Option<ScanGuard> {
        self.running
            .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
            .ok()?;
        self.cancelled.store(false, Ordering::Release);
        Some(ScanGuard {
            control: Arc::clone(self),
        })
    }

    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::Release);
    }

    pub fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::Acquire)
    }
}

/// Releases the scan slot when dropped (also on error/panic).
pub struct ScanGuard {
    control: Arc<ScanControl>,
}

impl Drop for ScanGuard {
    fn drop(&mut self) {
        self.control.running.store(false, Ordering::Release);
    }
}

/// Portable base directory, in priority order:
/// 1. `PHOTOVAULT_HOME`
/// 2. Directory containing the AppImage (the exe itself lives on a read-only mount)
/// 3. Directory containing the executable
fn resolve_base_dir() -> Result<PathBuf, String> {
    if let Some(home) = std::env::var_os("PHOTOVAULT_HOME") {
        return Ok(PathBuf::from(home));
    }

    if let Some(appimage) = std::env::var_os("APPIMAGE")
        && let Some(dir) = Path::new(&appimage).parent()
    {
        return Ok(dir.to_path_buf());
    }

    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    exe_path
        .parent()
        .map(Path::to_path_buf)
        .ok_or_else(|| "Could not determine executable directory".to_string())
}

fn ensure_writable(dir: &Path) -> Result<(), String> {
    let test_file = dir.join(".write_test");
    std::fs::File::create(&test_file)
        .map_err(|e| format!("Directory {} is not writable: {}", dir.display(), e))?;
    let _ = std::fs::remove_file(&test_file);
    Ok(())
}
