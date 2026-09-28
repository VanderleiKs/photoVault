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
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: Theme::Light,
            active_library_id: None,
            io_concurrency: 2,
            cpu_concurrency: 0,
            analysis: AnalysisSettings::default(),
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
        let _ = std::fs::remove_dir_all(dir);
    }
}
