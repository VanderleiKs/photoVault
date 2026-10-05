//! The one renderer (ADR 009): preview, edited thumbnails and delivery all go through
//! [`render`]. Spatial parameters are relative to the image size (the local-tone grid
//! has a fixed number of cells, the sharpening radius follows the long edge), so a
//! preview and a full-size delivery of the same recipe look the same.
//!
//! Order: crop → resize → white balance, exposure, levels, colour (linear) → local
//! tone → hue-preserving clip → sRGB → contrast (display) → sharpening → 8 bits.

use super::Resolved;
use super::color::{EncodeLut, LUMA, luminance};
use super::decode::Linear;

/// 8-bit sRGB, interleaved RGB.
pub struct Rendered {
    pub width: u32,
    pub height: u32,
    pub rgb: Vec<u8>,
}

/// Cells along the long edge of the local-tone grid.
const TONE_GRID: f32 = 128.0;
/// Blur of the local-tone grid, in cells (≈ 2 % of the long edge).
const TONE_SIGMA: f32 = 2.5;

/// Renders `src` (upright linear RGB) with `r`, fitting in `long_edge` if given.
pub fn render(
    src: &Linear,
    r: &Resolved,
    long_edge: Option<u32>,
    threads: usize,
) -> Result<Rendered, String> {
    let (width, height, display) = render_display(src, r, long_edge, threads)?;
    let mut rgb = vec![0u8; display.len()];
    let per = display.len().div_ceil(threads.max(1)).max(1);
    std::thread::scope(|s| {
        for (k, (out, chunk)) in rgb.chunks_mut(per).zip(display.chunks(per)).enumerate() {
            s.spawn(move || quantize_into(chunk, k * per, out));
        }
    });
    Ok(Rendered { width, height, rgb })
}

/// Same as [`render`], before quantization: display-referred sRGB in [0, 1].
pub fn render_display(
    src: &Linear,
    r: &Resolved,
    long_edge: Option<u32>,
    threads: usize,
) -> Result<(u32, u32, Vec<f32>), String> {
    let cropped;
    let mut img = src;
    if let Some(rect) = r.crop {
        cropped = img.crop(rect);
        img = &cropped;
    }
    let resized;
    if let Some(edge) = long_edge
        && img.long_edge() > edge
    {
        resized = img.fit(edge)?;
        img = &resized;
    }
    let (w, h) = (img.width as usize, img.height as usize);
    let threads = threads.max(1);
    let mut work = Linear {
        width: img.width,
        height: img.height,
        data: vec![0.0; img.data.len()],
    };

    // Linear stage.
    let exposure = 2f32.powf(r.ev);
    let gains = r.gains.map(|g| g * exposure);
    let (black, range) = (r.black, (r.white - r.black).max(1e-3));
    let color = r.vibrance != 0.0 || r.saturation != 0.0;
    let stride = w * 3;
    par_rows(&mut work.data, w, threads, |y, row| {
        let src_row = &img.data[y * stride..(y + 1) * stride];
        for (px, sp) in row
            .as_chunks_mut::<3>()
            .0
            .iter_mut()
            .zip(src_row.as_chunks::<3>().0.iter())
        {
            for c in 0..3 {
                px[c] = (sp[c] * gains[c] - black) / range;
            }
            if color {
                saturate(px, r.vibrance, r.saturation);
            }
        }
    });

    // Local tone.
    let grid = (r.shadows != 0.0 || r.highlights != 0.0).then(|| ToneGrid::new(&work, threads));
    let tone = grid
        .as_ref()
        .map(|_| ToneCurve::new(r.shadows, r.highlights));
    let a = r.contrast.clamp(-0.5, 0.5) * 1.6;
    let enc = EncodeLut::with_curve(|v| s_curve(v, a));
    par_rows(&mut work.data, w, threads, |y, row| {
        for (x, px) in row.as_chunks_mut::<3>().0.iter_mut().enumerate() {
            if let (Some(grid), Some(tone)) = (&grid, &tone) {
                let own = fast_log2(luminance([px[0], px[1], px[2]]).max(0.0) + 1e-6);
                let k = tone.get(0.6 * grid.sample(x, y) + 0.4 * own);
                px.iter_mut().for_each(|v| *v *= k);
            }
            clip_preserving_hue(px);
            for v in px.iter_mut() {
                *v = enc.get(v.clamp(0.0, 1.0));
            }
        }
    });

    let mut out = work.data;
    if r.sharpen > 0.0 {
        let sigma = (w.max(h) as f32 * 0.0004).max(0.5);
        sharpen(&mut out, w, h, r.sharpen, sigma, threads);
    }
    Ok((w as u32, h as u32, out))
}

