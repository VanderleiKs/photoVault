use chrono::Utc;
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use sqlx::Row;
use uuid::Uuid;

/// Initialize the database with migrations
pub async fn init_database(db_path: &std::path::Path) -> Result<SqlitePool, sqlx::Error> {
    let db_url = format!("sqlite://{}", db_path.display());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    // Enable WAL mode for better concurrency
    sqlx::query("PRAGMA journal_mode = WAL;")
        .execute(&pool)
        .await?;

    // Enable foreign keys
    sqlx::query("PRAGMA foreign_keys = ON;")
        .execute(&pool)
        .await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}

/// Create a new library
pub async fn create_library(
    pool: &SqlitePool,
    name: &str,
    root_path: &str,
) -> Result<String, sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO libraries (id, name, root_path, created_at, last_scan_at)
        VALUES (?1, ?2, ?3, ?4, NULL)
        "#,
    )
    .bind(&id)
    .bind(name)
    .bind(root_path)
    .bind(&now)
    .execute(pool)
    .await?;

    Ok(id)
}

/// List all libraries
pub async fn list_libraries(pool: &SqlitePool) -> Result<Vec<Library>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT id, name, root_path, created_at, last_scan_at
        FROM libraries
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    let libraries = rows
        .into_iter()
        .map(|row| Library {
            id: row.get("id"),
            name: row.get("name"),
            root_path: row.get("root_path"),
            created_at: row.get("created_at"),
            last_scan_at: row.get("last_scan_at"),
        })
        .collect();

    Ok(libraries)
}

/// Get library by ID
pub async fn get_library(pool: &SqlitePool, id: &str) -> Result<Option<Library>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        SELECT id, name, root_path, created_at, last_scan_at
        FROM libraries
        WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| Library {
        id: row.get("id"),
        name: row.get("name"),
        root_path: row.get("root_path"),
        created_at: row.get("created_at"),
        last_scan_at: row.get("last_scan_at"),
    }))
}

/// Delete a library (does NOT delete photos from disk)
pub async fn delete_library(pool: &SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM libraries WHERE id = ?1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

/// Update last scan timestamp
pub async fn update_last_scan(pool: &SqlitePool, library_id: &str) -> Result<(), sqlx::Error> {
    let now = Utc::now().to_rfc3339();
    sqlx::query("UPDATE libraries SET last_scan_at = ?1 WHERE id = ?2")
        .bind(&now)
        .bind(library_id)
        .execute(pool)
        .await?;
    Ok(())
}

/// Get library statistics
pub async fn get_library_stats(
    pool: &SqlitePool,
    library_id: &str,
) -> Result<LibraryStats, sqlx::Error> {
    let total_photos: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM photos WHERE library_id = ?1 AND media_type = 'image'",
    )
    .bind(library_id)
    .fetch_one(pool)
    .await?;

    let total_videos: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM photos WHERE library_id = ?1 AND media_type = 'video'",
    )
    .bind(library_id)
    .fetch_one(pool)
    .await?;

    let total_size: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(file_size), 0) FROM photos WHERE library_id = ?1",
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

#[derive(Debug, Clone, serde::Serialize)]
pub struct Library {
    pub id: String,
    pub name: String,
    pub root_path: String,
    pub created_at: String,
    pub last_scan_at: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct LibraryStats {
    pub total_photos: i64,
    pub total_videos: i64,
    pub total_size: i64,
}
