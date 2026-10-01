//! People (PRD §20, phase 7b): faces found by the local AI (`ai::faces`) in each photo's
//! 1024 px preview, grouped into people (`cluster`) that the user names, merges and
//! corrects. People are global (the same Ana in every library); lists and counts are per
//! library. Groups are recomputed when faces or decisions change (`rebuild`, from the
//! queue); the user's decisions never are: names, faces put in a person (`confirmed`),
//! faces taken out of one (`face_rejections`), hidden people.

pub mod cluster;

use crate::ai::faces::{DIM, Detection};
use crate::ai::{FACES_MODEL_ID, index};
use crate::error::{Error, Result};
use crate::ingestion::geo::fold;
use chrono::Utc;
use serde::Serialize;
use specta::Type;
use sqlx::SqlitePool;
use std::collections::{HashMap, HashSet};
use std::path::Path;

/// Faces smaller than this (short side, preview pixels) or turned away are kept (the
/// photo shows them) but not grouped: their vectors are unreliable.
pub const MIN_GROUP_SIZE: u32 = 40;
pub const MIN_GROUP_FRONTAL: f32 = 0.3;
pub const MIN_GROUP_SCORE: f32 = 0.8;
/// Smaller detections are dropped (background crowds, false positives).
pub const MIN_FACE_SIZE: u32 = 24;
/// Longest name accepted.
const MAX_NAME: usize = 80;

/// A face found in a preview, ready to store.
#[derive(Debug, Clone)]
pub struct FoundFace {
    /// Box as fractions of the preview.
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
    pub score: f32,
    pub frontal: f32,
    pub size: u32,
    pub vector: Vec<f32>,
}

impl FoundFace {
    /// `None` when too small to keep.
    pub fn new(d: &Detection, vector: Vec<f32>, width: u32, height: u32) -> Option<Self> {
        let size = d.w.min(d.h).max(0.0) as u32;
        if size < MIN_FACE_SIZE {
            return None;
        }
        let (w, h) = (width.max(1) as f32, height.max(1) as f32);
        Some(Self {
            x: (d.x / w).clamp(0.0, 1.0),
            y: (d.y / h).clamp(0.0, 1.0),
            w: (d.w / w).clamp(0.0, 1.0),
            h: (d.h / h).clamp(0.0, 1.0),
            score: d.score,
            frontal: d.frontal(),
            size,
            vector,
        })
    }
}

fn groupable(size: u32, frontal: f32, score: f32) -> bool {
    size >= MIN_GROUP_SIZE && frontal >= MIN_GROUP_FRONTAL && score >= MIN_GROUP_SCORE
}

// ---- Queue -------------------------------------------------------------------------

/// Photos (and videos with a frame) not yet searched with this model and preview.
pub async fn pending(pool: &SqlitePool, limit: u32) -> Result<Vec<(String, i64)>> {
    Ok(sqlx::query_as(
        "SELECT m.id, m.thumb_version FROM media m
         WHERE m.status = 'active' AND m.thumb_version > 0
           AND NOT EXISTS (SELECT 1 FROM face_scans s WHERE s.media_id = m.id AND s.model = ?1
                           AND s.thumb_version = m.thumb_version)
         ORDER BY m.sort_key DESC, m.id DESC LIMIT ?2",
    )
    .bind(FACES_MODEL_ID)
    .bind(i64::from(limit))
    .fetch_all(pool)
    .await?)
}

pub async fn pending_count(pool: &SqlitePool) -> Result<u32> {
    let n: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM media m
         WHERE m.status = 'active' AND m.thumb_version > 0
           AND NOT EXISTS (SELECT 1 FROM face_scans s WHERE s.media_id = m.id AND s.model = ?1
                           AND s.thumb_version = m.thumb_version)",
    )
    .bind(FACES_MODEL_ID)
    .fetch_one(pool)
    .await?;
    Ok(n as u32)
}

