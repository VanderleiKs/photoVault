use std::path::{Path, PathBuf};

const THUMBNAIL_SIZE: u32 = 256;

/// `<thumbnails_dir>/<id[0..2]>/<id>.webp`
pub fn thumbnail_path(thumbnails_dir: &Path, photo_id: &str) -> PathBuf {
    let subdir = photo_id.get(..2).unwrap_or("xx");
    thumbnails_dir.join(subdir).join(format!("{photo_id}.webp"))
}

/// Generate a thumbnail fitting in 256x256. Blocking: call from `spawn_blocking`.
/// With `force = false`, an existing thumbnail is kept.
pub fn generate_thumbnail(
    thumbnails_dir: &Path,
    photo_id: &str,
    source_path: &Path,
    force: bool,
) -> Result<(), String> {
    let thumb_path = thumbnail_path(thumbnails_dir, photo_id);
    if !force && thumb_path.exists() {
        return Ok(());
    }
    if let Some(parent) = thumb_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let img = image::open(source_path).map_err(|e| e.to_string())?;
    let thumbnail = img.thumbnail(THUMBNAIL_SIZE, THUMBNAIL_SIZE);

    // Write to a temp file first so a crash never leaves a truncated thumbnail.
    let tmp_path = thumb_path.with_extension("webp.tmp");
    {
        let file = std::fs::File::create(&tmp_path).map_err(|e| e.to_string())?;
        let mut writer = std::io::BufWriter::new(file);
        // The `image` crate only encodes lossless WebP; lossy comes with phase 2.
        let encoder = image::codecs::webp::WebPEncoder::new_lossless(&mut writer);
        thumbnail
            .write_with_encoder(encoder)
            .map_err(|e| e.to_string())?;
    }
    std::fs::rename(&tmp_path, &thumb_path).map_err(|e| e.to_string())?;

    Ok(())
}
