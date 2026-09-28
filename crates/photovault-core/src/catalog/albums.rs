//! Albums (PRD §18): references in the catalog, never copies of files.
//! Manual albums list their media; smart albums store a `MediaFilter` as the rule.

use super::media::{self, MediaItem};
use super::query::{self, MediaFilter, MediaQuery};
use crate::error::{Error, Result};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::{QueryBuilder, Sqlite, SqlitePool};

const MAX_NAME: usize = 100;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(type_name = "TEXT", rename_all = "lowercase")]
pub enum AlbumKind {
    Manual,
    Smart,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Album {
    pub id: String,
    pub library_id: String,
    pub name: String,
    pub kind: AlbumKind,
    /// Smart albums only.
    pub rule: Option<MediaFilter>,
    pub media_count: u32,
    /// Chosen cover, or the newest item with a thumbnail.
    pub cover: Option<MediaItem>,
    pub created_at: String,
}

#[derive(sqlx::FromRow)]
struct AlbumRow {
    id: String,
    library_id: String,
    name: String,
    kind: AlbumKind,
    rule_json: Option<String>,
    cover_media_id: Option<String>,
    created_at: String,
}

fn validate_name(name: &str) -> Result<String> {
    let name = name.trim();
    if name.is_empty() {
        return Err(Error::InvalidInput("Dê um nome ao álbum.".into()));
    }
    if name.chars().count() > MAX_NAME {
        return Err(Error::InvalidInput(format!(
            "O nome pode ter até {MAX_NAME} caracteres."
        )));
    }
    Ok(name.to_string())
}

async fn ensure_unique_name(
    pool: &SqlitePool,
    library_id: &str,
    name: &str,
    except: Option<&str>,
) -> Result<()> {
    let taken: Option<String> = sqlx::query_scalar(
        "SELECT id FROM albums WHERE library_id = ?1 AND lower(name) = lower(?2) AND id IS NOT ?3",
    )
    .bind(library_id)
    .bind(name)
    .bind(except)
    .fetch_optional(pool)
    .await?;
    match taken {
        Some(_) => Err(Error::InvalidInput(format!(
            "Já existe um álbum chamado \"{name}\"."
        ))),
        None => Ok(()),
    }
}

fn rule_json(rule: &MediaFilter) -> Result<String> {
    if rule.album_id.is_some() {
        return Err(Error::InvalidInput(
            "Um álbum inteligente não pode depender de outro álbum.".into(),
        ));
    }
    if rule.is_empty() {
        return Err(Error::InvalidInput(
            "Escolha pelo menos um filtro para o álbum inteligente.".into(),
        ));
    }
    query::validate(rule)?;
    serde_json::to_string(rule).map_err(|e| Error::Internal(e.to_string()))
}

async fn row(pool: &SqlitePool, id: &str) -> Result<AlbumRow> {
    sqlx::query_as(
        "SELECT id, library_id, name, kind, rule_json, cover_media_id, created_at FROM albums WHERE id = ?1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?
    .ok_or(Error::AlbumNotFound)
}

async fn hydrate(pool: &SqlitePool, r: AlbumRow) -> Result<Album> {
    let filter = MediaFilter {
        album_id: Some(r.id.clone()),
        ..Default::default()
    };
    let media_count = media::count(pool, &r.library_id, &filter).await?.total;

    let chosen = match &r.cover_media_id {
        Some(id) => media::get(pool, id).await.ok(),
        None => None,
    };
    let cover = match chosen {
        Some(c) => Some(c),
        None if media_count > 0 => {
            // Newest image of the album (smart rule already applied by `resolve`).
            let page = media::list(
                pool,
                &r.library_id,
                &MediaQuery {
                    filter: MediaFilter {
                        media_type: Some(media::MediaType::Image),
                        ..filter
                    },
                    ..Default::default()
                },
                None,
                1,
            )
            .await?;
            page.items.into_iter().next()
        }
        None => None,
    };

    let rule = r
        .rule_json
        .as_deref()
        .and_then(|j| serde_json::from_str(j).ok());
    Ok(Album {
        id: r.id,
        library_id: r.library_id,
        name: r.name,
        kind: r.kind,
        rule,
        media_count,
        cover,
        created_at: r.created_at,
    })
}

pub async fn list(pool: &SqlitePool, library_id: &str) -> Result<Vec<Album>> {
    let rows: Vec<AlbumRow> = sqlx::query_as(
        "SELECT id, library_id, name, kind, rule_json, cover_media_id, created_at
         FROM albums WHERE library_id = ?1 ORDER BY lower(name)",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?;
    let mut albums = Vec::with_capacity(rows.len());
    for r in rows {
        albums.push(hydrate(pool, r).await?);
    }
    Ok(albums)
}

pub async fn get(pool: &SqlitePool, id: &str) -> Result<Album> {
    hydrate(pool, row(pool, id).await?).await
}

/// Manual album when `rule` is `None`; smart album otherwise.
pub async fn create(
    pool: &SqlitePool,
    library_id: &str,
    name: &str,
    rule: Option<&MediaFilter>,
) -> Result<Album> {
    let name = validate_name(name)?;
    super::libraries::get(pool, library_id).await?;
    ensure_unique_name(pool, library_id, &name, None).await?;
    let (kind, json) = match rule {
        Some(rule) => (AlbumKind::Smart, Some(rule_json(rule)?)),
        None => (AlbumKind::Manual, None),
    };
    let id = uuid::Uuid::now_v7().to_string();
    sqlx::query(
        "INSERT INTO albums (id, library_id, name, kind, rule_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    )
    .bind(&id)
    .bind(library_id)
    .bind(&name)
    .bind(kind)
    .bind(json)
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;
    get(pool, &id).await
}

pub async fn rename(pool: &SqlitePool, id: &str, name: &str) -> Result<Album> {
    let name = validate_name(name)?;
    let album = row(pool, id).await?;
    ensure_unique_name(pool, &album.library_id, &name, Some(id)).await?;
    sqlx::query("UPDATE albums SET name = ?1 WHERE id = ?2")
        .bind(&name)
        .bind(id)
        .execute(pool)
        .await?;
    get(pool, id).await
}

pub async fn update_rule(pool: &SqlitePool, id: &str, rule: &MediaFilter) -> Result<Album> {
    if row(pool, id).await?.kind != AlbumKind::Smart {
        return Err(Error::InvalidInput(
            "Só álbuns inteligentes têm regra.".into(),
        ));
    }
    sqlx::query("UPDATE albums SET rule_json = ?1 WHERE id = ?2")
        .bind(rule_json(rule)?)
        .bind(id)
        .execute(pool)
        .await?;
    get(pool, id).await
}

/// Deletes the album only; the photos stay in the library.
pub async fn delete(pool: &SqlitePool, id: &str) -> Result<()> {
    let result = sqlx::query("DELETE FROM albums WHERE id = ?1")
        .bind(id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(Error::AlbumNotFound);
    }
    Ok(())
}

async fn manual(pool: &SqlitePool, id: &str) -> Result<AlbumRow> {
    let album = row(pool, id).await?;
    if album.kind != AlbumKind::Manual {
        return Err(Error::InvalidInput(
            "Álbuns inteligentes são preenchidos pela regra; edite a regra em vez de adicionar fotos.".into(),
        ));
    }
    Ok(album)
}

/// Adds media of the album's library (others are ignored). Returns how many were new.
pub async fn add_media(pool: &SqlitePool, id: &str, media_ids: &[String]) -> Result<u32> {
    let album = manual(pool, id).await?;
    let next: i64 = sqlx::query_scalar(
        "SELECT COALESCE(MAX(position), 0) FROM album_media WHERE album_id = ?1",
    )
    .bind(id)
    .fetch_one(pool)
    .await?;
    let mut added = 0;
    let mut tx = pool.begin().await?;
    for (offset, media_id) in media_ids.iter().enumerate() {
        let result = sqlx::query(
            "INSERT INTO album_media (album_id, media_id, position)
             SELECT ?1, id, ?2 FROM media WHERE id = ?3 AND library_id = ?4
             ON CONFLICT DO NOTHING",
        )
        .bind(id)
        .bind(next + 1 + offset as i64)
        .bind(media_id)
        .bind(&album.library_id)
        .execute(&mut *tx)
        .await?;
        added += result.rows_affected() as u32;
    }
    tx.commit().await?;
    Ok(added)
}

pub async fn remove_media(pool: &SqlitePool, id: &str, media_ids: &[String]) -> Result<u32> {
    manual(pool, id).await?;
    let mut removed = 0;
    for chunk in media_ids.chunks(500) {
        let mut qb = QueryBuilder::<Sqlite>::new("DELETE FROM album_media WHERE album_id = ");
        qb.push_bind(id.to_string()).push(" AND media_id IN (");
        let mut list = qb.separated(", ");
        for m in chunk {
            list.push_bind(m.clone());
        }
        qb.push(")");
        removed += qb.build().execute(pool).await?.rows_affected() as u32;
    }
    // A removed cover falls back to the automatic one.
    sqlx::query(
        "UPDATE albums SET cover_media_id = NULL
         WHERE id = ?1 AND cover_media_id NOT IN (SELECT media_id FROM album_media WHERE album_id = ?1)",
    )
    .bind(id)
    .execute(pool)
    .await?;
    Ok(removed)
}

/// `None` restores the automatic cover.
pub async fn set_cover(pool: &SqlitePool, id: &str, media_id: Option<&str>) -> Result<Album> {
    let album = row(pool, id).await?;
    if let Some(media_id) = media_id {
        let item = media::get(pool, media_id).await?;
        if item.library_id != album.library_id {
            return Err(Error::InvalidInput(
                "A capa precisa ser uma foto desta biblioteca.".into(),
            ));
        }
    }
    sqlx::query("UPDATE albums SET cover_media_id = ?1 WHERE id = ?2")
        .bind(media_id)
        .bind(id)
        .execute(pool)
        .await?;
    get(pool, id).await
}

#[derive(Debug, Clone, Serialize, Type, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct AlbumRef {
    pub id: String,
    pub name: String,
}

/// Manual albums that contain the item (info panel / viewer).
pub async fn containing(pool: &SqlitePool, media_id: &str) -> Result<Vec<AlbumRef>> {
    Ok(sqlx::query_as(
        "SELECT a.id, a.name FROM albums a JOIN album_media am ON am.album_id = a.id
         WHERE am.media_id = ?1 ORDER BY lower(a.name)",
    )
    .bind(media_id)
    .fetch_all(pool)
    .await?)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::catalog::libraries;
    use crate::catalog::media::tests::{Row, insert};
    use crate::db::tests::{temp_dir, test_db};

    #[tokio::test]
    async fn manual_album_lifecycle() {
        let (pool, dir) = test_db().await;
        let lib = libraries::create(&pool, "A", temp_dir().to_str().unwrap())
            .await
            .unwrap();
        let other = libraries::create(&pool, "B", temp_dir().to_str().unwrap())
            .await
            .unwrap();
        for (id, date) in [
            ("a", "2025-01-01T00:00:00"),
            ("b", "2025-02-01T00:00:00"),
            ("c", "2025-03-01T00:00:00"),
        ] {
            insert(
                &pool,
                &lib.id,
                Row {
                    id,
                    captured_at: Some(date),
                    ..Default::default()
                },
            )
            .await;
        }
        insert(
            &pool,
            &other.id,
            Row {
                id: "x",
                ..Default::default()
            },
        )
        .await;

        assert!(create(&pool, &lib.id, "   ", None).await.is_err());
        let album = create(&pool, &lib.id, " Férias ", None).await.unwrap();
        assert_eq!(
            (album.name.as_str(), album.kind, album.media_count),
            ("Férias", AlbumKind::Manual, 0)
        );
        assert!(album.cover.is_none());
        assert!(
            create(&pool, &lib.id, "férias", None).await.is_err(),
            "duplicate name (case-insensitive)"
        );
        assert!(
            create(&pool, &other.id, "Férias", None).await.is_ok(),
            "same name in another library"
        );

        // Other libraries' media and repeats are ignored.
        let ids: Vec<String> = ["a", "b", "x", "a"].map(String::from).to_vec();
        assert_eq!(add_media(&pool, &album.id, &ids).await.unwrap(), 2);
        let album = get(&pool, &album.id).await.unwrap();
        assert_eq!(album.media_count, 2);
        assert_eq!(album.cover.unwrap().id, "b", "automatic cover = newest");

        let album = set_cover(&pool, &album.id, Some("a")).await.unwrap();
        assert_eq!(album.cover.unwrap().id, "a");
        assert!(set_cover(&pool, &album.id, Some("x")).await.is_err());

        // Removing the cover falls back to the automatic one.
        assert_eq!(
            remove_media(&pool, &album.id, &["a".into()]).await.unwrap(),
            1
        );
        let album = get(&pool, &album.id).await.unwrap();
        assert_eq!(
            (album.media_count, album.cover.unwrap().id.as_str()),
            (1, "b")
        );

        assert_eq!(containing(&pool, "b").await.unwrap()[0].name, "Férias");
        let renamed = rename(&pool, &album.id, "Verão").await.unwrap();
        assert_eq!(renamed.name, "Verão");

        // Deleting the album keeps the photos.
        delete(&pool, &album.id).await.unwrap();
        assert!(matches!(
            get(&pool, &album.id).await,
            Err(Error::AlbumNotFound)
        ));
        assert!(media::get(&pool, "b").await.is_ok());
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn smart_album_follows_its_rule() {
        let (pool, dir) = test_db().await;
        let lib = libraries::create(&pool, "A", temp_dir().to_str().unwrap())
            .await
            .unwrap();
        insert(
            &pool,
            &lib.id,
            Row {
                id: "a",
                captured_at: Some("2025-07-01T00:00:00"),
                favorite: true,
                ..Default::default()
            },
        )
        .await;
        insert(
            &pool,
            &lib.id,
            Row {
                id: "b",
                captured_at: Some("2025-08-01T00:00:00"),
                ..Default::default()
            },
        )
        .await;
        insert(
            &pool,
            &lib.id,
            Row {
                id: "c",
                captured_at: Some("2024-07-01T00:00:00"),
                favorite: true,
                ..Default::default()
            },
        )
        .await;

        assert!(
            create(&pool, &lib.id, "Vazio", Some(&MediaFilter::default()))
                .await
                .is_err()
        );
        let rule = MediaFilter {
            year: Some(2025),
            favorite: Some(true),
            ..Default::default()
        };
        let album = create(&pool, &lib.id, "Melhores de 2025", Some(&rule))
            .await
            .unwrap();
        assert_eq!((album.kind, album.media_count), (AlbumKind::Smart, 1));
        assert_eq!(album.rule.as_ref(), Some(&rule));
        assert!(
            add_media(&pool, &album.id, &["b".into()]).await.is_err(),
            "smart albums are rule-only"
        );

        // New favorites show up without touching the album.
        media::set_favorite(&pool, &["b".into()], true)
            .await
            .unwrap();
        assert_eq!(get(&pool, &album.id).await.unwrap().media_count, 2);

        // The UI can narrow a smart album further.
        let page = media::list(
            &pool,
            &lib.id,
            &MediaQuery {
                filter: MediaFilter {
                    album_id: Some(album.id.clone()),
                    month: Some(8),
                    ..Default::default()
                },
                ..Default::default()
            },
            None,
            10,
        )
        .await
        .unwrap();
        assert_eq!(
            page.items.iter().map(|m| m.id.as_str()).collect::<Vec<_>>(),
            ["b"]
        );

        let album = update_rule(
            &pool,
            &album.id,
            &MediaFilter {
                favorite: Some(true),
                ..Default::default()
            },
        )
        .await
        .unwrap();
        assert_eq!(album.media_count, 3);
        let nested = MediaFilter {
            album_id: Some(album.id.clone()),
            ..Default::default()
        };
        assert!(
            create(&pool, &lib.id, "Aninhado", Some(&nested))
                .await
                .is_err()
        );
        let _ = std::fs::remove_dir_all(dir);
    }
}