/// Photos searched and faces found (all libraries), for Settings.
pub async fn scanned_counts(pool: &SqlitePool) -> Result<(u32, u32)> {
    let (photos, faces): (i64, i64) = sqlx::query_as(
        "SELECT (SELECT COUNT(*) FROM face_scans s JOIN media m ON m.id = s.media_id
                 WHERE s.model = ?1 AND m.status = 'active'),
                (SELECT COUNT(*) FROM faces f JOIN media m ON m.id = f.media_id WHERE m.status = 'active' AND f.ignored = 0)",
    )
    .bind(FACES_MODEL_ID)
    .fetch_one(pool)
    .await?;
    Ok((photos as u32, faces as u32))
}

/// Result of one photo: the faces, or why its preview couldn't be read (not retried until
/// the preview changes).
pub struct Scanned {
    pub media_id: String,
    pub thumb_version: i64,
    pub result: std::result::Result<Vec<FoundFace>, String>,
}

fn iou(a: (f32, f32, f32, f32), b: (f32, f32, f32, f32)) -> f32 {
    let (x1, y1) = (a.0.max(b.0), a.1.max(b.1));
    let (x2, y2) = ((a.0 + a.2).min(b.0 + b.2), (a.1 + a.3).min(b.1 + b.3));
    let inter = (x2 - x1).max(0.0) * (y2 - y1).max(0.0);
    let union = a.2 * a.3 + b.2 * b.3 - inter;
    if union <= 0.0 { 0.0 } else { inter / union }
}

/// Replace the faces of each photo. A face at the same place as before (new preview of an
/// edited file) keeps its person and confirmation.
pub async fn store(pool: &SqlitePool, scanned: &[Scanned]) -> Result<()> {
    let now = Utc::now().to_rfc3339();
    let mut tx = pool.begin().await?;
    let mut changed = false;
    for s in scanned {
        type Old = (String, f32, f32, f32, f32, Option<String>, i64, i64);
        let old: Vec<Old> = sqlx::query_as(
            "SELECT id, x, y, w, h, person_id, confirmed, ignored FROM faces WHERE media_id = ?1",
        )
        .bind(&s.media_id)
        .fetch_all(&mut *tx)
        .await?;
        let found = s.result.as_deref().unwrap_or_default();
        changed |= !old.is_empty() || !found.is_empty();
        sqlx::query("DELETE FROM faces WHERE media_id = ?1")
            .bind(&s.media_id)
            .execute(&mut *tx)
            .await?;
        for f in found {
            let kept = old
                .iter()
                .filter(|o| iou((o.1, o.2, o.3, o.4), (f.x, f.y, f.w, f.h)) > 0.5)
                .max_by(|a, b| a.6.cmp(&b.6));
            sqlx::query(
                "INSERT INTO faces (id, media_id, x, y, w, h, score, frontal, size, vector, person_id, confirmed, ignored)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            )
            .bind(uuid::Uuid::now_v7().to_string())
            .bind(&s.media_id)
            .bind(f.x)
            .bind(f.y)
            .bind(f.w)
            .bind(f.h)
            .bind(f.score)
            .bind(f.frontal)
            .bind(i64::from(f.size))
            .bind(index::encode(&f.vector))
            .bind(kept.and_then(|o| o.5.clone()))
            .bind(kept.map(|o| o.6).unwrap_or(0))
            .bind(kept.map(|o| o.7).unwrap_or(0))
            .execute(&mut *tx)
            .await?;
        }
        sqlx::query(
            "INSERT INTO face_scans (media_id, model, thumb_version, faces, error, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT (media_id) DO UPDATE SET model = excluded.model, thumb_version = excluded.thumb_version,
                faces = excluded.faces, error = excluded.error, created_at = excluded.created_at",
        )
        .bind(&s.media_id)
        .bind(FACES_MODEL_ID)
        .bind(s.thumb_version)
        .bind(found.len() as i64)
        .bind(
            s.result
                .as_ref()
                .err()
                .map(|e| e.chars().take(300).collect::<String>()),
        )
        .bind(&now)
        .execute(&mut *tx)
        .await?;
    }
    if changed {
        mark_dirty(&mut *tx).await?;
    }
    tx.commit().await?;
    Ok(())
}

pub async fn mark_dirty<'e, E>(executor: E) -> Result<()>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("UPDATE people_state SET dirty = 1 WHERE id = 1")
        .execute(executor)
        .await?;
    Ok(())
}

