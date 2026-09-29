//! Embeddings: stored per photo (`media_embeddings`), kept in memory per library for the
//! content search (a scan of 100k vectors takes a few ms).

use super::clip::{DIM, dot};
use super::{MODEL_ID, engine, scenes};
use crate::error::Result;
use chrono::Utc;
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, LazyLock, Mutex};

/// Bytes of a stored vector: f32 scale + one i8 per dimension.
const BYTES: usize = 4 + DIM;

/// Unit vector → scale + int8 (per-vector scale: no dimension is clipped).
pub fn encode(v: &[f32]) -> Vec<u8> {
    let max = v.iter().fold(0f32, |m, x| m.max(x.abs())).max(1e-9);
    let scale = max / 127.0;
    let mut out = Vec::with_capacity(BYTES);
    out.extend_from_slice(&scale.to_le_bytes());
    out.extend(
        v.iter()
            .map(|x| (x / scale).round().clamp(-127.0, 127.0) as i8 as u8),
    );
    out
}

pub fn decode(bytes: &[u8]) -> Option<Vec<f32>> {
    if bytes.len() != BYTES {
        return None;
    }
    let scale = f32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]);
    Some(
        bytes[4..]
            .iter()
            .map(|&b| f32::from(b as i8) * scale)
            .collect(),
    )
}

/// Photos (and videos with a captured frame) without an embedding of this model and of
/// their current preview: (id, thumb_version), newest first.
pub async fn pending(pool: &SqlitePool, limit: u32) -> Result<Vec<(String, i64)>> {
    Ok(sqlx::query_as(
        "SELECT m.id, m.thumb_version FROM media m
         WHERE m.status = 'active' AND m.thumb_version > 0
           AND NOT EXISTS (SELECT 1 FROM media_embeddings e WHERE e.media_id = m.id AND e.model = ?1
                           AND e.thumb_version = m.thumb_version)
         ORDER BY m.sort_key DESC, m.id DESC LIMIT ?2",
    )
    .bind(MODEL_ID)
    .bind(i64::from(limit))
    .fetch_all(pool)
    .await?)
}

pub async fn pending_count(pool: &SqlitePool) -> Result<u32> {
    let n: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM media m
         WHERE m.status = 'active' AND m.thumb_version > 0
           AND NOT EXISTS (SELECT 1 FROM media_embeddings e WHERE e.media_id = m.id AND e.model = ?1
                           AND e.thumb_version = m.thumb_version)",
    )
    .bind(MODEL_ID)
    .fetch_one(pool)
    .await?;
    Ok(n as u32)
}

pub async fn indexed_count(pool: &SqlitePool) -> Result<u32> {
    let n: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM media_embeddings e JOIN media m ON m.id = e.media_id
         WHERE e.model = ?1 AND e.vector IS NOT NULL AND m.status = 'active'",
    )
    .bind(MODEL_ID)
    .fetch_one(pool)
    .await?;
    Ok(n as u32)
}

/// Result of one photo: Ok = the vector; Err = why its preview couldn't be read (not
/// retried until the preview changes).
pub struct Embedded {
    pub media_id: String,
    pub thumb_version: i64,
    pub result: std::result::Result<Vec<f32>, String>,
}

