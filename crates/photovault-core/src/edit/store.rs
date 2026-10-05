//! Edits in the catalog: recipes, their history (undo), "Aplicar" batches and the
//! automatic values computed per photo.

use std::path::Path;

use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::{QueryBuilder, Sqlite, SqliteConnection, SqlitePool};

use super::{AutoOptions, AutoValues, EditRecipe, auto::AUTO_VERSION};
use crate::arrange::ArrangeScope;
use crate::catalog::query;
use crate::error::{Error, Result};
use crate::thumbnails;

/// History entries kept per photo.
const HISTORY_KEEP: i64 = 20;

/// Extensions the editor reads (no RAW nor HEIC, PRD §29).
pub const EDITABLE: [&str; 7] = ["jpg", "jpeg", "png", "tif", "tiff", "webp", "bmp"];

pub fn is_editable(extension: &str) -> bool {
    EDITABLE.contains(&extension.to_ascii_lowercase().as_str())
}

/// The edit of one photo.
#[derive(Debug, Clone, PartialEq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MediaEdit {
    pub media_id: String,
    pub recipe: EditRecipe,
    pub revision: u32,
    /// Revision of the edited thumbnails (0 = not rendered yet).
    pub edit_version: u32,
}

/// What "Melhorar fotos" would touch in a scope.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct EnhanceSummary {
    /// Photos that will be improved.
    pub editable: u32,
    /// Left out: videos, screenshots, documents, formats the editor can't read.
    pub excluded: u32,
    /// Of `editable`, already edited (their fine tuning is kept).
    pub edited: u32,
    /// A few of `editable`, newest first, for the before/after grid.
    pub sample: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct EditBatch {
    pub id: String,
    pub library_id: String,
    pub auto: AutoOptions,
    pub count: u32,
    /// "applied" | "undone".
    pub status: String,
    pub created_at: String,
}

/// Automatic values as stored: valid while the file (`sha256`) and the algorithm
/// ([`AUTO_VERSION`]) are the same.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoCache {
    pub sha256: Option<String>,
    pub values: AutoValues,
}

pub fn cached_auto(auto_json: Option<&str>, sha256: Option<&str>) -> Option<AutoValues> {
    let cache: AutoCache = serde_json::from_str(auto_json?).ok()?;
    (cache.values.version == AUTO_VERSION && cache.sha256.as_deref() == sha256)
        .then_some(cache.values)
}

fn now() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn to_json(recipe: &EditRecipe) -> String {
    serde_json::to_string(recipe).unwrap_or_else(|_| "{}".into())
}

fn small(n: i64) -> u32 {
    u32::try_from(n).unwrap_or(0)
}

pub async fn get(pool: &SqlitePool, media_id: &str) -> Result<Option<MediaEdit>> {
    let row: Option<(String, i64, i64)> = sqlx::query_as(
        "SELECT recipe_json, revision, thumb_revision FROM media_edits WHERE media_id = ?1",
    )
    .bind(media_id)
    .fetch_optional(pool)
    .await?;
    row.map(|(json, revision, thumb)| {
        Ok(MediaEdit {
            media_id: media_id.to_string(),
            recipe: EditRecipe::from_json(&json)?,
            revision: small(revision),
            edit_version: small(thumb),
        })
    })
    .transpose()
}

/// Automatic values already computed for a photo (still valid), if any.
pub async fn auto_values(pool: &SqlitePool, media_id: &str) -> Result<Option<AutoValues>> {
    let row: Option<(Option<String>, Option<String>)> = sqlx::query_as(
        "SELECT e.auto_json, m.sha256 FROM media m LEFT JOIN media_edits e ON e.media_id = m.id
         WHERE m.id = ?1",
    )
    .bind(media_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.and_then(|(json, sha)| cached_auto(json.as_deref(), sha.as_deref())))
}

