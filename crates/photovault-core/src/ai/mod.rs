//! Local AI (PRD §21, phase 7a). Optional: models are downloaded only when the user asks
//! (`download`), checked by SHA-256, and live in `<base>/models/`. Without them everything
//! else works; with them, photos get a CLIP embedding (`index`), which feeds the content
//! search ("cachorro na praia") and the scene chips ("Paisagem 92 %").

pub mod clip;
pub mod download;
pub mod index;
pub mod scenes;

use crate::error::{Error, Result};
use clip::Clip;
use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock};

/// Stored with each embedding: vectors of another model are not comparable.
pub const MODEL_ID: &str = "clip-b32-multilingual-v1-int8";

/// Names inside the model folder.
pub mod files {
    pub const VISION: &str = "vision.onnx";
    pub const TEXT: &str = "text.onnx";
    pub const PROJECTION: &str = "projection.safetensors";
    pub const TOKENIZER: &str = "tokenizer.json";
}

pub struct ModelFile {
    pub name: &'static str,
    pub url: &'static str,
    pub sha256: &'static str,
    pub size: u64,
}

/// Pinned revisions: a changed file upstream fails the checksum instead of loading.
/// Image encoder: OpenAI CLIP ViT-B/32 (MIT), int8 ONNX export by Xenova.
/// Text: sentence-transformers clip-ViT-B-32-multilingual-v1 (Apache 2.0), int8 ONNX.
pub const MANIFEST: [ModelFile; 4] = [
    ModelFile {
        name: files::VISION,
        url: "https://huggingface.co/Xenova/clip-vit-base-patch32/resolve/d15189d7028b43f1d3e65039190477f6af591c2a/onnx/vision_model_quantized.onnx",
        sha256: "583fd1110a514667812fee7d684952aaf82a99b959760c8d7dca7e0ab9839299",
        size: 89_117_001,
    },
    ModelFile {
        name: files::TEXT,
        url: "https://huggingface.co/sentence-transformers/clip-ViT-B-32-multilingual-v1/resolve/58edf8cada9e398793dca955574a48cbb7f18be2/onnx/model_quint8_avx2.onnx",
        sha256: "fbc8fbeaa5237d96bd1bf430057c70d34de8334a463e933a5faa305f6caeed9c",
        size: 135_377_779,
    },
    ModelFile {
        name: files::PROJECTION,
        url: "https://huggingface.co/sentence-transformers/clip-ViT-B-32-multilingual-v1/resolve/58edf8cada9e398793dca955574a48cbb7f18be2/2_Dense/model.safetensors",
        sha256: "d12568dc7300970a4d3dbb49068ad16cd89b99840b74b026f8e48071e9414f74",
        size: 1_572_984,
    },
    ModelFile {
        name: files::TOKENIZER,
        url: "https://huggingface.co/sentence-transformers/clip-ViT-B-32-multilingual-v1/resolve/58edf8cada9e398793dca955574a48cbb7f18be2/tokenizer.json",
        sha256: "5b4e1a8171c81dfd666ae40265b9530c6e0b3d53923fe8ac493dcc84229adf81",
        size: 1_961_847,
    },
];

pub fn total_size() -> u64 {
    MANIFEST.iter().map(|f| f.size).sum()
}

pub fn model_dir(models_dir: &Path) -> PathBuf {
    models_dir.join(MODEL_ID)
}

/// Every file present with its size (checksums are verified when downloading).
pub fn installed(models_dir: &Path) -> bool {
    let dir = model_dir(models_dir);
    MANIFEST
        .iter()
        .all(|f| std::fs::metadata(dir.join(f.name)).is_ok_and(|m| m.len() == f.size))
}

/// The loaded model, and the text vectors of the scenes (computed once).
pub struct Engine {
    pub clip: Clip,
    pub scenes: Vec<Vec<f32>>,
}

/// The PRD §5.4 contract, for a single image; the queue uses `clip.embed_images` in
/// batches, and the search `clip.embed_text`, which the trait doesn't cover.
impl crate::analysis::VisionAnalyzer for Engine {
    fn name(&self) -> &'static str {
        MODEL_ID
    }

    fn analyze(&self, image: &image::DynamicImage) -> Result<crate::analysis::VisionResult> {
        let embedding = self
            .clip
            .embed_images(std::slice::from_ref(image))?
            .pop()
            .ok_or_else(|| Error::Ai("sem resultado".into()))?;
        Ok(crate::analysis::VisionResult {
            labels: scenes::chips(&embedding, &self.scenes)
                .into_iter()
                .map(|c| ("scene".to_string(), c.value, c.score))
                .collect(),
            faces: 0,
            embedding: Some(embedding),
        })
    }
}

static ENGINE: RwLock<Option<Arc<Engine>>> = RwLock::new(None);

/// `None` = no model (not installed, disabled, or failed to load).
pub fn engine() -> Option<Arc<Engine>> {
    ENGINE.read().ok().and_then(|e| e.clone())
}

/// Load the model if installed (blocking: ~1 s). `Ok(false)` = not installed.
pub fn load(models_dir: &Path, threads: Option<usize>) -> Result<bool> {
    if engine().is_some() {
        return Ok(true);
    }
    if !installed(models_dir) {
        return Ok(false);
    }
    let started = std::time::Instant::now();
    let clip = Clip::load(&model_dir(models_dir), threads)?;
    let scenes = scenes::SCENES
        .iter()
        .map(|s| clip.embed_text(s.prompt))
        .collect::<Result<Vec<_>>>()?;
    *ENGINE
        .write()
        .map_err(|_| Error::Ai("estado travado".into()))? = Some(Arc::new(Engine { clip, scenes }));
    tracing::info!("Local AI model loaded in {:?}", started.elapsed());
    Ok(true)
}

static LOAD_ERROR: std::sync::Mutex<Option<String>> = std::sync::Mutex::new(None);

/// Why the model couldn't be loaded last time (corrupt file, unsupported CPU…).
pub fn load_error() -> Option<String> {
    LOAD_ERROR.lock().ok().and_then(|e| e.clone())
}

/// Threads per inference: the analysis setting; automatic (0) = the runtime's default.
pub fn threads(cpu_concurrency: u32) -> Option<usize> {
    (cpu_concurrency > 0).then_some(cpu_concurrency as usize)
}

/// Make the loaded model match the settings and the files on disk: load it when enabled
/// and installed, unload it otherwise. Returns whether it is ready.
pub async fn sync(pool: &sqlx::SqlitePool, models_dir: &Path) -> Result<bool> {
    let settings = crate::catalog::settings::get(pool).await?;
    if !settings.ai.enabled {
        unload();
        return Ok(false);
    }
    let dir = models_dir.to_path_buf();
    let threads = threads(settings.cpu_concurrency);
    let loaded = tokio::task::spawn_blocking(move || load(&dir, threads)).await?;
    if let Ok(mut e) = LOAD_ERROR.lock() {
        *e = loaded.as_ref().err().map(|e| e.to_string());
    }
    match loaded {
        Ok(ready) => Ok(ready),
        Err(e) => {
            tracing::error!("Local AI model failed to load: {e}");
            Ok(false)
        }
    }
}

pub fn unload() {
    if let Ok(mut e) = ENGINE.write() {
        *e = None;
    }
    index::forget();
}

/// Delete the downloaded files (the embeddings go with them).
pub async fn remove(pool: &sqlx::SqlitePool, models_dir: &Path) -> Result<()> {
    unload();
    let dir = model_dir(models_dir);
    if dir.exists() {
        std::fs::remove_dir_all(&dir)?;
    }
    index::delete_all(pool).await
}
