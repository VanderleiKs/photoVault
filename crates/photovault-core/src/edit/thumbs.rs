//! Edited thumbnails (1024 and 256, WebP) rendered from the original by the queue.

use std::path::Path;

use image::{DynamicImage, RgbImage};

use super::{AutoValues, EditRecipe, auto, decode, pipeline, resolve};
use crate::ingestion::processor;
use crate::thumbnails::{self, GRID_SIZE, PREVIEW_SIZE};

/// Renders and writes the edited thumbnails of `media_id`. Returns the automatic
/// values when they had to be computed (to be stored).
pub fn render(
    thumbnails_dir: &Path,
    media_id: &str,
    file: &Path,
    recipe: &EditRecipe,
    cached: Option<AutoValues>,
    threads: usize,
) -> Result<Option<AutoValues>, String> {
    let bytes = std::fs::read(file).map_err(|e| match e.kind() {
        std::io::ErrorKind::NotFound => "Arquivo não encontrado.".to_string(),
        _ => format!("Não foi possível ler o arquivo: {e}"),
    })?;
    // Twice the preview size: the crop still has pixels to spare.
    let source = decode::decode_fit(&bytes, Some(PREVIEW_SIZE * 2))
        .map_err(|e| format!("Não foi possível decodificar a imagem: {e}"))?;
    drop(bytes);
    let mut computed = None;
    let values = match cached {
        Some(v) => Some(v),
        None if recipe.needs_auto() => {
            let v = auto::analyze(&source)?;
            computed = Some(v.clone());
            Some(v)
        }
        None => None,
    };
    let r = resolve(recipe, values.as_ref());
    let out = pipeline::render(&source, &r, Some(PREVIEW_SIZE), threads)?;
    let img = RgbImage::from_raw(out.width, out.height, out.rgb)
        .map(DynamicImage::ImageRgb8)
        .ok_or("falha ao montar a imagem")?;
    let preview = processor::encode_webp(&img)?;
    let grid = processor::encode_webp(&processor::fit(&img, GRID_SIZE)?)?;
    thumbnails::write_edit(thumbnails_dir, media_id, PREVIEW_SIZE, &preview)
        .map_err(|e| e.to_string())?;
    thumbnails::write_edit(thumbnails_dir, media_id, GRID_SIZE, &grid)
        .map_err(|e| e.to_string())?;
    Ok(computed)
}
