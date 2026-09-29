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
    /// Lines of text: runs of dark strokes alternating with paper, counted across the
    /// page (either orientation). A page has dozens; people and objects on a white
    /// background have none or one or two.
    pub text_lines: u32,
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

/// Cells per side of the colour layout.
const COLOR_GRID: usize = 8;
/// OKLab a/b are stored ×256 as `i8` (their range in sRGB is about ±0.3).
const CHROMA_SCALE: f32 = 256.0;
pub const COLOR_LAYOUT_LEN: usize = COLOR_GRID * COLOR_GRID * 2;

/// Mean chroma (OKLab a, b) of each cell of an 8×8 grid. The pHash only sees
/// luminance, so a blue and a grey shirt shot the same way have the same hash; this
/// tells them apart. Lightness is left out: a brightened copy keeps its layout.
pub fn color_layout(img: &DynamicImage) -> Vec<u8> {
    let side = (COLOR_GRID * 8) as u32;
    let small = img
        .resize_exact(side, side, image::imageops::FilterType::Triangle)
        .to_rgb8();
    let mut sums = [[0f32; 2]; COLOR_GRID * COLOR_GRID];
    for (x, y, p) in small.enumerate_pixels() {
        let [_, a, b] = oklab(p.0);
        let cell = &mut sums[(y as usize / 8) * COLOR_GRID + x as usize / 8];
        cell[0] += a;
        cell[1] += b;
    }
    sums.iter()
        .flat_map(|[a, b]| [*a, *b])
        .map(|v| ((v / 64.0) * CHROMA_SCALE).round().clamp(-127.0, 127.0) as i8 as u8)
        .collect()
}

/// How different the colours of two layouts are, in OKLab chroma ×100: the mean of
/// the most different quarter of the cells, so a recoloured object that covers part of
/// the frame counts as much as a global colour change. Copies stay below ~2.
pub fn color_distance(a: &[u8], b: &[u8]) -> f64 {
    if a.len() != COLOR_LAYOUT_LEN || b.len() != COLOR_LAYOUT_LEN {
        return 0.0;
    }
    let mut cells: Vec<f64> = a
        .as_chunks::<2>()
        .0
        .iter()
        .zip(b.as_chunks::<2>().0)
        .map(|(p, q)| {
            let da = f64::from(p[0] as i8) - f64::from(q[0] as i8);
            let db = f64::from(p[1] as i8) - f64::from(q[1] as i8);
            (da * da + db * db).sqrt()
        })
        .collect();
    cells.sort_by(|x, y| y.total_cmp(x));
    let top = cells.len() / 4;
    cells[..top].iter().sum::<f64>() / top as f64 * 100.0 / f64::from(CHROMA_SCALE)
}

/// sRGB (8 bit) → OKLab (Björn Ottosson, 2020).
fn oklab([r, g, b]: [u8; 3]) -> [f32; 3] {
    let lin = |c: u8| {
        let c = f32::from(c) / 255.0;
        if c <= 0.04045 {
            c / 12.92
        } else {
            ((c + 0.055) / 1.055).powf(2.4)
        }
    };
    let (r, g, b) = (lin(r), lin(g), lin(b));
    let l = (0.412_221_46 * r + 0.536_332_55 * g + 0.051_445_995 * b).cbrt();
    let m = (0.211_903_5 * r + 0.680_699_5 * g + 0.107_396_96 * b).cbrt();
    let s = (0.088_302_46 * r + 0.281_718_85 * g + 0.629_978_7 * b).cbrt();
    [
        0.210_454_26 * l + 0.793_617_8 * m - 0.004_072_047 * s,
        1.977_998_5 * l - 2.428_592_2 * m + 0.450_593_7 * s,
        0.025_904_037 * l + 0.782_771_77 * m - 0.808_675_77 * s,
    ]
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
    let text_lines = text_lines(&luma, wu, hu, histogram_threshold(&histogram, n));

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
        text_lines,
    }
}

