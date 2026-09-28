//! Persistence of the analysis: per-item results (stage `analyze`) and the global,
//! per-library pass that derives flags, labels and groups with the current thresholds.

use super::classify::{self, MediaFacts};
use super::grouping::{self, Candidate, GroupKind};
use super::metrics::{self, ImageMetrics};
use crate::catalog::AnalysisSettings;
use crate::error::Result;
use crate::thumbnails;
use chrono::{NaiveDateTime, Utc};
use sqlx::{Sqlite, SqlitePool};
use std::path::Path;

/// Labels written by the analysis (dimension, value).
pub const SCREENSHOT: (&str, &str) = ("category", "screenshot");
pub const WHATSAPP: (&str, &str) = ("category", "whatsapp");
/// Scores below this are not stored at all (keeps `media_labels` small).
const MIN_STORED_SCORE: f64 = 0.3;

/// What the `analyze` job needs from the catalog.
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct AnalyzeInput {
    pub media_id: String,
    pub library_id: String,
    pub filename: String,
    pub relative_path: String,
    pub extension: String,
    pub width: Option<i64>,
    pub height: Option<i64>,
    pub camera_model: Option<String>,
    pub camera_make: Option<String>,
}

#[derive(Debug, Clone)]
pub struct Analysis {
    pub metrics: ImageMetrics,
    /// DCT pHash of the preview (hex).
    pub phash: String,
    /// (dimension, value, score)
    pub labels: Vec<(&'static str, &'static str, f64)>,
}

impl AnalyzeInput {
    fn facts(&self) -> MediaFacts<'_> {
        MediaFacts {
            filename: &self.filename,
            relative_path: &self.relative_path,
            extension: &self.extension,
            width: self.width.and_then(|w| u32::try_from(w).ok()),
            height: self.height.and_then(|h| u32::try_from(h).ok()),
            has_camera: self.camera_model.is_some() || self.camera_make.is_some(),
        }
    }

    fn megapixels(&self) -> Option<f64> {
        Some(self.width? as f64 * self.height? as f64 / 1_000_000.0)
    }
}

/// Blocking: decode the 1024 px preview and run the heuristics.
pub fn compute(
    thumbnails_dir: &Path,
    input: &AnalyzeInput,
    t: &AnalysisSettings,
) -> std::result::Result<Analysis, String> {
    let path = thumbnails::path(thumbnails_dir, &input.media_id, thumbnails::PREVIEW_SIZE);
    let bytes = std::fs::read(&path).map_err(|e| format!("Pré-visualização indisponível: {e}"))?;
    let img = image::load_from_memory_with_format(&bytes, image::ImageFormat::WebP)
        .map_err(|e| format!("Pré-visualização ilegível: {e}"))?;
    let metrics = metrics::measure(&img);
    let phash = metrics::perceptual_hash(&img);
    let facts = input.facts();

    let mut labels = Vec::new();
    let screenshot = classify::screenshot_score(&facts, &metrics);
    if screenshot >= MIN_STORED_SCORE {
        labels.push((SCREENSHOT.0, SCREENSHOT.1, screenshot));
    }
    for (kind, score) in classify::momentary(&facts, &metrics, t) {
        if score >= MIN_STORED_SCORE {
            labels.push(("momentary", kind.as_str(), score));
        }
    }
    if classify::is_whatsapp(&input.filename) {
        labels.push((WHATSAPP.0, WHATSAPP.1, 1.0));
    }
    Ok(Analysis {
        metrics,
        phash,
        labels,
    })
}

