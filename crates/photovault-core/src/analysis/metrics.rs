//! Pixel statistics of the 1024 px preview (PRD §12). Pure and deterministic; the
//! thresholds that turn them into flags live in `classify`.

use image::{DynamicImage, GenericImageView};

#[derive(Debug, Clone, Copy, Default, PartialEq)]
pub struct ImageMetrics {
    /// Local sharpness: over an 8×8 grid of tiles, the 90th percentile of
    /// (variance of the Laplacian / variance of luminance). Dimensionless, independent of
    /// exposure, and a smooth sky doesn't make a sharp photo "blurry" (its subject tiles
    /// still count). Blurred photos stay below ~0.07; sharp ones are ~0.2–10.
    pub sharpness: f64,
    /// Mean luminance, 0–255.
    pub brightness: f64,
    /// Standard deviation of luminance, 0–127.
    pub contrast: f64,
    /// 99th percentile of luminance: underexposed photos have no highlights, night
    /// scenes with lights do.
    pub highlights: f64,
    /// Fraction of pixels at ≥ 250 / ≤ 5 luminance.
    pub clipped_high: f64,
    pub clipped_low: f64,
    /// Shannon entropy of the luminance histogram, 0–8 bits.
    pub entropy: f64,
    /// Mean HSV saturation, 0–1.
    pub saturation: f64,
    /// Colours (4 bits per channel) needed to cover 90 % of the pixels: UI graphics
    /// and screenshots need few, photos need hundreds.
    pub colors_90: u32,
    /// Fraction of pixels on a strong edge (|Laplacian| > 48): text and line art.
    pub edge_density: f64,
}

/// Luminance variance (std ≥ 8) for a tile to count as textured.
const MIN_TILE_VARIANCE: f64 = 64.0;
const MIN_TEXTURED_TILES: usize = 3;
/// Sharpness reported when focus can't be judged (smooth image): "sharp enough".
pub const UNJUDGED_SHARPNESS: f64 = 1.0;

/// 64-bit DCT perceptual hash (hex), PRD §11: Hamming distance ≤ 4 ≈ same picture.
/// Unlike gradient hashes, it doesn't collapse to all-0/all-1 on smooth images.
pub fn perceptual_hash(img: &DynamicImage) -> String {
    let hasher = image_hasher::HasherConfig::new()
        // Median over DCT coefficients = classic pHash (Mean is dominated by the DC term).
        .hash_alg(image_hasher::HashAlg::Median)
        .preproc_dct()
        .hash_size(8, 8)
        .to_hasher();
    hasher
        .hash_image(img)
        .as_bytes()
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}

/// Hashes that say nothing (nearly all bits equal): flat or empty images.
pub fn is_degenerate(hash: u64) -> bool {
    !(4..=60).contains(&hash.count_ones())
}

