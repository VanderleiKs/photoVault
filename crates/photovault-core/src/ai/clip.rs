//! CLIP ViT-B/32 image encoder + the multilingual text encoder distilled into its space
//! (`clip-ViT-B-32-multilingual-v1`): an image and a sentence in Portuguese (or 50 other
//! languages) land on comparable 512-d unit vectors.

use super::files;
use crate::error::{Error, Result};
use image::DynamicImage;
use ndarray::{Array2, Array4, ArrayView2, Axis};
use ort::session::Session;
use ort::session::builder::GraphOptimizationLevel;
use ort::value::Tensor;
use std::path::Path;
use std::sync::Mutex;

pub const DIM: usize = 512;
const SIDE: u32 = 224;
const MEAN: [f32; 3] = [0.481_454_66, 0.457_827_5, 0.408_210_73];
const STD: [f32; 3] = [0.268_629_54, 0.261_302_6, 0.275_777_1];
/// Longest text the encoder sees (tokens).
const MAX_TOKENS: usize = 128;

pub struct Clip {
    vision: Mutex<Session>,
    text: Mutex<Session>,
    tokenizer: tokenizers::Tokenizer,
    /// Projection of the text encoder (512 × 768, no bias).
    projection: Array2<f32>,
}

/// `threads`: `None` = ONNX Runtime's default (one per physical core), which measured
/// fastest (`ai_eval`: ~33 ms/photo against ~51 ms with 4 threads, batches of 16).
pub(super) fn session(path: &Path, threads: Option<usize>) -> Result<Session> {
    // Builder errors carry the builder back; only the message matters here.
    let ai = |e: ort::Error<_>| Error::Ai(e.to_string());
    let mut builder = Session::builder()?
        .with_optimization_level(GraphOptimizationLevel::Level3)
        .map_err(ai)?;
    if let Some(n) = threads {
        builder = builder.with_intra_threads(n.max(1)).map_err(ai)?;
    }
    Ok(builder.commit_from_file(path)?)
}

impl Clip {
    /// `threads`: CPU threads per inference (`None` = automatic).
    pub fn load(dir: &Path, threads: Option<usize>) -> Result<Self> {
        let tokenizer = tokenizers::Tokenizer::from_file(dir.join(files::TOKENIZER))
            .map_err(|e| Error::Ai(format!("tokenizador: {e}")))?;
        Ok(Self {
            vision: Mutex::new(session(&dir.join(files::VISION), threads)?),
            text: Mutex::new(session(&dir.join(files::TEXT), threads)?),
            tokenizer,
            projection: read_projection(&dir.join(files::PROJECTION))?,
        })
    }

    /// Unit vectors, one per image (batched in one inference).
    pub fn embed_images(&self, images: &[DynamicImage]) -> Result<Vec<Vec<f32>>> {
        if images.is_empty() {
            return Ok(Vec::new());
        }
        let side = SIDE as usize;
        let mut input = Array4::<f32>::zeros((images.len(), 3, side, side));
        for (i, img) in images.iter().enumerate() {
            fill(&mut input, i, img);
        }
        let mut vision = self
            .vision
            .lock()
            .map_err(|_| Error::Ai("sessão travada".into()))?;
        let out = vision.run(ort::inputs!["pixel_values" => Tensor::from_array(input)?])?;
        let (_, data) = out["image_embeds"].try_extract_tensor::<f32>()?;
        Ok(data
            .as_chunks::<DIM>()
            .0
            .iter()
            .map(|v| normalized(v.to_vec()))
            .collect())
    }

    /// Unit vector of a sentence ("praia ao pôr do sol").
    pub fn embed_text(&self, text: &str) -> Result<Vec<f32>> {
        let enc = self
            .tokenizer
            .encode(text, true)
            .map_err(|e| Error::Ai(format!("tokenizador: {e}")))?;
        let n = enc.get_ids().len().min(MAX_TOKENS);
        let ids: Vec<i64> = enc.get_ids()[..n].iter().map(|&x| i64::from(x)).collect();
        let mask: Vec<i64> = enc.get_attention_mask()[..n]
            .iter()
            .map(|&x| i64::from(x))
            .collect();
        let mut text = self
            .text
            .lock()
            .map_err(|_| Error::Ai("sessão travada".into()))?;
        let out = text.run(ort::inputs![
            "input_ids" => Tensor::from_array(([1usize, n], ids))?,
            "attention_mask" => Tensor::from_array(([1usize, n], mask))?,
        ])?;
        let (_, hidden) = out["last_hidden_state"].try_extract_tensor::<f32>()?;
        let width = self.projection.ncols();
        let hidden = ArrayView2::from_shape((n, width), hidden)
            .map_err(|e| Error::Ai(format!("saída do texto: {e}")))?;
        // Mean pooling (every token is real: a single sentence has no padding).
        let pooled = hidden.sum_axis(Axis(0)) / n as f32;
        Ok(normalized(self.projection.dot(&pooled).to_vec()))
    }
}