/// Store the result of one item (raw metrics + automatic labels) and mark its library.
pub async fn store(
    pool: &SqlitePool,
    input: &AnalyzeInput,
    analysis: &Analysis,
    t: &AnalysisSettings,
) -> Result<()> {
    let m = &analysis.metrics;
    // Focus and exposure describe photos; screen captures get no quality verdict.
    let is_screenshot = analysis
        .labels
        .iter()
        .any(|&(d, v, score)| (d, v) == SCREENSHOT && score >= t.screenshot_threshold);
    let (level, flags) = match is_screenshot {
        true => (None, Vec::new()),
        false => {
            let (level, flags) = classify::quality(m, input.megapixels(), t);
            (Some(level), flags)
        }
    };
    let now = Utc::now().to_rfc3339();
    let mut tx = pool.begin().await?;
    sqlx::query(
        "INSERT INTO media_quality (media_id, sharpness, brightness, clipped_high, clipped_low, megapixels,
                                    level, flags, analyzed_at, contrast, entropy, saturation, colors_90, edge_density,
                                    highlights)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
         ON CONFLICT (media_id) DO UPDATE SET
            sharpness = excluded.sharpness, brightness = excluded.brightness,
            clipped_high = excluded.clipped_high, clipped_low = excluded.clipped_low,
            megapixels = excluded.megapixels, level = excluded.level, flags = excluded.flags,
            analyzed_at = excluded.analyzed_at, contrast = excluded.contrast, entropy = excluded.entropy,
            saturation = excluded.saturation, colors_90 = excluded.colors_90,
            edge_density = excluded.edge_density, highlights = excluded.highlights",
    )
    .bind(&input.media_id)
    .bind(m.sharpness)
    .bind(m.brightness)
    .bind(m.clipped_high)
    .bind(m.clipped_low)
    .bind(input.megapixels())
    .bind(level.map(|l| l.as_str()))
    .bind(flags_json(&flags))
    .bind(&now)
    .bind(m.contrast)
    .bind(m.entropy)
    .bind(m.saturation)
    .bind(i64::from(m.colors_90))
    .bind(m.edge_density)
    .bind(m.highlights)
    .execute(&mut *tx)
    .await?;

    sqlx::query("UPDATE media SET phash = ?1 WHERE id = ?2")
        .bind(&analysis.phash)
        .bind(&input.media_id)
        .execute(&mut *tx)
        .await?;
    sqlx::query("DELETE FROM media_labels WHERE media_id = ?1 AND source = 'auto'")
        .bind(&input.media_id)
        .execute(&mut *tx)
        .await?;
    for &(dimension, value, score) in &analysis.labels {
        let label_id = label_id(&mut tx, dimension, value).await?;
        sqlx::query(
            "INSERT INTO media_labels (media_id, label_id, score, source, active) VALUES (?1, ?2, ?3, 'auto', ?4)
             ON CONFLICT (media_id, label_id) DO NOTHING",
        )
        .bind(&input.media_id)
        .bind(label_id)
        .bind(score)
        .bind(label_active(dimension, value, score, t))
        .execute(&mut *tx)
        .await?;
    }
    mark_dirty(&mut *tx, &input.library_id).await?;
    tx.commit().await?;
    Ok(())
}

fn flags_json(flags: &[classify::QualityFlag]) -> String {
    serde_json::to_string(&flags.iter().map(|f| f.as_str()).collect::<Vec<_>>())
        .unwrap_or_else(|_| "[]".into())
}

fn label_active(dimension: &str, value: &str, score: f64, t: &AnalysisSettings) -> bool {
    match (dimension, value) {
        ("category", "screenshot") => score >= t.screenshot_threshold,
        ("momentary", _) => score >= t.momentary_threshold,
        _ => true,
    }
}

pub(crate) async fn label_id(
    tx: &mut sqlx::Transaction<'_, Sqlite>,
    dimension: &str,
    value: &str,
) -> Result<i64> {
    sqlx::query("INSERT INTO labels (dimension, value) VALUES (?1, ?2) ON CONFLICT DO NOTHING")
        .bind(dimension)
        .bind(value)
        .execute(&mut **tx)
        .await?;
    Ok(
        sqlx::query_scalar("SELECT id FROM labels WHERE dimension = ?1 AND value = ?2")
            .bind(dimension)
            .bind(value)
            .fetch_one(&mut **tx)
            .await?,
    )
}

pub async fn mark_dirty<'e, E>(executor: E, library_id: &str) -> Result<()>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query(
        "INSERT INTO analysis_state (library_id, dirty) VALUES (?1, 1)
         ON CONFLICT (library_id) DO UPDATE SET dirty = 1",
    )
    .bind(library_id)
    .execute(executor)
    .await?;
    Ok(())
}

