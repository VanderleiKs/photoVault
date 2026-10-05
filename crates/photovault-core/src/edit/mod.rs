//! "Melhorar fotos" (PRD §29, ADR 009): non-destructive editing.
//!
//! An edit is a *recipe* kept in the catalog; the original file never changes. One
//! renderer ([`pipeline::render`]) serves the live preview, the edited thumbnails and
//! the delivered copies, so what is shown is what is delivered. The automatic layers
//! ([`auto`]) only produce parameters for that renderer, never pixels.

pub mod auto;
pub mod color;
pub mod decode;
pub mod encode;
pub mod pipeline;

#[cfg(test)]
mod tests;

use serde::{Deserialize, Serialize};
use specta::Type;

pub use auto::AutoValues;
pub use decode::Linear;

/// Bumped when a recipe field changes meaning. A recipe from a newer app is read-only.
pub const RECIPE_VERSION: u32 = 1;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct EditRecipe {
    pub version: u32,
    pub auto: AutoOptions,
    pub adjust: Adjust,
    pub geometry: Geometry,
}

impl Default for EditRecipe {
    fn default() -> Self {
        Self {
            version: RECIPE_VERSION,
            auto: AutoOptions::default(),
            adjust: Adjust::default(),
            geometry: Geometry::default(),
        }
    }
}

impl EditRecipe {
    /// The recipe that reproduces the original.
    pub fn neutral() -> Self {
        Self {
            auto: AutoOptions {
                enabled: false,
                ..AutoOptions::default()
            },
            ..Self::default()
        }
    }

    /// Reads a stored recipe. `Err` = written by a newer PhotoVault (keep it untouched).
    pub fn from_json(json: &str) -> crate::Result<Self> {
        let recipe: Self = serde_json::from_str(json)
            .map_err(|e| crate::Error::InvalidInput(format!("receita inválida: {e}")))?;
        if recipe.version > RECIPE_VERSION {
            return Err(crate::Error::InvalidInput(
                "Esta foto foi editada numa versão mais nova do PhotoVault.".into(),
            ));
        }
        Ok(Self {
            version: RECIPE_VERSION,
            ..recipe
        })
    }

    pub fn needs_auto(&self) -> bool {
        self.auto.enabled && self.auto.intensity > 0.0
    }
}

/// The one-click part: an automatic correction plus a style, scaled by the intensity.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct AutoOptions {
    pub enabled: bool,
    pub style: Style,
    /// 0..=1 (the "Intensidade" control).
    pub intensity: f32,
}

impl Default for AutoOptions {
    fn default() -> Self {
        Self {
            enabled: true,
            style: Style::Natural,
            intensity: 1.0,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum Style {
    #[default]
    Natural,
}

/// Fine tuning, always added on top of the automatic values. 0 = unchanged.
/// `exposure` in EV (−5..5); the rest −100..100.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct Adjust {
    pub exposure: f32,
    pub contrast: f32,
    pub highlights: f32,
    pub shadows: f32,
    pub whites: f32,
    pub blacks: f32,
    pub temperature: f32,
    pub tint: f32,
    pub vibrance: f32,
    pub saturation: f32,
    pub sharpen: f32,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct Geometry {
    /// `[x, y, w, h]`, fractions of the upright image. `None` = whole image.
    pub crop: Option<[f32; 4]>,
}

/// Everything the renderer needs, in its own units. Built by [`resolve`].
#[derive(Debug, Clone, PartialEq)]
pub struct Resolved {
    /// Per-channel gains (white balance, luminance-preserving).
    pub gains: [f32; 3],
    /// Exposure, EV.
    pub ev: f32,
    /// Black and white points, linear luminance.
    pub black: f32,
    pub white: f32,
    /// Local tone, EV at the darkest shadows / brightest highlights.
    pub shadows: f32,
    pub highlights: f32,
    /// S-curve strength in display space (−0.5..0.5).
    pub contrast: f32,
    pub vibrance: f32,
    pub saturation: f32,
    /// Unsharp-mask amount at output size (0..1.5).
    pub sharpen: f32,
    pub crop: Option<[f32; 4]>,
}

impl Resolved {
    pub fn identity() -> Self {
        Self {
            gains: [1.0; 3],
            ev: 0.0,
            black: 0.0,
            white: 1.0,
            shadows: 0.0,
            highlights: 0.0,
            contrast: 0.0,
            vibrance: 0.0,
            saturation: 0.0,
            sharpen: 0.0,
            crop: None,
        }
    }

    pub fn is_identity(&self) -> bool {
        *self == Self::identity()
    }
}

/// Combines the automatic values (scaled by the intensity) with the fine tuning.
/// `auto` is ignored when the recipe has the automatic part off.
pub fn resolve(recipe: &EditRecipe, auto: Option<&AutoValues>) -> Resolved {
    let mut r = Resolved::identity();
    if recipe.needs_auto()
        && let Some(a) = auto
    {
        let k = recipe.auto.intensity.clamp(0.0, 1.0);
        r.gains = a.gains.map(|g| g.max(1e-3).powf(k));
        r.ev = a.ev * k;
        r.black = a.black * k;
        r.white = 1.0 + (a.white - 1.0) * k;
        r.shadows = a.shadows * k;
        r.highlights = a.highlights * k;
        let style = auto::style(recipe.auto.style);
        r.contrast = style.contrast * k;
        r.vibrance = style.vibrance * k;
        r.saturation = style.saturation * k;
        r.sharpen = style.sharpen * k;
    }

    let a = &recipe.adjust;
    let unit = |v: f32| v.clamp(-100.0, 100.0) / 100.0;
    // Temperature/tint: ±0.4 EV between red and blue, ±0.25 EV on green.
    let t = unit(a.temperature) * 0.4;
    let g = -unit(a.tint) * 0.25;
    let user = [2f32.powf(t), 2f32.powf(g), 2f32.powf(-t)];
    r.gains = normalize_gains([
        r.gains[0] * user[0],
        r.gains[1] * user[1],
        r.gains[2] * user[2],
    ]);
    r.ev += a.exposure.clamp(-5.0, 5.0);
    r.shadows += unit(a.shadows) * 1.5;
    r.highlights += unit(a.highlights) * 1.5;
    // Blacks: −100 crushes to 2 % linear, +100 lifts by 1 %.
    let b = unit(a.blacks);
    r.black += if b < 0.0 { -b * 0.02 } else { -b * 0.01 };
    // Whites: +100 puts the white point at 70 %, −100 at 140 %.
    let w = unit(a.whites);
    r.white *= if w > 0.0 {
        1.0 - w * 0.3
    } else {
        1.0 - w * 0.4
    };
    r.contrast = (r.contrast + unit(a.contrast) * 0.35).clamp(-0.5, 0.5);
    r.vibrance += unit(a.vibrance) * 0.8;
    r.saturation += unit(a.saturation);
    r.sharpen = (r.sharpen + a.sharpen.clamp(0.0, 100.0) / 100.0).min(1.5);
    r.crop = recipe.geometry.crop;
    r
}

/// Scales gains so a neutral grey keeps its luminance.
pub fn normalize_gains(g: [f32; 3]) -> [f32; 3] {
    let y = color::luminance(g);
    if y <= 0.0 {
        return [1.0; 3];
    }
    g.map(|v| v / y)
}
