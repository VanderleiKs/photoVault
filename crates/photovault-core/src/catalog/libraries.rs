use crate::error::{Error, Result};
use chrono::Utc;
use serde::Serialize;
use specta::Type;
use sqlx::SqlitePool;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Type, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Library {
    pub id: String,
    pub uid: String,
    pub name: String,
    pub root_path: String,
    pub created_at: String,
    pub last_scan_at: Option<String>,
    /// Whether `root_path` is reachable right now (e.g. external drive plugged in).
    #[sqlx(skip)]
    pub connected: bool,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LibraryStats {
    pub photos: u32,
    pub videos: u32,
    pub favorites: u32,
    #[specta(type = specta_typescript::Number)]
    pub total_bytes: u64,
}

const COLUMNS: &str = "id, uid, name, root_path, created_at, last_scan_at";

fn with_status(mut library: Library) -> Library {
    library.connected = Path::new(&library.root_path).is_dir();
    library
}

/// Normalized, validated library root.
fn validate_root(root_path: &str) -> Result<String> {
    let root = root_path.trim();
    if root.is_empty() || !Path::new(root).is_dir() {
        return Err(Error::PathNotAccessible(root.to_string()));
    }
    Ok(root.to_string())
}

fn validate_name(name: &str) -> Result<String> {
    let name = name.trim();
    if name.is_empty() {
        return Err(Error::InvalidInput("Informe o nome da biblioteca.".into()));
    }
    Ok(name.to_string())
}

pub async fn create(pool: &SqlitePool, name: &str, root_path: &str) -> Result<Library> {
    let name = validate_name(name)?;
    let root = validate_root(root_path)?;

    let existing: Option<String> =
        sqlx::query_scalar("SELECT name FROM libraries WHERE root_path = ?1")
            .bind(&root)
            .fetch_optional(pool)
            .await?;
    if let Some(other) = existing {
        return Err(Error::InvalidInput(format!(
            "Esta pasta já pertence à biblioteca \"{other}\"."
        )));
    }

    let id = uuid::Uuid::now_v7().to_string();
    sqlx::query(
        "INSERT INTO libraries (id, uid, name, root_path, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
    )
    .bind(&id)
    .bind(uuid::Uuid::now_v7().to_string())
    .bind(&name)
    .bind(&root)
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;

    get(pool, &id).await
}

pub async fn list(pool: &SqlitePool) -> Result<Vec<Library>> {
    let rows: Vec<Library> = sqlx::query_as(&format!(
        "SELECT {COLUMNS} FROM libraries ORDER BY name COLLATE NOCASE"
    ))
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(with_status).collect())
}

pub async fn get(pool: &SqlitePool, id: &str) -> Result<Library> {
    sqlx::query_as::<_, Library>(&format!("SELECT {COLUMNS} FROM libraries WHERE id = ?1"))
        .bind(id)
        .fetch_optional(pool)
        .await?
        .map(with_status)
        .ok_or(Error::LibraryNotFound)
}

pub async fn rename(pool: &SqlitePool, id: &str, name: &str) -> Result<Library> {
    let name = validate_name(name)?;
    let updated = sqlx::query("UPDATE libraries SET name = ?1 WHERE id = ?2")
        .bind(&name)
        .bind(id)
        .execute(pool)
        .await?;
    if updated.rows_affected() == 0 {
        return Err(Error::LibraryNotFound);
    }
    get(pool, id).await
}

/// Point a library at a new root (drive letter / mount point changed).
/// Refuses folders that contain none of a sample of the known files.
pub async fn relocate(pool: &SqlitePool, id: &str, new_root: &str) -> Result<Library> {
    let root = validate_root(new_root)?;
    get(pool, id).await?;

    let sample: Vec<String> = sqlx::query_scalar(
        "SELECT relative_path FROM media WHERE library_id = ?1 AND status = 'active'
         ORDER BY random() LIMIT 20",
    )
    .bind(id)
    .fetch_all(pool)
    .await?;
    if !sample.is_empty()
        && !sample
            .iter()
            .any(|rel| Path::new(&root).join(rel).is_file())
    {
        return Err(Error::RelocationMismatch);
    }

    sqlx::query("UPDATE libraries SET root_path = ?1 WHERE id = ?2")
        .bind(&root)
        .bind(id)
        .execute(pool)
        .await?;
    get(pool, id).await
}