pub async fn is_dirty(pool: &SqlitePool) -> Result<bool> {
    let d: Option<i64> = sqlx::query_scalar("SELECT dirty FROM people_state WHERE id = 1")
        .fetch_optional(pool)
        .await?;
    Ok(d == Some(1))
}

/// Removing the face models: faces, people and names go with them.
pub async fn delete_all(pool: &SqlitePool) -> Result<()> {
    let mut tx = pool.begin().await?;
    for sql in [
        "DELETE FROM face_rejections",
        "DELETE FROM faces",
        "DELETE FROM people",
        "DELETE FROM face_scans",
        "UPDATE people_state SET dirty = 0",
    ] {
        sqlx::query(sql).execute(&mut *tx).await?;
    }
    tx.commit().await?;
    Ok(())
}

// ---- Grouping ----------------------------------------------------------------------

/// Regroup every face: confirmed faces stay, the others join a confirmed person or a
/// suggested group. Suggested groups keep their id when they keep most of their faces.
pub async fn rebuild(pool: &SqlitePool) -> Result<()> {
    let started = std::time::Instant::now();
    sqlx::query("UPDATE people_state SET dirty = 0 WHERE id = 1")
        .execute(pool)
        .await?;
    type Row = (String, Vec<u8>, Option<String>, i64, i64, f64, f64);
    let rows: Vec<Row> = sqlx::query_as(
        "SELECT f.id, f.vector, f.person_id, f.confirmed, f.size, f.frontal, f.score
         FROM faces f JOIN media m ON m.id = f.media_id WHERE m.status = 'active' AND f.ignored = 0
         ORDER BY f.confirmed DESC, f.size * f.frontal * f.score DESC, f.id",
    )
    .fetch_all(pool)
    .await?;
    let people: Vec<(String, Option<String>, i64)> =
        sqlx::query_as("SELECT id, name, hidden FROM people")
            .fetch_all(pool)
            .await?;
    let person_index: HashMap<&str, u32> = people
        .iter()
        .enumerate()
        .map(|(i, p)| (p.0.as_str(), i as u32))
        .collect();
    let rejections: Vec<(String, String)> =
        sqlx::query_as("SELECT face_id, person_id FROM face_rejections")
            .fetch_all(pool)
            .await?;
    let rejected_ids: HashSet<(&str, &str)> = rejections
        .iter()
        .map(|(f, p)| (f.as_str(), p.as_str()))
        .collect();

    // Faces that take part: confirmed ones, and good enough ones.
    let mut ids: Vec<&str> = Vec::new();
    let mut vectors: Vec<f32> = Vec::new();
    let mut confirmed: Vec<Option<u32>> = Vec::new();
    let mut previous: Vec<Option<&str>> = Vec::new();
    let mut left_out: Vec<&str> = Vec::new();
    for (id, blob, person, conf, size, frontal, score) in &rows {
        let anchor = (*conf == 1)
            .then(|| person.as_deref().and_then(|p| person_index.get(p).copied()))
            .flatten();
        let vector = index::decode_dim(blob, DIM);
        match vector {
            Some(v)
                if anchor.is_some() || groupable(*size as u32, *frontal as f32, *score as f32) =>
            {
                ids.push(id);
                vectors.extend(v);
                confirmed.push(anchor);
                previous.push(person.as_deref());
            }
            _ if anchor.is_none() && person.is_some() => left_out.push(id),
            _ => {}
        }
    }
    let rejected: HashSet<(usize, u32)> = ids
        .iter()
        .enumerate()
        .flat_map(|(i, f)| {
            people
                .iter()
                .enumerate()
                .filter(|(_, p)| rejected_ids.contains(&(*f, p.0.as_str())))
                .map(move |(pi, _)| (i, pi as u32))
        })
        .collect();

    let conf = confirmed.clone();
    let out = tokio::task::spawn_blocking(move || {
        cluster::cluster(
            &cluster::Input {
                vectors: &vectors,
                confirmed: &conf,
                rejected: &rejected,
            },
            &cluster::PARAMS,
        )
    })
    .await?;

    // Suggested people (no name, not hidden, nothing confirmed) are the ones regrouped.
    let anchored: HashSet<u32> = confirmed.iter().flatten().copied().collect();
    let suggested: HashSet<&str> = people
        .iter()
        .enumerate()
        .filter(|(i, p)| p.1.is_none() && p.2 == 0 && !anchored.contains(&(*i as u32)))
        .map(|(_, p)| p.0.as_str())
        .collect();
    let mut target: Vec<Option<String>> = vec![None; ids.len()];
    for (i, c) in confirmed.iter().enumerate() {
        if let Some(p) = c {
            target[i] = Some(people[*p as usize].0.clone());
        } else if let Some(p) = out.assigned[i] {
            target[i] = Some(people[p as usize].0.clone());
        }
    }
    let now = Utc::now().to_rfc3339();
    let mut reused: HashSet<&str> = HashSet::new();
    let mut created: Vec<String> = Vec::new();
    for group in &out.groups {
        let mut overlap: HashMap<&str, usize> = HashMap::new();
        for &i in group {
            if let Some(p) = previous[i].filter(|p| suggested.contains(p) && !reused.contains(p)) {
                *overlap.entry(p).or_default() += 1;
            }
        }
        let id = match overlap
            .into_iter()
            .max_by(|a, b| a.1.cmp(&b.1).then(b.0.cmp(a.0)))
        {
            Some((p, _)) => {
                reused.insert(p);
                p.to_string()
            }
            None => {
                let id = uuid::Uuid::now_v7().to_string();
                created.push(id.clone());
                id
            }
        };
        for &i in group {
            // "Not this person" also holds for suggested groups.
            if !rejected_ids.contains(&(ids[i], id.as_str())) {
                target[i] = Some(id.clone());
            }
        }
    }

    let mut tx = pool.begin().await?;
    for id in &created {
        sqlx::query("INSERT INTO people (id, created_at, updated_at) VALUES (?1, ?2, ?2)")
            .bind(id)
            .bind(&now)
            .execute(&mut *tx)
            .await?;
    }
    let mut updates = 0;
    for (i, t) in target.iter().enumerate() {
        if previous[i] != t.as_deref() {
            updates += 1;
            sqlx::query("UPDATE faces SET person_id = ?1 WHERE id = ?2")
                .bind(t)
                .bind(ids[i])
                .execute(&mut *tx)
                .await?;
        }
    }
    for id in &left_out {
        sqlx::query("UPDATE faces SET person_id = NULL WHERE id = ?1")
            .bind(id)
            .execute(&mut *tx)
            .await?;
    }
    // People left without any face (a named person whose faces all went away included).
    sqlx::query(
        "DELETE FROM people WHERE NOT EXISTS (SELECT 1 FROM faces f WHERE f.person_id = people.id)",
    )
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    tracing::info!(
        "People regrouped: {} faces, {} groups, {} changes in {:?}",
        ids.len(),
        out.groups.len(),
        updates,
        started.elapsed()
    );
    Ok(())
}

