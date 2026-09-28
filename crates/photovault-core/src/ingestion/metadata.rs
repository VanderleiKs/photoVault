use std::path::Path;

/// Image dimensions. Blocking: call from `spawn_blocking`.
/// EXIF (capture date, camera, GPS) arrives in phase 2.
pub fn image_dimensions(path: &Path) -> (Option<i64>, Option<i64>) {
    match image::image_dimensions(path) {
        Ok((w, h)) => (Some(w as i64), Some(h as i64)),
        Err(e) => {
            tracing::debug!("Could not read dimensions of {}: {e}", path.display());
            (None, None)
        }
    }
}
