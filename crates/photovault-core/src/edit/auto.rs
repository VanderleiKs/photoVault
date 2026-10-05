//! Automatic correction (layer 1 of PRD §29): white balance, exposure, levels and
//! local tone computed per photo from a small linear copy, before any crop (cropping
//! must not change the exposure). Only parameters come out of here.
//!
//! Calibrated with `examples/edit_eval.rs`: measure before changing any constant and
//! record the result in the PLANO. Changing the algorithm = bump [`AUTO_VERSION`]
//! (stored values are recomputed, the user's fine tuning is kept).

use serde::{Deserialize, Serialize};

use super::color::luminance;
use super::decode::Linear;
use super::{Style, normalize_gains};

pub const AUTO_VERSION: u32 = 1;

/// Long edge of the analysis copy.
pub const ANALYSIS_EDGE: u32 = 512;

/// Per-photo automatic values, stored in `media_edits.auto_json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoValues {
    pub version: u32,
    pub gains: [f32; 3],
    pub ev: f32,
    pub black: f32,
    pub white: f32,
    pub shadows: f32,
    pub highlights: f32,
}

impl AutoValues {
    pub fn identity() -> Self {
        Self {
            version: AUTO_VERSION,
            gains: [1.0; 3],
            ev: 0.0,
            black: 0.0,
            white: 1.0,
            shadows: 0.0,
            highlights: 0.0,
        }
    }
}

/// Global look of a style (applied on top of the correction, scaled by the intensity).
pub struct StyleParams {
    pub contrast: f32,
    pub vibrance: f32,
    pub saturation: f32,
    pub sharpen: f32,
}

pub fn style(style: Style) -> StyleParams {
    match style {
        Style::Natural => StyleParams {
            contrast: 0.08,
            vibrance: 0.15,
            saturation: 0.0,
            sharpen: 0.35,
        },
    }
}

/// White balance: strength of the correction (a full one would neutralise a sunset).
const WB_STRENGTH: f32 = 0.8;
/// Casts beyond this angle (degrees) are probably intentional light: corrected less.
const WB_MAX_ANGLE: f32 = 15.0;
/// Minkowski norm of shades-of-grey (1 = grey world, ∞ = white patch).
const WB_P: f32 = 6.0;
const EV_LIMIT: f32 = 2.0;
/// Mid-grey key the exposure aims for.
const KEY: f32 = 0.18;
/// After the exposure, the 99.5th percentile of luminance stays under this.
const HIGHLIGHT_CEILING: f32 = 0.95;

/// Analyses an upright linear image (any size; reduced to [`ANALYSIS_EDGE`]).
pub fn analyze(img: &Linear) -> Result<AutoValues, String> {
    let small = img.fit(ANALYSIS_EDGE)?;
    let pixels: Vec<[f32; 3]> = small
        .data
        .as_chunks::<3>()
        .0
        .iter()
        .map(|p| [p[0].max(0.0), p[1].max(0.0), p[2].max(0.0)])
        .collect();
    if pixels.is_empty() {
        return Ok(AutoValues::identity());
    }

    let gains = white_balance(&pixels);
    let balanced: Vec<[f32; 3]> = pixels
        .iter()
        .map(|p| [p[0] * gains[0], p[1] * gains[1], p[2] * gains[2]])
        .collect();
    let ev = exposure(&balanced, small.width as usize, small.height as usize);

    let k = ev.exp2();
    let mut lum: Vec<f32> = balanced.iter().map(|p| luminance(*p) * k).collect();
    lum.sort_by(f32::total_cmp);
    let black = percentile(&lum, 0.003).clamp(0.0, 0.01);
    let white = percentile(&lum, 0.997).clamp(0.7, 1.0);
    let dark = fraction(&lum, |y| y < 0.02);
    let bright = fraction(&lum, |y| y > 0.8);

    Ok(AutoValues {
        version: AUTO_VERSION,
        gains,
        ev,
        black,
        white,
        shadows: 0.6 * smooth(0.05, 0.4, dark),
        highlights: -0.8 * smooth(0.01, 0.15, bright),
    })
}

