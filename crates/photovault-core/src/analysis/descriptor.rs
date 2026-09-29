//! Features that describe the *kind* of photo (tone, colour, texture, layout, whether it
//! looks like a capture), used to find photos like the user's examples (PLANO, Fase 5).
//!
//! Without a vision model this sees what a photo looks like, not what it shows: chat
//! screenshots, receipts, pocket shots or dark concert photos cluster well; "food" or
//! "cars" don't. The embedding of phase 7 replaces it behind the same functions.

use super::metrics::ImageMetrics;
use image::{DynamicImage, GenericImageView};

/// Bumped when the features change: stored descriptors of another length are ignored.
pub const DESCRIPTOR_LEN: usize = 48;

const HUE_BINS: usize = 12;
const LAYOUT: usize = 4;

/// Feature groups: (first index, length, weight). Each group contributes the mean of its
/// squared differences, so a group's size doesn't set its importance.
const GROUPS: [(usize, usize, f64); 5] = [
    (0, 6, 1.0),                    // tone
    (6, 3 + HUE_BINS, 1.0),         // colour
    (6 + 3 + HUE_BINS, 2, 1.0),     // texture
    (23, LAYOUT * LAYOUT, 0.25),    // layout (4×4 luminance)
    (23 + LAYOUT * LAYOUT, 9, 2.0), // kind (capture, camera, shape)
];

/// What the file says about itself (not in the pixels).
#[derive(Debug, Clone, Copy, Default)]
pub struct Kind {
    pub screenshot: f64,
    pub has_camera: bool,
    pub messaging: bool,
}

pub fn describe(img: &DynamicImage, m: &ImageMetrics, kind: Kind) -> Vec<f32> {
    let mut f = Vec::with_capacity(DESCRIPTOR_LEN);
    // Tone.
    f.push(m.brightness / 255.0);
    f.push((m.contrast / 100.0).min(1.0));
    f.push(m.highlights / 255.0);
    f.push(m.clipped_high.sqrt());
    f.push(m.clipped_low.sqrt());
    f.push(m.entropy / 8.0);
    // Colour.
    let (hues, grey) = hue_histogram(img);
    f.push(m.saturation);
    f.push((1.0 + f64::from(m.colors_90)).ln() / 4097f64.ln());
    f.push(grey);
    f.extend(hues);
    // Texture.
    f.push((m.edge_density.sqrt() * 2.0).min(1.0));
    f.push(((m.sharpness.max(1e-3).log10() + 2.0) / 3.0).clamp(0.0, 1.0));
    // Layout.
    f.extend(luma_layout(img));
    // Kind: repeated so the file facts weigh like one group, not one feature.
    let (w, h) = img.dimensions();
    let aspect = (0.5 + (f64::from(w.max(1)) / f64::from(h.max(1))).ln() / 2.0).clamp(0.0, 1.0);
    let camera = if kind.has_camera { 1.0 } else { 0.0 };
    let messaging = if kind.messaging { 1.0 } else { 0.0 };
    for v in [
        kind.screenshot,
        kind.screenshot,
        kind.screenshot,
        camera,
        camera,
        messaging,
        aspect,
        aspect,
        aspect,
    ] {
        f.push(v);
    }
    debug_assert_eq!(f.len(), DESCRIPTOR_LEN);
    f.into_iter().map(|v| v as f32).collect()
}

/// Weighted mean squared difference of each feature group (tone, colour, texture,
/// layout, kind). Diagnostics for calibration (`analysis_eval`).
pub fn group_distances(a: &[f32], b: &[f32]) -> [f64; 5] {
    let mut out = [0.0; 5];
    if a.len() != DESCRIPTOR_LEN || b.len() != DESCRIPTOR_LEN {
        return out;
    }
    for (g, &(start, len, weight)) in GROUPS.iter().enumerate() {
        let sum: f64 = (start..start + len)
            .map(|i| (f64::from(a[i]) - f64::from(b[i])).powi(2))
            .sum();
        out[g] = weight * sum / len as f64;
    }
    out
}