/// Vibrance (more on dull colours, half on skin tones) and saturation, around the
/// pixel's own luminance.
fn saturate(px: &mut [f32], vibrance: f32, saturation: f32) {
    let y = luminance([px[0], px[1], px[2]]);
    let max = px[0].max(px[1]).max(px[2]);
    let min = px[0].min(px[1]).min(px[2]);
    let sat = if max > 1e-6 {
        ((max - min) / max).clamp(0.0, 1.0)
    } else {
        0.0
    };
    let skin = px[0] > px[1] && px[1] > px[2];
    let v = vibrance * (1.0 - sat) * if skin { 0.5 } else { 1.0 };
    let s = (1.0 + saturation + v).max(0.0);
    for c in px.iter_mut() {
        *c = y + (*c - y) * s;
    }
}

/// Brings channels above 1 back by desaturating towards the luminance (keeps hue and
/// brightness, unlike clipping each channel: a bright sky doesn't turn cyan or yellow).
/// Pixels within [0, 1] are untouched.
fn clip_preserving_hue(px: &mut [f32]) {
    let max = px[0].max(px[1]).max(px[2]);
    if max <= 1.0 {
        return;
    }
    let y = luminance([px[0], px[1], px[2]]);
    if y >= 1.0 {
        px.fill(1.0);
        return;
    }
    let t = (1.0 - y) / (max - y);
    for c in px.iter_mut() {
        *c = y + (*c - y) * t;
    }
}

/// Fixed ends, steeper middle for `a > 0` (monotonic while |a| < 1).
fn s_curve(x: f32, a: f32) -> f32 {
    if a == 0.0 || !(0.0..=1.0).contains(&x) {
        return x;
    }
    let tau = std::f32::consts::TAU;
    (x - a * (tau * x).sin() / tau).clamp(0.0, 1.0)
}

/// log2 from the float's exponent plus a cubic on the mantissa (error < 0.01): only
/// used to place a pixel on the shadow/highlight masks.
pub(super) fn fast_log2(x: f32) -> f32 {
    let bits = x.to_bits();
    let exponent = ((bits >> 23) & 0xff) as f32 - 127.0;
    let m = f32::from_bits((bits & 0x007f_ffff) | 0x3f80_0000); // [1, 2)
    exponent + (-0.344_845 * m + 2.024_658) * m - 1.674_873
}

/// Gain of the local tone as a function of the neighbourhood log-luminance: shadows
/// below ≈ 1.5 % lifted, highlights above mid-grey pulled down, smooth in between.
struct ToneCurve(Vec<f32>);

impl ToneCurve {
    const LO: f32 = -8.0;
    const HI: f32 = 1.0;
    const SIZE: usize = 1024;

    fn new(shadows: f32, highlights: f32) -> Self {
        let step = (Self::HI - Self::LO) / (Self::SIZE - 1) as f32;
        Self(
            (0..Self::SIZE)
                .map(|i| {
                    let l = Self::LO + i as f32 * step;
                    (shadows * (1.0 - smoothstep(-6.0, -2.0, l))
                        + highlights * smoothstep(-2.5, 0.0, l))
                    .exp2()
                })
                .collect(),
        )
    }

    fn get(&self, l: f32) -> f32 {
        let t = ((l - Self::LO) / (Self::HI - Self::LO)).clamp(0.0, 1.0);
        self.0[(t * (Self::SIZE - 1) as f32 + 0.5) as usize]
    }
}