/// Luminance and colour statistics. The image is scanned once per pass; a 1024 px
/// preview takes a few milliseconds.
pub fn measure(img: &DynamicImage) -> ImageMetrics {
    let (w, h) = img.dimensions();
    if w < 3 || h < 3 {
        return ImageMetrics::default();
    }
    let rgb = img.to_rgb8();
    let n = (w * h) as f64;

    let mut luma = vec![0u8; (w * h) as usize];
    let mut histogram = [0u64; 256];
    let mut colors = vec![0u32; 4096];
    let mut saturation = 0.0;
    for (i, p) in rgb.pixels().enumerate() {
        let [r, g, b] = p.0;
        // ITU-R BT.601 luma, integer math.
        let y = ((77 * r as u32 + 150 * g as u32 + 29 * b as u32) >> 8) as u8;
        luma[i] = y;
        histogram[y as usize] += 1;
        colors[((r as usize >> 4) << 8) | ((g as usize >> 4) << 4) | (b as usize >> 4)] += 1;
        let max = r.max(g).max(b) as f64;
        let min = r.min(g).min(b) as f64;
        if max > 0.0 {
            saturation += (max - min) / max;
        }
    }

    let brightness = histogram
        .iter()
        .enumerate()
        .map(|(v, &c)| v as f64 * c as f64)
        .sum::<f64>()
        / n;
    let variance = histogram
        .iter()
        .enumerate()
        .map(|(v, &c)| (v as f64 - brightness).powi(2) * c as f64)
        .sum::<f64>()
        / n;
    let entropy = histogram
        .iter()
        .filter(|&&c| c > 0)
        .map(|&c| {
            let p = c as f64 / n;
            -p * p.log2()
        })
        .sum();
    let clipped_high = histogram[250..].iter().sum::<u64>() as f64 / n;
    let highlights = {
        let target = (n * 0.99).ceil() as u64;
        let mut seen = 0u64;
        histogram
            .iter()
            .position(|&c| {
                seen += c;
                seen >= target
            })
            .unwrap_or(255) as f64
    };
    let clipped_low = histogram[..=5].iter().sum::<u64>() as f64 / n;

    colors.sort_unstable_by(|a, b| b.cmp(a));
    let target = (n * 0.9).ceil() as u64;
    let mut covered = 0u64;
    let mut colors_90 = 0;
    for &c in &colors {
        if covered >= target || c == 0 {
            break;
        }
        covered += c as u64;
        colors_90 += 1;
    }

    // 4-neighbour Laplacian over the interior, accumulated per tile.
    const TILES: usize = 8;
    let (wu, hu) = (w as usize, h as usize);
    let (tw, th) = ((wu / TILES).max(1), (hu / TILES).max(1));
    #[derive(Clone, Copy, Default)]
    struct Tile {
        n: f64,
        lap: f64,
        lap_sq: f64,
        y: f64,
        y_sq: f64,
    }
    let mut tiles = [Tile::default(); TILES * TILES];
    let mut edges = 0u64;
    for y in 1..hu - 1 {
        let row = y * wu;
        let ty = (y / th).min(TILES - 1);
        for x in 1..wu - 1 {
            let i = row + x;
            let lap = (luma[i - 1] as i32
                + luma[i + 1] as i32
                + luma[i - wu] as i32
                + luma[i + wu] as i32
                - 4 * luma[i] as i32) as f64;
            if lap.abs() > 48.0 {
                edges += 1;
            }
            let t = &mut tiles[ty * TILES + (x / tw).min(TILES - 1)];
            let v = luma[i] as f64;
            t.n += 1.0;
            t.lap += lap;
            t.lap_sq += lap * lap;
            t.y += v;
            t.y_sq += v * v;
        }
    }
    // Only textured tiles tell focus apart: a clear sky is smooth whether or not the
    // photo is in focus, while a blurred photo keeps its large-scale contrast.
    let mut ratios: Vec<f64> = tiles
        .iter()
        .filter(|t| t.n > 0.0)
        .filter_map(|t| {
            let lap_var = t.lap_sq / t.n - (t.lap / t.n).powi(2);
            let y_var = t.y_sq / t.n - (t.y / t.n).powi(2);
            (y_var >= MIN_TILE_VARIANCE).then(|| lap_var / (y_var + 25.0))
        })
        .collect();
    ratios.sort_by(|a, b| a.total_cmp(b));
    let sharpness = if ratios.len() >= MIN_TEXTURED_TILES {
        ratios[((ratios.len() - 1) * 9) / 10]
    } else {
        // Not enough detail to judge focus: never reported as blurry.
        UNJUDGED_SHARPNESS
    };
    let interior = ((wu - 2) * (hu - 2)) as f64;

    ImageMetrics {
        sharpness,
        brightness,
        highlights,
        contrast: variance.sqrt(),
        clipped_high,
        clipped_low,
        entropy,
        saturation: saturation / n,
        colors_90,
        edge_density: edges as f64 / interior,
    }
}

#[cfg(test)]
pub(crate) mod tests {
    use super::*;
    use image::{Rgb, RgbImage};

