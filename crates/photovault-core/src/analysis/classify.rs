//! Heuristics of the v1 (no AI): quality flags (PRD §12), screenshots and momentary
//! photos (PRD §14). Pure functions over `ImageMetrics` + catalog metadata.

use super::metrics::ImageMetrics;
use crate::catalog::AnalysisSettings;
use regex::Regex;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::LazyLock;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum QualityFlag {
    Blurry,
    Dark,
    Overexposed,
    LowRes,
    /// Almost no information (blank wall, lens cap, flat colour).
    Empty,
}

impl QualityFlag {
    pub fn as_str(self) -> &'static str {
        match self {
            QualityFlag::Blurry => "blurry",
            QualityFlag::Dark => "dark",
            QualityFlag::Overexposed => "overexposed",
            QualityFlag::LowRes => "low_res",
            QualityFlag::Empty => "empty",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum QualityLevel {
    Low,
    Medium,
    High,
}

impl QualityLevel {
    pub fn as_str(self) -> &'static str {
        match self {
            QualityLevel::Low => "low",
            QualityLevel::Medium => "medium",
            QualityLevel::High => "high",
        }
    }
}

/// 99th-percentile luminance under which a dark photo is underexposed (not a night scene).
const DARK_MAX_HIGHLIGHTS: f64 = 60.0;

/// Technical quality. Never implies personal value (PRD §2): a blurry photo of a
/// loved one is still important; this only feeds suggestions.
pub fn quality(
    m: &ImageMetrics,
    megapixels: Option<f64>,
    t: &AnalysisSettings,
) -> (QualityLevel, Vec<QualityFlag>) {
    let mut flags = Vec::new();
    let empty = m.contrast < 6.0 || m.entropy < 2.0;
    // Underexposed = dark overall *and* no highlights (night scenes with lights are fine).
    let dark = m.brightness < t.dark_threshold && m.highlights < DARK_MAX_HIGHLIGHTS;
    if empty {
        flags.push(QualityFlag::Empty);
    } else if m.sharpness < t.blur_threshold && !dark {
        // Flat or nearly black images have no detail to judge focus by.
        flags.push(QualityFlag::Blurry);
    }
    if dark {
        flags.push(QualityFlag::Dark);
    }
    if m.clipped_high > t.overexposed_fraction || m.brightness > 230.0 {
        flags.push(QualityFlag::Overexposed);
    }
    if megapixels.is_some_and(|mp| mp < t.min_megapixels) {
        flags.push(QualityFlag::LowRes);
    }
    let severe = flags.iter().any(|f| !matches!(f, QualityFlag::LowRes));
    let level = if severe {
        QualityLevel::Low
    } else if !flags.is_empty() || m.sharpness < 2.0 * t.blur_threshold {
        QualityLevel::Medium
    } else {
        QualityLevel::High
    };
    (level, flags)
}

/// Catalog facts the heuristics need besides pixels.
#[derive(Debug, Clone, Default)]
pub struct MediaFacts<'a> {
    pub filename: &'a str,
    pub relative_path: &'a str,
    pub extension: &'a str,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub has_camera: bool,
}

/// Screen resolutions of common phones, tablets and monitors (portrait or landscape).
const SCREENS: &[(u32, u32)] = &[
    // Phones
    (640, 1136),
    (750, 1334),
    (828, 1792),
    (1080, 1920),
    (1080, 2160),
    (1080, 2220),
    (1080, 2280),
    (1080, 2340),
    (1080, 2400),
    (1080, 2408),
    (1125, 2436),
    (1170, 2532),
    (1179, 2556),
    (1242, 2208),
    (1242, 2688),
    (1284, 2778),
    (1290, 2796),
    (1440, 2560),
    (1440, 2960),
    (1440, 3040),
    (1440, 3088),
    (1440, 3120),
    (1440, 3200),
    (720, 1280),
    (720, 1520),
    (720, 1600),
    // Tablets
    (1536, 2048),
    (1620, 2160),
    (1640, 2360),
    (1668, 2224),
    (1668, 2388),
    (2048, 2732),
    (1200, 1920),
    (1600, 2560),
    // Monitors / laptops
    (1280, 720),
    (1280, 800),
    (1280, 1024),
    (1366, 768),
    (1440, 900),
    (1536, 864),
    (1600, 900),
    (1680, 1050),
    (1920, 1080),
    (1920, 1200),
    (2560, 1080),
    (2560, 1440),
    (2560, 1600),
    (2880, 1800),
    (3024, 1964),
    (3440, 1440),
    (3456, 2234),
    (3840, 2160),
    (5120, 2880),
];

static SCREENSHOT_NAME: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)(screenshot|screen[ _-]?shot|captura de tela|captura_de_tela|screencap|^scr_|^ss_|print[ _-]?screen)")
        .expect("valid regex")
});
static SCREENSHOT_FOLDER: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)(^|/)(screenshots?|capturas?( de tela)?|prints?)(/|$)").expect("valid regex")
});
static WHATSAPP: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)-WA\d{3,}").expect("valid regex"));