// ---- Reading -----------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PersonSummary {
    pub id: String,
    /// `None` = suggested group, not named yet.
    pub name: Option<String>,
    pub hidden: bool,
    /// Photos of this person in the library.
    pub photo_count: u32,
    /// Face shown as the person's picture (`pv://…/face/<id>`).
    pub cover_face_id: Option<String>,
}

/// Best face of the person in the library: the chosen one, else confirmed and big first.
const COVER: &str = "COALESCE(
    (SELECT c.id FROM faces c WHERE c.id = p.cover_face_id AND c.person_id = p.id),
    (SELECT c.id FROM faces c JOIN media cm ON cm.id = c.media_id
     WHERE c.person_id = p.id AND cm.library_id = ?1 AND cm.status = 'active'
     ORDER BY c.confirmed DESC, c.size * c.frontal * c.score DESC LIMIT 1))";

type SummaryRow = (String, Option<String>, i64, i64, Option<String>);

fn summary((id, name, hidden, photos, cover): SummaryRow) -> PersonSummary {
    PersonSummary {
        id,
        name,
        hidden: hidden == 1,
        photo_count: photos as u32,
        cover_face_id: cover,
    }
}

/// People with photos in the library: named first (by photo count), then suggestions.
pub async fn list(
    pool: &SqlitePool,
    library_id: &str,
    include_hidden: bool,
) -> Result<Vec<PersonSummary>> {
    let rows: Vec<SummaryRow> = sqlx::query_as(&format!(
        "SELECT p.id, p.name, p.hidden, COUNT(DISTINCT f.media_id), {COVER}
         FROM people p JOIN faces f ON f.person_id = p.id JOIN media m ON m.id = f.media_id
         WHERE m.library_id = ?1 AND m.status = 'active' AND (?2 OR p.hidden = 0)
         GROUP BY p.id
         ORDER BY p.name IS NULL, COUNT(DISTINCT f.media_id) DESC, p.name COLLATE NOCASE, p.id"
    ))
    .bind(library_id)
    .bind(include_hidden)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(summary).collect())
}

