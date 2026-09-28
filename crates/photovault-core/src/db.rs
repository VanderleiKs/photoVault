//! SQLite connection, migrations and the one-off reset of v0.x catalogs (ADR-008).

use crate::error::Result;
use chrono::Utc;
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous};
use std::path::{Path, PathBuf};
use std::time::Duration;

pub use sqlx::SqlitePool;

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations");

pub struct Database {
    pub pool: SqlitePool,
    /// Set when a v0.x catalog was archived on this start (shown once in the UI).
    pub archived_legacy_catalog: Option<PathBuf>,
}

/// Open the catalog (creating it if missing), archive a v0.x catalog if found,
/// and run migrations.
///
/// `thumbnails_dir` is cleared when a legacy catalog is archived, because the
/// old thumbnails are keyed by ids that no longer exist.
pub async fn open(db_path: &Path, thumbnails_dir: &Path) -> Result<Database> {
    let mut pool = connect(db_path).await?;
    let mut archived = None;

    if is_legacy_catalog(&pool).await? {
        let libraries = legacy_libraries(&pool).await?;
        pool.close().await;

        let backup = archive_file(db_path)?;
        tracing::warn!(
            "Legacy v0.x catalog archived to {} ({} libraries kept)",
            backup.display(),
            libraries.len()
        );
        clear_dir(thumbnails_dir);

        pool = connect(db_path).await?;
        MIGRATOR.run(&pool).await?;
        restore_libraries(&pool, &libraries).await?;
        archived = Some(backup);
    } else {
        MIGRATOR.run(&pool).await?;
    }

    Ok(Database {
        pool,
        archived_legacy_catalog: archived,
    })
}

async fn connect(db_path: &Path) -> Result<SqlitePool> {
    let options = SqliteConnectOptions::new()
        .filename(db_path)
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Normal)
        .foreign_keys(true)
        .busy_timeout(Duration::from_secs(5));

    Ok(SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?)
}

async fn is_legacy_catalog(pool: &SqlitePool) -> Result<bool> {
    let tables: Vec<String> =
        sqlx::query_scalar("SELECT name FROM sqlite_master WHERE type = 'table'")
            .fetch_all(pool)
            .await?;
    let has = |t: &str| tables.iter().any(|n| n == t);
    Ok(has("photos") && !has("media"))
}

type LegacyLibrary = (String, String, String, String);

async fn legacy_libraries(pool: &SqlitePool) -> Result<Vec<LegacyLibrary>> {
    Ok(
        sqlx::query_as("SELECT id, name, root_path, created_at FROM libraries")
            .fetch_all(pool)
            .await?,
    )
}

async fn restore_libraries(pool: &SqlitePool, libraries: &[LegacyLibrary]) -> Result<()> {
    for (id, name, root_path, created_at) in libraries {
        sqlx::query(
            "INSERT INTO libraries (id, uid, name, root_path, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        )
        .bind(id)
        .bind(uuid::Uuid::now_v7().to_string())
        .bind(name)
        .bind(root_path)
        .bind(created_at)
        .execute(pool)
        .await?;
    }
    Ok(())
}

/// Rename `catalog.db` (and WAL side files) to `catalog.v0-<timestamp>.db`.
fn archive_file(db_path: &Path) -> Result<PathBuf> {
    let stamp = Utc::now().format("%Y%m%d-%H%M%S");
    let backup = db_path.with_file_name(format!("catalog.v0-{stamp}.db"));
    std::fs::rename(db_path, &backup)?;
    for suffix in ["-wal", "-shm"] {
        let side = PathBuf::from(format!("{}{suffix}", db_path.display()));
        if side.exists() {
            let _ = std::fs::rename(&side, format!("{}{suffix}", backup.display()));
        }
    }
    Ok(backup)
}

fn clear_dir(dir: &Path) {
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            let _ = if path.is_dir() {
                std::fs::remove_dir_all(&path)
            } else {
                std::fs::remove_file(&path)
            };
        }
    }
}

#[cfg(test)]
pub(crate) mod tests {
    use super::*;

    pub(crate) fn temp_dir() -> PathBuf {
        let dir = std::env::temp_dir().join(format!("pv-core-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    /// Fresh migrated database in a temp dir.
    pub(crate) async fn test_db() -> (SqlitePool, PathBuf) {
        let dir = temp_dir();
        let db = open(&dir.join("catalog.db"), &dir.join("thumbnails"))
            .await
            .unwrap();
        (db.pool, dir)
    }

    #[tokio::test]
    async fn creates_database_from_scratch() {
        let (pool, dir) = test_db().await;
        let tables: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name IN ('libraries', 'media', 'review_candidates', 'trash_items')",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(tables, 4);
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn legacy_catalog_is_archived_and_libraries_kept() {
        let dir = temp_dir();
        let db_path = dir.join("catalog.db");
        let thumbs = dir.join("thumbnails");
        std::fs::create_dir_all(thumbs.join("ab")).unwrap();
        std::fs::write(thumbs.join("ab").join("old.webp"), b"x").unwrap();

        // Minimal v0.x schema.
        {
            let pool = connect(&db_path).await.unwrap();
            for sql in [
                "CREATE TABLE libraries (id TEXT PRIMARY KEY, name TEXT, root_path TEXT, created_at TEXT, last_scan_at TEXT)",
                "CREATE TABLE photos (id TEXT PRIMARY KEY)",
                "INSERT INTO libraries VALUES ('lib-1', 'Fotos', '/media/hd/Fotos', '2026-01-01T00:00:00Z', NULL)",
            ] {
                sqlx::query(sql).execute(&pool).await.unwrap();
            }
            pool.close().await;
        }

        let db = open(&db_path, &thumbs).await.unwrap();

        let backup = db.archived_legacy_catalog.expect("legacy catalog archived");
        assert!(backup.exists());
        assert!(!thumbs.join("ab").exists(), "old thumbnails removed");
        let (name, root): (String, String) =
            sqlx::query_as("SELECT name, root_path FROM libraries WHERE id = 'lib-1'")
                .fetch_one(&db.pool)
                .await
                .unwrap();
        assert_eq!((name.as_str(), root.as_str()), ("Fotos", "/media/hd/Fotos"));

        // Second start: nothing to archive.
        db.pool.close().await;
        let again = open(&db_path, &thumbs).await.unwrap();
        assert!(again.archived_legacy_catalog.is_none());
        let _ = std::fs::remove_dir_all(dir);
    }
}
