//! User preferences, stored as key/value rows in `settings`.

use crate::error::{Error, Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::SqlitePool;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Light,
    Dark,
    System,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: Theme,
    /// Library shown when the app opens.
    pub active_library_id: Option<String>,
    /// Parallel file reads during analysis (2 for USB HDDs, higher for SSDs). Used from phase 2.
    pub io_concurrency: u32,
    /// CPU workers for analysis; 0 = automatic (cores - 1). Used from phase 2.
    pub cpu_concurrency: u32,
    /// Thresholds of the analysis heuristics (PRD §11–14). Absent in older catalogs.
    #[serde(default)]
    pub analysis: AnalysisSettings,
    /// Suggestions and trash (PRD §15–16). Absent before v1.0.
    #[serde(default)]
    pub review: ReviewSettings,
    /// Trips and events (PRD §17). Absent before v1.1.
    #[serde(default)]
    pub events: EventSettings,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: Theme::Light,
            active_library_id: None,
            io_concurrency: 2,
            cpu_concurrency: 0,
            analysis: AnalysisSettings::default(),
            review: ReviewSettings::default(),
            events: EventSettings::default(),
        }
    }
}

/// Applied when groups and flags are recomputed, so changing them never requires
/// re-reading the photos (raw metrics are stored).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct AnalysisSettings {
    /// pHash Hamming distance for "same picture" (resize, recompression). PRD: ≤ 4.
    pub visual_distance: u32,
    /// Colour difference (`metrics::color_distance`) up to which two photos with close
    /// pHashes are still the same picture.
    pub color_distance: f64,
    /// pHash distance for "same scene". PRD: ≤ 12.
    pub similar_distance: u32,
    /// Similar photos must be this close in time.
    pub similar_window_minutes: u32,
    /// Max gap between consecutive shots of a burst.
    pub sequence_gap_seconds: u32,
    pub sequence_min_size: u32,
    /// Local sharpness (see `ImageMetrics::sharpness`) below this = blurry.
    pub blur_threshold: f64,
    /// Mean luminance (0–255) below this = dark.
    pub dark_threshold: f64,
    /// Fraction of blown-out pixels above this = overexposed.
    pub overexposed_fraction: f64,
    pub min_megapixels: f64,
    /// Scores (0–1) from which a photo counts as screenshot / momentary.
    pub screenshot_threshold: f64,
    pub momentary_threshold: f64,
}

impl Default for AnalysisSettings {
    fn default() -> Self {
        Self {
            visual_distance: 4,
            color_distance: 2.0,
            similar_distance: 12,
            similar_window_minutes: 30,
            sequence_gap_seconds: 3,
            sequence_min_size: 3,
            blur_threshold: 0.075,
            dark_threshold: 45.0,
            overexposed_fraction: 0.25,
            min_megapixels: 1.0,
            screenshot_threshold: 0.6,
            momentary_threshold: 0.6,
        }
    }
}

impl AnalysisSettings {
    fn validate(&self) -> Result<()> {
        let ok = self.visual_distance <= 16
            && (0.0..=100.0).contains(&self.color_distance)
            && self.similar_distance <= 24
            && self.visual_distance <= self.similar_distance
            && (1..=24 * 60).contains(&self.similar_window_minutes)
            && (1..=60).contains(&self.sequence_gap_seconds)
            && (2..=50).contains(&self.sequence_min_size)
            && (0.0..=10.0).contains(&self.blur_threshold)
            && (0.0..=255.0).contains(&self.dark_threshold)
            && (0.0..=1.0).contains(&self.overexposed_fraction)
            && (0.0..=100.0).contains(&self.min_megapixels)
            && (0.0..=1.0).contains(&self.screenshot_threshold)
            && (0.0..=1.0).contains(&self.momentary_threshold);
        if ok {
            Ok(())
        } else {
            Err(Error::InvalidInput(
                "Limiar de análise fora do intervalo permitido.".into(),
            ))
        }
    }
}

/// How much each reason weighs in the Review priority (0 = never suggest for it).
/// Suggested levels in the UI: 1 (alta), 0.6 (normal), 0.3 (baixa), 0 (desligado).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct ReasonWeights {
    pub exact_duplicate: f64,
    pub visual_duplicate: f64,
    pub similar_sequence: f64,
    pub blurry: f64,
    pub dark: f64,
    pub overexposed: f64,
    pub low_resolution: f64,
    pub screenshot: f64,
    pub momentary: f64,
    pub accidental: f64,
    pub low_information: f64,
    pub example: f64,
}

impl Default for ReasonWeights {
    fn default() -> Self {
        Self {
            exact_duplicate: 1.0,
            visual_duplicate: 1.0,
            similar_sequence: 0.6,
            blurry: 0.6,
            dark: 0.6,
            overexposed: 0.3,
            low_resolution: 0.3,
            screenshot: 0.6,
            momentary: 0.6,
            accidental: 1.0,
            low_information: 1.0,
            example: 1.0,
        }
    }
}

