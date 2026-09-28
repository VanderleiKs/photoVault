//! Disk/volume information for the sidebar footer ("HD Externo (E:) · 512 GB livres").

use serde::Serialize;
use specta::Type;
use std::path::Path;
use sysinfo::Disks;

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct VolumeInfo {
    /// Human label: volume name on Windows, last mount-point component on Linux.
    pub label: String,
    pub mount_point: String,
    #[specta(type = specta_typescript::Number)]
    pub total_bytes: u64,
    #[specta(type = specta_typescript::Number)]
    pub available_bytes: u64,
    pub removable: bool,
}

/// Volume containing `path`, or `None` if it is not reachable.
pub fn for_path(path: &Path) -> Option<VolumeInfo> {
    let path = path.canonicalize().ok()?;
    let disks = Disks::new_with_refreshed_list();
    let disk = disks
        .list()
        .iter()
        .filter(|d| path.starts_with(d.mount_point()))
        .max_by_key(|d| d.mount_point().as_os_str().len())?;

    let mount = disk.mount_point().to_string_lossy().into_owned();
    let name = disk.name().to_string_lossy().into_owned();
    let label = if cfg!(windows) {
        let letter = mount.trim_end_matches(['\\', '/']);
        if name.is_empty() {
            letter.to_string()
        } else {
            format!("{name} ({letter})")
        }
    } else {
        disk.mount_point()
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_else(|| "Sistema".to_string())
    };

    Some(VolumeInfo {
        label,
        mount_point: mount,
        total_bytes: disk.total_space(),
        available_bytes: disk.available_space(),
        removable: disk.is_removable(),
    })
}
