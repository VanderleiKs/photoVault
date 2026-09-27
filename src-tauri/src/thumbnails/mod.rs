use crate::app;
use std::path::Path;
use tauri::Manager;

const THUMBNAIL_SIZE: u32 = 256;

/// Generate a 256x256 thumbnail for a photo
pub async fn generate_thumbnail(
    app_handle: &tauri::AppHandle,
    photo_id: &str,
    source_path: &Path,
) -> Result<(), String> {
    let thumbnails_dir = app::get_thumbnails_dir(app_handle)?;

    // Create subdirectory based on first 2 chars of ID for better filesystem performance
    let subdir = if photo_id.len() >= 2 {
        &photo_id[..2]
    } else {
        "xx"
    };
    let thumb_subdir = thumbnails_dir.join(subdir);
    std::fs::create_dir_all(&thumb_subdir).map_err(|e| e.to_string())?;

    let thumb_path = thumb_subdir.join(format!("{}.webp", photo_id));

    // Skip if thumbnail already exists
    if thumb_path.exists() {
        return Ok(());
    }

    // Generate thumbnail using the `image` crate
    let img = image::open(source_path).map_err(|e| e.to_string())?;

    // Resize to fit within THUMBNAIL_SIZE x THUMBNAIL_SIZE while maintaining aspect ratio
    let thumbnail = img.resize(
        THUMBNAIL_SIZE,
        THUMBNAIL_SIZE,
        image::imageops::FilterType::Lanczos3,
    );

    // Save as WebP
    let output_file = std::fs::File::create(&thumb_path).map_err(|e| e.to_string())?;
    let mut writer = std::io::BufWriter::new(output_file);

    // Use webp encoding
    let encoder = image::codecs::webp::WebPEncoder::new_lossless(&mut writer);
    thumbnail
        .write_with_encoder(encoder)
        .map_err(|e| e.to_string())?;

    tracing::debug!(
        "Generated thumbnail for {} at {}",
        photo_id,
        thumb_path.display()
    );

    Ok(())
}

/// Get the thumbnail path for a photo
pub fn get_thumbnail_path(
    app_handle: &tauri::AppHandle,
    photo_id: &str,
) -> Result<std::path::PathBuf, String> {
    let thumbnails_dir = app::get_thumbnails_dir(app_handle)?;
    let subdir = if photo_id.len() >= 2 {
        &photo_id[..2]
    } else {
        "xx"
    };
    Ok(thumbnails_dir.join(subdir).join(format!("{}.webp", photo_id)))
}
