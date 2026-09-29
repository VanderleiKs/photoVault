//! Scene chips ("Praia 71 %"): zero-shot, the photo's embedding against one sentence per
//! scene. Derived at read time from the stored embedding, so changing this list needs no
//! reprocessing. Prompts in English (the language the text encoder was distilled from).

use super::clip::dot;
use serde::Serialize;
use specta::Type;

pub struct Scene {
    pub value: &'static str,
    /// pt-BR, as shown.
    pub label: &'static str,
    pub prompt: &'static str,
}

const fn scene(value: &'static str, label: &'static str, prompt: &'static str) -> Scene {
    Scene {
        value,
        label,
        prompt,
    }
}

pub const SCENES: [Scene; 26] = [
    scene("beach", "Praia", "a photo of a beach"),
    scene("mountain", "Montanha", "a photo of mountains"),
    scene("snow", "Neve", "a photo of a snowy landscape"),
    scene("forest", "Floresta", "a photo of a forest"),
    scene(
        "countryside",
        "Campo",
        "a photo of fields in the countryside",
    ),
    scene("sea", "Mar", "a photo of the sea"),
    scene("lake", "Lago ou rio", "a photo of a lake or a river"),
    scene("sunset", "Pôr do sol", "a photo of a sunset"),
    scene("night_sky", "Céu noturno", "a photo of the night sky"),
    scene("desert", "Deserto", "a photo of a desert"),
    scene("city", "Cidade", "a photo of a city street"),
    scene("city_night", "Cidade à noite", "a photo of a city at night"),
    scene("building", "Arquitetura", "a photo of a building"),
    scene("church", "Igreja", "a photo of a church"),
    scene(
        "indoor",
        "Ambiente interno",
        "a photo of a room inside a house",
    ),
    scene("food", "Comida", "a photo of food"),
    scene("dog", "Cachorro", "a photo of a dog"),
    scene("cat", "Gato", "a photo of a cat"),
    scene("bird", "Pássaro", "a photo of a bird"),
    scene("flowers", "Flores", "a photo of flowers"),
    scene("car", "Carro", "a photo of a car"),
    scene("people", "Pessoas", "a photo of a group of people"),
    scene("portrait", "Retrato", "a portrait photo of a person"),
    scene("baby", "Bebê", "a photo of a baby"),
    scene("party", "Festa", "a photo of a party"),
    scene("sport", "Esporte", "a photo of people playing sports"),
];

/// CLIP's logit scale: sharpens the softmax over scenes.
const LOGIT_SCALE: f32 = 100.0;
/// A chip needs this share of the softmax…
pub const MIN_SHARE: f32 = 0.2;
/// …and this raw similarity (a photo of nothing listed still sums to 100 %).
pub const MIN_SIMILARITY: f32 = 0.2;
const MAX_CHIPS: usize = 3;

#[derive(Debug, Clone, PartialEq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SceneScore {
    pub value: String,
    pub label: String,
    /// 0–1: share among the scenes.
    pub score: f32,
}

/// Softmax share and raw similarity of each scene.
pub fn scores(image: &[f32], scenes: &[Vec<f32>]) -> Vec<(f32, f32)> {
    let sims: Vec<f32> = scenes.iter().map(|s| dot(image, s)).collect();
    let max = sims.iter().copied().fold(f32::MIN, f32::max);
    let exp: Vec<f32> = sims
        .iter()
        .map(|s| ((s - max) * LOGIT_SCALE).exp())
        .collect();
    let sum: f32 = exp.iter().sum();
    exp.iter().zip(&sims).map(|(e, &s)| (e / sum, s)).collect()
}

/// The chips of a photo, most likely first.
pub fn chips(image: &[f32], scenes: &[Vec<f32>]) -> Vec<SceneScore> {
    let mut out: Vec<SceneScore> = scores(image, scenes)
        .into_iter()
        .zip(&SCENES)
        .filter(|((share, sim), _)| *share >= MIN_SHARE && *sim >= MIN_SIMILARITY)
        .map(|((share, _), s)| SceneScore {
            value: s.value.to_string(),
            label: s.label.to_string(),
            score: share,
        })
        .collect();
    out.sort_by(|a, b| b.score.total_cmp(&a.score));
    out.truncate(MAX_CHIPS);
    out
}