fn is_screen_size(w: u32, h: u32) -> bool {
    SCREENS
        .iter()
        .any(|&(a, b)| (w, h) == (a, b) || (w, h) == (b, a))
}

/// 0–1: how likely the image is a screen capture (PRD §14).
pub fn screenshot_score(f: &MediaFacts<'_>, m: &ImageMetrics) -> f64 {
    let folder = f
        .relative_path
        .rsplit_once('/')
        .map(|(dir, _)| dir)
        .unwrap_or("");
    let named = SCREENSHOT_NAME.is_match(f.filename) || SCREENSHOT_FOLDER.is_match(folder);
    let screen = matches!((f.width, f.height), (Some(w), Some(h)) if is_screen_size(w, h));
    // Interfaces are made of few flat colours and sharp edges.
    let flat = m.colors_90 > 0 && m.colors_90 < 120;
    let lossless = matches!(f.extension, "png" | "webp" | "gif" | "bmp");

    // A screen-sized image alone is weak evidence (downloaded wallpapers, exports):
    // it needs interface-like content or a lossless format too.
    let mut score: f64 = match (named, screen, f.has_camera) {
        (true, _, false) => 0.85,
        (true, _, true) => 0.4,
        (false, true, false) if lossless => 0.45,
        (false, true, false) => 0.25,
        (false, false, false) if lossless && flat => 0.45,
        _ => 0.0,
    };
    if score > 0.0 && flat {
        score += 0.15;
    }
    if score > 0.0 && lossless {
        score += 0.1;
    }
    score.min(1.0)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum MomentaryKind {
    /// Paper: receipt, document, notes, whiteboard.
    Document,
    /// Probably taken by accident (pocket shot, black frame, extreme blur).
    Accidental,
}

impl MomentaryKind {
    pub fn as_str(self) -> &'static str {
        match self {
            MomentaryKind::Document => "document",
            MomentaryKind::Accidental => "accidental",
        }
    }
}

/// Momentary-photo candidates with a 0–1 score (only kinds with some evidence).
/// Lines of text a photo needs to count as a document.
pub const MIN_TEXT_LINES: u32 = 8;

pub fn momentary(
    f: &MediaFacts<'_>,
    m: &ImageMetrics,
    t: &AnalysisSettings,
) -> Vec<(MomentaryKind, f64)> {
    let mut out = Vec::new();

    // Document: bright, colourless paper with lines of text. Brightness, colour and
    // edges alone also describe people or objects on a white background; the lines of
    // text (`text_lines`) are what a page has and they don't.
    if m.saturation < 0.18
        && m.brightness > 110.0
        && m.contrast > 30.0
        && m.edge_density > 0.04
        && m.text_lines >= MIN_TEXT_LINES
    {
        let mut score = 0.5;
        score += ((0.18 - m.saturation) / 0.18) * 0.15;
        score += (f64::from(m.text_lines - MIN_TEXT_LINES).min(20.0) / 20.0) * 0.25;
        let aspect = match (f.width, f.height) {
            (Some(w), Some(h)) if w > 0 && h > 0 => w.max(h) as f64 / w.min(h) as f64,
            _ => 0.0,
        };
        if (aspect - 1.414).abs() < 0.12 {
            score += 0.1; // A4 / letter
        }
        out.push((MomentaryKind::Document, score.min(1.0)));
    }

    // Accidental: nearly black, or blurred beyond use.
    let very_dark = m.brightness < t.dark_threshold * 0.5;
    let very_blurry = m.sharpness < t.blur_threshold * 0.25 && m.contrast >= 6.0;
    if f.has_camera && (very_dark || very_blurry) {
        let mut score: f64 = 0.5;
        if very_dark {
            score += 0.25;
        }
        if very_blurry {
            score += 0.2;
        }
        if very_dark && very_blurry {
            score += 0.05;
        }
        out.push((MomentaryKind::Accidental, score.min(1.0)));
    }
    out
}