/// Delete a library from the catalog. Never touches the photos on disk.
/// Returns the ids of the removed media so their thumbnails can be deleted.
pub async fn delete(pool: &SqlitePool, id: &str) -> Result<Vec<String>> {
    let media_ids: Vec<String> = sqlx::query_scalar("SELECT id FROM media WHERE library_id = ?1")
        .bind(id)
        .fetch_all(pool)
        .await?;
    let deleted = sqlx::query("DELETE FROM libraries WHERE id = ?1")
        .bind(id)
        .execute(pool)
        .await?;
    if deleted.rows_affected() == 0 {
        return Err(Error::LibraryNotFound);
    }
    Ok(media_ids)
}

pub async fn touch_last_scan(pool: &SqlitePool, id: &str) -> Result<()> {
    sqlx::query("UPDATE libraries SET last_scan_at = ?1 WHERE id = ?2")
        .bind(Utc::now().to_rfc3339())
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn stats(pool: &SqlitePool, id: &str) -> Result<LibraryStats> {
    let (photos, videos, favorites, total_bytes): (i64, i64, i64, i64) = sqlx::query_as(
        "SELECT
            COUNT(CASE WHEN media_type = 'image' THEN 1 END),
            COUNT(CASE WHEN media_type = 'video' THEN 1 END),
            COUNT(CASE WHEN is_favorite = 1 THEN 1 END),
            COALESCE(SUM(file_size), 0)
         FROM media
         WHERE library_id = ?1 AND status = 'active'",
    )
    .bind(id)
    .fetch_one(pool)
    .await?;

    Ok(LibraryStats {
        photos: photos as u32,
        videos: videos as u32,
        favorites: favorites as u32,
        total_bytes: total_bytes as u64,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::tests::{temp_dir, test_db};

    #[tokio::test]
    async fn create_validates_and_rejects_duplicates() {
        let (pool, dir) = test_db().await;
        let root = temp_dir();
        let root_str = root.to_str().unwrap();

        assert!(matches!(
            create(&pool, "  ", root_str).await,
            Err(Error::InvalidInput(_))
        ));
        assert!(matches!(
            create(&pool, "X", "/nao/existe").await,
            Err(Error::PathNotAccessible(_))
        ));

        let lib = create(&pool, " Fotos ", root_str).await.unwrap();
        assert_eq!(lib.name, "Fotos");
        assert!(lib.connected);
        assert!(matches!(
            create(&pool, "Outra", root_str).await,
            Err(Error::InvalidInput(_))
        ));
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn relocate_requires_known_files() {
        let (pool, dir) = test_db().await;
        let old_root = temp_dir();
        let lib = create(&pool, "Fotos", old_root.to_str().unwrap())
            .await
            .unwrap();
        sqlx::query(
            "INSERT INTO media (id, library_id, relative_path, filename, extension, media_type,
                                file_size, indexed_at, updated_at)
             VALUES ('m1', ?1, 'a/b.jpg', 'b.jpg', 'jpg', 'image', 1, '', '')",
        )
        .bind(&lib.id)
        .execute(&pool)
        .await
        .unwrap();

        let empty = temp_dir();
        assert!(matches!(
            relocate(&pool, &lib.id, empty.to_str().unwrap()).await,
            Err(Error::RelocationMismatch)
        ));

        let moved = temp_dir();
        std::fs::create_dir_all(moved.join("a")).unwrap();
        std::fs::write(moved.join("a/b.jpg"), b"x").unwrap();
        let relocated = relocate(&pool, &lib.id, moved.to_str().unwrap())
            .await
            .unwrap();
        assert_eq!(relocated.root_path, moved.to_str().unwrap());

        let removed = delete(&pool, &lib.id).await.unwrap();
        assert_eq!(removed, ["m1"]);
        let _ = std::fs::remove_dir_all(dir);
    }
}
