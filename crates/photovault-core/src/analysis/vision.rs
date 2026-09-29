//! Pluggable visual analysis (PRD §21); the catalog never depends on a specific model.
//! Implemented by `ai::Engine` (CLIP: scenes + embedding, phase 7a); faces in phase 7b.

use crate::error::Result;

#[derive(Debug, Clone, Default)]
pub struct VisionResult {
    /// (dimension, value, score), e.g. ("scene", "paisagem", 0.92).
    pub labels: Vec<(String, String, f32)>,
    pub faces: u32,
    pub embedding: Option<Vec<f32>>,
}

pub trait VisionAnalyzer: Send + Sync {
    fn name(&self) -> &'static str;
    fn analyze(&self, image: &image::DynamicImage) -> Result<VisionResult>;
}
