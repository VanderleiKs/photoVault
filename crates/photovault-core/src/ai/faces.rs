//! Faces (phase 7b): YuNet finds them (with 5 landmarks), SFace turns each one, aligned to
//! 112 × 112, into a 128-d unit vector; two vectors of the same person are close. Both
//! models come from the OpenCV Zoo (YuNet: MIT; SFace: Apache 2.0). Pre- and
//! post-processing follow OpenCV's `FaceDetectorYN` and `FaceRecognizerSF::alignCrop`.

use super::clip::{normalized, resize_rgb, session};
use crate::error::{Error, Result};
use image::{DynamicImage, RgbImage};
use ndarray::Array4;
use ort::session::Session;
use ort::value::Tensor;
use std::path::Path;
use std::sync::Mutex;

pub const DIM: usize = 128;
/// YuNet's input (fixed in the ONNX file); the image is scaled to fit and padded.
const INPUT: u32 = 640;
const STRIDES: [u32; 3] = [8, 16, 32];
/// Detections below this are discarded (OpenCV's demo uses 0.9 for photos).
pub const MIN_SCORE: f32 = 0.7;
const NMS_IOU: f32 = 0.3;
/// SFace's input side and the landmark positions it was trained with (ArcFace template).
const ALIGNED: u32 = 112;
const TEMPLATE: [[f32; 2]; 5] = [
    [38.2946, 51.6963],
    [73.5318, 51.5014],
    [56.0252, 71.7366],
    [41.5493, 92.3655],
    [70.7299, 92.2041],
];

/// A face in image pixels. Landmarks: right eye, left eye, nose, right and left mouth
/// corners (of the person; the first eye is on the left of the image).
#[derive(Debug, Clone, PartialEq)]
pub struct Detection {
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
    pub landmarks: [[f32; 2]; 5],
    pub score: f32,
}

impl Detection {
    /// 1 = looking at the camera; → 0 as the head turns (nose towards one eye).
    pub fn frontal(&self) -> f32 {
        let [re, le, nose, ..] = self.landmarks;
        let eyes = (le[0] - re[0]).abs().max(1.0);
        let mid = (le[0] + re[0]) / 2.0;
        (1.0 - 2.0 * (nose[0] - mid).abs() / eyes).clamp(0.0, 1.0)
    }
}

pub struct Faces {
    detector: Mutex<Session>,
    recognizer: Mutex<Session>,
}

impl Faces {
    pub fn load(dir: &Path, threads: Option<usize>) -> Result<Self> {
        Ok(Self {
            detector: Mutex::new(session(&dir.join(super::files::DETECTOR), threads)?),
            recognizer: Mutex::new(session(&dir.join(super::files::RECOGNIZER), threads)?),
        })
    }

    /// Faces in `img`, best first, coordinates in `img` pixels.
    pub fn detect(&self, img: &RgbImage) -> Result<Vec<Detection>> {
        let (w, h) = img.dimensions();
        let scale = INPUT as f32 / w.max(h).max(1) as f32;
        let (nw, nh) = (
            ((w as f32 * scale).round() as u32).clamp(1, INPUT),
            ((h as f32 * scale).round() as u32).clamp(1, INPUT),
        );
        let resized = resize_rgb(img, nw, nh);
        let side = INPUT as usize;
        let mut input = Array4::<f32>::zeros((1, 3, side, side));
        for (x, y, p) in resized.enumerate_pixels() {
            // BGR, 0–255, no normalization (OpenCV's blob of a BGR image).
            for c in 0..3 {
                input[[0, c, y as usize, x as usize]] = f32::from(p[2 - c]);
            }
        }
        let mut detector = self
            .detector
            .lock()
            .map_err(|_| Error::Ai("sessão travada".into()))?;
        let out = detector.run(ort::inputs!["input" => Tensor::from_array(input)?])?;
        let mut found = Vec::new();
        for stride in STRIDES {
            let get = |name: &str| -> Result<Vec<f32>> {
                Ok(out[format!("{name}_{stride}").as_str()]
                    .try_extract_tensor::<f32>()?
                    .1
                    .to_vec())
            };
            decode(
                stride,
                &get("cls")?,
                &get("obj")?,
                &get("bbox")?,
                &get("kps")?,
                &mut found,
            );
        }
        let mut faces = nms(found);
        for f in &mut faces {
            f.x /= scale;
            f.y /= scale;
            f.w /= scale;
            f.h /= scale;
            for p in &mut f.landmarks {
                p[0] /= scale;
                p[1] /= scale;
            }
        }
        Ok(faces)
    }