pub async fn store(pool: &SqlitePool, results: &[Embedded]) -> Result<()> {
    let now = Utc::now().to_rfc3339();
    let mut tx = pool.begin().await?;
    for Embedded {
        media_id,
        thumb_version,
        result,
    } in results
    {
        let (vector, error) = match result {
            Ok(v) => (Some(encode(v)), None),
            Err(e) => (None, Some(e.chars().take(300).collect::<String>())),
        };
        sqlx::query(
            "INSERT INTO media_embeddings (media_id, model, thumb_version, vector, error, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT (media_id) DO UPDATE SET model = excluded.model, thumb_version = excluded.thumb_version,
                vector = excluded.vector, error = excluded.error, created_at = excluded.created_at",
        )
        .bind(media_id)
        .bind(MODEL_ID)
        .bind(thumb_version)
        .bind(vector)
        .bind(error)
        .bind(&now)
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;
    GENERATION.fetch_add(1, Ordering::AcqRel);
    Ok(())
}

pub async fn delete_all(pool: &SqlitePool) -> Result<()> {
    sqlx::query("DELETE FROM media_embeddings")
        .execute(pool)
        .await?;
    forget();
    Ok(())
}

pub async fn vector_of(pool: &SqlitePool, media_id: &str) -> Result<Option<Vec<f32>>> {
    let blob: Option<Option<Vec<u8>>> = sqlx::query_scalar(
        "SELECT vector FROM media_embeddings WHERE media_id = ?1 AND model = ?2",
    )
    .bind(media_id)
    .bind(MODEL_ID)
    .fetch_optional(pool)
    .await?;
    Ok(blob.flatten().as_deref().and_then(decode))
}

/// Scene chips of a photo (empty without model or embedding).
pub async fn scenes_of(pool: &SqlitePool, media_id: &str) -> Result<Vec<scenes::SceneScore>> {
    let Some(engine) = engine() else {
        return Ok(Vec::new());
    };
    Ok(match vector_of(pool, media_id).await? {
        Some(v) => scenes::chips(&v, &engine.scenes),
        None => Vec::new(),
    })
}

// ---- In-memory index and search ----------------------------------------------------

/// Bumped on every write: cached indexes and results older than this are stale.
static GENERATION: AtomicU64 = AtomicU64::new(1);

struct LibraryIndex {
    generation: u64,
    ids: Vec<String>,
    vectors: Vec<f32>, // ids.len() × DIM
}

static INDEXES: LazyLock<Mutex<HashMap<String, Arc<LibraryIndex>>>> =
    LazyLock::new(Default::default);
/// Recent searches: (library, text) → (generation, hits). Typing, the gallery, the count
/// and the viewer context all ask for the same text.
type CachedSearch = ((String, String), u64, Arc<Vec<String>>);
static SEARCHES: LazyLock<Mutex<Vec<CachedSearch>>> = LazyLock::new(Default::default);
const CACHED_SEARCHES: usize = 16;

pub fn forget() {
    GENERATION.fetch_add(1, Ordering::AcqRel);
    if let Ok(mut i) = INDEXES.lock() {
        i.clear();
    }
    if let Ok(mut s) = SEARCHES.lock() {
        s.clear();
    }
}

async fn library_index(pool: &SqlitePool, library_id: &str) -> Result<Arc<LibraryIndex>> {
    let generation = GENERATION.load(Ordering::Acquire);
    if let Some(i) = INDEXES.lock().ok().and_then(|m| m.get(library_id).cloned())
        && i.generation == generation
    {
        return Ok(i);
    }
    let rows: Vec<(String, Vec<u8>)> = sqlx::query_as(
        "SELECT e.media_id, e.vector FROM media_embeddings e JOIN media m ON m.id = e.media_id
         WHERE m.library_id = ?1 AND m.status = 'active' AND e.model = ?2 AND e.vector IS NOT NULL",
    )
    .bind(library_id)
    .bind(MODEL_ID)
    .fetch_all(pool)
    .await?;
    let mut ids = Vec::with_capacity(rows.len());
    let mut vectors = Vec::with_capacity(rows.len() * DIM);
    for (id, blob) in rows {
        if let Some(v) = decode(&blob) {
            ids.push(id);
            vectors.extend(v);
        }
    }
    let index = Arc::new(LibraryIndex {
        generation,
        ids,
        vectors,
    });
    if let Ok(mut m) = INDEXES.lock() {
        m.insert(library_id.to_string(), Arc::clone(&index));
    }
    Ok(index)
}

/// A result must score at least this…
pub const MIN_SIMILARITY: f32 = 0.24;
/// …and be this close to the best one (the scale of CLIP scores varies by query).
pub const MAX_BELOW_BEST: f32 = 0.05;
const MAX_HITS: usize = 2000;

/// Photos whose content matches `text`, best first. `None` = no model (search by name only).
pub async fn search(
    pool: &SqlitePool,
    library_id: &str,
    text: &str,
) -> Result<Option<Arc<Vec<String>>>> {
    let Some(engine) = engine() else {
        return Ok(None);
    };
    let text = text.trim().to_string();
    if text.chars().count() < 2 {
        return Ok(None);
    }
    let key = (library_id.to_string(), text.to_lowercase());
    let generation = GENERATION.load(Ordering::Acquire);
    if let Some(hit) = SEARCHES.lock().ok().and_then(|s| {
        s.iter()
            .find(|(k, g, _)| *k == key && *g == generation)
            .map(|(_, _, h)| Arc::clone(h))
    }) {
        return Ok(Some(hit));
    }
    let index = library_index(pool, library_id).await?;
    let hits = tokio::task::spawn_blocking(move || -> Result<Vec<String>> {
        let query = engine.clip.embed_text(&sentence(&text))?;
        Ok(rank(&index.ids, &index.vectors, &query))
    })
    .await??;
    let hits = Arc::new(hits);
    if let Ok(mut s) = SEARCHES.lock() {
        s.retain(|(k, _, _)| *k != key);
        s.insert(0, (key, generation, Arc::clone(&hits)));
        s.truncate(CACHED_SEARCHES);
    }
    Ok(Some(hits))
}

/// "cachorro" → "uma foto de cachorro": CLIP was trained on captions, and bare words find
/// less (`ai_eval`: recall 78 % → 84 %; "carro" 3 → 8 of 12). Text that already says
/// "foto…"/"imagem…" stays.
pub fn sentence(text: &str) -> String {
    let lower = text.to_lowercase();
    if ["foto", "uma foto", "imagem", "uma imagem"]
        .iter()
        .any(|p| lower.starts_with(p))
    {
        text.to_string()
    } else {
        format!("uma foto de {text}")
    }
}

/// Ids above the thresholds, best first.
pub fn rank(ids: &[String], vectors: &[f32], query: &[f32]) -> Vec<String> {
    let mut scored: Vec<(f32, usize)> = vectors
        .as_chunks::<DIM>()
        .0
        .iter()
        .enumerate()
        .map(|(i, v)| (dot(v, query), i))
        .collect();
    let best = scored.iter().map(|s| s.0).fold(f32::MIN, f32::max);
    let floor = MIN_SIMILARITY.max(best - MAX_BELOW_BEST);
    scored.retain(|s| s.0 >= floor);
    scored.sort_by(|a, b| b.0.total_cmp(&a.0));
    scored.truncate(MAX_HITS);
    scored.into_iter().map(|(_, i)| ids[i].clone()).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn int8_vectors_keep_the_similarity() {
        let a = super::super::clip::normalized(
            (0..DIM)
                .map(|i| ((i * 37 % 101) as f32 - 50.0) / 50.0)
                .collect(),
        );
        let b = super::super::clip::normalized(
            (0..DIM)
                .map(|i| ((i * 53 % 97) as f32 - 48.0) / 48.0)
                .collect(),
        );
        let (qa, qb) = (decode(&encode(&a)).unwrap(), decode(&encode(&b)).unwrap());
        assert!((dot(&qa, &b) - dot(&a, &b)).abs() < 0.01);
        assert!((dot(&qa, &a) - 1.0).abs() < 0.01);
        assert_eq!(encode(&a).len(), BYTES);
        assert!(decode(&[0; 10]).is_none());
        let _ = qb;
    }

    #[test]
    fn short_queries_become_captions() {
        assert_eq!(sentence("cachorro"), "uma foto de cachorro");
        assert_eq!(
            sentence("praia ao pôr do sol"),
            "uma foto de praia ao pôr do sol"
        );
        assert_eq!(
            sentence("Foto de um carro vermelho"),
            "Foto de um carro vermelho"
        );
        assert_eq!(sentence("Imagem de um farol"), "Imagem de um farol");
    }

    #[test]
    fn ranking_keeps_the_best_and_those_close_to_it() {
        let ids: Vec<String> = ["a", "b", "c", "d"].map(String::from).to_vec();
        // Scores 0.30, 0.27, 0.22, 0.10 along one axis.
        let mut vectors = vec![0f32; 4 * DIM];
        for (i, s) in [0.30f32, 0.27, 0.22, 0.10].iter().enumerate() {
            vectors[i * DIM] = *s;
        }
        let mut query = vec![0f32; DIM];
        query[0] = 1.0;
        assert_eq!(rank(&ids, &vectors, &query), ["a", "b"]);
        // Nothing similar enough: nothing (not "the least bad").
        query[0] = 0.5;
        assert!(rank(&ids, &vectors, &query).is_empty());
    }
}
