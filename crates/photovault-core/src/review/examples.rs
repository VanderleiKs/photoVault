//! Examples the user gives of what to remove ("fotos como esta eu apago") or to never
//! suggest. Photos whose descriptor is close to a "remove" example (and closer to it than
//! to any "keep" example) get the `EXAMPLE` reason. Examples are global and carry their
//! own descriptor and thumbnail, so they outlive the photo they came from.

use crate::analysis::descriptor::{self, DESCRIPTOR_LEN};
use crate::analysis::store::{self, AnalyzeInput, mark_all_dirty};
use crate::catalog::AnalysisSettings;
use crate::catalog::MediaType;
use crate::error::{Error, Result};
use crate::ingestion::processor::{self, SourceFile};
use crate::thumbnails;
use base64::Engine;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::SqlitePool;
use std::path::Path;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum ExampleIntent {
    /// Suggest photos like this one for removal.
    Remove,
    /// Never suggest photos like this one (wins over "remove" when closer).
    Keep,
}

impl ExampleIntent {
    fn as_str(self) -> &'static str {
        match self {
            ExampleIntent::Remove => "remove",
            ExampleIntent::Keep => "keep",
        }
    }
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ReviewExample {
    pub id: String,
    pub intent: ExampleIntent,
    pub name: String,
    /// `data:image/webp;base64,…`
    pub thumbnail: String,
    /// Photo of the catalog it came from (absent for files picked from disk).
    pub media_id: Option<String>,
    pub created_at: String,
    /// Photos currently suggested because of it.
    pub matches: u32,
}

pub const MAX_EXAMPLES: i64 = 200;
/// A "keep" example must be at least this much less similar to lose to a "remove" one.
const KEEP_MARGIN: f64 = 0.02;

type ExampleRow = (String, String, String, String, Option<String>, String, i64);

pub async fn list(pool: &SqlitePool) -> Result<Vec<ReviewExample>> {
    let rows: Vec<ExampleRow> = sqlx::query_as(
        "SELECT e.id, e.intent, e.name, e.thumbnail, e.media_id, e.created_at,
                (SELECT COUNT(*) FROM review_candidates c
                 WHERE c.reason = 'EXAMPLE' AND c.group_id = e.id AND c.status = 'pending')
         FROM review_examples e ORDER BY e.created_at DESC",
    )
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(id, intent, name, thumbnail, media_id, created_at, matches)| ReviewExample {
                id,
                intent: if intent == "keep" {
                    ExampleIntent::Keep
                } else {
                    ExampleIntent::Remove
                },
                name,
                thumbnail,
                media_id,
                created_at,
                matches: matches as u32,
            },
        )
        .collect())
}

