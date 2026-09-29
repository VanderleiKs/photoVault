//! Runtime directory layout (PRD §3.3).

use crate::error::{Error, Result};
use serde::Serialize;
use specta::Type;
use std::path::{Path, PathBuf};

/// Marker file that enables portable mode next to the executable/AppImage.
pub const PORTABLE_FLAG: &str = "portable.flag";

/// Where the runtime data lives.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum DataMode {
    /// Next to the executable (or AppImage): `portable.flag` present, or a debug build.
    Portable,
    /// Forced by the `PHOTOVAULT_HOME` environment variable.
    Custom,
    /// OS data directory (no flag, or the app folder is read-only).
    System,
}

#[derive(Debug, Clone)]
pub struct AppPaths {
    pub mode: DataMode,
    pub base_dir: PathBuf,
    pub db_path: PathBuf,
    pub thumbnails_dir: PathBuf,
    /// Local AI models (phase 7), downloaded on request.
    pub models_dir: PathBuf,
    pub logs_dir: PathBuf,
    pub cache_dir: PathBuf,
    /// WebView profile (WebView2/WebKitGTK). Must not live in %LOCALAPPDATA% / ~/.local.
    pub webview_dir: PathBuf,
}

/// Inputs for resolution, split out so the rules are testable.
#[derive(Debug, Default, Clone)]
pub struct PathInputs {
    pub photovault_home: Option<PathBuf>,
    pub appimage: Option<PathBuf>,
    pub exe: Option<PathBuf>,
    pub system_data_dir: Option<PathBuf>,
    pub debug_build: bool,
}

impl PathInputs {
    pub fn from_env() -> Self {
        Self {
            photovault_home: std::env::var_os("PHOTOVAULT_HOME").map(PathBuf::from),
            appimage: std::env::var_os("APPIMAGE").map(PathBuf::from),
            exe: std::env::current_exe().ok(),
            system_data_dir: dirs::data_dir().map(|d| d.join("PhotoVault")),
            debug_build: cfg!(debug_assertions),
        }
    }
}

impl AppPaths {
    /// Resolve from the process environment and create every directory.
    pub fn init() -> Result<Self> {
        let paths = Self::resolve(&PathInputs::from_env())?;
        paths.create_dirs()?;
        Ok(paths)
    }

    /// Resolution order:
    /// 1. `PHOTOVAULT_HOME`
    /// 2. Folder of the AppImage (the exe itself sits on a read-only mount) or of the
    ///    executable, when it has `portable.flag` (or in debug builds) and is writable
    /// 3. OS data directory
    pub fn resolve(inputs: &PathInputs) -> Result<Self> {
        if let Some(home) = &inputs.photovault_home {
            return Ok(Self::at(home.clone(), DataMode::Custom));
        }

        let app_dir = inputs
            .appimage
            .as_deref()
            .or(inputs.exe.as_deref())
            .and_then(Path::parent);
        if let Some(dir) = app_dir {
            let wants_portable = inputs.debug_build || dir.join(PORTABLE_FLAG).is_file();
            if wants_portable && is_writable(dir) {
                return Ok(Self::at(dir.to_path_buf(), DataMode::Portable));
            }
        }

        inputs
            .system_data_dir
            .clone()
            .map(|dir| Self::at(dir, DataMode::System))
            .ok_or_else(|| Error::Internal("Não foi possível determinar a pasta de dados.".into()))
    }

    fn at(base_dir: PathBuf, mode: DataMode) -> Self {
        let cache_dir = base_dir.join("cache");
        Self {
            mode,
            db_path: base_dir.join("data").join("catalog.db"),
            thumbnails_dir: base_dir.join("thumbnails"),
            models_dir: base_dir.join("models"),
            logs_dir: base_dir.join("logs"),
            webview_dir: cache_dir.join("webview"),
            cache_dir,
            base_dir,
        }
    }

    pub fn create_dirs(&self) -> Result<()> {
        let data_dir = self.db_path.parent().unwrap_or(&self.base_dir);
        for dir in [
            data_dir,
            &self.thumbnails_dir,
            &self.logs_dir,
            &self.cache_dir,
            &self.webview_dir,
        ] {
            std::fs::create_dir_all(dir).map_err(|e| {
                Error::Internal(format!("Não foi possível criar {}: {e}", dir.display()))
            })?;
        }
        if !is_writable(data_dir) {
            return Err(Error::Internal(format!(
                "A pasta {} não permite gravação.",
                data_dir.display()
            )));
        }
        Ok(())
    }
}

fn is_writable(dir: &Path) -> bool {
    let probe = dir.join(format!(".photovault-write-test-{}", std::process::id()));
    let ok = std::fs::File::create(&probe).is_ok();
    let _ = std::fs::remove_file(&probe);
    ok
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("pv-paths-{name}-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn inputs(exe_dir: &Path) -> PathInputs {
        PathInputs {
            exe: Some(exe_dir.join("photovault")),
            system_data_dir: Some(PathBuf::from("/sys-data/PhotoVault")),
            ..Default::default()
        }
    }

    #[test]
    fn env_override_wins() {
        let dir = temp_dir("env");
        let mut i = inputs(&dir);
        i.photovault_home = Some(PathBuf::from("/custom"));
        let p = AppPaths::resolve(&i).unwrap();
        assert_eq!(p.mode, DataMode::Custom);
        assert_eq!(p.base_dir, PathBuf::from("/custom"));
    }

    #[test]
    fn release_without_flag_uses_system_dir() {
        let dir = temp_dir("noflag");
        let p = AppPaths::resolve(&inputs(&dir)).unwrap();
        assert_eq!(p.mode, DataMode::System);
        assert_eq!(p.base_dir, PathBuf::from("/sys-data/PhotoVault"));
    }

    #[test]
    fn flag_enables_portable_next_to_exe() {
        let dir = temp_dir("flag");
        std::fs::write(dir.join(PORTABLE_FLAG), "").unwrap();
        let p = AppPaths::resolve(&inputs(&dir)).unwrap();
        assert_eq!(p.mode, DataMode::Portable);
        assert_eq!(p.base_dir, dir);
        assert_eq!(p.webview_dir, dir.join("cache").join("webview"));
    }

    #[test]
    fn appimage_dir_is_used_instead_of_mount() {
        let dir = temp_dir("appimage");
        std::fs::write(dir.join(PORTABLE_FLAG), "").unwrap();
        let mut i = inputs(Path::new("/tmp/.mount_PhotoVxyz/usr/bin"));
        i.appimage = Some(dir.join("PhotoVault.AppImage"));
        let p = AppPaths::resolve(&i).unwrap();
        assert_eq!(p.base_dir, dir);
    }

    #[test]
    fn debug_build_is_portable_without_flag() {
        let dir = temp_dir("debug");
        let mut i = inputs(&dir);
        i.debug_build = true;
        assert_eq!(AppPaths::resolve(&i).unwrap().mode, DataMode::Portable);
    }
}