pub async fn get(pool: &SqlitePool, library_id: &str, person_id: &str) -> Result<PersonSummary> {
    let row: Option<SummaryRow> = sqlx::query_as(&format!(
        "SELECT p.id, p.name, p.hidden,
                (SELECT COUNT(DISTINCT f.media_id) FROM faces f JOIN media m ON m.id = f.media_id
                 WHERE f.person_id = p.id AND m.library_id = ?1 AND m.status = 'active'),
                {COVER}
         FROM people p WHERE p.id = ?2"
    ))
    .bind(library_id)
    .bind(person_id)
    .fetch_optional(pool)
    .await?;
    row.map(summary).ok_or(Error::PersonNotFound)
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FaceInfo {
    pub id: String,
    pub media_id: String,
    /// Box as fractions of the photo.
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
    pub person_id: Option<String>,
    pub person_name: Option<String>,
    /// The user put it in this person (or named it).
    pub confirmed: bool,
}

type FaceRow = (
    String,
    String,
    f64,
    f64,
    f64,
    f64,
    Option<String>,
    Option<String>,
    i64,
);

fn face_info((id, media_id, x, y, w, h, person_id, person_name, confirmed): FaceRow) -> FaceInfo {
    FaceInfo {
        id,
        media_id,
        x: x as f32,
        y: y as f32,
        w: w as f32,
        h: h as f32,
        person_id,
        person_name,
        confirmed: confirmed == 1,
    }
}

const FACE_COLUMNS: &str = "f.id, f.media_id, f.x, f.y, f.w, f.h, f.person_id, p.name, f.confirmed";

/// Faces of a photo, left to right (hidden people are shown without a name).
pub async fn faces_of_media(pool: &SqlitePool, media_id: &str) -> Result<Vec<FaceInfo>> {
    let rows: Vec<FaceRow> = sqlx::query_as(&format!(
        "SELECT {FACE_COLUMNS} FROM faces f LEFT JOIN people p ON p.id = f.person_id AND p.hidden = 0
         WHERE f.media_id = ?1 AND f.size >= ?2 AND f.ignored = 0 ORDER BY f.x"
    ))
    .bind(media_id)
    .bind(i64::from(MIN_GROUP_SIZE))
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(face_info).collect())
}