impl ReasonWeights {
    fn all(&self) -> [f64; 12] {
        [
            self.exact_duplicate,
            self.visual_duplicate,
            self.similar_sequence,
            self.blurry,
            self.dark,
            self.overexposed,
            self.low_resolution,
            self.screenshot,
            self.momentary,
            self.accidental,
            self.low_information,
            self.example,
        ]
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct ReviewSettings {
    pub weights: ReasonWeights,
    /// Similarity (0–1) from which a photo counts as "like" one of the examples.
    pub example_similarity: f64,
    /// Send to the operating system's trash instead of `.photovault-trash` (then it can
    /// only be restored from there).
    pub use_system_trash: bool,
    /// Delete items older than this from the trash on startup; 0 = never (default).
    pub auto_purge_days: u32,
}

impl Default for ReviewSettings {
    fn default() -> Self {
        Self {
            weights: ReasonWeights::default(),
            example_similarity: 0.7,
            use_system_trash: false,
            auto_purge_days: 0,
        }
    }
}

impl ReviewSettings {
    fn validate(&self) -> Result<()> {
        let ok = self.weights.all().iter().all(|w| (0.0..=1.0).contains(w))
            && (0.5..=1.0).contains(&self.example_similarity)
            && self.auto_purge_days <= 3650;
        if ok {
            Ok(())
        } else {
            Err(Error::InvalidInput(
                "Configuração de revisão fora do intervalo permitido.".into(),
            ))
        }
    }
}

/// Thresholds of the trip/event detection (PRD §17).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct EventSettings {
    /// A gap longer than this between two photos starts a new event.
    pub gap_hours: u32,
    /// Farther than this from home (the most photographed place) = away.
    pub trip_min_km: u32,
    /// Away stretches this close in time (nights) belong to the same trip.
    pub trip_join_hours: u32,
    /// Smallest event / trip worth suggesting.
    pub min_event_items: u32,
    pub min_trip_items: u32,
    /// Where the user lives; empty = the place photographed on the most days.
    pub homes: Vec<Home>,
}

/// A place the user calls home: trips are measured from the closest one.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Home {
    /// "Porto Alegre, RS"
    pub name: String,
    #[specta(optional)]
    pub country_code: Option<String>,
    pub lat: f64,
    pub lon: f64,
}

pub const MAX_HOMES: usize = 5;

impl Default for EventSettings {
    fn default() -> Self {
        Self {
            gap_hours: 6,
            trip_min_km: 50,
            trip_join_hours: 48,
            min_event_items: 20,
            min_trip_items: 10,
            homes: Vec::new(),
        }
    }
}

impl EventSettings {
    fn validate(&self) -> Result<()> {
        let ok = (1..=72).contains(&self.gap_hours)
            && (5..=5000).contains(&self.trip_min_km)
            && (self.gap_hours..=240).contains(&self.trip_join_hours)
            && (2..=1000).contains(&self.min_event_items)
            && (2..=1000).contains(&self.min_trip_items)
            && self.homes.len() <= MAX_HOMES
            && self.homes.iter().all(|h| {
                (-90.0..=90.0).contains(&h.lat)
                    && (-180.0..=180.0).contains(&h.lon)
                    && (1..=120).contains(&h.name.trim().chars().count())
            });
        if ok {
            Ok(())
        } else {
            Err(Error::InvalidInput(
                "Configuração de viagens fora do intervalo permitido.".into(),
            ))
        }
    }
}

const KEY: &str = "app";

pub async fn get(pool: &SqlitePool) -> Result<AppSettings> {
    let raw: Option<String> = sqlx::query_scalar("SELECT value FROM settings WHERE key = ?1")
        .bind(KEY)
        .fetch_optional(pool)
        .await?;
    // Unknown/old shapes fall back to defaults instead of breaking startup.
    Ok(raw
        .and_then(|json| serde_json::from_str(&json).ok())
        .unwrap_or_default())
}

pub async fn save(pool: &SqlitePool, settings: &AppSettings) -> Result<AppSettings> {
    if !(1..=32).contains(&settings.io_concurrency) || settings.cpu_concurrency > 64 {
        return Err(Error::InvalidInput(
            "Valores de concorrência fora do intervalo.".into(),
        ));
    }
    settings.analysis.validate()?;
    settings.review.validate()?;
    settings.events.validate()?;
    let json = serde_json::to_string(settings).map_err(|e| Error::Internal(e.to_string()))?;
    sqlx::query(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .bind(KEY)
    .bind(json)
    .execute(pool)
    .await?;
    Ok(settings.clone())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::tests::test_db;

    #[tokio::test]
    async fn defaults_then_roundtrip() {
        let (pool, dir) = test_db().await;
        assert_eq!(get(&pool).await.unwrap(), AppSettings::default());

        let custom = AppSettings {
            theme: Theme::Dark,
            active_library_id: Some("lib".into()),
            io_concurrency: 4,
            cpu_concurrency: 3,
            analysis: AnalysisSettings {
                visual_distance: 6,
                ..Default::default()
            },
            review: ReviewSettings {
                use_system_trash: true,
                ..Default::default()
            },
            events: EventSettings {
                trip_min_km: 80,
                ..Default::default()
            },
        };
        save(&pool, &custom).await.unwrap();
        assert_eq!(get(&pool).await.unwrap(), custom);

        let invalid = AppSettings {
            io_concurrency: 0,
            ..custom.clone()
        };
        assert!(save(&pool, &invalid).await.is_err());
        let invalid = AppSettings {
            analysis: AnalysisSettings {
                visual_distance: 20,
                ..Default::default()
            },
            ..custom.clone()
        };
        assert!(save(&pool, &invalid).await.is_err());

        // Settings saved before phase 4 load with default thresholds.
        let old: AppSettings = serde_json::from_str(
            r#"{"theme":"dark","activeLibraryId":null,"ioConcurrency":2,"cpuConcurrency":0}"#,
        )
        .unwrap();
        assert_eq!(old.analysis, AnalysisSettings::default());
        assert_eq!(old.review, ReviewSettings::default());
        assert_eq!(old.events, EventSettings::default());
        let _ = std::fs::remove_dir_all(dir);
    }
}