/// Photos of the catalog as examples. They must be analysed (have a descriptor). A photo
/// that already is an example just changes intent.
pub async fn add_from_media(
    pool: &SqlitePool,
    thumbnails_dir: &Path,
    ids: &[String],
    intent: ExampleIntent,
) -> Result<u32> {
    let mut added = 0;
    for id in ids {
        let row: Option<(String, Option<Vec<u8>>)> = sqlx::query_as(
            "SELECT m.filename, q.descriptor FROM media m
             LEFT JOIN media_quality q ON q.media_id = m.id WHERE m.id = ?1",
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;
        let (name, descriptor) = row.ok_or(Error::MediaNotFound)?;
        let descriptor = descriptor
            .filter(|d| d.len() == DESCRIPTOR_LEN * 4)
            .ok_or_else(|| Error::InvalidInput(format!("\"{name}\" ainda não foi analisada.")))?;
        let updated = sqlx::query("UPDATE review_examples SET intent = ?1 WHERE media_id = ?2")
            .bind(intent.as_str())
            .bind(id)
            .execute(pool)
            .await?
            .rows_affected();
        if updated > 0 {
            continue;
        }
        let thumb = thumbnails::path(thumbnails_dir, id, thumbnails::GRID_SIZE);
        let webp = tokio::fs::read(&thumb).await?;
        insert(pool, intent, Some(id), &name, &descriptor, &webp).await?;
        added += 1;
    }
    mark_all_dirty(pool).await?;
    Ok(added)
}

/// An image file from anywhere on disk (read only, nothing is written next to it).
pub async fn add_from_file(
    pool: &SqlitePool,
    path: &Path,
    intent: ExampleIntent,
    t: &AnalysisSettings,
) -> Result<ReviewExample> {
    let path = path.to_path_buf();
    let t = t.clone();
    let (name, descriptor, webp) = tokio::task::spawn_blocking(move || describe_file(&path, &t))
        .await?
        .map_err(Error::InvalidInput)?;
    let id = insert(pool, intent, None, &name, &descriptor, &webp).await?;
    mark_all_dirty(pool).await?;
    list(pool)
        .await?
        .into_iter()
        .find(|e| e.id == id)
        .ok_or_else(|| Error::Internal("Exemplo não gravado.".into()))
}

/// (name, descriptor bytes, 256 px WebP)
fn describe_file(
    path: &Path,
    t: &AnalysisSettings,
) -> std::result::Result<(String, Vec<u8>, Vec<u8>), String> {
    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default();
    let extension = path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();
    let bytes = std::fs::read(path).map_err(|e| format!("Não foi possível ler \"{name}\": {e}"))?;
    let processed = processor::process_image(
        &bytes,
        &SourceFile {
            filename: &name,
            extension: &extension,
            media_type: MediaType::Image,
            modified: None,
        },
    );
    if let Some(e) = processed.decode_error {
        return Err(e);
    }
    let thumb = |size| {
        processed
            .thumbnails
            .iter()
            .find(|(s, _)| *s == size)
            .map(|(_, b)| b.clone())
    };
    let (Some(grid), Some(preview)) = (
        thumb(thumbnails::GRID_SIZE),
        thumb(thumbnails::PREVIEW_SIZE),
    ) else {
        return Err(format!("Não foi possível abrir \"{name}\"."));
    };
    let img = image::load_from_memory_with_format(&preview, image::ImageFormat::WebP)
        .map_err(|e| e.to_string())?;
    let input = AnalyzeInput {
        media_id: String::new(),
        library_id: String::new(),
        filename: name.clone(),
        relative_path: name.clone(),
        extension,
        width: processed.width.map(i64::from),
        height: processed.height.map(i64::from),
        camera_model: processed.capture.camera_model,
        camera_make: processed.capture.camera_make,
    };
    let analysis = store::analyze_image(&img, &input, t);
    Ok((name, descriptor::to_bytes(&analysis.descriptor), grid))
}

async fn insert(
    pool: &SqlitePool,
    intent: ExampleIntent,
    media_id: Option<&str>,
    name: &str,
    descriptor: &[u8],
    webp: &[u8],
) -> Result<String> {
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM review_examples")
        .fetch_one(pool)
        .await?;
    if count >= MAX_EXAMPLES {
        return Err(Error::InvalidInput(format!(
            "Limite de {MAX_EXAMPLES} exemplos atingido. Remova alguns antes de adicionar outros."
        )));
    }
    let id = uuid::Uuid::now_v7().to_string();
    let thumbnail = format!(
        "data:image/webp;base64,{}",
        base64::engine::general_purpose::STANDARD.encode(webp)
    );
    sqlx::query(
        "INSERT INTO review_examples (id, intent, media_id, name, descriptor, thumbnail, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
    )
    .bind(&id)
    .bind(intent.as_str())
    .bind(media_id)
    .bind(name)
    .bind(descriptor)
    .bind(thumbnail)
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;
    Ok(id)
}

pub async fn set_intent(pool: &SqlitePool, id: &str, intent: ExampleIntent) -> Result<()> {
    sqlx::query("UPDATE review_examples SET intent = ?1 WHERE id = ?2")
        .bind(intent.as_str())
        .bind(id)
        .execute(pool)
        .await?;
    mark_all_dirty(pool).await
}

pub async fn remove(pool: &SqlitePool, id: &str) -> Result<()> {
    sqlx::query("DELETE FROM review_examples WHERE id = ?1")
        .bind(id)
        .execute(pool)
        .await?;
    mark_all_dirty(pool).await
}

/// Photos of a library like a "remove" example: (media id, example id, similarity).
pub(crate) async fn matches(
    pool: &SqlitePool,
    library_id: &str,
    threshold: f64,
) -> Result<Vec<(String, String, f64)>> {
    let examples: Vec<(String, String, Vec<u8>)> =
        sqlx::query_as("SELECT id, intent, descriptor FROM review_examples")
            .fetch_all(pool)
            .await?;
    if !examples.iter().any(|e| e.1 == "remove") {
        return Ok(Vec::new());
    }
    let photos: Vec<(String, Vec<u8>)> = sqlx::query_as(
        "SELECT q.media_id, q.descriptor FROM media_quality q JOIN media m ON m.id = q.media_id
         WHERE m.library_id = ?1 AND m.status = 'active' AND q.descriptor IS NOT NULL",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?;
    Ok(tokio::task::spawn_blocking(move || {
        let examples: Vec<(String, bool, Vec<f32>)> = examples
            .into_iter()
            .map(|(id, intent, d)| (id, intent == "remove", descriptor::from_bytes(&d)))
            .collect();
        photos
            .into_iter()
            .filter_map(|(media, d)| {
                let d = descriptor::from_bytes(&d);
                let mut remove: Option<(f64, &str)> = None;
                let mut keep = 0f64;
                for (id, is_remove, e) in &examples {
                    let s = descriptor::similarity(&d, e);
                    if *is_remove {
                        if remove.is_none_or(|(best, _)| s > best) {
                            remove = Some((s, id));
                        }
                    } else {
                        keep = keep.max(s);
                    }
                }
                let (score, example) = remove?;
                (score >= threshold && score > keep + KEEP_MARGIN)
                    .then(|| (media, example.to_string(), score))
            })
            .collect()
    })
    .await?)
}
