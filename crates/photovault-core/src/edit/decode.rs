//! Original file → upright linear RGB (f32), the input of every render.

use std::io::Cursor;

use fast_image_resize::{FilterType, PixelType, ResizeAlg, ResizeOptions, Resizer};
use image::{DynamicImage, ImageDecoder, ImageReader, Rgb32FImage};

use super::color::{self, DecodeLut};

/// Linear RGB, interleaved, sRGB primaries, unbounded.
#[derive(Clone)]
pub struct Linear {
    pub width: u32,
    pub height: u32,
    pub data: Vec<f32>,
}

impl Linear {
    pub fn long_edge(&self) -> u32 {
        self.width.max(self.height)
    }

    pub fn pixel(&self, x: u32, y: u32) -> [f32; 3] {
        let i = (y as usize * self.width as usize + x as usize) * 3;
        [self.data[i], self.data[i + 1], self.data[i + 2]]
    }

    /// Lanczos3 in linear light, keeping the aspect ratio; never upscales.
    pub fn fit(&self, edge: u32) -> Result<Linear, String> {
        let (w, h) = (self.width, self.height);
        if w.max(h) <= edge {
            return Ok(self.clone());
        }
        let scale = edge as f64 / w.max(h) as f64;
        let dw = ((w as f64 * scale).round() as u32).max(1);
        let dh = ((h as f64 * scale).round() as u32).max(1);
        self.resize(dw, dh)
    }

    pub fn resize(&self, dw: u32, dh: u32) -> Result<Linear, String> {
        if (dw, dh) == (self.width, self.height) {
            return Ok(self.clone());
        }
        let src = Rgb32FImage::from_raw(self.width, self.height, self.data.clone())
            .ok_or("imagem inválida")?;
        let src = DynamicImage::ImageRgb32F(src);
        let mut dst = fast_image_resize::images::Image::new(dw, dh, PixelType::F32x3);
        Resizer::new()
            .resize(
                &src,
                &mut dst,
                &ResizeOptions::new().resize_alg(ResizeAlg::Convolution(FilterType::Lanczos3)),
            )
            .map_err(|e| e.to_string())?;
        let data = dst
            .buffer()
            .as_chunks::<4>()
            .0
            .iter()
            .map(|b| f32::from_ne_bytes(*b))
            .collect();
        Ok(Linear {
            width: dw,
            height: dh,
            data,
        })
    }

    /// Normalised crop `[x, y, w, h]` (fractions of the upright image).
    pub fn crop(&self, rect: [f32; 4]) -> Linear {
        let [x, y, w, h] = rect.map(|v| v.clamp(0.0, 1.0));
        let x0 = (x * self.width as f32).round() as u32;
        let y0 = (y * self.height as f32).round() as u32;
        let cw =
            ((w * self.width as f32).round() as u32).clamp(1, self.width.saturating_sub(x0).max(1));
        let ch = ((h * self.height as f32).round() as u32)
            .clamp(1, self.height.saturating_sub(y0).max(1));
        let x0 = x0.min(self.width - 1);
        let y0 = y0.min(self.height - 1);
        let mut data = Vec::with_capacity((cw * ch * 3) as usize);
        for row in y0..y0 + ch {
            let start = (row as usize * self.width as usize + x0 as usize) * 3;
            data.extend_from_slice(&self.data[start..start + cw as usize * 3]);
        }
        Linear {
            width: cw,
            height: ch,
            data,
        }
    }
}

/// Decodes, applies the EXIF orientation and the embedded ICC profile, composites
/// transparency over white and converts to linear light. 16-bit sources keep their
/// precision (nothing goes through 8 bits).
pub fn decode(bytes: &[u8]) -> Result<Linear, String> {
    let reader = ImageReader::new(Cursor::new(bytes))
        .with_guessed_format()
        .map_err(|e| e.to_string())?;
    let mut decoder = reader.into_decoder().map_err(|e| e.to_string())?;
    let orientation = decoder.orientation().ok();
    let icc = decoder.icc_profile().ok().flatten();
    let mut img = DynamicImage::from_decoder(decoder).map_err(|e| e.to_string())?;
    if let Some(orientation) = orientation {
        img.apply_orientation(orientation);
    }
    let (width, height) = (img.width(), img.height());

    let mut data: Vec<f32> = if img.color().has_alpha() {
        img.to_rgba32f()
            .into_raw()
            .as_chunks::<4>()
            .0
            .iter()
            .flat_map(|p| {
                let a = p[3];
                [0, 1, 2].map(|c| p[c] * a + (1.0 - a))
            })
            .collect()
    } else {
        img.to_rgb32f().into_raw()
    };
    drop(img);

    if let Some(icc) = icc
        && let Err(e) = color::icc_to_srgb(&icc, &mut data)
    {
        tracing::warn!("ICC profile ignored: {e}");
    }
    let lut = DecodeLut::new();
    for v in &mut data {
        *v = lut.get(*v);
    }
    Ok(Linear {
        width,
        height,
        data,
    })
}