    /// Identity vector of one detected face.
    pub fn embed(&self, img: &RgbImage, face: &Detection) -> Result<Vec<f32>> {
        let aligned = align(img, &face.landmarks);
        let side = ALIGNED as usize;
        let mut input = Array4::<f32>::zeros((1, 3, side, side));
        for (x, y, p) in aligned.enumerate_pixels() {
            for c in 0..3 {
                input[[0, c, y as usize, x as usize]] = f32::from(p[c]);
            }
        }
        let mut recognizer = self
            .recognizer
            .lock()
            .map_err(|_| Error::Ai("sessão travada".into()))?;
        let out = recognizer.run(ort::inputs!["data" => Tensor::from_array(input)?])?;
        let (_, data) = out["fc1"].try_extract_tensor::<f32>()?;
        if data.len() != DIM {
            return Err(Error::Ai("saída inesperada do reconhecimento".into()));
        }
        Ok(normalized(data.to_vec()))
    }

    /// Convenience for a decoded image: detections with their vectors.
    pub fn analyze(&self, img: &DynamicImage) -> Result<Vec<(Detection, Vec<f32>)>> {
        let rgb = img.to_rgb8();
        self.detect(&rgb)?
            .into_iter()
            .map(|d| self.embed(&rgb, &d).map(|v| (d, v)))
            .collect()
    }
}

/// One output level of YuNet (anchor-free: one prediction per cell), in input pixels.
fn decode(
    stride: u32,
    cls: &[f32],
    obj: &[f32],
    bbox: &[f32],
    kps: &[f32],
    out: &mut Vec<Detection>,
) {
    let cols = (INPUT / stride) as usize;
    let s = stride as f32;
    for idx in 0..cls.len().min(obj.len()) {
        let score = (cls[idx].clamp(0.0, 1.0) * obj[idx].clamp(0.0, 1.0)).sqrt();
        if score < MIN_SCORE || bbox.len() < idx * 4 + 4 || kps.len() < idx * 10 + 10 {
            continue;
        }
        let (r, c) = ((idx / cols) as f32, (idx % cols) as f32);
        let b = &bbox[idx * 4..idx * 4 + 4];
        let (cx, cy) = ((c + b[0]) * s, (r + b[1]) * s);
        let (w, h) = (b[2].exp() * s, b[3].exp() * s);
        let k = &kps[idx * 10..idx * 10 + 10];
        let mut landmarks = [[0f32; 2]; 5];
        for (n, p) in landmarks.iter_mut().enumerate() {
            *p = [(k[2 * n] + c) * s, (k[2 * n + 1] + r) * s];
        }
        out.push(Detection {
            x: cx - w / 2.0,
            y: cy - h / 2.0,
            w,
            h,
            landmarks,
            score,
        });
    }
}

fn iou(a: &Detection, b: &Detection) -> f32 {
    let x1 = a.x.max(b.x);
    let y1 = a.y.max(b.y);
    let x2 = (a.x + a.w).min(b.x + b.w);
    let y2 = (a.y + a.h).min(b.y + b.h);
    let inter = (x2 - x1).max(0.0) * (y2 - y1).max(0.0);
    let union = a.w * a.h + b.w * b.h - inter;
    if union <= 0.0 { 0.0 } else { inter / union }
}

/// Greedy non-maximum suppression, best first.
fn nms(mut found: Vec<Detection>) -> Vec<Detection> {
    found.sort_by(|a, b| b.score.total_cmp(&a.score));
    let mut kept: Vec<Detection> = Vec::new();
    for d in found {
        if kept.iter().all(|k| iou(k, &d) <= NMS_IOU) {
            kept.push(d);
        }
    }
    kept
}

/// Least-squares similarity (rotation + uniform scale + translation) taking `src` to
/// `dst`: `[a, -b, tx; b, a, ty]`.
pub fn similarity(src: &[[f32; 2]; 5], dst: &[[f32; 2]; 5]) -> [f32; 6] {
    let n = src.len() as f32;
    let mean = |p: &[[f32; 2]; 5]| {
        let (x, y) = p.iter().fold((0.0, 0.0), |(x, y), q| (x + q[0], y + q[1]));
        [x / n, y / n]
    };
    let (ms, md) = (mean(src), mean(dst));
    let (mut num_a, mut num_b, mut den) = (0f32, 0f32, 0f32);
    for (s, d) in src.iter().zip(dst) {
        let (sx, sy) = (s[0] - ms[0], s[1] - ms[1]);
        let (dx, dy) = (d[0] - md[0], d[1] - md[1]);
        num_a += sx * dx + sy * dy;
        num_b += sx * dy - sy * dx;
        den += sx * sx + sy * sy;
    }
    let den = den.max(1e-6);
    let (a, b) = (num_a / den, num_b / den);
    [
        a,
        -b,
        md[0] - (a * ms[0] - b * ms[1]),
        b,
        a,
        md[1] - (b * ms[0] + a * ms[1]),
    ]
}

