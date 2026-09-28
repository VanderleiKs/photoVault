use crate::error::{Error, Result};
use serde::Serialize;
use specta::Type;
use sqlx::SqlitePool;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(type_name = "TEXT", rename_all = "lowercase")]
pub enum MediaType {
    Image,
    Video,
}

impl MediaType {
    pub fn as_str(self) -> &'static str {
        match self {
            MediaType::Image => "image",
            MediaType::Video => "video",
        }
    }
}

/// Media item as exposed to the frontend.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MediaItem {
    pub id: String,
    pub library_id: String,
    pub relative_path: String,
    pub filename: String,
    pub extension: String,
    pub media_type: MediaType,
    #[specta(type = specta_typescript::Number)]
    pub file_size: u64,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub duration_ms: Option<u32>,
    pub captured_at: Option<String>,
    pub date_source: Option<String>,
    pub camera_make: Option<String>,
    pub camera_model: Option<String>,
    pub is_favorite: bool,
    pub indexed_at: String,
}

#[derive(sqlx::FromRow)]
struct MediaRow {
    id: String,
    library_id: String,
    relative_path: String,
    filename: String,
    extension: String,
    media_type: MediaType,
    file_size: i64,
    width: Option<i64>,
    height: Option<i64>,
    duration_ms: Option<i64>,
    captured_at: Option<String>,
    date_source: Option<String>,
    camera_make: Option<String>,
    camera_model: Option<String>,
    is_favorite: bool,
    indexed_at: String,
}

impl From<MediaRow> for MediaItem {
    fn from(r: MediaRow) -> Self {
        let small = |v: Option<i64>| v.and_then(|n| u32::try_from(n).ok());
        MediaItem {
            id: r.id,
            library_id: r.library_id,
            relative_path: r.relative_path,
            filename: r.filename,
            extension: r.extension,
            media_type: r.media_type,
            file_size: r.file_size as u64,
            width: small(r.width),
            height: small(r.height),
            duration_ms: small(r.duration_ms),
            captured_at: r.captured_at,
            date_source: r.date_source,
            camera_make: r.camera_make,
            camera_model: r.camera_model,
            is_favorite: r.is_favorite,
            indexed_at: r.indexed_at,
        }
    }
}

/// One page of the gallery. Pass `next_cursor` back to get the following page.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MediaPage {
    pub items: Vec<MediaItem>,
    pub next_cursor: Option<String>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MediaNavigation {
    /// Previous item in gallery order (newer).
    pub prev_id: Option<String>,
    /// Next item in gallery order (older).
    pub next_id: Option<String>,
    /// 1-based position and total, for "12 / 426".
    pub position: u32,
    pub total: u32,
}

const COLUMNS: &str = "id, library_id, relative_path, filename, extension, media_type, file_size, \
     width, height, duration_ms, captured_at, date_source, camera_make, camera_model, \
     is_favorite, indexed_at";

const MAX_PAGE: u32 = 500;
const CURSOR_SEP: char = '\u{1f}';

fn encode_cursor(sort_key: &str, id: &str) -> String {
    format!("{sort_key}{CURSOR_SEP}{id}")
}

fn decode_cursor(cursor: &str) -> Result<(String, String)> {
    cursor
        .split_once(CURSOR_SEP)
        .map(|(k, id)| (k.to_string(), id.to_string()))
        .ok_or_else(|| Error::InvalidInput("Cursor de paginação inválido.".into()))
}

/// Active media of a library in gallery order: newest first, undated last.
pub async fn list(
    pool: &SqlitePool,
    library_id: &str,
    cursor: Option<&str>,
    limit: u32,
) -> Result<MediaPage> {
    let limit = limit.clamp(1, MAX_PAGE);
    let (key, id) = match cursor {
        Some(c) => {
            let (k, i) = decode_cursor(c)?;
            (Some(k), Some(i))
        }
        None => (None, None),
    };

    let mut rows: Vec<(MediaRow, String)> = sqlx::query_as::<_, MediaRow>(&format!(
        "SELECT {COLUMNS} FROM media
         WHERE library_id = ?1 AND status = 'active'
           AND (?2 IS NULL OR (sort_key, id) < (?2, ?3))
         ORDER BY sort_key DESC, id DESC
         LIMIT ?4"
    ))
    .bind(library_id)
    .bind(&key)
    .bind(&id)
    .bind(limit as i64 + 1)
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(|row| {
        let key = row.captured_at.clone().unwrap_or_default();
        (row, key)
    })
    .collect();

    let has_more = rows.len() > limit as usize;
    rows.truncate(limit as usize);
    let next_cursor = has_more
        .then(|| rows.last().map(|(row, key)| encode_cursor(key, &row.id)))
        .flatten();

    Ok(MediaPage {
        items: rows.into_iter().map(|(row, _)| row.into()).collect(),
        next_cursor,
    })
}

pub async fn get(pool: &SqlitePool, id: &str) -> Result<MediaItem> {
    sqlx::query_as::<_, MediaRow>(&format!("SELECT {COLUMNS} FROM media WHERE id = ?1"))
        .bind(id)
        .fetch_optional(pool)
        .await?
        .map(Into::into)
        .ok_or(Error::MediaNotFound)
}

