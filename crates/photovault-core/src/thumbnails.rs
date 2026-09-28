//! WebP thumbnails: `<thumbnails>/<size>/<id[0..2]>/<id[2..4]>/<id>.webp`.

use crate::error::{Error, Result};
use std::path::{Path, PathBuf};

pub const GRID_SIZE: u32 = 256;

pub fn path(thumbnails_dir: &Path, media_id: &str, size: u32) -> PathBuf {
    let a = media_id.get(..2).unwrap_or("xx");
    let b = media_id.get(2..4).unwrap_or("xx");
    thumbnails_dir
        .join(size.to_string())
        .join(a)
        .join(b)
        .join(format!("{media_id}.webp"))
}

/// Generate a thumbnail fitting in `size`x`size`. Blocking: call from `spawn_blocking`.
/// With `force = false`, an existing thumbnail is kept.
pub fn generate(
    thumbnails_dir: &Path,
    media_id: &str,
    source: &Path,
    size: u32,
    force: bool,
) -> Result<()> {
    let target = path(thumbnails_dir, media_id, size);
    if !force && target.exists() {
        return Ok(());
    }
    if let Some(parent) = target.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let img = image::open(source).map_err(|e| Error::Internal(e.to_string()))?;
    let thumb = img.thumbnail(size, size);

    // Temp file + rename so a crash never leaves a truncated thumbnail.
    let tmp = target.with_extension("webp.tmp");
    {
        let mut writer = std::io::BufWriter::new(std::fs::File::create(&tmp)?);
        // The `image` crate only encodes lossless WebP; lossy comes in phase 2.
        let encoder = image::codecs::webp::WebPEncoder::new_lossless(&mut writer);
        thumb
            .write_with_encoder(encoder)
            .map_err(|e| Error::Internal(e.to_string()))?;
    }
    std::fs::rename(&tmp, &target)?;
    Ok(())
}

/// Remove every size of the given thumbnails (missing files are ignored).
pub fn remove(thumbnails_dir: &Path, media_ids: &[String]) {
    for id in media_ids {
        for size in [GRID_SIZE, 1024] {
            let _ = std::fs::remove_file(path(thumbnails_dir, id, size));
        }
    }
}