fn smoothstep(e0: f32, e1: f32, x: f32) -> f32 {
    let t = ((x - e0) / (e1 - e0)).clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

/// Blurred log-luminance on a coarse grid, sampled bilinearly: the "neighbourhood"
/// brightness that decides what is shadow and what is highlight.
struct ToneGrid {
    gw: usize,
    gh: usize,
    cell: f32,
    values: Vec<f32>,
}

impl ToneGrid {
    fn new(img: &Linear, threads: usize) -> Self {
        let (w, h) = (img.width as usize, img.height as usize);
        let cell = (w.max(h) as f32 / TONE_GRID).max(1.0);
        let gw = ((w as f32 / cell).ceil() as usize).max(1);
        let gh = ((h as f32 / cell).ceil() as usize).max(1);
        // Mean luminance per cell (grid rows in parallel), then its log.
        let mut values = vec![0f32; gw * gh];
        let per = gh.div_ceil(threads.max(1)).max(1);
        std::thread::scope(|s| {
            for (k, chunk) in values.chunks_mut(per * gw).enumerate() {
                s.spawn(move || {
                    let mut count = vec![0u32; chunk.len()];
                    let first = k * per;
                    let rows = chunk.len() / gw;
                    let y0 = (first as f32 * cell).ceil() as usize;
                    let y1 = (((first + rows) as f32 * cell).ceil() as usize).min(h);
                    for y in y0..y1 {
                        let gy = ((y as f32 / cell) as usize).min(gh - 1) - first;
                        let row = &img.data[y * w * 3..(y + 1) * w * 3];
                        for (x, p) in row.as_chunks::<3>().0.iter().enumerate() {
                            let gx = ((x as f32 / cell) as usize).min(gw - 1);
                            chunk[gy * gw + gx] += luminance([p[0], p[1], p[2]]).max(0.0);
                            count[gy * gw + gx] += 1;
                        }
                    }
                    for (v, n) in chunk.iter_mut().zip(count) {
                        *v = (*v / n.max(1) as f32 + 1e-6).log2();
                    }
                });
            }
        });
        gaussian_blur(&mut values, gw, gh, TONE_SIGMA);
        Self {
            gw,
            gh,
            cell,
            values,
        }
    }

    fn sample(&self, x: usize, y: usize) -> f32 {
        let fx = ((x as f32 + 0.5) / self.cell - 0.5).clamp(0.0, (self.gw - 1) as f32);
        let fy = ((y as f32 + 0.5) / self.cell - 0.5).clamp(0.0, (self.gh - 1) as f32);
        let (x0, y0) = (fx as usize, fy as usize);
        let (x1, y1) = ((x0 + 1).min(self.gw - 1), (y0 + 1).min(self.gh - 1));
        let (tx, ty) = (fx - x0 as f32, fy - y0 as f32);
        let v = |x: usize, y: usize| self.values[y * self.gw + x];
        let top = v(x0, y0) + (v(x1, y0) - v(x0, y0)) * tx;
        let bottom = v(x0, y1) + (v(x1, y1) - v(x0, y1)) * tx;
        top + (bottom - top) * ty
    }
}

fn gaussian_kernel(sigma: f32) -> Vec<f32> {
    let radius = (sigma * 3.0).ceil() as i32;
    let mut k: Vec<f32> = (-radius..=radius)
        .map(|i| (-(i * i) as f32 / (2.0 * sigma * sigma)).exp())
        .collect();
    let total: f32 = k.iter().sum();
    k.iter_mut().for_each(|v| *v /= total);
    k
}

/// Separable Gaussian blur of a single-channel plane (edges clamped).
fn gaussian_blur(plane: &mut [f32], w: usize, h: usize, sigma: f32) {
    let k = gaussian_kernel(sigma);
    let r = (k.len() / 2) as isize;
    let mut tmp = vec![0f32; plane.len()];
    for y in 0..h {
        for x in 0..w {
            let mut acc = 0.0;
            for (j, kv) in k.iter().enumerate() {
                let sx = (x as isize + j as isize - r).clamp(0, w as isize - 1) as usize;
                acc += plane[y * w + sx] * kv;
            }
            tmp[y * w + x] = acc;
        }
    }
    for y in 0..h {
        for x in 0..w {
            let mut acc = 0.0;
            for (j, kv) in k.iter().enumerate() {
                let sy = (y as isize + j as isize - r).clamp(0, h as isize - 1) as usize;
                acc += tmp[sy * w + x] * kv;
            }
            plane[y * w + x] = acc;
        }
    }
}

/// Separable Gaussian blur of a large plane, rows split across threads.
fn par_blur(plane: &[f32], w: usize, h: usize, sigma: f32, threads: usize) -> Vec<f32> {
    let k = gaussian_kernel(sigma);
    let r = (k.len() / 2) as isize;
    let per = h.div_ceil(threads.max(1)).max(1);
    let mut tmp = vec![0f32; plane.len()];
    std::thread::scope(|s| {
        for (c, chunk) in tmp.chunks_mut(per * w).enumerate() {
            let k = &k;
            s.spawn(move || {
                for (i, out) in chunk.chunks_mut(w).enumerate() {
                    let row = &plane[(c * per + i) * w..(c * per + i + 1) * w];
                    for (x, o) in out.iter_mut().enumerate() {
                        *o = k
                            .iter()
                            .enumerate()
                            .map(|(j, kv)| {
                                row[(x as isize + j as isize - r).clamp(0, w as isize - 1) as usize]
                                    * kv
                            })
                            .sum();
                    }
                }
            });
        }
    });
    let mut out = vec![0f32; plane.len()];
    std::thread::scope(|s| {
        for (c, chunk) in out.chunks_mut(per * w).enumerate() {
            let (k, tmp) = (&k, &tmp);
            s.spawn(move || {
                for (i, o_row) in chunk.chunks_mut(w).enumerate() {
                    let y = (c * per + i) as isize;
                    for (j, kv) in k.iter().enumerate() {
                        let sy = (y + j as isize - r).clamp(0, h as isize - 1) as usize;
                        let src = &tmp[sy * w..(sy + 1) * w];
                        for (o, v) in o_row.iter_mut().zip(src) {
                            *o += v * kv;
                        }
                    }
                }
            });
        }
    });
    out
}

/// Unsharp mask on the display luminance, added equally to the three channels (no
/// colour fringes). Differences under ~1 level are left alone (noise).
fn sharpen(rgb: &mut [f32], w: usize, h: usize, amount: f32, sigma: f32, threads: usize) {
    let original: Vec<f32> = rgb
        .as_chunks::<3>()
        .0
        .iter()
        .map(|p| LUMA[0] * p[0] + LUMA[1] * p[1] + LUMA[2] * p[2])
        .collect();
    let luma = par_blur(&original, w, h, sigma, threads);
    let threshold = 1.0 / 255.0;
    par_rows(rgb, w, threads, |y, row| {
        for (x, px) in row.as_chunks_mut::<3>().0.iter_mut().enumerate() {
            let i = y * w + x;
            let d = original[i] - luma[i];
            let d = if d.abs() < threshold {
                d * (d.abs() / threshold)
            } else {
                d
            };
            for v in px.iter_mut() {
                *v = (*v + amount * d).clamp(0.0, 1.0);
            }
        }
    });
}

/// To 8 bits with a light triangular dither (no banding in skies). The noise stays
/// under half a level, so an untouched pixel comes back exactly.
fn quantize_into(display: &[f32], offset: usize, out: &mut [u8]) {
    for (i, (v, o)) in display.iter().zip(out).enumerate() {
        let n = dither((offset + i) as u32);
        *o = (v.clamp(0.0, 1.0) * 255.0 + n).round().clamp(0.0, 255.0) as u8;
    }
}

/// Deterministic triangular noise in (−0.49, 0.49).
fn dither(i: u32) -> f32 {
    let hash = |mut x: u32| {
        x ^= x >> 16;
        x = x.wrapping_mul(0x7feb_352d);
        x ^= x >> 15;
        x = x.wrapping_mul(0x846c_a68b);
        x ^= x >> 16;
        (x >> 8) as f32 / (1u32 << 24) as f32
    };
    (hash(i.wrapping_mul(2)) + hash(i.wrapping_mul(2).wrapping_add(1)) - 1.0) * 0.49
}

/// Runs `f(row_index, row)` over the image rows on `threads` threads.
fn par_rows(data: &mut [f32], width: usize, threads: usize, f: impl Fn(usize, &mut [f32]) + Sync) {
    let stride = width * 3;
    if stride == 0 {
        return;
    }
    let rows = data.len() / stride;
    let per = rows.div_ceil(threads.max(1)).max(1);
    std::thread::scope(|s| {
        for (chunk_index, chunk) in data.chunks_mut(per * stride).enumerate() {
            let f = &f;
            s.spawn(move || {
                for (i, row) in chunk.chunks_mut(stride).enumerate() {
                    f(chunk_index * per + i, row);
                }
            });
        }
    });
}
