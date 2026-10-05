//! WebP thumbnails: `<thumbnails>/<size>/<id[0..2]>/<id[2..4]>/<id>.webp`.
//!
//! Edited photos (phase 9) also have `<thumbnails>/edit/<size>/…`: the edited look for
//! the gallery and the viewer. The plain ones above stay the input of every analysis.

use crate::error::Result;
use std::path::{Path, PathBuf};

/// Gallery tiles.
pub const GRID_SIZE: u32 = 256;
/// Viewer placeholder / fallback for formats the WebView can't show (HEIC, TIFF) and analysis.
pub const PREVIEW_SIZE: u32 = 1024;
pub const SIZES: [u32; 2] = [GRID_SIZE, PREVIEW_SIZE];

pub fn path(thumbnails_dir: &Path, media_id: &str, size: u32) -> PathBuf {
    let a = media_id.get(..2).unwrap_or("xx");
    let b = media_id.get(2..4).unwrap_or("xx");
    thumbnails_dir
        .join(size.to_string())
        .join(a)
        .join(b)
        .join(format!("{media_id}.webp"))
}

/// Thumbnail of the edited photo.
pub fn edit_path(thumbnails_dir: &Path, media_id: &str, size: u32) -> PathBuf {
    path(&thumbnails_dir.join("edit"), media_id, size)
}

/// Write an encoded thumbnail atomically (temp file + rename).
pub fn write(thumbnails_dir: &Path, media_id: &str, size: u32, webp: &[u8]) -> Result<()> {
    write_to(&path(thumbnails_dir, media_id, size), webp)
}

pub fn write_edit(thumbnails_dir: &Path, media_id: &str, size: u32, webp: &[u8]) -> Result<()> {
    write_to(&edit_path(thumbnails_dir, media_id, size), webp)
}

fn write_to(target: &Path, webp: &[u8]) -> Result<()> {
    if let Some(parent) = target.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let tmp = target.with_extension("webp.tmp");
    std::fs::write(&tmp, webp)?;
    std::fs::rename(&tmp, target)?;
    Ok(())
}

/// Remove every size of the given thumbnails, edited ones included (missing files are
/// ignored).
pub fn remove(thumbnails_dir: &Path, media_ids: &[String]) {
    remove_edit(thumbnails_dir, media_ids);
    for id in media_ids {
        for size in SIZES {
            let _ = std::fs::remove_file(path(thumbnails_dir, id, size));
        }
    }
}

/// Remove only the edited thumbnails (the edit was undone).
pub fn remove_edit(thumbnails_dir: &Path, media_ids: &[String]) {
    for id in media_ids {
        for size in SIZES {
            let _ = std::fs::remove_file(edit_path(thumbnails_dir, id, size));
        }
    }
}