/// Faces of a person in the library, for reviewing them (unconfirmed first: those are
/// the ones that may be wrong).
pub async fn faces_of_person(
    pool: &SqlitePool,
    library_id: &str,
    person_id: &str,
    limit: u32,
) -> Result<Vec<FaceInfo>> {
    let rows: Vec<FaceRow> = sqlx::query_as(&format!(
        "SELECT {FACE_COLUMNS} FROM faces f JOIN media m ON m.id = f.media_id
         LEFT JOIN people p ON p.id = f.person_id
         WHERE f.person_id = ?1 AND m.library_id = ?2 AND m.status = 'active'
         ORDER BY f.confirmed, f.size * f.frontal * f.score, f.id LIMIT ?3"
    ))
    .bind(person_id)
    .bind(library_id)
    .bind(i64::from(limit))
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(face_info).collect())
}

/// Named people, not hidden (suggesting names while typing; names in the search), A→Z.
pub async fn names(pool: &SqlitePool) -> Result<Vec<(String, String)>> {
    Ok(sqlx::query_as(
        "SELECT id, name FROM people WHERE name IS NOT NULL AND hidden = 0 ORDER BY name COLLATE NOCASE",
    )
    .fetch_all(pool)
    .await?)
}

// ---- Decisions ---------------------------------------------------------------------

fn clean_name(name: &str) -> Result<String> {
    let name = name.split_whitespace().collect::<Vec<_>>().join(" ");
    if name.is_empty() {
        return Err(Error::InvalidInput("Digite um nome.".into()));
    }
    if name.chars().count() > MAX_NAME {
        return Err(Error::InvalidInput(format!(
            "O nome pode ter até {MAX_NAME} caracteres."
        )));
    }
    Ok(name)
}

/// Another person already called `name` (accents and case ignored).
async fn named_as(pool: &SqlitePool, name: &str, except: Option<&str>) -> Result<Option<String>> {
    let folded = fold(name);
    Ok(names(pool)
        .await?
        .into_iter()
        .chain(
            sqlx::query_as::<_, (String, String)>(
                "SELECT id, name FROM people WHERE name IS NOT NULL AND hidden = 1",
            )
            .fetch_all(pool)
            .await?,
        )
        .find(|(id, n)| Some(id.as_str()) != except && fold(n) == folded)
        .map(|(id, _)| id))
}

/// Name a person. Its faces become confirmed (naming says "these are Ana"). If another
/// person already has that name, the two become one. Returns the id that remains.
pub async fn rename(pool: &SqlitePool, person_id: &str, name: &str) -> Result<String> {
    let name = clean_name(name)?;
    exists(pool, person_id).await?;
    if let Some(other) = named_as(pool, &name, Some(person_id)).await? {
        merge(pool, &other, &[person_id.to_string()]).await?;
        return Ok(other);
    }
    let mut tx = pool.begin().await?;
    sqlx::query("UPDATE people SET name = ?1, updated_at = ?2 WHERE id = ?3")
        .bind(&name)
        .bind(Utc::now().to_rfc3339())
        .bind(person_id)
        .execute(&mut *tx)
        .await?;
    sqlx::query("UPDATE faces SET confirmed = 1 WHERE person_id = ?1")
        .bind(person_id)
        .execute(&mut *tx)
        .await?;
    mark_dirty(&mut *tx).await?;
    tx.commit().await?;
    Ok(person_id.to_string())
}

async fn exists(pool: &SqlitePool, person_id: &str) -> Result<()> {
    let found: Option<i64> = sqlx::query_scalar("SELECT 1 FROM people WHERE id = ?1")
        .bind(person_id)
        .fetch_optional(pool)
        .await?;
    found.map(|_| ()).ok_or(Error::PersonNotFound)
}