    /// Deterministic "photo": a scene of overlapping shapes at several scales over a
    /// gradient, plus sensor-like noise. (Pure gradients are a poor stand-in for photos:
    /// their DCT has no structure.)
    pub(crate) fn scene(w: u32, h: u32, seed: u32) -> DynamicImage {
        let mut state = seed.wrapping_mul(2_654_435_761).wrapping_add(1);
        let mut next = move || {
            state ^= state << 13;
            state ^= state >> 17;
            state ^= state << 5;
            state
        };
        let shapes: Vec<(f64, f64, f64, f64, [u8; 3], bool)> = (0..28)
            .map(|_| {
                let cx = (next() % 1000) as f64 / 1000.0;
                let cy = (next() % 1000) as f64 / 1000.0;
                let rx = 0.03 + (next() % 250) as f64 / 1000.0;
                let ry = 0.03 + (next() % 250) as f64 / 1000.0;
                let color = [
                    (next() % 256) as u8,
                    (next() % 256) as u8,
                    (next() % 256) as u8,
                ];
                (cx, cy, rx, ry, color, next() % 2 == 0)
            })
            .collect();
        DynamicImage::ImageRgb8(RgbImage::from_fn(w, h, |x, y| {
            let (u, v) = (x as f64 / w as f64, y as f64 / h as f64);
            let mut px = [
                (40.0 + 150.0 * v) as u8,
                (90.0 + 80.0 * u) as u8,
                (160.0 - 60.0 * v) as u8,
            ];
            for &(cx, cy, rx, ry, color, ellipse) in &shapes {
                let (dx, dy) = ((u - cx) / rx, (v - cy) / ry);
                let inside = if ellipse {
                    dx * dx + dy * dy <= 1.0
                } else {
                    dx.abs() <= 1.0 && dy.abs() <= 1.0
                };
                if inside {
                    px = color;
                }
            }
            let n = ((x.wrapping_mul(7919) ^ y.wrapping_mul(104_729)).wrapping_mul(2_654_435_761)
                >> 27) as u8;
            Rgb([
                px[0].saturating_add(n),
                px[1].saturating_add(n),
                px[2].saturating_add(n),
            ])
        }))
    }

    pub(crate) fn photo(w: u32, h: u32) -> DynamicImage {
        scene(w, h, 1)
    }

    pub(crate) fn blur(img: &DynamicImage, sigma: f32) -> DynamicImage {
        img.blur(sigma)
    }

    #[test]
    fn blur_lowers_sharpness_by_an_order_of_magnitude() {
        let sharp = measure(&photo(512, 384));
        let blurry = measure(&blur(&photo(512, 384), 3.0));
        assert!(
            sharp.sharpness > 10.0 * blurry.sharpness,
            "{sharp:?} vs {blurry:?}"
        );
    }

    #[test]
    fn exposure_and_flat_images() {
        let black = DynamicImage::ImageRgb8(RgbImage::from_pixel(64, 64, Rgb([2, 2, 2])));
        let m = measure(&black);
        assert!(m.brightness < 5.0 && m.clipped_low > 0.99 && m.highlights <= 2.0);
        assert_eq!((m.contrast, m.entropy, m.colors_90), (0.0, 0.0, 1));

        let white = DynamicImage::ImageRgb8(RgbImage::from_pixel(64, 64, Rgb([255, 255, 255])));
        assert!(measure(&white).clipped_high > 0.99);

        let p = measure(&photo(256, 256));
        assert!(
            p.entropy > 5.0 && p.colors_90 > 100 && p.saturation > 0.2,
            "{p:?}"
        );
    }

    fn distance(a: &DynamicImage, b: &DynamicImage) -> u32 {
        let parse = |h: String| u64::from_str_radix(&h, 16).unwrap();
        (parse(perceptual_hash(a)) ^ parse(perceptual_hash(b))).count_ones()
    }

    fn recompress(img: &DynamicImage, w: u32, quality: u8) -> DynamicImage {
        let small = img.resize(w, w, image::imageops::FilterType::Triangle);
        let mut jpg = Vec::new();
        small
            .write_with_encoder(image::codecs::jpeg::JpegEncoder::new_with_quality(
                &mut jpg, quality,
            ))
            .unwrap();
        image::load_from_memory(&jpg).unwrap()
    }

    #[test]
    fn perceptual_hash_tolerates_resize_and_recompression() {
        let scenes: Vec<DynamicImage> = (1..=10).map(|seed| scene(800, 600, seed)).collect();
        let hashes: Vec<u64> = scenes
            .iter()
            .map(|s| u64::from_str_radix(&perceptual_hash(s), 16).unwrap())
            .collect();
        for (i, a) in scenes.iter().enumerate() {
            assert!(distance(a, &recompress(a, 300, 55)) <= 4, "scene {i}");
            for j in i + 1..scenes.len() {
                let d = (hashes[i] ^ hashes[j]).count_ones();
                assert!(d > 12, "scenes {i}/{j}: {d}");
            }
        }
        let black = DynamicImage::ImageRgb8(RgbImage::from_pixel(64, 64, Rgb([0, 0, 0])));
        assert!(is_degenerate(
            u64::from_str_radix(&perceptual_hash(&black), 16).unwrap()
        ));
    }

    #[test]
    fn tiny_images_are_not_measured() {
        let dot = DynamicImage::ImageRgb8(RgbImage::from_pixel(2, 2, Rgb([9, 9, 9])));
        assert_eq!(measure(&dot), ImageMetrics::default());
    }
}
