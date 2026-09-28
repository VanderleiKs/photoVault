//! "Organizar" (PRD §11–14): counters, groups and per-item analysis for the UI, and
//! manual tags. Read side of `analysis::store`; nothing here deletes anything.

use super::media::{self, MediaItem};
use crate::analysis::classify::{QualityFlag, QualityLevel};
use crate::error::{Error, Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::SqlitePool;

#[derive(Debug, Clone, Default, PartialEq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct OrganizeCounts {
    /// Groups, and extra copies in them (what could be freed).
    pub exact_groups: u32,
    pub exact_extra: u32,
    pub visual_groups: u32,
    pub visual_extra: u32,
    pub similar_groups: u32,
    pub sequences: u32,
    pub low_quality: u32,
    pub momentary: u32,
    pub screenshots: u32,
    /// Photos analysed / waiting (the counters grow while this is > 0).
    pub analyzed: u32,
    pub pending: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum GroupKind {
    ExactDuplicate,
    VisualDuplicate,
    Similar,
    Sequence,
}

impl GroupKind {
    fn db(self) -> &'static str {
        match self {
            GroupKind::ExactDuplicate => "exact_duplicate",
            GroupKind::VisualDuplicate => "visual_duplicate",
            GroupKind::Similar => "similar",
            GroupKind::Sequence => "sequence",
        }
    }
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GroupMember {
    pub item: MediaItem,
    /// pHash distance to the best candidate.
    pub distance: u32,
    pub quality: Option<QualityLevel>,
    pub sharpness: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MediaGroup {
    pub id: String,
    pub kind: GroupKind,
    /// Best candidate first (`members[0]`).
    pub members: Vec<GroupMember>,
    /// Bytes of the non-best members.
    #[specta(type = specta_typescript::Number)]
    pub extra_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GroupPage {
    pub groups: Vec<MediaGroup>,
    pub total: u32,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LabelInfo {
    /// category | momentary | tag
    pub dimension: String,
    pub value: String,
    pub score: Option<f64>,
    pub manual: bool,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GroupRef {
    pub id: String,
    pub kind: GroupKind,
    pub size: u32,
    pub is_best: bool,
}

/// Everything the info panel shows about an item's analysis.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MediaAnalysis {
    pub analyzed: bool,
    pub quality: Option<QualityLevel>,
    pub flags: Vec<QualityFlag>,
    pub sharpness: Option<f64>,
    pub brightness: Option<f64>,
    /// Active labels only (automatic above threshold, and manual tags).
    pub labels: Vec<LabelInfo>,
    pub groups: Vec<GroupRef>,
}

#[derive(Debug, Clone, Serialize, Type, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct TagCount {
    pub tag: String,
    #[sqlx(try_from = "i64")]
    pub count: u32,
}

/// (level, flags JSON, sharpness, brightness)
type QualityRow = (Option<String>, String, Option<f64>, Option<f64>);

const MAX_GROUPS: u32 = 100;
const MAX_TAG: usize = 40;

pub async fn counts(pool: &SqlitePool, library_id: &str) -> Result<OrganizeCounts> {
    let groups: Vec<(String, i64, i64)> = sqlx::query_as(
        "SELECT g.kind, COUNT(DISTINCT g.id), COUNT(*) - COUNT(DISTINCT g.id)
         FROM similarity_groups g JOIN similarity_members s ON s.group_id = g.id
         WHERE g.library_id = ?1 GROUP BY g.kind",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?;
    let get = |kind: &str| {
        groups
            .iter()
            .find(|g| g.0 == kind)
            .map(|g| (g.1 as u32, g.2 as u32))
            .unwrap_or((0, 0))
    };

    let (sequences, low_quality, momentary, screenshots, analyzed, pending): (i64, i64, i64, i64, i64, i64) = sqlx::query_as(
        "SELECT
            (SELECT COUNT(*) FROM sequences WHERE library_id = ?1),
            (SELECT COUNT(*) FROM media_quality q JOIN media m ON m.id = q.media_id
             WHERE m.library_id = ?1 AND m.status = 'active' AND q.level = 'low'),
            (SELECT COUNT(DISTINCT ml.media_id) FROM media_labels ml JOIN labels l ON l.id = ml.label_id
             JOIN media m ON m.id = ml.media_id
             WHERE m.library_id = ?1 AND m.status = 'active' AND ml.active = 1 AND l.dimension = 'momentary'),
            (SELECT COUNT(*) FROM media_labels ml JOIN labels l ON l.id = ml.label_id
             JOIN media m ON m.id = ml.media_id
             WHERE m.library_id = ?1 AND m.status = 'active' AND ml.active = 1
               AND l.dimension = 'category' AND l.value = 'screenshot'),
            (SELECT COUNT(*) FROM media_quality q JOIN media m ON m.id = q.media_id
             WHERE m.library_id = ?1 AND m.status = 'active'),
            (SELECT COUNT(DISTINCT j.media_id) FROM jobs j JOIN media m ON m.id = j.media_id
             WHERE m.library_id = ?1 AND m.status = 'active' AND j.status IN ('queued', 'running'))",
    )
    .bind(library_id)
    .fetch_one(pool)
    .await?;

    let (exact_groups, exact_extra) = get("exact_duplicate");
    let (visual_groups, visual_extra) = get("visual_duplicate");
    Ok(OrganizeCounts {
        exact_groups,
        exact_extra,
        visual_groups,
        visual_extra,
        similar_groups: get("similar").0,
        sequences: sequences as u32,
        low_quality: low_quality as u32,
        momentary: momentary as u32,
        screenshots: screenshots as u32,
        analyzed: analyzed as u32,
        pending: pending as u32,
    })
}

/// Groups of one kind, biggest savings first (duplicates) or newest first (others).
pub async fn groups(
    pool: &SqlitePool,
    library_id: &str,
    kind: GroupKind,
    offset: u32,
    limit: u32,
) -> Result<GroupPage> {
    let limit = limit.clamp(1, MAX_GROUPS);
    let (ids, total): (Vec<String>, i64) = if kind == GroupKind::Sequence {
        let ids = sqlx::query_scalar(
            "SELECT id FROM sequences WHERE library_id = ?1 ORDER BY started_at DESC, id LIMIT ?2 OFFSET ?3",
        )
        .bind(library_id)
        .bind(i64::from(limit))
        .bind(i64::from(offset))
        .fetch_all(pool)
        .await?;
        let total = sqlx::query_scalar("SELECT COUNT(*) FROM sequences WHERE library_id = ?1")
            .bind(library_id)
            .fetch_one(pool)
            .await?;
        (ids, total)
    } else {
        let order = if kind == GroupKind::Similar {
            "MAX(m.sort_key) DESC"
        } else {
            "SUM(m.file_size) - MAX(m.file_size) DESC"
        };
        let ids = sqlx::query_scalar(&format!(
            "SELECT g.id FROM similarity_groups g
             JOIN similarity_members s ON s.group_id = g.id JOIN media m ON m.id = s.media_id
             WHERE g.library_id = ?1 AND g.kind = ?2
             GROUP BY g.id ORDER BY {order}, g.id LIMIT ?3 OFFSET ?4"
        ))
        .bind(library_id)
        .bind(kind.db())
        .bind(i64::from(limit))
        .bind(i64::from(offset))
        .fetch_all(pool)
        .await?;
        let total = sqlx::query_scalar(
            "SELECT COUNT(*) FROM similarity_groups WHERE library_id = ?1 AND kind = ?2",
        )
        .bind(library_id)
        .bind(kind.db())
        .fetch_one(pool)
        .await?;
        (ids, total)
    };

    let mut groups = Vec::with_capacity(ids.len());
    for id in ids {
        groups.push(group(pool, &id, kind).await?);
    }
    Ok(GroupPage {
        groups,
        total: total as u32,
    })
}

async fn group(pool: &SqlitePool, id: &str, kind: GroupKind) -> Result<MediaGroup> {
    let rows: Vec<(String, i64, Option<String>, Option<f64>)> = if kind == GroupKind::Sequence {
        sqlx::query_as(
            "SELECT m.id, 0, q.level, q.sharpness
             FROM media m JOIN sequences s ON s.id = m.sequence_id
             LEFT JOIN media_quality q ON q.media_id = m.id
             WHERE s.id = ?1
             ORDER BY m.id = s.best_media_id DESC, m.sort_key, m.id",
        )
        .bind(id)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as(
            "SELECT m.id, s.distance, q.level, q.sharpness
             FROM similarity_members s JOIN similarity_groups g ON g.id = s.group_id
             JOIN media m ON m.id = s.media_id LEFT JOIN media_quality q ON q.media_id = m.id
             WHERE s.group_id = ?1
             ORDER BY m.id = g.best_media_id DESC, s.distance, m.sort_key DESC, m.id",
        )
        .bind(id)
        .fetch_all(pool)
        .await?
    };
    let ids: Vec<String> = rows.iter().map(|r| r.0.clone()).collect();
    let items = media::get_many(pool, &ids).await?;
    let mut members = Vec::with_capacity(rows.len());
    for (media_id, distance, level, sharpness) in rows {
        if let Some(item) = items.iter().find(|m| m.id == media_id).cloned() {
            members.push(GroupMember {
                item,
                distance: distance as u32,
                quality: level.as_deref().and_then(level_of),
                sharpness,
            });
        }
    }
    let extra_bytes = members.iter().skip(1).map(|m| m.item.file_size).sum();
    Ok(MediaGroup {
        id: id.to_string(),
        kind,
        members,
        extra_bytes,
    })
}

fn level_of(level: &str) -> Option<QualityLevel> {
    match level {
        "low" => Some(QualityLevel::Low),
        "medium" => Some(QualityLevel::Medium),
        "high" => Some(QualityLevel::High),
        _ => None,
    }
}

fn flag_of(flag: &str) -> Option<QualityFlag> {
    Some(match flag {
        "blurry" => QualityFlag::Blurry,
        "dark" => QualityFlag::Dark,
        "overexposed" => QualityFlag::Overexposed,
        "low_res" => QualityFlag::LowRes,
        "empty" => QualityFlag::Empty,
        _ => return None,
    })
}

pub async fn media_analysis(pool: &SqlitePool, media_id: &str) -> Result<MediaAnalysis> {
    let quality: Option<QualityRow> = sqlx::query_as(
        "SELECT level, flags, sharpness, brightness FROM media_quality WHERE media_id = ?1",
    )
    .bind(media_id)
    .fetch_optional(pool)
    .await?;
    let labels: Vec<(String, String, Option<f64>, String)> = sqlx::query_as(
        "SELECT l.dimension, l.value, ml.score, ml.source FROM media_labels ml JOIN labels l ON l.id = ml.label_id
         WHERE ml.media_id = ?1 AND ml.active = 1 ORDER BY l.dimension = 'tag', l.value",
    )
    .bind(media_id)
    .fetch_all(pool)
    .await?;
    let mut groups: Vec<GroupRef> = sqlx::query_as::<_, (String, String, i64, bool)>(
        "SELECT g.id, g.kind, (SELECT COUNT(*) FROM similarity_members WHERE group_id = g.id), g.best_media_id = ?1
         FROM similarity_groups g JOIN similarity_members s ON s.group_id = g.id WHERE s.media_id = ?1",
    )
    .bind(media_id)
    .fetch_all(pool)
    .await?
    .into_iter()
    .filter_map(|(id, kind, size, is_best)| {
        let kind = match kind.as_str() {
            "exact_duplicate" => GroupKind::ExactDuplicate,
            "visual_duplicate" => GroupKind::VisualDuplicate,
            "similar" => GroupKind::Similar,
            _ => return None,
        };
        Some(GroupRef { id, kind, size: size as u32, is_best })
    })
    .collect();
    let sequence: Option<(String, i64, bool)> = sqlx::query_as(
        "SELECT s.id, s.size, s.best_media_id = ?1 FROM media m JOIN sequences s ON s.id = m.sequence_id WHERE m.id = ?1",
    )
    .bind(media_id)
    .fetch_optional(pool)
    .await?;
    if let Some((id, size, is_best)) = sequence {
        groups.push(GroupRef {
            id,
            kind: GroupKind::Sequence,
            size: size as u32,
            is_best,
        });
    }

    let analyzed = quality.is_some();
    let (level, flags, sharpness, brightness) = match quality {
        Some((level, flags, sharpness, brightness)) => (level, flags, sharpness, brightness),
        None => (None, "[]".to_string(), None, None),
    };
    let flags: Vec<String> = serde_json::from_str(&flags).unwrap_or_default();
    Ok(MediaAnalysis {
        analyzed,
        quality: level.as_deref().and_then(level_of),
        flags: flags.iter().filter_map(|f| flag_of(f)).collect(),
        sharpness,
        brightness,
        labels: labels
            .into_iter()
            .map(|(dimension, value, score, source)| LabelInfo {
                dimension,
                value,
                score,
                manual: source == "manual",
            })
            .collect(),
        groups,
    })
}

fn normalize_tag(tag: &str) -> Result<String> {
    let tag: String = tag
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .to_lowercase();
    if tag.is_empty() {
        return Err(Error::InvalidInput("Digite a tag.".into()));
    }
    if tag.chars().count() > MAX_TAG {
        return Err(Error::InvalidInput(format!(
            "A tag pode ter até {MAX_TAG} caracteres."
        )));
    }
    Ok(tag)
}

/// Manual tag on items (idempotent). Returns the normalized tag.
pub async fn add_tag(pool: &SqlitePool, media_ids: &[String], tag: &str) -> Result<String> {
    let tag = normalize_tag(tag)?;
    let mut tx = pool.begin().await?;
    let label = crate::analysis::store::label_id(&mut tx, "tag", &tag).await?;
    for id in media_ids {
        sqlx::query(
            "INSERT INTO media_labels (media_id, label_id, score, source, active)
             SELECT id, ?2, NULL, 'manual', 1 FROM media WHERE id = ?1
             ON CONFLICT (media_id, label_id) DO NOTHING",
        )
        .bind(id)
        .bind(label)
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;
    Ok(tag)
}

pub async fn remove_tag(pool: &SqlitePool, media_ids: &[String], tag: &str) -> Result<()> {
    let tag = normalize_tag(tag)?;
    let mut tx = pool.begin().await?;
    for id in media_ids {
        sqlx::query(
            "DELETE FROM media_labels WHERE media_id = ?1 AND source = 'manual'
               AND label_id = (SELECT id FROM labels WHERE dimension = 'tag' AND value = ?2)",
        )
        .bind(id)
        .bind(&tag)
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;
    Ok(())
}

/// Tags used in a library, most used first.
pub async fn tags(pool: &SqlitePool, library_id: &str) -> Result<Vec<TagCount>> {
    Ok(sqlx::query_as(
        "SELECT l.value AS tag, COUNT(*) AS count FROM labels l
         JOIN media_labels ml ON ml.label_id = l.id JOIN media m ON m.id = ml.media_id
         WHERE l.dimension = 'tag' AND m.library_id = ?1 AND m.status = 'active'
         GROUP BY l.id ORDER BY count DESC, l.value",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?)
}