/// Otsu's threshold of the luminance histogram (ink vs. paper).
fn histogram_threshold(histogram: &[u64; 256], n: f64) -> u8 {
    let total: f64 = histogram
        .iter()
        .enumerate()
        .map(|(v, &c)| v as f64 * c as f64)
        .sum();
    let (mut weight, mut sum, mut best, mut best_var) = (0.0, 0.0, 0u8, 0.0);
    for (v, &c) in histogram.iter().enumerate() {
        weight += c as f64;
        if weight == 0.0 || weight == n {
            continue;
        }
        sum += v as f64 * c as f64;
        let (m0, m1) = (sum / weight, (total - sum) / (n - weight));
        let var = weight * (n - weight) * (m0 - m1).powi(2);
        if var > best_var {
            best_var = var;
            best = v as u8;
        }
    }
    best
}

/// Skews tried when looking for lines of text (degrees): pages are rarely level.
const TEXT_SKEWS: [f64; 9] = [-4.0, -3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0, 4.0];

/// Lines of text: runs of rows with a little ink (at least 2 rows, at most 5 % of the
/// image) between runs of clean paper rows. The ink profile is taken along the skew that
/// makes it sharpest (projection-profile deskew), over the whole width; ink is measured
/// above the profile's own baseline, so a dark margin (the table around a page) doesn't
/// hide the gaps. Rows and columns are both tried (receipts photographed sideways).
fn text_lines(luma: &[u8], w: usize, h: usize, threshold: u8) -> u32 {
    let ink = |x: usize, y: usize| luma[y * w + x] <= threshold;
    // Profile of `len` lines across `across` pixels, sheared by `skew` degrees.
    let profile = |len: usize, across: usize, skew: f64, at: &dyn Fn(usize, usize) -> bool| {
        let slope = skew.to_radians().tan();
        let offset = (slope.abs() * across as f64).ceil() as usize;
        let mut counts = vec![0u32; len + 2 * offset];
        let mut totals = vec![0u32; len + 2 * offset];
        for i in 0..len {
            for j in (0..across).step_by(2) {
                let k = (i as f64 + offset as f64 + j as f64 * slope).round() as usize;
                totals[k] += 1;
                if at(i, j) {
                    counts[k] += 1;
                }
            }
        }
        counts
            .iter()
            .zip(&totals)
            .filter(|(_, t)| **t as usize * 2 >= across / 2) // lines that cross most of it
            .map(|(&c, &t)| f64::from(c) / f64::from(t))
            .collect::<Vec<f64>>()
    };
    let lines = |len: usize, across: usize, at: &dyn Fn(usize, usize) -> bool| -> u32 {
        let variance = |p: &[f64]| {
            let mean = p.iter().sum::<f64>() / p.len().max(1) as f64;
            p.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / p.len().max(1) as f64
        };
        let Some(shares) = TEXT_SKEWS
            .iter()
            .map(|&skew| profile(len, across, skew, at))
            .max_by(|a, b| variance(a).total_cmp(&variance(b)))
        else {
            return 0;
        };
        if shares.is_empty() {
            return 0;
        }
        let mut sorted = shares.clone();
        sorted.sort_by(|a, b| a.total_cmp(b));
        let base = sorted[sorted.len() / 10];
        if base > 0.3 {
            return 0; // no paper
        }
        let max_run = (len / 20).max(2);
        let (mut found, mut run, mut gap, mut gap_before) = (0u32, 0usize, 0usize, 0usize);
        for share in shares.into_iter().map(|s| s - base) {
            if (0.01..=0.45).contains(&share) {
                if run == 0 {
                    gap_before = gap;
                }
                run += 1;
                gap = 0;
            } else if share < 0.005 {
                gap += 1;
                if gap == 2 && (2..=max_run).contains(&run) && gap_before >= 2 {
                    found += 1;
                }
                if gap >= 2 {
                    run = 0;
                }
            } else {
                run = 0;
                gap = 0;
            }
        }
        found
    };
    let rows = lines(h, w, &|y, x| ink(x, y));
    let cols = lines(w, h, &|x, y| ink(x, y));
    rows.max(cols)
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

    /// The same shot of a garment in another colour: identical luminance, so the pHash
    /// can't tell them apart (the "blue and grey shirt" report).
    pub(crate) fn recolored(img: &DynamicImage, rgb: [u8; 3]) -> DynamicImage {
        let mut out = img.to_rgb8();
        let (w, h) = out.dimensions();
        let target = 77 * rgb[0] as i32 + 150 * rgb[1] as i32 + 29 * rgb[2] as i32;
        for (x, y, p) in out.enumerate_pixels_mut() {
            let (u, v) = (x as f64 / w as f64 - 0.5, y as f64 / h as f64 - 0.5);
            if (u / 0.3).powi(2) + (v / 0.35).powi(2) <= 1.0 {
                let [r, g, b] = p.0;
                let y = 77 * r as i32 + 150 * g as i32 + 29 * b as i32;
                let k = y as f64 / target.max(1) as f64;
                p.0 = rgb.map(|c| (c as f64 * k).round().clamp(0.0, 255.0) as u8);
            }
        }
        DynamicImage::ImageRgb8(out)
    }

    #[test]
    fn color_layout_separates_recolored_objects_and_tolerates_copies() {
        for seed in 1..=6 {
            let base = scene(800, 600, seed);
            let blue = recolored(&base, [40, 90, 200]);
            let grey = recolored(&base, [115, 115, 115]);
            let layout = |i: &DynamicImage| color_layout(i);
            assert_eq!(layout(&base).len(), COLOR_LAYOUT_LEN);
            assert!(distance(&blue, &grey) <= 4, "pHash can't tell them apart");
            let recolor = color_distance(&layout(&blue), &layout(&grey));
            assert!(recolor > 8.0, "seed {seed}: {recolor}");
            let copy = color_distance(&layout(&blue), &layout(&recompress(&blue, 300, 55)));
            assert!(copy < 2.0, "seed {seed}: {copy}");
            let brighter =
                image::DynamicImage::ImageRgb8(image::imageops::brighten(&blue.to_rgb8(), 20));
            let bright = color_distance(&layout(&blue), &layout(&brighter));
            assert!(bright < 3.0, "seed {seed}: {bright}");
        }
    }

    #[test]
    fn text_lines_tell_pages_from_objects() {
        // A tilted page of text, and a dark object on white (same brightness, edges).
        let page = DynamicImage::ImageRgb8(RgbImage::from_fn(1000, 1400, |x, y| {
            let y = y as f64 + x as f64 * 0.05; // ~3° tilt
            let line = (y as u32 / 40).is_multiple_of(2)
                && (100..900).contains(&x)
                && (100.0..1300.0).contains(&y);
            if line && (x / 6) % 4 != 0 && (y as u32) % 40 < 18 {
                Rgb([30, 30, 30])
            } else {
                Rgb([236, 234, 230])
            }
        }));
        let object = DynamicImage::ImageRgb8(RgbImage::from_fn(1000, 1400, |x, y| {
            let (u, v) = (x as f64 / 1000.0 - 0.5, y as f64 / 1400.0 - 0.5);
            if u * u / 0.09 + v * v / 0.12 <= 1.0 && (x / 9 + y / 9) % 2 == 0 {
                Rgb([40, 38, 36])
            } else {
                Rgb([245, 245, 245])
            }
        }));
        let (p, o) = (measure(&page), measure(&object));
        assert!(p.text_lines >= 10, "{p:?}");
        assert!(o.text_lines <= 2, "{o:?}");
        let sideways = measure(&page.rotate90());
        assert!(sideways.text_lines >= 10, "{sideways:?}");
        assert!(measure(&photo(800, 600)).text_lines < 5);
    }

    #[test]
    fn tiny_images_are_not_measured() {
        let dot = DynamicImage::ImageRgb8(RgbImage::from_pixel(2, 2, Rgb([9, 9, 9])));
        assert_eq!(measure(&dot), ImageMetrics::default());
    }
}