/// Resize the short side to 224 (bicubic), center crop, normalize: CLIP's preprocessing.
fn fill(input: &mut Array4<f32>, i: usize, img: &DynamicImage) {
    let rgb = img.to_rgb8();
    let (w, h) = rgb.dimensions();
    let scale = SIDE as f32 / w.min(h).max(1) as f32;
    let nw = ((w as f32 * scale).round() as u32).max(SIDE);
    let nh = ((h as f32 * scale).round() as u32).max(SIDE);
    let resized = resize_rgb(&rgb, nw, nh);
    let (x0, y0) = ((nw - SIDE) / 2, (nh - SIDE) / 2);
    for y in 0..SIDE {
        for x in 0..SIDE {
            let p = resized.get_pixel(x0 + x, y0 + y);
            for c in 0..3 {
                input[[i, c, y as usize, x as usize]] =
                    (f32::from(p[c]) / 255.0 - MEAN[c]) / STD[c];
            }
        }
    }
}

/// Bicubic resize with `fast_image_resize` (SIMD): the `image` crate's bicubic took most
/// of the time.
pub(super) fn resize_rgb(rgb: &image::RgbImage, nw: u32, nh: u32) -> image::RgbImage {
    use fast_image_resize::{FilterType, ResizeAlg, ResizeOptions, Resizer, images::Image};
    let mut dst = Image::new(nw, nh, fast_image_resize::PixelType::U8x3);
    Resizer::new()
        .resize(
            rgb,
            &mut dst,
            &ResizeOptions::new().resize_alg(ResizeAlg::Convolution(FilterType::CatmullRom)),
        )
        .ok()
        .and_then(|_| image::RgbImage::from_raw(nw, nh, dst.into_vec()))
        .unwrap_or_else(|| {
            image::imageops::resize(rgb, nw, nh, image::imageops::FilterType::CatmullRom)
        })
}

pub fn normalized(mut v: Vec<f32>) -> Vec<f32> {
    let n = v.iter().map(|x| x * x).sum::<f32>().sqrt().max(1e-9);
    v.iter_mut().for_each(|x| *x /= n);
    v
}

pub fn dot(a: &[f32], b: &[f32]) -> f32 {
    a.iter().zip(b).map(|(x, y)| x * y).sum()
}

/// The `2_Dense` layer (safetensors: u64 header length, JSON header, raw f32 LE).
fn read_projection(path: &Path) -> Result<Array2<f32>> {
    let bad = |why: &str| Error::Ai(format!("projeção inválida: {why}"));
    let bytes = std::fs::read(path)?;
    let len = u64::from_le_bytes(
        bytes
            .get(..8)
            .ok_or_else(|| bad("curta"))?
            .try_into()
            .unwrap_or_default(),
    ) as usize;
    let header: serde_json::Value =
        serde_json::from_slice(bytes.get(8..8 + len).ok_or_else(|| bad("cabeçalho"))?)
            .map_err(|_| bad("cabeçalho"))?;
    let (_, tensor) = header
        .as_object()
        .and_then(|o| o.iter().find(|(k, _)| k.as_str() != "__metadata__"))
        .ok_or_else(|| bad("sem tensor"))?;
    if tensor["dtype"] != "F32" {
        return Err(bad("tipo"));
    }
    let shape: Vec<usize> = tensor["shape"]
        .as_array()
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_u64())
                .map(|v| v as usize)
                .collect()
        })
        .unwrap_or_default();
    let [rows, cols] = shape[..] else {
        return Err(bad("forma"));
    };
    if rows != DIM {
        return Err(bad("dimensão"));
    }
    let start = tensor["data_offsets"][0]
        .as_u64()
        .ok_or_else(|| bad("offset"))? as usize
        + 8
        + len;
    let data: Vec<f32> = bytes
        .get(start..start + rows * cols * 4)
        .ok_or_else(|| bad("dados"))?
        .as_chunks::<4>()
        .0
        .iter()
        .map(|c| f32::from_le_bytes(*c))
        .collect();
    Array2::from_shape_vec((rows, cols), data).map_err(|_| bad("forma"))
}
