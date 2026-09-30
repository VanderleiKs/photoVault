//! Local AI (PRD §21, phases 7a/7b). Optional: models are downloaded only when the user
//! asks (`download`), checked by SHA-256, and live in `<base>/models/<package>/`. Two
//! packages, each with its own consent: content (CLIP: content search and scene chips)
//! and faces (YuNet + SFace: people). Without them everything else works.

pub mod clip;
pub mod download;
pub mod faces;
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
    pub const DETECTOR: &str = "yunet.onnx";
    pub const RECOGNIZER: &str = "sface.onnx";
}

pub struct ModelFile {
    pub name: &'static str,
    pub url: &'static str,
    pub sha256: &'static str,
    pub size: u64,
}

/// A set of files downloaded, installed and removed together.
pub struct Package {
    /// Folder name, and the model id stored with what it produces.
    pub id: &'static str,
    pub files: &'static [ModelFile],
}

/// Pinned revisions: a changed file upstream fails the checksum instead of loading.
/// Image encoder: OpenAI CLIP ViT-B/32 (MIT), int8 ONNX export by Xenova.
/// Text: sentence-transformers clip-ViT-B-32-multilingual-v1 (Apache 2.0), int8 ONNX.
pub const CONTENT: Package = Package {
    id: MODEL_ID,
    files: &[
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
    ],
};

/// Stored with each face: vectors of another model are not comparable.
pub const FACES_MODEL_ID: &str = "faces-yunet2023-sface2021";

/// OpenCV Zoo: YuNet 2023mar (detection, MIT) and SFace 2021dec (recognition, Apache 2.0).
pub const FACES: Package = Package {
    id: FACES_MODEL_ID,
    files: &[
        ModelFile {
            name: files::DETECTOR,
            url: "https://huggingface.co/opencv/face_detection_yunet/resolve/3cc26e7f1014a5ee5d74a42acee58bafc9d0a310/face_detection_yunet_2023mar.onnx",
            sha256: "8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4",
            size: 232_589,
        },
        ModelFile {
            name: files::RECOGNIZER,
            url: "https://huggingface.co/opencv/face_recognition_sface/resolve/3d7082438a6e4551e840c9b2bb60b71e8da4b524/face_recognition_sface_2021dec.onnx",
            sha256: "0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79",
            size: 38_696_353,
        },
    ],
};

impl Package {
    pub fn size(&self) -> u64 {
        self.files.iter().map(|f| f.size).sum()
    }

    pub fn dir(&self, models_dir: &Path) -> PathBuf {
        models_dir.join(self.id)
    }

    /// Every file present with its size (checksums are verified when downloading).
    pub fn installed(&self, models_dir: &Path) -> bool {
        let dir = self.dir(models_dir);
        self.files
            .iter()
            .all(|f| std::fs::metadata(dir.join(f.name)).is_ok_and(|m| m.len() == f.size))
    }
}

pub fn package(id: &str) -> Option<&'static Package> {
    [&CONTENT, &FACES].into_iter().find(|p| p.id == id)
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
static FACE_ENGINE: RwLock<Option<Arc<faces::Faces>>> = RwLock::new(None);

/// `None` = no content model (not installed, disabled, or failed to load).
pub fn engine() -> Option<Arc<Engine>> {
    ENGINE.read().ok().and_then(|e| e.clone())
}

/// `None` = no face models.
pub fn face_engine() -> Option<Arc<faces::Faces>> {
    FACE_ENGINE.read().ok().and_then(|e| e.clone())
}

/// Load the content model if installed (blocking: ~1 s). `Ok(false)` = not installed.
pub fn load(models_dir: &Path, threads: Option<usize>) -> Result<bool> {
    if engine().is_some() {
        return Ok(true);
    }
    if !CONTENT.installed(models_dir) {
        return Ok(false);
    }
    let started = std::time::Instant::now();
    let clip = Clip::load(&CONTENT.dir(models_dir), threads)?;
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

/// Load the face models if installed (blocking). `Ok(false)` = not installed.
pub fn load_faces(models_dir: &Path, threads: Option<usize>) -> Result<bool> {
    if face_engine().is_some() {
        return Ok(true);
    }
    if !FACES.installed(models_dir) {
        return Ok(false);
    }
    let faces = faces::Faces::load(&FACES.dir(models_dir), threads)?;
    *FACE_ENGINE
        .write()
        .map_err(|_| Error::Ai("estado travado".into()))? = Some(Arc::new(faces));
    tracing::info!("Face models loaded");
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

/// Make the loaded models match the settings and the files on disk: load them when
/// enabled and installed, unload them otherwise. Returns whether the content model is ready.
pub async fn sync(pool: &sqlx::SqlitePool, models_dir: &Path) -> Result<bool> {
    let settings = crate::catalog::settings::get(pool).await?;
    if !settings.ai.enabled {
        unload();
        return Ok(false);
    }
    let dir = models_dir.to_path_buf();
    let threads = threads(settings.cpu_concurrency);
    let (content, faces) =
        tokio::task::spawn_blocking(move || (load(&dir, threads), load_faces(&dir, threads)))
            .await?;
    if let Ok(mut e) = LOAD_ERROR.lock() {
        *e = content
            .as_ref()
            .err()
            .or(faces.as_ref().err())
            .map(|e| e.to_string());
    }
    if let Err(e) = &faces {
        tracing::error!("Face models failed to load: {e}");
    }
    match content {
        Ok(ready) => Ok(ready),
        Err(e) => {
            tracing::error!("Local AI model failed to load: {e}");
            Ok(false)
        }
    }
}

pub fn unload() {
    unload_content();
    unload_faces();
}

/// Only the content model (it failed; the face models may be fine).
pub fn unload_content() {
    if let Ok(mut e) = ENGINE.write() {
        *e = None;
    }
    index::forget();
}

pub fn unload_faces() {
    if let Ok(mut e) = FACE_ENGINE.write() {
        *e = None;
    }
}

/// Delete the downloaded files of a package and what they produced (the content
/// analysis; the faces and people).
pub async fn remove(pool: &sqlx::SqlitePool, models_dir: &Path, package: &Package) -> Result<()> {
    let faces = package.id == FACES.id;
    if faces {
        unload_faces();
    } else {
        unload_content();
    }
    let dir = package.dir(models_dir);
    if dir.exists() {
        std::fs::remove_dir_all(&dir)?;
    }
    if faces {
        crate::people::delete_all(pool).await
    } else {
        index::delete_all(pool).await
    }
}