/// "Same person": the faces of `sources` go to `target` (confirmed), sources are deleted.
/// The target keeps its name; without one, it takes the first source's name.
pub async fn merge(pool: &SqlitePool, target: &str, sources: &[String]) -> Result<()> {
    exists(pool, target).await?;
    let mut tx = pool.begin().await?;
    for source in sources.iter().filter(|s| s.as_str() != target) {
        sqlx::query(
            "UPDATE people SET name = COALESCE(name, (SELECT name FROM people WHERE id = ?1)) WHERE id = ?2",
        )
        .bind(source)
        .bind(target)
        .execute(&mut *tx)
        .await?;
        sqlx::query("UPDATE faces SET person_id = ?1, confirmed = 1 WHERE person_id = ?2")
            .bind(target)
            .bind(source)
            .execute(&mut *tx)
            .await?;
        // A rejection of the source now applies to the merged person.
        sqlx::query(
            "INSERT OR IGNORE INTO face_rejections (face_id, person_id)
             SELECT face_id, ?1 FROM face_rejections WHERE person_id = ?2",
        )
        .bind(target)
        .bind(source)
        .execute(&mut *tx)
        .await?;
        sqlx::query("DELETE FROM people WHERE id = ?1")
            .bind(source)
            .execute(&mut *tx)
            .await?;
    }
    sqlx::query("UPDATE faces SET confirmed = 1 WHERE person_id = ?1")
        .bind(target)
        .execute(&mut *tx)
        .await?;
    sqlx::query("UPDATE people SET updated_at = ?1 WHERE id = ?2")
        .bind(Utc::now().to_rfc3339())
        .bind(target)
        .execute(&mut *tx)
        .await?;
    mark_dirty(&mut *tx).await?;
    tx.commit().await?;
    Ok(())
}

/// Hide ("don't show this person") or show again. Hiding confirms its faces, so new
/// photos of the same person go to it (hidden) instead of a new suggestion.
pub async fn set_hidden(pool: &SqlitePool, person_id: &str, hidden: bool) -> Result<()> {
    exists(pool, person_id).await?;
    let mut tx = pool.begin().await?;
    sqlx::query("UPDATE people SET hidden = ?1, updated_at = ?2 WHERE id = ?3")
        .bind(hidden)
        .bind(Utc::now().to_rfc3339())
        .bind(person_id)
        .execute(&mut *tx)
        .await?;
    if hidden {
        sqlx::query("UPDATE faces SET confirmed = 1 WHERE person_id = ?1")
            .bind(person_id)
            .execute(&mut *tx)
            .await?;
    }
    mark_dirty(&mut *tx).await?;
    tx.commit().await?;
    Ok(())
}

/// "Not this person": the faces leave their person for good (they may join another).
pub async fn remove_faces(pool: &SqlitePool, face_ids: &[String]) -> Result<()> {
    let mut tx = pool.begin().await?;
    for id in face_ids {
        sqlx::query(
            "INSERT OR IGNORE INTO face_rejections (face_id, person_id)
             SELECT id, person_id FROM faces WHERE id = ?1 AND person_id IS NOT NULL",
        )
        .bind(id)
        .execute(&mut *tx)
        .await?;
        sqlx::query("UPDATE faces SET person_id = NULL, confirmed = 0 WHERE id = ?1")
            .bind(id)
            .execute(&mut *tx)
            .await?;
    }
    mark_dirty(&mut *tx).await?;
    tx.commit().await?;
    Ok(())
}

/// "Não é um rosto" (a doll, a pattern): never shown nor grouped again, even after a new
/// preview of the photo.
pub async fn ignore_faces(pool: &SqlitePool, face_ids: &[String]) -> Result<()> {
    let mut tx = pool.begin().await?;
    for id in face_ids {
        sqlx::query("UPDATE faces SET ignored = 1, person_id = NULL, confirmed = 0 WHERE id = ?1")
            .bind(id)
            .execute(&mut *tx)
            .await?;
    }
    sqlx::query("UPDATE people SET cover_face_id = NULL WHERE cover_face_id IN (SELECT id FROM faces WHERE ignored = 1)")
        .execute(&mut *tx)
        .await?;
    mark_dirty(&mut *tx).await?;
    tx.commit().await?;
    Ok(())
}

