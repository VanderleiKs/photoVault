use std::path::Path;

/// Basic image metadata. Blocking: call from `spawn_blocking`.
/// Returns (width, height, captured_at).
pub fn extract_image_metadata(path: &Path) -> (Option<i64>, Option<i64>, Option<String>) {
    let (width, height) = match image::image_dimensions(path) {
        Ok((w, h)) => (Some(w as i64), Some(h as i64)),
        Err(e) => {
            tracing::debug!(
                "Could not read image dimensions for {}: {}",
                path.display(),
                e
            );
            (None, None)
        }
    };

    (width, height, file_modified_at(path))
}

/// File modification time as RFC 3339.
/// Placeholder for the capture date until EXIF parsing lands (plan, phase 2).
pub fn file_modified_at(path: &Path) -> Option<String> {
    let modified = std::fs::metadata(path).ok()?.modified().ok()?;
    let datetime: chrono::DateTime<chrono::Utc> = modified.into();
    Some(datetime.to_rfc3339())
}