/// The face warped to SFace's template (bilinear; outside the image = black).
fn align(img: &RgbImage, landmarks: &[[f32; 2]; 5]) -> RgbImage {
    let [a, _, tx, b, _, ty] = similarity(landmarks, &TEMPLATE);
    let k = (a * a + b * b).max(1e-9);
    let (w, h) = img.dimensions();
    let mut out = RgbImage::new(ALIGNED, ALIGNED);
    for (u, v, px) in out.enumerate_pixels_mut() {
        // Inverse of the similarity: dst → src.
        let (du, dv) = (u as f32 - tx, v as f32 - ty);
        let sx = (a * du + b * dv) / k;
        let sy = (-b * du + a * dv) / k;
        let (x0, y0) = (sx.floor(), sy.floor());
        let (fx, fy) = (sx - x0, sy - y0);
        let mut acc = [0f32; 3];
        for (dx, dy, wgt) in [
            (0, 0, (1.0 - fx) * (1.0 - fy)),
            (1, 0, fx * (1.0 - fy)),
            (0, 1, (1.0 - fx) * fy),
            (1, 1, fx * fy),
        ] {
            let (x, y) = (x0 as i64 + dx, y0 as i64 + dy);
            if x >= 0 && y >= 0 && (x as u32) < w && (y as u32) < h {
                let p = img.get_pixel(x as u32, y as u32);
                for c in 0..3 {
                    acc[c] += wgt * f32::from(p[c]);
                }
            }
        }
        *px = image::Rgb(acc.map(|c| c.round().clamp(0.0, 255.0) as u8));
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn det(x: f32, y: f32, w: f32, score: f32) -> Detection {
        Detection {
            x,
            y,
            w,
            h: w,
            landmarks: [[0.0; 2]; 5],
            score,
        }
    }

    #[test]
    fn similarity_recovers_a_known_transform() {
        // Rotate 30°, scale 2, move (10, -5).
        let (c, s) = (
            30f32.to_radians().cos() * 2.0,
            30f32.to_radians().sin() * 2.0,
        );
        let dst = TEMPLATE.map(|[x, y]| [c * x - s * y + 10.0, s * x + c * y - 5.0]);
        let [a, mb, tx, b, a2, ty] = similarity(&TEMPLATE, &dst);
        assert!((a - c).abs() < 1e-3 && (b - s).abs() < 1e-3);
        assert!((mb + s).abs() < 1e-3 && (a2 - c).abs() < 1e-3);
        assert!((tx - 10.0).abs() < 1e-2 && (ty + 5.0).abs() < 1e-2);
    }

    #[test]
    fn aligning_the_template_itself_is_the_identity() {
        let img = RgbImage::from_fn(ALIGNED, ALIGNED, |x, y| image::Rgb([x as u8, y as u8, 7]));
        let out = align(&img, &TEMPLATE);
        assert_eq!(out.get_pixel(40, 60), img.get_pixel(40, 60));
        assert_eq!(out.get_pixel(100, 5), img.get_pixel(100, 5));
    }

    #[test]
    fn overlapping_detections_keep_the_best() {
        let kept = nms(vec![
            det(0.0, 0.0, 100.0, 0.8),
            det(5.0, 5.0, 100.0, 0.95),
            det(300.0, 0.0, 80.0, 0.9),
        ]);
        assert_eq!(kept.len(), 2);
        assert_eq!(kept[0].score, 0.95);
        assert_eq!(kept[1].x, 300.0);
    }

    #[test]
    fn decode_places_a_cell_prediction() {
        // One cell (row 2, col 3) of the stride-32 level, confident, 2 × 2 cells big.
        let cells = (INPUT / 32 * INPUT / 32) as usize;
        let idx = 2 * (INPUT / 32) as usize + 3;
        let (mut cls, mut obj) = (vec![0f32; cells], vec![0f32; cells]);
        cls[idx] = 1.0;
        obj[idx] = 0.81;
        let mut bbox = vec![0f32; cells * 4];
        bbox[idx * 4..idx * 4 + 4].copy_from_slice(&[0.5, 0.5, 2f32.ln(), 2f32.ln()]);
        let kps = vec![0f32; cells * 10];
        let mut out = Vec::new();
        decode(32, &cls, &obj, &bbox, &kps, &mut out);
        assert_eq!(out.len(), 1);
        let d = &out[0];
        assert!((d.score - 0.9).abs() < 1e-5);
        assert!((d.x - (3.5 * 32.0 - 32.0)).abs() < 1e-3);
        assert!((d.w - 64.0).abs() < 1e-3);
        assert_eq!(d.landmarks[0], [96.0, 64.0]);
    }

    #[test]
    fn frontal_face_scores_high_and_profile_low() {
        let mut d = det(0.0, 0.0, 100.0, 0.9);
        d.landmarks = [
            [30.0, 40.0],
            [70.0, 40.0],
            [50.0, 60.0],
            [35.0, 80.0],
            [65.0, 80.0],
        ];
        assert!(d.frontal() > 0.99);
        d.landmarks[2][0] = 68.0;
        assert!(d.frontal() < 0.2);
    }
}