/// "This is Ana": put a face in the person with that name (created if new). Returns the
/// person's id.
pub async fn name_face(pool: &SqlitePool, face_id: &str, name: &str) -> Result<String> {
    let name = clean_name(name)?;
    let person = match named_as(pool, &name, None).await? {
        Some(id) => id,
        None => {
            let id = uuid::Uuid::now_v7().to_string();
            let now = Utc::now().to_rfc3339();
            sqlx::query(
                "INSERT INTO people (id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?3)",
            )
            .bind(&id)
            .bind(&name)
            .bind(&now)
            .execute(pool)
            .await?;
            id
        }
    };
    let mut tx = pool.begin().await?;
    let updated = sqlx::query("UPDATE faces SET person_id = ?1, confirmed = 1 WHERE id = ?2")
        .bind(&person)
        .bind(face_id)
        .execute(&mut *tx)
        .await?;
    if updated.rows_affected() == 0 {
        return Err(Error::InvalidInput("Rosto não encontrado.".into()));
    }
    sqlx::query("DELETE FROM face_rejections WHERE face_id = ?1 AND person_id = ?2")
        .bind(face_id)
        .bind(&person)
        .execute(&mut *tx)
        .await?;
    mark_dirty(&mut *tx).await?;
    tx.commit().await?;
    Ok(person)
}

/// Use this face as the person's picture.
pub async fn set_cover(pool: &SqlitePool, person_id: &str, face_id: &str) -> Result<()> {
    let updated = sqlx::query(
        "UPDATE people SET cover_face_id = ?1 WHERE id = ?2
         AND EXISTS (SELECT 1 FROM faces WHERE id = ?1 AND person_id = ?2)",
    )
    .bind(face_id)
    .bind(person_id)
    .execute(pool)
    .await?;
    if updated.rows_affected() == 0 {
        return Err(Error::PersonNotFound);
    }
    Ok(())
}

// ---- Face picture ------------------------------------------------------------------

/// Side of the face picture served to the WebView.
pub const CROP_SIZE: u32 = 160;

/// The face cut from the preview (square, with some margin), as JPEG. Blocking.
pub fn crop(thumbnails_dir: &Path, media_id: &str, bx: (f32, f32, f32, f32)) -> Result<Vec<u8>> {
    let path = crate::thumbnails::path(thumbnails_dir, media_id, crate::thumbnails::PREVIEW_SIZE);
    let img = image::open(&path).map_err(|e| Error::Internal(format!("prévia: {e}")))?;
    let (w, h) = (img.width() as f32, img.height() as f32);
    let (x, y, fw, fh) = (bx.0 * w, bx.1 * h, bx.2 * w, bx.3 * h);
    let side = (fw.max(fh) * 1.6).min(w.min(h)).max(1.0);
    let cx = (x + fw / 2.0 - side / 2.0).clamp(0.0, (w - side).max(0.0));
    let cy = (y + fh / 2.0 - side / 2.0).clamp(0.0, (h - side).max(0.0));
    let face = img
        .crop_imm(cx as u32, cy as u32, side as u32, side as u32)
        .resize_exact(
            CROP_SIZE,
            CROP_SIZE,
            image::imageops::FilterType::CatmullRom,
        )
        .to_rgb8();
    let mut out = Vec::new();
    image::codecs::jpeg::JpegEncoder::new_with_quality(&mut out, 85)
        .encode_image(&face)
        .map_err(|e| Error::Internal(format!("jpeg: {e}")))?;
    Ok(out)
}

/// Where a face is: (media id, box).
pub async fn face_location(
    pool: &SqlitePool,
    face_id: &str,
) -> Result<Option<(String, (f32, f32, f32, f32))>> {
    let row: Option<(String, f64, f64, f64, f64)> =
        sqlx::query_as("SELECT media_id, x, y, w, h FROM faces WHERE id = ?1")
            .bind(face_id)
            .fetch_optional(pool)
            .await?;
    Ok(row.map(|(m, x, y, w, h)| (m, (x as f32, y as f32, w as f32, h as f32))))
}

#[cfg(test)]
mod tests;
