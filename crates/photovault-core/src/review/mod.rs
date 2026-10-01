//! Review suggestions (PRD §15). Every low-retention signal of the analysis (groups,
//! quality flags, screenshot/momentary labels, the user's examples) becomes one
//! `review_candidates` row per (photo, reason). Rebuilt in the global pass; the user's
//! decisions survive every rebuild. Nothing here touches files (see `crate::trash`).
//!
//! Rules: favorites never become candidates (R5); a photo kept or ignored for a reason is
//! not suggested again for it; the best candidate of a group is never a candidate of it.

pub mod exact;
pub mod examples;

use crate::analysis::store::mark_dirty;
use crate::catalog::media::{self, MediaItem};
use crate::catalog::settings::{AnalysisSettings, AppSettings, ReasonWeights};
use crate::error::{Error, Result};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use std::collections::{HashMap, HashSet};

#[derive(
    Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize, Type,
)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ReviewReason {
    ExactDuplicate,
    VisualDuplicate,
    SimilarSequence,
    Blurry,
    Dark,
    Overexposed,
    LowResolution,
    Screenshot,
    Momentary,
    Accidental,
    LowInformation,
    Example,
}

impl ReviewReason {
    pub const ALL: [ReviewReason; 12] = [
        ReviewReason::ExactDuplicate,
        ReviewReason::VisualDuplicate,
        ReviewReason::SimilarSequence,
        ReviewReason::Blurry,
        ReviewReason::Dark,
        ReviewReason::Overexposed,
        ReviewReason::LowResolution,
        ReviewReason::Screenshot,
        ReviewReason::Momentary,
        ReviewReason::Accidental,
        ReviewReason::LowInformation,
        ReviewReason::Example,
    ];

    pub fn as_str(self) -> &'static str {
        match self {
            ReviewReason::ExactDuplicate => "EXACT_DUPLICATE",
            ReviewReason::VisualDuplicate => "VISUAL_DUPLICATE",
            ReviewReason::SimilarSequence => "SIMILAR_SEQUENCE",
            ReviewReason::Blurry => "BLURRY",
            ReviewReason::Dark => "DARK",
            ReviewReason::Overexposed => "OVEREXPOSED",
            ReviewReason::LowResolution => "LOW_RESOLUTION",
            ReviewReason::Screenshot => "SCREENSHOT",
            ReviewReason::Momentary => "MOMENTARY",
            ReviewReason::Accidental => "ACCIDENTAL",
            ReviewReason::LowInformation => "LOW_INFORMATION",
            ReviewReason::Example => "EXAMPLE",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        Self::ALL.into_iter().find(|r| r.as_str() == s)
    }