/// Records the recipe before a change, then writes `recipe`. Same recipe = no change.
async fn save_in(
    conn: &mut SqliteConnection,
    media_id: &str,
    recipe: &EditRecipe,
    source: &str,
    batch_id: Option<&str>,
) -> Result<()> {
    let json = to_json(recipe);
    let previous: Option<(String,)> =
        sqlx::query_as("SELECT recipe_json FROM media_edits WHERE media_id = ?1")
            .bind(media_id)
            .fetch_optional(&mut *conn)
            .await?;
    if previous.as_ref().is_some_and(|(p,)| *p == json) {
        return Ok(());
    }
    let at = now();
    record_history(
        conn,
        media_id,
        previous.map(|(p,)| p),
        source,
        batch_id,
        &at,
    )
    .await?;
    sqlx::query(
        "INSERT INTO media_edits (media_id, recipe_json, recipe_version, revision, updated_at)
         VALUES (?1, ?2, ?3, 1, ?4)
         ON CONFLICT (media_id) DO UPDATE SET recipe_json = excluded.recipe_json,
             recipe_version = excluded.recipe_version, revision = revision + 1,
             thumb_error = NULL, updated_at = excluded.updated_at",
    )
    .bind(media_id)
    .bind(&json)
    .bind(i64::from(super::RECIPE_VERSION))
    .bind(&at)
    .execute(&mut *conn)
    .await?;
    Ok(())
}

async fn record_history(
    conn: &mut SqliteConnection,
    media_id: &str,
    previous: Option<String>,
    source: &str,
    batch_id: Option<&str>,
    at: &str,
) -> Result<()> {
    sqlx::query(
        "INSERT INTO media_edit_history (media_id, batch_id, previous_json, source, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
    )
    .bind(media_id)
    .bind(batch_id)
    .bind(previous)
    .bind(source)
    .bind(at)
    .execute(&mut *conn)
    .await?;
    sqlx::query(
        "DELETE FROM media_edit_history WHERE media_id = ?1 AND id NOT IN
           (SELECT id FROM media_edit_history WHERE media_id = ?1 ORDER BY id DESC LIMIT ?2)",
    )
    .bind(media_id)
    .bind(HISTORY_KEEP)
    .execute(&mut *conn)
    .await?;
    Ok(())
}

async fn check_editable(pool: &SqlitePool, media_id: &str) -> Result<()> {
    let row: Option<(String, String, String)> =
        sqlx::query_as("SELECT media_type, extension, status FROM media WHERE id = ?1")
            .bind(media_id)
            .fetch_optional(pool)
            .await?;
    let (kind, extension, status) = row.ok_or(Error::MediaNotFound)?;
    if kind != "image" || !is_editable(&extension) || status != "active" {
        return Err(Error::InvalidInput(
            "Esta foto não pode ser melhorada (formato não suportado, vídeo ou na lixeira).".into(),
        ));
    }
    Ok(())
}

/// Fine tuning of one photo (the editor saves as the user goes).
pub async fn save(pool: &SqlitePool, media_id: &str, recipe: &EditRecipe) -> Result<MediaEdit> {
    check_editable(pool, media_id).await?;
    let mut tx = pool.begin().await?;
    save_in(&mut tx, media_id, recipe, "adjust", None).await?;
    tx.commit().await?;
    get(pool, media_id).await?.ok_or(Error::MediaNotFound)
}

/// Back to the original: the edit is removed (kept in the history).
pub async fn reset(pool: &SqlitePool, thumbnails_dir: &Path, media_ids: &[String]) -> Result<u32> {
    let mut tx = pool.begin().await?;
    let mut removed = Vec::new();
    for id in media_ids {
        if remove_in(&mut tx, id, "reset", None).await? {
            removed.push(id.clone());
        }
    }
    tx.commit().await?;
    thumbnails::remove_edit(thumbnails_dir, &removed);
    Ok(removed.len() as u32)
}

async fn remove_in(
    conn: &mut SqliteConnection,
    media_id: &str,
    source: &str,
    batch_id: Option<&str>,
) -> Result<bool> {
    let previous: Option<(String,)> =
        sqlx::query_as("SELECT recipe_json FROM media_edits WHERE media_id = ?1")
            .bind(media_id)
            .fetch_optional(&mut *conn)
            .await?;
    let Some((previous,)) = previous else {
        return Ok(false);
    };
    record_history(conn, media_id, Some(previous), source, batch_id, &now()).await?;
    sqlx::query("DELETE FROM media_edits WHERE media_id = ?1")
        .bind(media_id)
        .execute(&mut *conn)
        .await?;
    Ok(true)
}

