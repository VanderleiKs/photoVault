use std::path::Path;

/// Check if a path exists and is accessible
pub fn path_exists(path: &Path) -> bool {
    path.exists()
}

/// Get file size in bytes
pub fn get_file_size(path: &Path) -> Result<u64, std::io::Error> {
    let metadata = std::fs::metadata(path)?;
    Ok(metadata.len())
}

/// Check if a file is readable
pub fn is_readable(path: &Path) -> bool {
    std::fs::File::open(path).is_ok()
}

/// Safely move a file to trash (never deletes permanently)
pub fn move_to_trash(
    source: &Path,
    trash_dir: &Path,
) -> Result<std::path::PathBuf, std::io::Error> {
    std::fs::create_dir_all(trash_dir)?;

    let filename = source
        .file_name()
        .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidInput, "Invalid filename"))?;

    let unique_name = format!(
        "{}_{}",
        chrono::Utc::now().timestamp_millis(),
        filename.to_string_lossy()
    );

    let dest = trash_dir.join(unique_name);
    std::fs::rename(source, &dest)?;

    Ok(dest)
}

/// Restore a file from trash
pub fn restore_from_trash(
    trash_path: &Path,
    original_path: &Path,
) -> Result<(), std::io::Error> {
    if let Some(parent) = original_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::rename(trash_path, original_path)?;
    Ok(())
}
