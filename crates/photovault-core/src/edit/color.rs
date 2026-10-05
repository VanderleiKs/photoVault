//! Colour math of the editor: the working space is linear RGB with sRGB (Rec. 709)
//! primaries in unbounded f32 (edits may push values past 1; the renderer brings
//! them back at the end, keeping the hue).

use moxcms::{ColorProfile, DataColorSpace, Layout, TransformOptions};

/// Rec. 709 luminance weights (linear light).
pub const LUMA: [f32; 3] = [0.2126, 0.7152, 0.0722];

pub fn luminance(rgb: [f32; 3]) -> f32 {
    LUMA[0] * rgb[0] + LUMA[1] * rgb[1] + LUMA[2] * rgb[2]
}

/// sRGB decoding (EOTF), mirrored for negative values.
pub fn srgb_to_linear(v: f32) -> f32 {
    let a = v.abs();
    let l = if a <= 0.04045 {
        a / 12.92
    } else {
        ((a + 0.055) / 1.055).powf(2.4)
    };
    l.copysign(v)
}

/// sRGB encoding (OETF), mirrored for negative values.
pub fn linear_to_srgb(v: f32) -> f32 {
    let a = v.abs();
    let e = if a <= 0.003_130_8 {
        a * 12.92
    } else {
        1.055 * a.powf(1.0 / 2.4) - 0.055
    };
    e.copysign(v)
}

/// Table for [0, 1] of the decoding: 8- and 16-bit sources land exactly on a node.
pub struct DecodeLut(Vec<f32>);

impl DecodeLut {
    const SIZE: usize = 65_536;

    pub fn new() -> Self {
        let n = Self::SIZE - 1;
        Self(
            (0..Self::SIZE)
                .map(|i| srgb_to_linear(i as f32 / n as f32))
                .collect(),
        )
    }

    pub fn get(&self, v: f32) -> f32 {
        if (0.0..=1.0).contains(&v) {
            self.0[(v * (Self::SIZE - 1) as f32 + 0.5) as usize]
        } else {
            srgb_to_linear(v)
        }
    }
}

impl Default for DecodeLut {
    fn default() -> Self {
        Self::new()
    }
}

/// Table for [0, 1] of the encoding, indexed by √v (the curve is steep near black).
pub struct EncodeLut(Vec<f32>);

impl EncodeLut {
    const SIZE: usize = 4096;

    pub fn new() -> Self {
        Self::with_curve(|v| v)
    }

    /// Encoding followed by a display-space `curve` (baked in, one lookup per value).
    pub fn with_curve(curve: impl Fn(f32) -> f32) -> Self {
        let n = (Self::SIZE - 1) as f32;
        Self(
            (0..Self::SIZE)
                .map(|i| {
                    let t = i as f32 / n;
                    curve(linear_to_srgb(t * t))
                })
                .collect(),
        )
    }

    pub fn get(&self, v: f32) -> f32 {
        if !(0.0..=1.0).contains(&v) {
            return linear_to_srgb(v);
        }
        let x = v.sqrt() * (Self::SIZE - 1) as f32;
        let i = (x as usize).min(Self::SIZE - 2);
        let f = x - i as f32;
        self.0[i] + (self.0[i + 1] - self.0[i]) * f
    }
}

impl Default for EncodeLut {
    fn default() -> Self {
        Self::new()
    }
}

/// Converts gamma-encoded RGB (interleaved, [0, 1]) tagged with `icc` to gamma-encoded
/// sRGB, in place. Colours outside the sRGB gamut are clipped by the transform (as a
/// browser shows them); the delivery is sRGB anyway. Profiles that aren't RGB (grey, CMYK) or can't be read are left
/// alone: the pixels are taken as sRGB, which is what a browser would show.
pub fn icc_to_srgb(icc: &[u8], rgb: &mut [f32]) -> Result<(), String> {
    let source = ColorProfile::new_from_slice(icc).map_err(|e| e.to_string())?;
    if source.color_space != DataColorSpace::Rgb {
        return Ok(());
    }
    let transform = source
        .create_transform_f32(
            Layout::Rgb,
            &ColorProfile::new_srgb(),
            Layout::Rgb,
            TransformOptions::default(),
        )
        .map_err(|e| e.to_string())?;
    let mut out = vec![0.0; rgb.len()];
    transform
        .transform(rgb, &mut out)
        .map_err(|e| e.to_string())?;
    rgb.copy_from_slice(&out);
    Ok(())
}

/// The sRGB profile embedded in delivered JPEGs.
pub fn srgb_icc() -> Vec<u8> {
    ColorProfile::new_srgb().encode().unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn transfer_functions_round_trip_and_tables_match() {
        let dec = DecodeLut::new();
        let enc = EncodeLut::new();
        for i in 0..=255 {
            let v = i as f32 / 255.0;
            let l = dec.get(v);
            assert!((l - srgb_to_linear(v)).abs() < 1e-6);
            assert_eq!((enc.get(l) * 255.0).round() as i32, i, "level {i}");
        }
        assert!((linear_to_srgb(srgb_to_linear(-0.3)) + 0.3).abs() < 1e-5);
        assert!(srgb_to_linear(1.2) > 1.0);
    }

    #[test]
    fn display_p3_colours_become_srgb() {
        let p3 = ColorProfile::new_display_p3().encode().unwrap();
        let mut px = [0.8f32, 0.5, 0.4];
        icc_to_srgb(&p3, &mut px).unwrap();
        // The same numbers mean a more saturated colour in P3: in sRGB, red goes up.
        assert!(px[0] > 0.83 && px[2] < 0.4, "{px:?}");
        let mut grey = [0.5f32, 0.5, 0.5];
        icc_to_srgb(&p3, &mut grey).unwrap();
        assert!(grey.iter().all(|v| (v - 0.5).abs() < 0.01), "{grey:?}");
    }
}
