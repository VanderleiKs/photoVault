use std::path::Path;

/// Extract basic metadata from an image file
/// Returns (width, height, captured_at)
pub async fn extract_image_metadata(path: &Path) -> (Option<i64>, Option<i64>, Option<String>) {
    // Try to get image dimensions using the `image` crate
    let (width, height) = match image::image_dimensions(path) {
        Ok((w, h)) => (Some(w as i64), Some(h as i64)),
        Err(e) => {
            tracing::debug!("Could not read image dimensions for {}: {}", path.display(), e);
            (None, None)
        }
    };

    // Try to extract EXIF data for capture date
    let captured_at = extract_exif_date(path).await;

    (width, height, captured_at)
}

/// Extract capture date from EXIF data
async fn extract_exif_date(path: &Path) -> Option<String> {
    // For now, use file modification time as fallback
    // TODO: Implement full EXIF parsing in Phase 3
    if let Ok(metadata) = std::fs::metadata(path) {
        if let Ok(modified) = metadata.modified() {
            let datetime: chrono::DateTime<chrono::Utc> = modified.into();
            return Some(datetime.to_rfc3339());
        }
    }
    None
}
