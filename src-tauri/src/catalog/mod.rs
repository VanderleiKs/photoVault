use chrono::Utc;
use serde::Serialize;
use sqlx::sqlite::{
    SqliteConnectOptions, SqliteJournalMode, SqlitePool, SqlitePoolOptions, SqliteSynchronous,
};
use std::time::Duration;
use uuid::Uuid;

/// Open the catalog (creating it if missing) and run migrations.
pub async fn init_database(db_path: &std::path::Path) -> Result<SqlitePool, sqlx::Error> {
    let options = SqliteConnectOptions::new()
        .filename(db_path)
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Normal)
        .foreign_keys(true)
        .busy_timeout(Duration::from_secs(5));

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Library {
    pub id: String,
    pub name: String,
    pub root_path: String,
    pub created_at: String,
    pub last_scan_at: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct LibraryStats {
    pub total_photos: i64,
    pub total_videos: i64,
    pub total_size: i64,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Photo {
    pub id: String,
    pub library_id: String,
    pub relative_path: String,
    pub filename: String,
    pub media_type: String,
    pub file_size: i64,
    pub width: Option<i64>,
    pub height: Option<i64>,
    pub captured_at: Option<String>,
    pub sha256: Option<String>,
    pub perceptual_hash: Option<String>,
    pub quality_score: Option<f64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct PhotoNavigation {
    pub prev_id: Option<String>,
    pub next_id: Option<String>,
}

const PHOTO_COLUMNS: &str = "id, library_id, relative_path, filename, media_type, \
     file_size, width, height, captured_at, sha256, perceptual_hash, quality_score, \
     created_at, updated_at";

/// Gallery order: newest first, photos without date last, `id` as tie-breaker.
/// `get_photo_navigation` must use the same ordering.
const PHOTO_ORDER_KEY: &str = "COALESCE(captured_at, '')";

pub async fn create_library(
    pool: &SqlitePool,
    name: &str,
    root_path: &str,
) -> Result<Library, sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO libraries (id, name, root_path, created_at, last_scan_at)
         VALUES (?1, ?2, ?3, ?4, NULL)",
    )
    .bind(&id)
    .bind(name)
    .bind(root_path)
    .bind(&now)
    .execute(pool)
    .await?;

    get_library(pool, &id)
        .await?
        .ok_or(sqlx::Error::RowNotFound)
}

pub async fn list_libraries(pool: &SqlitePool) -> Result<Vec<Library>, sqlx::Error> {
    sqlx::query_as(
        "SELECT id, name, root_path, created_at, last_scan_at
         FROM libraries
         ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await
}

pub async fn get_library(pool: &SqlitePool, id: &str) -> Result<Option<Library>, sqlx::Error> {
    sqlx::query_as(
        "SELECT id, name, root_path, created_at, last_scan_at
         FROM libraries
         WHERE id = ?1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

/// Delete a library (does NOT delete photos from disk).
pub async fn delete_library(pool: &SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM libraries WHERE id = ?1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_last_scan(pool: &SqlitePool, library_id: &str) -> Result<(), sqlx::Error> {
    let now = Utc::now().to_rfc3339();
    sqlx::query("UPDATE libraries SET last_scan_at = ?1 WHERE id = ?2")
        .bind(&now)
        .bind(library_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_library_stats(
    pool: &SqlitePool,
    library_id: &str,
) -> Result<LibraryStats, sqlx::Error> {
    let (total_photos, total_videos, total_size): (i64, i64, i64) = sqlx::query_as(
        "SELECT
            COUNT(CASE WHEN media_type = 'image' THEN 1 END),
            COUNT(CASE WHEN media_type = 'video' THEN 1 END),
            COALESCE(SUM(file_size), 0)
         FROM photos
         WHERE library_id = ?1",
    )
    .bind(library_id)
    .fetch_one(pool)
    .await?;

    Ok(LibraryStats {
        total_photos,
        total_videos,
        total_size,
    })
}

/// Photos of a library, paginated (`page` starts at 1).
pub async fn get_photos(
    pool: &SqlitePool,
    library_id: &str,
    page: i64,
    limit: i64,
) -> Result<Vec<Photo>, sqlx::Error> {
    let limit = limit.clamp(1, 10_000);
    let offset = (page.max(1) - 1) * limit;

    sqlx::query_as(&format!(
        "SELECT {PHOTO_COLUMNS} FROM photos
         WHERE library_id = ?1
         ORDER BY {PHOTO_ORDER_KEY} DESC, id DESC
         LIMIT ?2 OFFSET ?3"
    ))
    .bind(library_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await
}

pub async fn get_photo(pool: &SqlitePool, photo_id: &str) -> Result<Option<Photo>, sqlx::Error> {
    sqlx::query_as(&format!("SELECT {PHOTO_COLUMNS} FROM photos WHERE id = ?1"))
        .bind(photo_id)
        .fetch_optional(pool)
        .await
}

/// Neighbours of a photo in gallery order, within the same library.
/// `prev_id` is the item before it in the gallery (newer), `next_id` the one after (older).
pub async fn get_photo_navigation(
    pool: &SqlitePool,
    photo_id: &str,
) -> Result<PhotoNavigation, sqlx::Error> {
    let current: Option<(String, String)> = sqlx::query_as(&format!(
        "SELECT library_id, {PHOTO_ORDER_KEY} FROM photos WHERE id = ?1"
    ))
    .bind(photo_id)
    .fetch_optional(pool)
    .await?;

    let Some((library_id, key)) = current else {
        return Ok(PhotoNavigation {
            prev_id: None,
            next_id: None,
        });
    };

    let neighbour = |cmp: &str, dir: &str| {
        format!(
            "SELECT id FROM photos
             WHERE library_id = ?1 AND ({PHOTO_ORDER_KEY}, id) {cmp} (?2, ?3)
             ORDER BY {PHOTO_ORDER_KEY} {dir}, id {dir}
             LIMIT 1"
        )
    };

    let prev_id: Option<String> = sqlx::query_scalar(&neighbour(">", "ASC"))
        .bind(&library_id)
        .bind(&key)
        .bind(photo_id)
        .fetch_optional(pool)
        .await?;

    let next_id: Option<String> = sqlx::query_scalar(&neighbour("<", "DESC"))
        .bind(&library_id)
        .bind(&key)
        .bind(photo_id)
        .fetch_optional(pool)
        .await?;

    Ok(PhotoNavigation { prev_id, next_id })
}

/// Absolute location of a photo on disk: (library root, relative path, media type).
pub async fn get_photo_location(
    pool: &SqlitePool,
    photo_id: &str,
) -> Result<Option<(String, String, String)>, sqlx::Error> {
    sqlx::query_as(
        "SELECT l.root_path, p.relative_path, p.media_type
         FROM photos p JOIN libraries l ON l.id = p.library_id
         WHERE p.id = ?1",
    )
    .bind(photo_id)
    .fetch_optional(pool)
    .await
}

#[cfg(test)]
mod tests {
    use super::*;

    async fn temp_pool() -> (SqlitePool, std::path::PathBuf) {
        let dir = std::env::temp_dir().join(format!("photovault-test-{}", Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        // The file does not exist yet: init must create it.
        let pool = init_database(&dir.join("catalog.db")).await.unwrap();
        (pool, dir)
    }

    async fn insert(pool: &SqlitePool, library_id: &str, id: &str, captured_at: Option<&str>) {
        sqlx::query(
            "INSERT INTO photos (id, library_id, relative_path, filename, media_type, file_size,
                                 captured_at, created_at, updated_at)
             VALUES (?1, ?2, ?1, ?1, 'image', 1, ?3, '', '')",
        )
        .bind(id)
        .bind(library_id)
        .bind(captured_at)
        .execute(pool)
        .await
        .unwrap();
    }

    #[tokio::test]
    async fn gallery_order_and_navigation_agree() {
        let (pool, dir) = temp_pool().await;
        let lib = create_library(&pool, "Teste", "/fotos").await.unwrap();
        let other = create_library(&pool, "Outra", "/outra").await.unwrap();

        insert(&pool, &lib.id, "a", Some("2025-07-12T10:00:00Z")).await;
        insert(&pool, &lib.id, "b", Some("2025-07-11T10:00:00Z")).await;
        insert(&pool, &lib.id, "c", Some("2025-07-11T10:00:00Z")).await; // same date as b
        insert(&pool, &lib.id, "d", None).await;
        insert(&pool, &other.id, "z", Some("2025-07-11T12:00:00Z")).await;

        let ids: Vec<String> = get_photos(&pool, &lib.id, 1, 50)
            .await
            .unwrap()
            .into_iter()
            .map(|p| p.id)
            .collect();
        assert_eq!(ids, ["a", "c", "b", "d"]);

        // Walking `next` from the first photo visits the gallery in order.
        let mut walked = vec!["a".to_string()];
        while let Some(next) = get_photo_navigation(&pool, walked.last().unwrap())
            .await
            .unwrap()
            .next_id
        {
            walked.push(next);
        }
        assert_eq!(walked, ids);

        let nav = get_photo_navigation(&pool, "c").await.unwrap();
        assert_eq!(nav.prev_id.as_deref(), Some("a"));
        assert_eq!(nav.next_id.as_deref(), Some("b"));

        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn deleting_library_cascades_to_photos() {
        let (pool, dir) = temp_pool().await;
        let lib = create_library(&pool, "Teste", "/fotos").await.unwrap();
        insert(&pool, &lib.id, "a", None).await;

        delete_library(&pool, &lib.id).await.unwrap();

        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM photos")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(count, 0);
        let _ = std::fs::remove_dir_all(dir);
    }
}
