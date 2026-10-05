//! JPEG output (preview and delivery). `jpeg-encoder` instead of `image`'s encoder:
//! it writes ICC and EXIF segments, 4:4:4 and optimised Huffman tables.

use jpeg_encoder::{ColorType, Encoder, SamplingFactor};

use super::pipeline::Rendered;

pub struct JpegOptions<'a> {
    pub quality: u8,
    pub progressive: bool,
    /// Embedded colour profile (the delivery always carries sRGB).
    pub icc: Option<&'a [u8]>,
    /// Raw EXIF (TIFF header onwards), written as APP1.
    pub exif: Option<&'a [u8]>,
}

impl JpegOptions<'_> {
    /// Live preview: fast (4:2:0), no metadata.
    pub fn preview() -> Self {
        Self {
            quality: 88,
            progressive: false,
            icc: None,
            exif: None,
        }
    }
}

pub fn jpeg(img: &Rendered, opts: &JpegOptions) -> Result<Vec<u8>, String> {
    let (w, h) = (
        u16::try_from(img.width).map_err(|_| "imagem grande demais para JPEG")?,
        u16::try_from(img.height).map_err(|_| "imagem grande demais para JPEG")?,
    );
    let mut out = Vec::with_capacity(img.rgb.len() / 6);
    let mut enc = Encoder::new(&mut out, opts.quality.clamp(1, 100));
    // Chroma at full resolution from quality 90 up (thin coloured edges stay sharp).
    enc.set_sampling_factor(if opts.quality >= 90 {
        SamplingFactor::R_4_4_4
    } else {
        SamplingFactor::R_4_2_0
    });
    enc.set_progressive(opts.progressive);
    enc.set_optimized_huffman_tables(opts.progressive);
    if let Some(exif) = opts.exif {
        let mut app1 = b"Exif\0\0".to_vec();
        app1.extend_from_slice(exif);
        enc.add_app_segment(1, app1).map_err(|e| e.to_string())?;
    }
    if let Some(icc) = opts.icc {
        enc.add_icc_profile(icc).map_err(|e| e.to_string())?;
    }
    enc.encode(&img.rgb, w, h, ColorType::Rgb)
        .map_err(|e| e.to_string())?;
    Ok(out)
}