    pub fn weight(self, w: &ReasonWeights) -> f64 {
        match self {
            ReviewReason::ExactDuplicate => w.exact_duplicate,
            ReviewReason::VisualDuplicate => w.visual_duplicate,
            ReviewReason::SimilarSequence => w.similar_sequence,
            ReviewReason::Blurry => w.blurry,
            ReviewReason::Dark => w.dark,
            ReviewReason::Overexposed => w.overexposed,
            ReviewReason::LowResolution => w.low_resolution,
            ReviewReason::Screenshot => w.screenshot,
            ReviewReason::Momentary => w.momentary,
            ReviewReason::Accidental => w.accidental,
            ReviewReason::LowInformation => w.low_information,
            ReviewReason::Example => w.example,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum ReviewStatus {
    Pending,
    Kept,
    Ignored,
    Trashed,
}

impl ReviewStatus {
    fn parse(s: &str) -> Self {
        match s {
            "kept" => ReviewStatus::Kept,
            "ignored" => ReviewStatus::Ignored,
            "trashed" => ReviewStatus::Trashed,
            _ => ReviewStatus::Pending,
        }
    }
}

/// What the user decided about the suggestions of some photos.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum Decision {
    /// "Manter": the photo stays, don't suggest it again for these reasons.
    Keep,
    /// "Ignorar sugestão": same effect, recorded as a dismissed suggestion.
    Ignore,
    /// Undo a keep/ignore (history): the suggestion comes back if it still applies.
    Reopen,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ReasonCount {
    pub reason: ReviewReason,
    pub count: u32,
}

#[derive(Debug, Clone, Default, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ReviewSummary {
    /// Photos with at least one pending suggestion.
    pub pending: u32,
    /// Pending suggestions per reason (a photo counts once per reason).
    pub by_reason: Vec<ReasonCount>,
    /// Bytes of the photos to review.
    #[specta(type = specta_typescript::Number)]
    pub pending_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ReviewEntry {
    pub reason: ReviewReason,
    /// 0–1: how sure the heuristic is.
    pub score: f64,
    pub status: ReviewStatus,
    /// Similarity group, burst or example behind it.
    pub group_id: Option<String>,
    /// For `EXAMPLE`: the name of the example it looks like.
    pub example_name: Option<String>,
    pub decided_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ReasonScore {
    pub reason: ReviewReason,
    pub score: f64,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MediaReasons {
    pub media_id: String,
    /// Pending reasons, most important first.
    pub reasons: Vec<ReasonScore>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    pub item: MediaItem,
    pub reason: ReviewReason,
    pub status: ReviewStatus,
    pub decided_at: String,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct HistoryPage {
    pub entries: Vec<HistoryEntry>,
    pub next_cursor: Option<String>,
}

/// (photo, reason) → (score, group/burst/example id)
type Found = HashMap<(String, ReviewReason), (f64, Option<String>)>;

/// Burst shots are alike on purpose: less sure than a duplicate.
const SEQUENCE_SCORE: f64 = 0.7;
const MAX_HISTORY_PAGE: u32 = 200;

/// Combined priority (0–1000) of a photo's pending reasons: the chance that at least
/// one of them is right, each weighted by the user's setting. `None` = nothing pending.
pub fn priority(
    reasons: impl IntoIterator<Item = (ReviewReason, f64)>,
    w: &ReasonWeights,
) -> Option<i64> {
    let mut keep = 1.0;
    let mut any = false;
    for (reason, score) in reasons {
        let x = (reason.weight(w) * score).clamp(0.0, 1.0);
        if x > 0.0 {
            any = true;
            keep *= 1.0 - x;
        }
    }
    any.then(|| (((1.0 - keep) * 1000.0).round() as i64).max(1))
}

/// Raw quality values of one photo (see `media_quality`).
#[derive(Debug, Clone, Default, sqlx::FromRow)]
pub struct QualityValues {
    pub media_id: String,
    pub flags: String,
    pub sharpness: Option<f64>,
    pub brightness: Option<f64>,
    pub clipped_high: Option<f64>,
    pub megapixels: Option<f64>,
}

/// Reasons from the quality flags, scored by how far past the threshold the photo is.
pub fn quality_reasons(q: &QualityValues, t: &AnalysisSettings) -> Vec<(ReviewReason, f64)> {
    let past = |x: f64| 0.5 + 0.5 * x.clamp(0.0, 1.0);
    let flags: Vec<String> = serde_json::from_str(&q.flags).unwrap_or_default();
    flags
        .iter()
        .filter_map(|flag| match flag.as_str() {
            "blurry" => Some((
                ReviewReason::Blurry,
                past(1.0 - q.sharpness.unwrap_or(0.0) / t.blur_threshold.max(1e-6)),
            )),
            "dark" => Some((
                ReviewReason::Dark,
                past(1.0 - q.brightness.unwrap_or(0.0) / t.dark_threshold.max(1e-6)),
            )),
            "overexposed" => Some((
                ReviewReason::Overexposed,
                past(
                    (q.clipped_high.unwrap_or(1.0) - t.overexposed_fraction)
                        / (1.0 - t.overexposed_fraction).max(1e-6),
                ),
            )),
            "low_res" => Some((
                ReviewReason::LowResolution,
                past(1.0 - q.megapixels.unwrap_or(0.0) / t.min_megapixels.max(1e-6)),
            )),
            "empty" => Some((ReviewReason::LowInformation, 0.9)),
            _ => None,
        })
        .collect()
}

/// Recompute the suggestions of a library from the current analysis (global pass,
/// after the groups). Idempotent.
pub async fn rebuild(pool: &SqlitePool, library_id: &str, s: &AppSettings) -> Result<()> {
    let (t, w) = (&s.analysis, &s.review.weights);
    let mut found: Found = HashMap::new();
    let mut add = |id: String, reason: ReviewReason, score: f64, group: Option<String>| {
        if reason.weight(w) <= 0.0 {
            return;
        }
        let entry = found.entry((id, reason)).or_insert((score, group.clone()));
        if score > entry.0 {
            *entry = (score, group);
        }
    };

    // 1. Duplicates: every member but the best.
    let members: Vec<(String, String, String, String, i64)> = sqlx::query_as(
        "SELECT g.id, g.kind, g.best_media_id, s.media_id, s.distance
         FROM similarity_groups g JOIN similarity_members s ON s.group_id = g.id
         WHERE g.library_id = ?1 AND g.kind IN ('exact_duplicate', 'visual_duplicate')",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?;
    for (group, kind, best, media, distance) in members {
        if media == best {
            continue;
        }
        if kind == "exact_duplicate" {
            add(media, ReviewReason::ExactDuplicate, 1.0, Some(group));
        } else {
            let closeness = 1.0 - distance as f64 / f64::from(t.visual_distance + 1);
            add(
                media,
                ReviewReason::VisualDuplicate,
                0.7 + 0.3 * closeness,
                Some(group),
            );
        }
    }

    // 2. Bursts: every shot but the best.
    let shots: Vec<(String, String, Option<String>)> = sqlx::query_as(
        "SELECT m.id, s.id, s.best_media_id FROM media m JOIN sequences s ON s.id = m.sequence_id
         WHERE s.library_id = ?1",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?;
    for (media, sequence, best) in shots {
        if best.as_deref() != Some(media.as_str()) {
            add(
                media,
                ReviewReason::SimilarSequence,
                SEQUENCE_SCORE,
                Some(sequence),
            );
        }
    }

    // 3. Technical quality.
    let quality: Vec<QualityValues> = sqlx::query_as(
        "SELECT q.media_id, q.flags, q.sharpness, q.brightness, q.clipped_high, q.megapixels
         FROM media_quality q JOIN media m ON m.id = q.media_id
         WHERE m.library_id = ?1 AND q.flags != '[]'",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?;
    for q in &quality {
        for (reason, score) in quality_reasons(q, t) {
            add(q.media_id.clone(), reason, score, None);
        }
    }

    // 4. Screenshots and momentary photos (labels above their threshold).
    let labels: Vec<(String, String, f64)> = sqlx::query_as(
        "SELECT ml.media_id, l.value, ml.score
         FROM media_labels ml JOIN labels l ON l.id = ml.label_id JOIN media m ON m.id = ml.media_id
         WHERE m.library_id = ?1 AND ml.active = 1 AND ml.source = 'auto'
           AND ((l.dimension = 'category' AND l.value = 'screenshot') OR l.dimension = 'momentary')",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?;
    for (media, value, score) in labels {
        let reason = match value.as_str() {
            "screenshot" => ReviewReason::Screenshot,
            "accidental" => ReviewReason::Accidental,
            _ => ReviewReason::Momentary,
        };
        add(media, reason, score, None);
    }

    // 5. Like the user's examples.
    for (media, example, score) in
        examples::matches(pool, library_id, s.review.example_similarity).await?
    {
        add(media, ReviewReason::Example, score, Some(example));
    }

    // Only active photos that aren't favorites (R5).
    let eligible: HashSet<String> = sqlx::query_scalar(
        "SELECT id FROM media WHERE library_id = ?1 AND status = 'active'
           AND media_type = 'image' AND is_favorite = 0",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?
    .into_iter()
    .collect();
    found.retain(|(id, _), _| eligible.contains(id));
    persist(pool, library_id, found, w).await
}

async fn persist(
    pool: &SqlitePool,
    library_id: &str,
    found: Found,
    w: &ReasonWeights,
) -> Result<()> {
    let existing: Vec<(String, String, String, f64, Option<String>)> = sqlx::query_as(
        "SELECT media_id, reason, status, score, group_id FROM review_candidates WHERE library_id = ?1",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?;
    let mut known: HashMap<(String, ReviewReason), (String, f64, Option<String>)> = HashMap::new();
    for (media, reason, status, score, group) in existing {
        if let Some(reason) = ReviewReason::parse(&reason) {
            known.insert((media, reason), (status, score, group));
        }
    }

    let now = Utc::now().to_rfc3339();
    let mut tx = pool.begin().await?;
    // Pending suggestions that no longer apply go away; decisions stay (history).
    for ((media, reason), (status, ..)) in &known {
        if status == "pending" && !found.contains_key(&(media.clone(), *reason)) {
            sqlx::query("DELETE FROM review_candidates WHERE media_id = ?1 AND reason = ?2")
                .bind(media)
                .bind(reason.as_str())
                .execute(&mut *tx)
                .await?;
        }
    }
    for ((media, reason), (score, group)) in &found {
        match known.get(&(media.clone(), *reason)) {
            // Decided: never re-suggested for the same reason.
            Some((status, ..)) if status != "pending" => continue,
            Some((_, old_score, old_group))
                if (old_score - score).abs() < 1e-9 && old_group == group =>
            {
                continue;
            }
            _ => {}
        }
        sqlx::query(
            "INSERT INTO review_candidates (id, library_id, media_id, reason, score, group_id, status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'pending', ?7)
             ON CONFLICT (media_id, reason) DO UPDATE SET score = excluded.score, group_id = excluded.group_id",
        )
        .bind(uuid::Uuid::now_v7().to_string())
        .bind(library_id)
        .bind(media)
        .bind(reason.as_str())
        .bind(score)
        .bind(group)
        .bind(&now)
        .execute(&mut *tx)
        .await?;
    }
    update_priorities(&mut tx, library_id, None, w).await?;
    tx.commit().await?;
    Ok(())
}

/// Recompute `media.review_priority` of a library (or only of `only`) from its pending
/// suggestions. Touches only rows whose value changes.
async fn update_priorities(
    tx: &mut sqlx::Transaction<'_, Sqlite>,
    library_id: &str,
    only: Option<&[String]>,
    w: &ReasonWeights,
) -> Result<()> {
    let pending: Vec<(String, String, f64)> = sqlx::query_as(
        "SELECT media_id, reason, score FROM review_candidates WHERE library_id = ?1 AND status = 'pending'",
    )
    .bind(library_id)
    .fetch_all(&mut **tx)
    .await?;
    let mut by_media: HashMap<String, Vec<(ReviewReason, f64)>> = HashMap::new();
    for (media, reason, score) in pending {
        if let Some(reason) = ReviewReason::parse(&reason) {
            by_media.entry(media).or_default().push((reason, score));
        }
    }
    let target: HashMap<String, i64> = by_media
        .into_iter()
        .filter_map(|(media, reasons)| priority(reasons, w).map(|p| (media, p)))
        .collect();
    let current: HashMap<String, i64> = sqlx::query_as::<_, (String, i64)>(
        "SELECT id, review_priority FROM media WHERE library_id = ?1 AND review_priority IS NOT NULL",
    )
    .bind(library_id)
    .fetch_all(&mut **tx)
    .await?
    .into_iter()
    .collect();
    let only: Option<HashSet<&String>> = only.map(|ids| ids.iter().collect());
    let wanted = |id: &String| only.as_ref().is_none_or(|ids| ids.contains(id));

    for (id, old) in &current {
        if wanted(id) && !target.contains_key(id) {
            set_priority(tx, id, None).await?;
        } else if let Some(&new) = target.get(id)
            && new != *old
            && wanted(id)
        {
            set_priority(tx, id, Some(new)).await?;
        }
    }
    for (id, &new) in &target {
        if wanted(id) && !current.contains_key(id) {
            set_priority(tx, id, Some(new)).await?;
        }
    }
    Ok(())
}

async fn set_priority(
    tx: &mut sqlx::Transaction<'_, Sqlite>,
    media_id: &str,
    priority: Option<i64>,
) -> Result<()> {
    sqlx::query("UPDATE media SET review_priority = ?1 WHERE id = ?2")
        .bind(priority)
        .bind(media_id)
        .execute(&mut **tx)
        .await?;
    Ok(())
}

/// Apply a decision to the suggestions of `ids` (all their reasons, or only `reason`).
/// Returns how many suggestions changed.
pub async fn decide(
    pool: &SqlitePool,
    ids: &[String],
    decision: Decision,
    reason: Option<ReviewReason>,
    w: &ReasonWeights,
) -> Result<u32> {
    if ids.is_empty() {
        return Ok(0);
    }
    let libraries = libraries_of(pool, ids).await?;
    let now = Utc::now().to_rfc3339();
    let mut changed = 0;
    let mut tx = pool.begin().await?;
    for chunk in ids.chunks(500) {
        let mut qb = QueryBuilder::<Sqlite>::new("UPDATE review_candidates SET ");
        match decision {
            Decision::Keep | Decision::Ignore => {
                qb.push("status = ")
                    .push_bind(if decision == Decision::Keep {
                        "kept"
                    } else {
                        "ignored"
                    })
                    .push(", decided_at = ")
                    .push_bind(now.clone())
                    .push(" WHERE status = 'pending'");
            }
            Decision::Reopen => {
                qb.push(
                    "status = 'pending', decided_at = NULL WHERE status IN ('kept', 'ignored')",
                );
            }
        }
        if let Some(reason) = reason {
            qb.push(" AND reason = ").push_bind(reason.as_str());
        }
        qb.push(" AND media_id IN (");
        let mut list = qb.separated(", ");
        for id in chunk {
            list.push_bind(id.clone());
        }
        qb.push(")");
        changed += qb.build().execute(&mut *tx).await?.rows_affected() as u32;
    }
    for library_id in &libraries {
        update_priorities(&mut tx, library_id, Some(ids), w).await?;
        if decision == Decision::Reopen {
            // Re-derive: a reopened suggestion that no longer applies disappears.
            mark_dirty(&mut *tx, library_id).await?;
        }
    }
    tx.commit().await?;
    Ok(changed)
}

/// Mark the pending suggestions of trashed photos (called by `trash`), or turn the
/// "trashed" ones back into "kept" when a photo is restored.
pub(crate) async fn on_trash<'e, E>(executor: E, media_id: &str, restored: bool) -> Result<()>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let sql = if restored {
        "UPDATE review_candidates SET status = 'kept', decided_at = ?1 WHERE media_id = ?2 AND status = 'trashed'"
    } else {
        "UPDATE review_candidates SET status = 'trashed', decided_at = ?1 WHERE media_id = ?2 AND status = 'pending'"
    };
    sqlx::query(sql)
        .bind(Utc::now().to_rfc3339())
        .bind(media_id)
        .execute(executor)
        .await?;
    Ok(())
}

async fn libraries_of(pool: &SqlitePool, ids: &[String]) -> Result<Vec<String>> {
    let mut libraries: Vec<String> = media::get_many(pool, ids)
        .await?
        .into_iter()
        .map(|m| m.library_id)
        .collect();
    libraries.sort();
    libraries.dedup();
    Ok(libraries)
}

pub async fn summary(pool: &SqlitePool, library_id: &str) -> Result<ReviewSummary> {
    let rows: Vec<(String, i64)> = sqlx::query_as(
        "SELECT c.reason, COUNT(*) FROM review_candidates c JOIN media m ON m.id = c.media_id
         WHERE c.library_id = ?1 AND c.status = 'pending' AND m.status = 'active'
         GROUP BY c.reason",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?;
    let (pending, bytes): (i64, Option<i64>) = sqlx::query_as(
        "SELECT COUNT(*), SUM(file_size) FROM media
         WHERE library_id = ?1 AND status = 'active' AND review_priority IS NOT NULL",
    )
    .bind(library_id)
    .fetch_one(pool)
    .await?;
    let mut by_reason: Vec<ReasonCount> = rows
        .into_iter()
        .filter_map(|(reason, count)| {
            Some(ReasonCount {
                reason: ReviewReason::parse(&reason)?,
                count: count as u32,
            })
        })
        .collect();
    by_reason.sort_by_key(|r| r.reason);
    Ok(ReviewSummary {
        pending: pending as u32,
        by_reason,
        pending_bytes: bytes.unwrap_or(0).max(0) as u64,
    })
}

/// (reason, score, status, group, example name, decided at)
type EntryRow = (
    String,
    f64,
    String,
    Option<String>,
    Option<String>,
    Option<String>,
);

/// Every suggestion of one photo, decided or not (info panel).
pub async fn for_media(pool: &SqlitePool, media_id: &str) -> Result<Vec<ReviewEntry>> {
    let rows: Vec<EntryRow> = sqlx::query_as(
        "SELECT c.reason, c.score, c.status, c.group_id, e.name, c.decided_at
             FROM review_candidates c
             LEFT JOIN review_examples e ON c.reason = 'EXAMPLE' AND e.id = c.group_id
             WHERE c.media_id = ?1",
    )
    .bind(media_id)
    .fetch_all(pool)
    .await?;
    let mut entries: Vec<ReviewEntry> = rows
        .into_iter()
        .filter_map(
            |(reason, score, status, group_id, example_name, decided_at)| {
                Some(ReviewEntry {
                    reason: ReviewReason::parse(&reason)?,
                    score,
                    status: ReviewStatus::parse(&status),
                    group_id,
                    example_name,
                    decided_at,
                })
            },
        )
        .collect();
    entries.sort_by_key(|e| (e.status != ReviewStatus::Pending, e.reason));
    Ok(entries)
}

/// Pending reasons of several photos (chips on the Review tiles).
pub async fn pending_reasons(
    pool: &SqlitePool,
    ids: &[String],
    w: &ReasonWeights,
) -> Result<Vec<MediaReasons>> {
    let mut by_media: HashMap<String, Vec<ReasonScore>> = HashMap::new();
    for chunk in ids.chunks(500) {
        let mut qb = QueryBuilder::<Sqlite>::new(
            "SELECT media_id, reason, score FROM review_candidates WHERE status = 'pending' AND media_id IN (",
        );
        let mut list = qb.separated(", ");
        for id in chunk {
            list.push_bind(id.clone());
        }
        qb.push(")");
        let rows: Vec<(String, String, f64)> = qb.build_query_as().fetch_all(pool).await?;
        for (media, reason, score) in rows {
            if let Some(reason) = ReviewReason::parse(&reason) {
                by_media
                    .entry(media)
                    .or_default()
                    .push(ReasonScore { reason, score });
            }
        }
    }
    Ok(by_media
        .into_iter()
        .map(|(media_id, mut reasons)| {
            reasons.sort_by(|a, b| {
                (b.reason.weight(w) * b.score).total_cmp(&(a.reason.weight(w) * a.score))
            });
            MediaReasons { media_id, reasons }
        })
        .collect())
}

/// Decisions, newest first (keyset on decided_at + id).
pub async fn history(
    pool: &SqlitePool,
    library_id: &str,
    cursor: Option<&str>,
    limit: u32,
) -> Result<HistoryPage> {
    let limit = limit.clamp(1, MAX_HISTORY_PAGE);
    let mut qb = QueryBuilder::<Sqlite>::new(
        "SELECT id, media_id, reason, status, decided_at FROM review_candidates
         WHERE library_id = ",
    );
    qb.push_bind(library_id.to_string())
        .push(" AND decided_at IS NOT NULL");
    if let Some(cursor) = cursor {
        let (at, id) = cursor
            .split_once('|')
            .ok_or_else(|| Error::InvalidInput("Cursor de paginação inválido.".into()))?;
        qb.push(" AND (decided_at, id) < (")
            .push_bind(at.to_string())
            .push(", ")
            .push_bind(id.to_string())
            .push(")");
    }
    qb.push(" ORDER BY decided_at DESC, id DESC LIMIT ")
        .push_bind(i64::from(limit) + 1);
    let mut rows: Vec<(String, String, String, String, String)> =
        qb.build_query_as().fetch_all(pool).await?;
    let has_more = rows.len() > limit as usize;
    rows.truncate(limit as usize);
    let next_cursor = has_more
        .then(|| rows.last().map(|r| format!("{}|{}", r.4, r.0)))
        .flatten();

    let ids: Vec<String> = rows.iter().map(|r| r.1.clone()).collect();
    let items: HashMap<String, MediaItem> = media::get_many(pool, &ids)
        .await?
        .into_iter()
        .map(|m| (m.id.clone(), m))
        .collect();
    let entries = rows
        .into_iter()
        .filter_map(|(_, media_id, reason, status, decided_at)| {
            Some(HistoryEntry {
                item: items.get(&media_id)?.clone(),
                reason: ReviewReason::parse(&reason)?,
                status: ReviewStatus::parse(&status),
                decided_at,
            })
        })
        .collect();
    Ok(HistoryPage {
        entries,
        next_cursor,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn priority_combines_reasons_with_weights() {
        let w = ReasonWeights::default();
        assert_eq!(priority([], &w), None);
        assert_eq!(
            priority([(ReviewReason::ExactDuplicate, 1.0)], &w),
            Some(1000)
        );
        let blurry = priority([(ReviewReason::Blurry, 0.5)], &w).unwrap();
        let both = priority([(ReviewReason::Blurry, 0.5), (ReviewReason::Dark, 0.5)], &w).unwrap();
        assert!(both > blurry, "two reasons weigh more than one");
        let off = ReasonWeights {
            blurry: 0.0,
            ..Default::default()
        };
        assert_eq!(priority([(ReviewReason::Blurry, 1.0)], &off), None);
    }

    #[test]
    fn quality_reasons_scale_with_severity() {
        let t = AnalysisSettings::default();
        let q = |flags: &str, sharpness: f64| QualityValues {
            flags: flags.into(),
            sharpness: Some(sharpness),
            brightness: Some(20.0),
            ..Default::default()
        };
        let mild = quality_reasons(&q(r#"["blurry"]"#, 0.07), &t);
        let bad = quality_reasons(&q(r#"["blurry"]"#, 0.01), &t);
        assert_eq!(mild[0].0, ReviewReason::Blurry);
        assert!(bad[0].1 > mild[0].1 && bad[0].1 <= 1.0 && mild[0].1 >= 0.5);
        let reasons: Vec<_> = quality_reasons(&q(r#"["dark","empty"]"#, 1.0), &t)
            .into_iter()
            .map(|r| r.0)
            .collect();
        assert_eq!(reasons, [ReviewReason::Dark, ReviewReason::LowInformation]);
        assert!(quality_reasons(&q("[]", 1.0), &t).is_empty());
    }

    #[test]
    fn reasons_roundtrip() {
        for r in ReviewReason::ALL {
            assert_eq!(ReviewReason::parse(r.as_str()), Some(r));
            let json = serde_json::to_string(&r).unwrap();
            assert_eq!(json, format!("\"{}\"", r.as_str()));
        }
    }
}