/// Thresholds changed: every library must be recomputed.
pub async fn mark_all_dirty(pool: &SqlitePool) -> Result<()> {
    sqlx::query(
        "INSERT INTO analysis_state (library_id, dirty) SELECT id, 1 FROM libraries WHERE true
         ON CONFLICT (library_id) DO UPDATE SET dirty = 1",
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn dirty_libraries(pool: &SqlitePool) -> Result<Vec<String>> {
    Ok(sqlx::query_scalar(
        "SELECT s.library_id FROM analysis_state s JOIN libraries l ON l.id = s.library_id WHERE s.dirty = 1",
    )
    .fetch_all(pool)
    .await?)
}

/// Global pass for one library: flags and labels with the current thresholds, then
/// duplicate/similar/burst groups. Idempotent; replaces the previous groups.
pub async fn refresh_library(
    pool: &SqlitePool,
    library_id: &str,
    t: &AnalysisSettings,
) -> Result<()> {
    let started = std::time::Instant::now();
    // Clear first so edits made while we work mark it dirty again.
    sqlx::query("UPDATE analysis_state SET dirty = 0 WHERE library_id = ?1")
        .bind(library_id)
        .execute(pool)
        .await?;
    requalify(pool, library_id, t).await?;
    rebuild_groups(pool, library_id, t).await?;
    sqlx::query("UPDATE analysis_state SET analyzed_at = ?1 WHERE library_id = ?2")
        .bind(Utc::now().to_rfc3339())
        .bind(library_id)
        .execute(pool)
        .await?;
    tracing::info!(
        "Analysis of library {library_id} refreshed in {:?}",
        started.elapsed()
    );
    Ok(())
}

#[derive(sqlx::FromRow)]
struct QualityRow {
    media_id: String,
    sharpness: Option<f64>,
    brightness: Option<f64>,
    clipped_high: Option<f64>,
    clipped_low: Option<f64>,
    megapixels: Option<f64>,
    contrast: Option<f64>,
    entropy: Option<f64>,
    highlights: Option<f64>,
    level: Option<String>,
    flags: String,
    screenshot: bool,
}

/// Re-derive flags/level and label activity from the stored raw values.
async fn requalify(pool: &SqlitePool, library_id: &str, t: &AnalysisSettings) -> Result<()> {
    let mut tx = pool.begin().await?;
    // Labels first: whether an item is a screenshot decides whether it gets a quality.
    // Only rows whose state changes are touched (each fires the FTS trigger).
    sqlx::query(
        "UPDATE media_labels SET active = (score >= CASE
             WHEN label_id IN (SELECT id FROM labels WHERE dimension = 'category' AND value = 'screenshot') THEN ?1
             ELSE ?2 END)
         WHERE source = 'auto'
           AND label_id IN (SELECT id FROM labels WHERE (dimension = 'category' AND value = 'screenshot') OR dimension = 'momentary')
           AND media_id IN (SELECT id FROM media WHERE library_id = ?3)
           AND active != (score >= CASE
             WHEN label_id IN (SELECT id FROM labels WHERE dimension = 'category' AND value = 'screenshot') THEN ?1
             ELSE ?2 END)",
    )
    .bind(t.screenshot_threshold)
    .bind(t.momentary_threshold)
    .bind(library_id)
    .execute(&mut *tx)
    .await?;

    let rows: Vec<QualityRow> = sqlx::query_as(
        "SELECT q.media_id, q.sharpness, q.brightness, q.clipped_high, q.clipped_low, q.megapixels,
                q.contrast, q.entropy, q.highlights, q.level, q.flags,
                EXISTS (SELECT 1 FROM media_labels ml JOIN labels l ON l.id = ml.label_id
                        WHERE ml.media_id = q.media_id AND ml.active = 1
                          AND l.dimension = 'category' AND l.value = 'screenshot') AS screenshot
         FROM media_quality q JOIN media m ON m.id = q.media_id
         WHERE m.library_id = ?1",
    )
    .bind(library_id)
    .fetch_all(&mut *tx)
    .await?;
    for r in rows {
        let (level, flags) = if r.screenshot {
            (None, "[]".to_string())
        } else {
            let m = ImageMetrics {
                sharpness: r.sharpness.unwrap_or_default(),
                brightness: r.brightness.unwrap_or_default(),
                clipped_high: r.clipped_high.unwrap_or_default(),
                clipped_low: r.clipped_low.unwrap_or_default(),
                contrast: r.contrast.unwrap_or(50.0),
                entropy: r.entropy.unwrap_or(7.0),
                highlights: r.highlights.unwrap_or(255.0),
                ..Default::default()
            };
            let (level, flags) = classify::quality(&m, r.megapixels, t);
            (Some(level.as_str()), flags_json(&flags))
        };
        if r.level.as_deref() != level || r.flags != flags {
            sqlx::query("UPDATE media_quality SET level = ?1, flags = ?2 WHERE media_id = ?3")
                .bind(level)
                .bind(&flags)
                .bind(&r.media_id)
                .execute(&mut *tx)
                .await?;
        }
    }
    tx.commit().await?;
    Ok(())
}

#[derive(sqlx::FromRow)]
struct CandidateRow {
    id: String,
    sha256: Option<String>,
    phash: Option<String>,
    captured_at: Option<String>,
    camera_model: Option<String>,
    gps_lat: Option<f64>,
    gps_lon: Option<f64>,
    width: Option<i64>,
    height: Option<i64>,
    sharpness: Option<f64>,
    brightness: Option<f64>,
    contrast: Option<f64>,
    entropy: Option<f64>,
    is_favorite: bool,
    file_mtime: Option<String>,
}

async fn rebuild_groups(pool: &SqlitePool, library_id: &str, t: &AnalysisSettings) -> Result<()> {
    let rows: Vec<CandidateRow> = sqlx::query_as(
        "SELECT m.id, m.sha256, m.phash, m.captured_at, m.camera_model, m.gps_lat, m.gps_lon,
                m.width, m.height, q.sharpness, q.brightness, q.contrast, q.entropy, m.is_favorite, m.file_mtime
         FROM media m LEFT JOIN media_quality q ON q.media_id = m.id
         WHERE m.library_id = ?1 AND m.status = 'active' AND m.media_type = 'image'",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?;
    let items: Vec<Candidate> = rows
        .into_iter()
        .map(|r| Candidate {
            // Blank frames all look alike: they are "empty", not duplicates of each other.
            phash: r
                .phash
                .as_deref()
                .and_then(|h| u64::from_str_radix(h, 16).ok())
                .filter(|&h| !metrics::is_degenerate(h))
                .filter(|_| r.contrast.unwrap_or(50.0) >= 6.0 && r.entropy.unwrap_or(7.0) >= 2.0),
            captured_at: r.captured_at.as_deref().and_then(|s| {
                NaiveDateTime::parse_from_str(s.get(..19).unwrap_or(s), "%Y-%m-%dT%H:%M:%S").ok()
            }),
            gps: r.gps_lat.zip(r.gps_lon),
            pixels: (r.width.unwrap_or(0).max(0) as u64) * (r.height.unwrap_or(0).max(0) as u64),
            exposure_error: r.brightness.map(|b| (b - 128.0).abs()),
            id: r.id,
            sha256: r.sha256,
            camera: r.camera_model,
            sharpness: r.sharpness,
            favorite: r.is_favorite,
            file_mtime: r.file_mtime,
        })
        .collect();

    let groups = tokio::task::spawn_blocking({
        let t = t.clone();
        move || {
            let groups = grouping::group(&items, &t);
            (items, groups)
        }
    })
    .await?;
    let (items, groups) = groups;

    let mut tx = pool.begin().await?;
    sqlx::query("DELETE FROM similarity_groups WHERE library_id = ?1")
        .bind(library_id)
        .execute(&mut *tx)
        .await?;
    sqlx::query(
        "UPDATE media SET sequence_id = NULL WHERE library_id = ?1 AND sequence_id IS NOT NULL",
    )
    .bind(library_id)
    .execute(&mut *tx)
    .await?;
    sqlx::query("DELETE FROM sequences WHERE library_id = ?1")
        .bind(library_id)
        .execute(&mut *tx)
        .await?;

    for g in &groups {
        let id = uuid::Uuid::now_v7().to_string();
        let best = &items[g.members[0]].id;
        if g.kind == GroupKind::Sequence {
            let times: Vec<_> = g
                .members
                .iter()
                .filter_map(|&m| items[m].captured_at)
                .collect();
            let fmt = |d: Option<&NaiveDateTime>| {
                d.map(|d| d.format("%Y-%m-%dT%H:%M:%S").to_string())
                    .unwrap_or_default()
            };
            sqlx::query(
                "INSERT INTO sequences (id, library_id, started_at, ended_at, size, best_media_id)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            )
            .bind(&id)
            .bind(library_id)
            .bind(fmt(times.iter().min()))
            .bind(fmt(times.iter().max()))
            .bind(g.members.len() as i64)
            .bind(best)
            .execute(&mut *tx)
            .await?;
            for &m in &g.members {
                sqlx::query("UPDATE media SET sequence_id = ?1 WHERE id = ?2")
                    .bind(&id)
                    .bind(&items[m].id)
                    .execute(&mut *tx)
                    .await?;
            }
            continue;
        }
        let kind = match g.kind {
            GroupKind::ExactDuplicate => "exact_duplicate",
            GroupKind::VisualDuplicate => "visual_duplicate",
            _ => "similar",
        };
        sqlx::query("INSERT INTO similarity_groups (id, library_id, kind, best_media_id) VALUES (?1, ?2, ?3, ?4)")
            .bind(&id)
            .bind(library_id)
            .bind(kind)
            .bind(best)
            .execute(&mut *tx)
            .await?;
        for (&m, &distance) in g.members.iter().zip(&g.distances) {
            sqlx::query(
                "INSERT INTO similarity_members (group_id, media_id, distance) VALUES (?1, ?2, ?3)",
            )
            .bind(&id)
            .bind(&items[m].id)
            .bind(i64::from(distance))
            .execute(&mut *tx)
            .await?;
        }
    }
    tx.commit().await?;
    Ok(())
}