/// Shades-of-grey illuminant estimate on pixels that are neither clipped nor nearly
/// black; gains limited in strength and in angle.
fn white_balance(pixels: &[[f32; 3]]) -> [f32; 3] {
    let mut lum: Vec<f32> = pixels.iter().map(|p| luminance(*p)).collect();
    lum.sort_by(f32::total_cmp);
    let floor = percentile(&lum, 0.02).max(1e-4);
    let mut acc = [0f64; 3];
    let mut n = 0usize;
    for p in pixels {
        if p.iter().any(|&c| c > 0.89) || luminance(*p) <= floor {
            continue;
        }
        for c in 0..3 {
            acc[c] += (p[c] as f64).powf(WB_P as f64);
        }
        n += 1;
    }
    if n < 64 {
        return [1.0; 3];
    }
    let e = acc.map(|v| (v / n as f64).powf(1.0 / WB_P as f64) as f32);
    if e.iter().any(|&v| v <= 1e-6) {
        return [1.0; 3];
    }
    let angle = cast_angle(e);
    let mut strength = WB_STRENGTH;
    if angle > WB_MAX_ANGLE {
        strength *= WB_MAX_ANGLE / angle;
    }
    let mean = (e[0] + e[1] + e[2]) / 3.0;
    normalize_gains(e.map(|v| (mean / v).powf(strength)))
}

/// Angle (degrees) between a colour and neutral grey.
pub fn cast_angle(rgb: [f32; 3]) -> f32 {
    let norm = (rgb[0] * rgb[0] + rgb[1] * rgb[1] + rgb[2] * rgb[2]).sqrt();
    if norm <= 0.0 {
        return 0.0;
    }
    let cos = (rgb[0] + rgb[1] + rgb[2]) / (norm * 3f32.sqrt());
    cos.clamp(-1.0, 1.0).acos().to_degrees()
}

/// Centre-weighted geometric mean aimed at [`KEY`], without pushing the brightest
/// 0.5 % into clipping (unless they already were).
fn exposure(pixels: &[[f32; 3]], w: usize, h: usize) -> f32 {
    let sigma = 0.35 * w.max(h) as f32;
    let (cx, cy) = (w as f32 / 2.0, h as f32 / 2.0);
    let mut sum = 0f64;
    let mut weights = 0f64;
    let mut lum = Vec::with_capacity(pixels.len());
    for (i, p) in pixels.iter().enumerate() {
        let y = luminance(*p);
        lum.push(y);
        let (x, row) = ((i % w) as f32, (i / w) as f32);
        let d2 = (x - cx).powi(2) + (row - cy).powi(2);
        let weight = (-d2 / (2.0 * sigma * sigma)).exp() as f64;
        sum += weight * ((y + 1e-4) as f64).log2();
        weights += weight;
    }
    let key = (sum / weights.max(1e-9)).exp2() as f32;
    let mut ev = (KEY / key.max(1e-4)).log2();
    if ev > 0.0 {
        lum.sort_by(f32::total_cmp);
        let clipped = fraction(&lum, |y| y > 0.95);
        if clipped < 0.02 {
            let top = percentile(&lum, 0.995).max(1e-4);
            ev = ev.min((HIGHLIGHT_CEILING / top).log2().max(0.0));
        }
    }
    ev.clamp(-EV_LIMIT, EV_LIMIT)
}

/// `sorted` ascending, `q` in [0, 1].
fn percentile(sorted: &[f32], q: f32) -> f32 {
    if sorted.is_empty() {
        return 0.0;
    }
    let i = ((sorted.len() - 1) as f32 * q).round() as usize;
    sorted[i.min(sorted.len() - 1)]
}

fn fraction(values: &[f32], pred: impl Fn(f32) -> bool) -> f32 {
    values.iter().filter(|&&v| pred(v)).count() as f32 / values.len().max(1) as f32
}

fn smooth(e0: f32, e1: f32, x: f32) -> f32 {
    let t = ((x - e0) / (e1 - e0)).clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}
