//! CPU side of the ingest pipeline: one read of the file yields hashes, capture
//! metadata, oriented thumbnails and the perceptual hash. Pure and blocking.

use super::metadata::{self, CaptureInfo};
use crate::catalog::MediaType;
use crate::thumbnails::{GRID_SIZE, PREVIEW_SIZE};
use fast_image_resize::{IntoImageView, ResizeAlg, ResizeOptions, Resizer, images::Image};
use image::{DynamicImage, ImageDecoder, ImageReader};
use sha2::{Digest, Sha256};
use std::io::{Cursor, Read};
use std::path::Path;

/// WebP quality for thumbnails (lossy, PRD §22).
const WEBP_QUALITY: f32 = 80.0;
/// libwebp effort 0–6. 2 is 2.5× faster than the default 4 for ~5% larger files.
const WEBP_METHOD: i32 = 2;

/// Encoded WebP thumbnails by edge size.
pub type Thumbnails = Vec<(u32, Vec<u8>)>;

#[derive(Debug, Default)]
pub struct Processed {
    pub sha256: String,
    pub capture: CaptureInfo,
    /// Displayed (orientation-corrected) size.
    pub width: Option<u32>,
    pub height: Option<u32>,
    /// Encoded WebP thumbnails by edge size (empty when the format can't be decoded).
    pub thumbnails: Thumbnails,
    /// Why thumbnails are missing, if they are (unsupported format, corrupt file).
    pub decode_error: Option<String>,
    /// The format is known but not decodable yet (HEIC): not a problem with the file.
    pub unsupported_format: bool,
}

pub struct SourceFile<'a> {
    pub filename: &'a str,
    pub extension: &'a str,
    pub media_type: MediaType,
    pub modified: Option<&'a str>,
}

/// Process an image whose bytes are already in memory.
pub fn process_image(bytes: &[u8], file: &SourceFile<'_>) -> Processed {
    let mut out = Processed {
        sha256: hex(&Sha256::digest(bytes)),
        capture: metadata::read_image_exif(bytes),
        ..Default::default()
    };
    metadata::resolve_capture_date(&mut out.capture, file.filename, file.modified);

    match decode_oriented(bytes) {
        Ok(img) => {
            out.width = Some(img.width());
            out.height = Some(img.height());
            match make_thumbnails(img) {
                Ok((thumbs, _grid)) => out.thumbnails = thumbs,
                Err(e) => out.decode_error = Some(e),
            }
        }
        Err(e) => {
            out.unsupported_format = is_unsupported(file.extension);
            out.decode_error = Some(describe_decode_error(file.extension, &e));
        }
    }
    out
}

/// Process a video: streamed SHA-256 plus container metadata. The thumbnail comes later,
/// from a frame the WebView captures (`ingestion::frames`).
pub fn process_video(path: &Path, file: &SourceFile<'_>) -> std::io::Result<Processed> {
    let sha256 = sha256_file(path)?;
    let mut capture = metadata::read_video(path);
    metadata::resolve_capture_date(&mut capture, file.filename, file.modified);
    Ok(Processed {
        sha256,
        width: capture.width,
        height: capture.height,
        capture,
        ..Default::default()
    })
}

/// Thumbnails of a still frame (a JPEG/PNG captured from a video).
pub fn frame_thumbnails(bytes: &[u8]) -> Result<Thumbnails, String> {
    let img = decode_oriented(bytes)?;
    make_thumbnails(img).map(|(thumbs, _)| thumbs)
}