/// Photos of a scope, newest first, and whether the editor takes each one.
async fn scope_rows(
    pool: &SqlitePool,
    library_id: &str,
    scope: &ArrangeScope,
) -> Result<Vec<(String, bool, bool)>> {
    query::validate(&scope.filter)?;
    let mut filter = query::resolve(pool, library_id, scope.filter.clone()).await?;
    filter.trashed = None;
    let mut qb = QueryBuilder::<Sqlite>::new(format!(
        "SELECT m.id,
                m.media_type = 'image' AND lower(m.extension) IN ({})
                AND m.id NOT IN (SELECT ml.media_id FROM media_labels ml
                                 JOIN labels l ON l.id = ml.label_id
                                 WHERE ml.active = 1
                                   AND ((l.dimension = 'category' AND l.value = 'screenshot')
                                     OR (l.dimension = 'momentary' AND l.value = 'document'))),
                EXISTS (SELECT 1 FROM media_edits e WHERE e.media_id = m.id)
         FROM media m",
        EDITABLE.map(|e| format!("'{e}'")).join(", ")
    ));
    query::push_where(&mut qb, library_id, &filter);
    if let Some(ids) = &scope.media_ids {
        qb.push(" AND m.id IN (SELECT value FROM json_each(")
            .push_bind(serde_json::to_string(ids).unwrap_or_else(|_| "[]".into()))
            .push("))");
    }
    qb.push(" ORDER BY m.sort_key DESC, m.id DESC");
    Ok(qb.build_query_as().fetch_all(pool).await?)
}

pub async fn summarize(
    pool: &SqlitePool,
    library_id: &str,
    scope: &ArrangeScope,
    sample: u32,
) -> Result<EnhanceSummary> {
    let rows = scope_rows(pool, library_id, scope).await?;
    let mut s = EnhanceSummary::default();
    for (id, editable, edited) in rows {
        if !editable {
            s.excluded += 1;
            continue;
        }
        s.editable += 1;
        s.edited += u32::from(edited);
        if s.sample.len() < sample as usize {
            s.sample.push(id);
        }
    }
    Ok(s)
}

/// "Aplicar": the automatic part (`auto`) on every editable photo of the scope. Photos
/// already edited keep their fine tuning and crop. Undone as a whole by [`undo_batch`].
pub async fn apply(
    pool: &SqlitePool,
    library_id: &str,
    scope: &ArrangeScope,
    auto: &AutoOptions,
) -> Result<EditBatch> {
    let ids: Vec<String> = scope_rows(pool, library_id, scope)
        .await?
        .into_iter()
        .filter(|(_, editable, _)| *editable)
        .map(|(id, ..)| id)
        .collect();
    if ids.is_empty() {
        return Err(Error::InvalidInput(
            "Nenhuma foto para melhorar aqui (vídeos, screenshots e documentos ficam de fora)."
                .into(),
        ));
    }
    let auto = AutoOptions {
        enabled: true,
        intensity: auto.intensity.clamp(0.0, 1.0),
        ..auto.clone()
    };
    let batch = EditBatch {
        id: uuid::Uuid::new_v4().to_string(),
        library_id: library_id.to_string(),
        auto: auto.clone(),
        count: ids.len() as u32,
        status: "applied".into(),
        created_at: now(),
    };
    let mut tx = pool.begin().await?;
    sqlx::query(
        "INSERT INTO edit_batches (id, library_id, recipe_json, count, status, created_at)
         VALUES (?1, ?2, ?3, ?4, 'applied', ?5)",
    )
    .bind(&batch.id)
    .bind(library_id)
    .bind(serde_json::to_string(&auto).unwrap_or_default())
    .bind(i64::from(batch.count))
    .bind(&batch.created_at)
    .execute(&mut *tx)
    .await?;
    for id in &ids {
        let current: Option<(String,)> =
            sqlx::query_as("SELECT recipe_json FROM media_edits WHERE media_id = ?1")
                .bind(id)
                .fetch_optional(&mut *tx)
                .await?;
        let mut recipe = match current {
            // Edited in a newer PhotoVault: left alone.
            Some((json,)) => match EditRecipe::from_json(&json) {
                Ok(r) => r,
                Err(_) => continue,
            },
            None => EditRecipe::default(),
        };
        recipe.auto = auto.clone();
        save_in(&mut tx, id, &recipe, "apply", Some(&batch.id)).await?;
    }
    tx.commit().await?;
    Ok(batch)
}