/// Neighbours and position of a media item in gallery order, within its library.
pub async fn navigation(pool: &SqlitePool, id: &str) -> Result<MediaNavigation> {
    let (library_id, key): (String, String) =
        sqlx::query_as("SELECT library_id, sort_key FROM media WHERE id = ?1")
            .bind(id)
            .fetch_optional(pool)
            .await?
            .ok_or(Error::MediaNotFound)?;

    let neighbour = |cmp: &str, dir: &str| {
        format!(
            "SELECT id FROM media
             WHERE library_id = ?1 AND status = 'active' AND (sort_key, id) {cmp} (?2, ?3)
             ORDER BY sort_key {dir}, id {dir}
             LIMIT 1"
        )
    };
    let fetch = |sql: String| {
        let (library_id, key) = (library_id.clone(), key.clone());
        async move {
            sqlx::query_scalar::<_, String>(&sql)
                .bind(library_id)
                .bind(key)
                .bind(id)
                .fetch_optional(pool)
                .await
        }
    };

    let prev_id = fetch(neighbour(">", "ASC")).await?;
    let next_id = fetch(neighbour("<", "DESC")).await?;

    let (before, total): (i64, i64) = sqlx::query_as(
        "SELECT
            COUNT(CASE WHEN (sort_key, id) > (?2, ?3) THEN 1 END),
            COUNT(*)
         FROM media WHERE library_id = ?1 AND status = 'active'",
    )
    .bind(&library_id)
    .bind(&key)
    .bind(id)
    .fetch_one(pool)
    .await?;

    Ok(MediaNavigation {
        prev_id,
        next_id,
        position: before as u32 + 1,
        total: total as u32,
    })
}

/// Where a media file lives: (library root, relative path, media type).
pub async fn location(pool: &SqlitePool, id: &str) -> Result<(String, String, MediaType)> {
    sqlx::query_as(
        "SELECT l.root_path, m.relative_path, m.media_type
         FROM media m JOIN libraries l ON l.id = m.library_id
         WHERE m.id = ?1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?
    .ok_or(Error::MediaNotFound)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::catalog::libraries;
    use crate::db::tests::{temp_dir, test_db};

    async fn insert(pool: &SqlitePool, library_id: &str, id: &str, captured_at: Option<&str>) {
        sqlx::query(
            "INSERT INTO media (id, library_id, relative_path, filename, extension, media_type,
                                file_size, captured_at, indexed_at, updated_at)
             VALUES (?1, ?2, ?1, ?1, 'jpg', 'image', 1, ?3, '', '')",
        )
        .bind(id)
        .bind(library_id)
        .bind(captured_at)
        .execute(pool)
        .await
        .unwrap();
    }

    #[tokio::test]
    async fn keyset_pages_and_navigation_agree() {
        let (pool, dir) = test_db().await;
        let lib = libraries::create(&pool, "A", temp_dir().to_str().unwrap())
            .await
            .unwrap();
        let other = libraries::create(&pool, "B", temp_dir().to_str().unwrap())
            .await
            .unwrap();

        insert(&pool, &lib.id, "a", Some("2025-07-12T10:00:00Z")).await;
        insert(&pool, &lib.id, "b", Some("2025-07-11T10:00:00Z")).await;
        insert(&pool, &lib.id, "c", Some("2025-07-11T10:00:00Z")).await; // same date as b
        insert(&pool, &lib.id, "d", None).await;
        insert(&pool, &lib.id, "e", None).await;
        insert(&pool, &other.id, "z", Some("2025-07-11T12:00:00Z")).await;

        // Page through two at a time.
        let mut ids = Vec::new();
        let mut cursor = None;
        loop {
            let page = list(&pool, &lib.id, cursor.as_deref(), 2).await.unwrap();
            ids.extend(page.items.into_iter().map(|m| m.id));
            match page.next_cursor {
                Some(c) => cursor = Some(c),
                None => break,
            }
        }
        assert_eq!(ids, ["a", "c", "b", "e", "d"]);

        // Walking `next_id` visits the same order, with correct positions.
        let mut walked = vec!["a".to_string()];
        loop {
            let nav = navigation(&pool, walked.last().unwrap()).await.unwrap();
            assert_eq!(nav.position as usize, walked.len());
            assert_eq!(nav.total, 5);
            match nav.next_id {
                Some(next) => walked.push(next),
                None => break,
            }
        }
        assert_eq!(walked, ids);

        let nav = navigation(&pool, "c").await.unwrap();
        assert_eq!(nav.prev_id.as_deref(), Some("a"));
        assert_eq!(nav.next_id.as_deref(), Some("b"));
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn invalid_cursor_is_rejected() {
        let (pool, dir) = test_db().await;
        assert!(matches!(
            list(&pool, "x", Some("garbage"), 10).await,
            Err(Error::InvalidInput(_))
        ));
        let _ = std::fs::remove_dir_all(dir);
    }
}