/// Received through WhatsApp ("IMG-20250712-WA0001.jpg"): informative label only.
pub fn is_whatsapp(filename: &str) -> bool {
    WHATSAPP.is_match(filename)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn metrics() -> ImageMetrics {
        ImageMetrics {
            sharpness: 1.5,
            brightness: 120.0,
            highlights: 240.0,
            contrast: 50.0,
            clipped_high: 0.01,
            clipped_low: 0.01,
            entropy: 7.0,
            saturation: 0.35,
            colors_90: 900,
            edge_density: 0.01,
            text_lines: 0,
        }
    }

    fn facts(filename: &str) -> MediaFacts<'_> {
        MediaFacts {
            filename,
            relative_path: filename,
            extension: "jpg",
            width: Some(4032),
            height: Some(3024),
            has_camera: true,
        }
    }

    #[test]
    fn quality_levels() {
        let t = AnalysisSettings::default();
        assert_eq!(
            quality(&metrics(), Some(12.0), &t),
            (QualityLevel::High, vec![])
        );
        let soft = ImageMetrics {
            sharpness: 0.12,
            ..metrics()
        };
        assert_eq!(quality(&soft, Some(12.0), &t).0, QualityLevel::Medium);
        let blurry = ImageMetrics {
            sharpness: 0.02,
            ..metrics()
        };
        assert_eq!(
            quality(&blurry, Some(12.0), &t),
            (QualityLevel::Low, vec![QualityFlag::Blurry])
        );
        let dark = ImageMetrics {
            brightness: 20.0,
            highlights: 40.0,
            ..metrics()
        };
        assert_eq!(
            quality(&dark, None, &t),
            (QualityLevel::Low, vec![QualityFlag::Dark])
        );
        let blown = ImageMetrics {
            clipped_high: 0.4,
            ..metrics()
        };
        assert_eq!(quality(&blown, None, &t).1, vec![QualityFlag::Overexposed]);
        assert_eq!(
            quality(&metrics(), Some(0.3), &t),
            (QualityLevel::Medium, vec![QualityFlag::LowRes])
        );
        // Flat images are "empty", not "blurry".
        let flat = ImageMetrics {
            sharpness: 0.0,
            contrast: 1.0,
            entropy: 0.5,
            ..metrics()
        };
        assert_eq!(quality(&flat, None, &t).1, vec![QualityFlag::Empty]);
    }

    #[test]
    fn screenshots() {
        let ui = ImageMetrics {
            colors_90: 40,
            ..metrics()
        };
        let shot = |filename, path, ext, w, h, camera| MediaFacts {
            filename,
            relative_path: path,
            extension: ext,
            width: Some(w),
            height: Some(h),
            has_camera: camera,
        };
        let t = |f: &MediaFacts<'_>, m: &ImageMetrics| screenshot_score(f, m) >= 0.6;

        assert!(t(
            &shot(
                "Screenshot_20250712-143201.png",
                "Screenshot_20250712-143201.png",
                "png",
                1080,
                2400,
                false
            ),
            &ui
        ));
        assert!(t(
            &shot(
                "Captura de tela 2025-07-12 143201.png",
                "x/Captura de tela 2025-07-12 143201.png",
                "png",
                1366,
                768,
                false
            ),
            &ui
        ));
        assert!(t(
            &shot(
                "IMG_0001.PNG",
                "Pictures/Screenshots/IMG_0001.PNG",
                "png",
                1170,
                2532,
                false
            ),
            &metrics()
        ));
        // Screen-sized, no camera, even without a telling name.
        assert!(t(
            &shot("IMG_0002.PNG", "IMG_0002.PNG", "png", 2532, 1170, false),
            &ui
        ));
        // Screen-sized photo without EXIF (downloaded wallpaper): not enough evidence.
        assert!(!t(
            &shot("wallpaper.jpg", "wallpaper.jpg", "jpg", 3840, 2160, false),
            &metrics()
        ));
        // Camera photos are not screenshots even at a "screen" size.
        assert!(!t(
            &shot("IMG_0003.JPG", "IMG_0003.JPG", "jpg", 1920, 1080, true),
            &metrics()
        ));
        // Regular photo.
        assert!(!t(&facts("IMG_1234.jpg"), &metrics()));
        // Exported graphic without camera, lossless, few colours → weak evidence alone.
        assert!(!t(
            &shot("logo.png", "logo.png", "png", 800, 600, false),
            &metrics()
        ));
        assert!(t(
            &shot("logo.png", "logo.png", "png", 800, 600, false),
            &ui
        ));
    }

    #[test]
    fn momentary_kinds() {
        let t = AnalysisSettings::default();
        let paper = ImageMetrics {
            saturation: 0.05,
            brightness: 190.0,
            contrast: 70.0,
            edge_density: 0.11,
            text_lines: 30,
            ..metrics()
        };
        // Same look without lines of text: a person or an object on a white background.
        let object = ImageMetrics {
            text_lines: 4,
            ..paper
        };
        assert!(momentary(&facts("IMG_3.jpg"), &object, &t).is_empty());
        let a4 = MediaFacts {
            width: Some(2480),
            height: Some(3508),
            ..facts("recibo.jpg")
        };
        let doc = momentary(&a4, &paper, &t);
        assert_eq!(doc[0].0, MomentaryKind::Document);
        assert!(doc[0].1 >= 0.9, "{doc:?}");
        assert!(momentary(&facts("IMG_1.jpg"), &metrics(), &t).is_empty());

        let pocket = ImageMetrics {
            brightness: 8.0,
            highlights: 20.0,
            sharpness: 0.005,
            ..metrics()
        };
        let acc = momentary(&facts("IMG_2.jpg"), &pocket, &t);
        assert_eq!(acc, vec![(MomentaryKind::Accidental, 1.0)]);
        // Night sky from a scanner/export (no camera) is not "accidental".
        let no_camera = MediaFacts {
            has_camera: false,
            ..facts("scan.jpg")
        };
        assert!(momentary(&no_camera, &pocket, &t).is_empty());
    }

    #[test]
    fn whatsapp_names() {
        assert!(is_whatsapp("IMG-20231224-WA0007.jpg"));
        assert!(is_whatsapp("VID-20231224-WA0012.mp4"));
        assert!(!is_whatsapp("IMG_20231224_101112.jpg"));
    }
}