/// Puts every photo of a batch back as it was before it (no edit, or the previous
/// recipe). Returns how many changed.
pub async fn undo_batch(pool: &SqlitePool, thumbnails_dir: &Path, batch_id: &str) -> Result<u32> {
    let mut tx = pool.begin().await?;
    let status: Option<(String,)> = sqlx::query_as("SELECT status FROM edit_batches WHERE id = ?1")
        .bind(batch_id)
        .fetch_optional(&mut *tx)
        .await?;
    match status {
        None => {
            return Err(Error::InvalidInput(
                "Lote de melhoria não encontrado.".into(),
            ));
        }
        Some((s,)) if s == "undone" => return Ok(0),
        _ => {}
    }
    let entries: Vec<(String, Option<String>)> = sqlx::query_as(
        "SELECT media_id, previous_json FROM media_edit_history WHERE batch_id = ?1 ORDER BY id",
    )
    .bind(batch_id)
    .fetch_all(&mut *tx)
    .await?;
    let mut cleared = Vec::new();
    let at = now();
    for (media_id, previous) in &entries {
        match previous {
            None => {
                sqlx::query("DELETE FROM media_edits WHERE media_id = ?1")
                    .bind(media_id)
                    .execute(&mut *tx)
                    .await?;
                cleared.push(media_id.clone());
            }
            Some(json) => {
                sqlx::query(
                    "UPDATE media_edits SET recipe_json = ?2, revision = revision + 1,
                         thumb_error = NULL, updated_at = ?3 WHERE media_id = ?1",
                )
                .bind(media_id)
                .bind(json)
                .bind(&at)
                .execute(&mut *tx)
                .await?;
            }
        }
    }
    sqlx::query("DELETE FROM media_edit_history WHERE batch_id = ?1")
        .bind(batch_id)
        .execute(&mut *tx)
        .await?;
    sqlx::query("UPDATE edit_batches SET status = 'undone' WHERE id = ?1")
        .bind(batch_id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    thumbnails::remove_edit(thumbnails_dir, &cleared);
    Ok(entries.len() as u32)
}

pub async fn batches(pool: &SqlitePool, library_id: &str, limit: u32) -> Result<Vec<EditBatch>> {
    let rows: Vec<(String, String, String, i64, String, String)> = sqlx::query_as(
        "SELECT id, library_id, recipe_json, count, status, created_at FROM edit_batches
         WHERE library_id = ?1 ORDER BY created_at DESC LIMIT ?2",
    )
    .bind(library_id)
    .bind(i64::from(limit))
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(id, library_id, json, count, status, created_at)| EditBatch {
                id,
                library_id,
                auto: serde_json::from_str(&json).unwrap_or_default(),
                count: small(count),
                status,
                created_at,
            },
        )
        .collect())
}

/// An edit whose thumbnails are behind its recipe.
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct PendingThumb {
    pub media_id: String,
    pub revision: i64,
    pub recipe_json: String,
    pub auto_json: Option<String>,
    pub sha256: Option<String>,
    pub root: String,
    pub relative_path: String,
}

pub async fn pending_thumbs(pool: &SqlitePool, limit: u32) -> Result<Vec<PendingThumb>> {
    Ok(sqlx::query_as(
        "SELECT e.media_id, e.revision, e.recipe_json, e.auto_json, m.sha256,
                l.root_path AS root, m.relative_path
         FROM media_edits e JOIN media m ON m.id = e.media_id
         JOIN libraries l ON l.id = m.library_id
         WHERE e.thumb_revision < e.revision AND e.thumb_error IS NULL AND m.status = 'active'
         ORDER BY e.updated_at LIMIT ?1",
    )
    .bind(i64::from(limit))
    .fetch_all(pool)
    .await?)
}

/// Thumbnails of `revision` written (and the automatic values computed for them).
pub async fn thumb_done(
    pool: &SqlitePool,
    media_id: &str,
    revision: i64,
    auto: Option<AutoCache>,
) -> Result<()> {
    let auto_json = auto.and_then(|a| serde_json::to_string(&a).ok());
    sqlx::query(
        "UPDATE media_edits SET thumb_revision = ?2, auto_json = COALESCE(?3, auto_json)
         WHERE media_id = ?1 AND revision >= ?2",
    )
    .bind(media_id)
    .bind(revision)
    .bind(auto_json)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn thumb_failed(
    pool: &SqlitePool,
    media_id: &str,
    revision: i64,
    error: &str,
) -> Result<()> {
    sqlx::query("UPDATE media_edits SET thumb_error = ?3 WHERE media_id = ?1 AND revision = ?2")
        .bind(media_id)
        .bind(revision)
        .bind(error)
        .execute(pool)
        .await?;
    Ok(())
}

/// Photos changed by a batch (to refresh them in the UI).
pub async fn batch_media(pool: &SqlitePool, batch_id: &str) -> Result<Vec<String>> {
    Ok(
        sqlx::query_scalar("SELECT DISTINCT media_id FROM media_edit_history WHERE batch_id = ?1")
            .bind(batch_id)
            .fetch_all(pool)
            .await?,
    )
}