pub fn sha256_file(path: &Path) -> std::io::Result<String> {
    let mut file = std::fs::File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buf = vec![0u8; 1 << 20];
    loop {
        let n = file.read(&mut buf)?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(hex(&hasher.finalize()))
}

/// Decode and apply the EXIF orientation, so thumbnails are always upright.
fn decode_oriented(bytes: &[u8]) -> Result<DynamicImage, String> {
    let reader = ImageReader::new(Cursor::new(bytes))
        .with_guessed_format()
        .map_err(|e| e.to_string())?;
    let mut decoder = reader.into_decoder().map_err(|e| e.to_string())?;
    let orientation = decoder.orientation().ok();
    let mut img = DynamicImage::from_decoder(decoder).map_err(|e| e.to_string())?;
    if let Some(orientation) = orientation {
        img.apply_orientation(orientation);
    }
    Ok(img)
}

/// Catalogued formats the image decoder can't read yet.
fn is_unsupported(extension: &str) -> bool {
    matches!(extension, "heic" | "heif")
}

fn describe_decode_error(extension: &str, error: &str) -> String {
    if is_unsupported(extension) {
        "Miniaturas de HEIC/HEIF ainda não são suportadas.".to_string()
    } else {
        format!("Não foi possível decodificar a imagem: {error}")
    }
}

/// Preview (1024) and grid (256) thumbnails. Returns the grid image for hashing.
fn make_thumbnails(img: DynamicImage) -> Result<(Thumbnails, DynamicImage), String> {
    // WebP only takes 8-bit RGB/RGBA. `into_*` is free when already in that format
    // (JPEGs decode as RGB8), which avoids copying a 12 MP buffer.
    let img = if img.color().has_alpha() {
        DynamicImage::ImageRgba8(img.into_rgba8())
    } else {
        DynamicImage::ImageRgb8(img.into_rgb8())
    };
    let preview = fit(&img, PREVIEW_SIZE)?;
    let grid = fit(&preview, GRID_SIZE)?;
    let thumbs = vec![
        (PREVIEW_SIZE, encode_webp(&preview)?),
        (GRID_SIZE, encode_webp(&grid)?),
    ];
    Ok((thumbs, grid))
}

/// Downscale to fit in `edge`×`edge` keeping the aspect ratio (never upscales).
fn fit(img: &DynamicImage, edge: u32) -> Result<DynamicImage, String> {
    let (w, h) = (img.width(), img.height());
    if w <= edge && h <= edge {
        return Ok(img.clone());
    }
    let scale = edge as f64 / w.max(h) as f64;
    let (dw, dh) = (
        ((w as f64 * scale).round() as u32).max(1),
        ((h as f64 * scale).round() as u32).max(1),
    );
    let pixel_type = img.pixel_type().ok_or("formato de pixel não suportado")?;
    let mut dst = Image::new(dw, dh, pixel_type);
    Resizer::new()
        .resize(
            img,
            &mut dst,
            &ResizeOptions::new().resize_alg(ResizeAlg::Convolution(
                fast_image_resize::FilterType::Lanczos3,
            )),
        )
        .map_err(|e| e.to_string())?;
    let buffer = dst.into_vec();
    let out = if img.color().has_alpha() {
        image::RgbaImage::from_raw(dw, dh, buffer).map(DynamicImage::ImageRgba8)
    } else {
        image::RgbImage::from_raw(dw, dh, buffer).map(DynamicImage::ImageRgb8)
    };
    out.ok_or_else(|| "falha ao redimensionar".to_string())
}

fn encode_webp(img: &DynamicImage) -> Result<Vec<u8>, String> {
    let encoder = webp::Encoder::from_image(img).map_err(str::to_string)?;
    let mut config = webp::WebPConfig::new().map_err(|()| "configuração WebP inválida")?;
    config.quality = WEBP_QUALITY;
    config.method = WEBP_METHOD;
    let encoded = encoder
        .encode_advanced(&config)
        .map_err(|e| format!("falha ao gerar WebP: {e:?}"))?;
    Ok(encoded.to_vec())
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture(name: &str) -> Vec<u8> {
        std::fs::read(
            Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("tests/fixtures")
                .join(name),
        )
        .unwrap()
    }

    fn source(name: &str) -> SourceFile<'_> {
        SourceFile {
            filename: name,
            extension: "jpg",
            media_type: MediaType::Image,
            modified: Some("2026-01-01T00:00:00Z"),
        }
    }

    fn webp_size(bytes: &[u8]) -> (u32, u32) {
        let img = image::load_from_memory_with_format(bytes, image::ImageFormat::WebP).unwrap();
        (img.width(), img.height())
    }

    #[test]
    fn applies_orientation_and_builds_both_sizes() {
        // Stored 320×200 with Orientation 6 → displayed 200×320.
        let p = process_image(&fixture("exif_full.jpg"), &source("exif_full.jpg"));
        assert_eq!((p.width, p.height), (Some(200), Some(320)));
        assert!(p.decode_error.is_none());
        let sizes: Vec<_> = p
            .thumbnails
            .iter()
            .map(|(edge, bytes)| (*edge, webp_size(bytes)))
            .collect();
        // Small image: never upscaled; grid thumb fits in 256.
        assert_eq!(sizes, [(PREVIEW_SIZE, (200, 320)), (GRID_SIZE, (160, 256))]);
        assert_eq!(p.sha256.len(), 64);
        assert_eq!(p.capture.camera_model.as_deref(), Some("iPhone 15 Pro"));
    }

    #[test]
    fn large_images_are_downscaled() {
        let big = DynamicImage::ImageRgb8(image::RgbImage::from_fn(3000, 2000, |x, y| {
            image::Rgb([(x % 256) as u8, (y % 256) as u8, 90])
        }));
        let (thumbs, grid) = make_thumbnails(big).unwrap();
        assert_eq!(webp_size(&thumbs[0].1), (1024, 683));
        assert_eq!((grid.width(), grid.height()), (256, 171));
    }

    #[test]
    fn undecodable_files_keep_hash_and_explain() {
        let p = process_image(b"definitely not a jpeg", &source("quebrada.jpg"));
        assert_eq!(p.sha256.len(), 64);
        assert!(p.thumbnails.is_empty());
        assert!(p.decode_error.is_some());
        assert_eq!(p.capture.date_source, Some(metadata::DateSource::Mtime));

        let heic = SourceFile {
            extension: "heic",
            ..source("IMG_0001.HEIC")
        };
        let p = process_image(b"ftypheic....", &heic);
        assert!(p.unsupported_format);
        assert!(p.decode_error.unwrap().contains("HEIC"));
    }

    #[test]
    fn streamed_hash_matches_in_memory_hash() {
        let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/similar_a.jpg");
        assert_eq!(
            sha256_file(&path).unwrap(),
            hex(&Sha256::digest(fixture("similar_a.jpg")))
        );
    }
}