/// 0–1: 1 = same kind of photo. Descriptors of other versions compare as 0.
pub fn similarity(a: &[f32], b: &[f32]) -> f64 {
    if a.len() != DESCRIPTOR_LEN || b.len() != DESCRIPTOR_LEN {
        return 0.0;
    }
    let d2: f64 =
        group_distances(a, b).iter().sum::<f64>() / GROUPS.iter().map(|g| g.2).sum::<f64>();
    // d² of photos of the same kind is ~0.005, of unrelated photos ~0.05.
    (-d2 / SCALE).exp()
}

/// Distance scale of `similarity` (calibrated with `analysis_eval`).
const SCALE: f64 = 0.02;

pub fn to_bytes(d: &[f32]) -> Vec<u8> {
    d.iter().flat_map(|v| v.to_le_bytes()).collect()
}

pub fn from_bytes(bytes: &[u8]) -> Vec<f32> {
    bytes
        .as_chunks::<4>()
        .0
        .iter()
        .map(|c| f32::from_le_bytes(*c))
        .collect()
}

/// Chroma-weighted share of each of 12 hue bins (a nearly black pixel barely counts, so
/// dark photos of different scenes stay close), and the share of grey pixels.
fn hue_histogram(img: &DynamicImage) -> ([f64; HUE_BINS], f64) {
    let small = img
        .resize_exact(64, 64, image::imageops::FilterType::Triangle)
        .to_rgb8();
    let mut bins = [0f64; HUE_BINS];
    let mut grey = 0f64;
    let n = f64::from(small.width() * small.height());
    for p in small.pixels() {
        let [r, g, b] = p.0.map(|c| f64::from(c) / 255.0);
        let (max, min) = (r.max(g).max(b), r.min(g).min(b));
        let chroma = max - min;
        if max < 0.08 || chroma / max.max(1e-6) < 0.15 {
            grey += 1.0;
            continue;
        }
        let hue = if max == r {
            ((g - b) / chroma).rem_euclid(6.0)
        } else if max == g {
            (b - r) / chroma + 2.0
        } else {
            (r - g) / chroma + 4.0
        } / 6.0;
        bins[((hue * HUE_BINS as f64) as usize).min(HUE_BINS - 1)] += chroma;
    }
    (bins.map(|c| c / n), grey / n)
}

fn luma_layout(img: &DynamicImage) -> Vec<f64> {
    let small = img
        .resize_exact(
            LAYOUT as u32,
            LAYOUT as u32,
            image::imageops::FilterType::Triangle,
        )
        .to_luma8();
    small.pixels().map(|p| f64::from(p.0[0]) / 255.0).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::analysis::metrics::{measure, tests::scene};
    use image::{Rgb, RgbImage};

    fn describe_img(img: &DynamicImage, kind: Kind) -> Vec<f32> {
        describe(img, &measure(img), kind)
    }

    #[test]
    fn same_kind_is_closer_than_another_kind() {
        let photo = |seed| {
            describe_img(
                &scene(800, 600, seed),
                Kind {
                    has_camera: true,
                    ..Default::default()
                },
            )
        };
        let page = |shade: u8| {
            let mut img = RgbImage::from_pixel(600, 800, Rgb([shade, shade, shade - 4]));
            for y in (60..740).step_by(24) {
                for x in 60..(300 + (y % 5) * 50) {
                    for dy in 0..3 {
                        img.put_pixel(x, y + dy, Rgb([30, 30, 34]));
                    }
                }
            }
            describe_img(
                &DynamicImage::ImageRgb8(img),
                Kind {
                    has_camera: true,
                    ..Default::default()
                },
            )
        };
        let (a, b, c) = (photo(1), photo(2), page(236));
        let d = page(228);
        assert_eq!(a.len(), DESCRIPTOR_LEN);
        assert!((similarity(&a, &a) - 1.0).abs() < 1e-9);
        assert!(similarity(&c, &d) > similarity(&a, &c), "pages look alike");
        assert!(similarity(&a, &b) > similarity(&a, &c), "photos look alike");
        assert_eq!(from_bytes(&to_bytes(&a)), a);
        assert_eq!(similarity(&a, &a[..10]), 0.0);
    }
}
