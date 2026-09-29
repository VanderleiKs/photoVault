use super::query::{self, MediaFilter, MediaQuery, MediaSort};
use crate::error::{Error, Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::{QueryBuilder, Sqlite, SqlitePool};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type, sqlx::Type)]
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
    pub lens: Option<String>,
    pub iso: Option<u32>,
    pub aperture: Option<f64>,
    /// "1/1200", "2"…
    pub shutter: Option<String>,
    pub focal_length: Option<f64>,
    pub gps_lat: Option<f64>,
    pub gps_lon: Option<f64>,
    pub place_name: Option<String>,
    /// State; Brazilian states as their code ("RS").
    pub place_admin1: Option<String>,
    /// ISO 3166-1 alpha-2 ("BR").
    pub place_country: Option<String>,
    pub is_favorite: bool,
    /// 0 = thumbnails not generated yet; bumps when they are rewritten.
    pub thumb_version: u32,
    pub indexed_at: String,
    /// In the trash (`relative_path` then points inside `.photovault-trash`).
    pub in_trash: bool,
    /// Priority (1–1000) of its pending review suggestions; `None` = nothing to review.
    pub review_priority: Option<u32>,
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
    lens: Option<String>,
    iso: Option<i64>,
    aperture: Option<f64>,
    shutter: Option<String>,
    focal_length: Option<f64>,
    gps_lat: Option<f64>,
    gps_lon: Option<f64>,
    place_name: Option<String>,
    place_admin1: Option<String>,
    place_country: Option<String>,
    is_favorite: bool,
    thumb_version: i64,
    indexed_at: String,
    in_trash: bool,
    review_priority: Option<i64>,
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
            lens: r.lens,
            iso: small(r.iso),
            aperture: r.aperture,
            shutter: r.shutter,
            focal_length: r.focal_length,
            gps_lat: r.gps_lat,
            gps_lon: r.gps_lon,
            place_name: r.place_name,
            place_admin1: r.place_admin1,
            place_country: r.place_country,
            is_favorite: r.is_favorite,
            thumb_version: small(Some(r.thumb_version)).unwrap_or(0),
            indexed_at: r.indexed_at,
            in_trash: r.in_trash,
            review_priority: small(r.review_priority),
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

#[derive(Debug, Clone, Default, PartialEq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MediaCount {
    pub total: u32,
    pub photos: u32,
    pub videos: u32,
}

/// Where an item sits in a gallery context (filter + order), for the viewer.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MediaContext {
    /// 1-based position and total, for "12 / 426".
    pub position: u32,
    pub total: u32,
    /// Neighbours in order (thumbnail strip); `items[index]` is the item itself.
    pub items: Vec<MediaItem>,
    pub index: u32,
}

/// Columns of `MediaRow`, selected `FROM media m LEFT JOIN places p`.
const COLUMNS: &str = "m.id, m.library_id, m.relative_path, m.filename, m.extension, m.media_type, \
     m.file_size, m.width, m.height, m.duration_ms, m.captured_at, m.date_source, \
     m.camera_make, m.camera_model, m.lens, m.iso, m.aperture, m.shutter, m.focal_length, \
     m.gps_lat, m.gps_lon, p.name AS place_name, p.admin1 AS place_admin1, \
     p.country_code AS place_country, m.is_favorite, m.thumb_version, m.indexed_at, \
     m.status = 'trashed' AS in_trash, m.review_priority";
const FROM: &str = "FROM media m LEFT JOIN places p ON p.id = m.place_id";

const MAX_PAGE: u32 = 500;
const MAX_RADIUS: u32 = 50;
const CURSOR_SEP: char = '\u{1f}';

fn encode_cursor(key: &str, id: &str) -> String {
    format!("{key}{CURSOR_SEP}{id}")
}

fn decode_cursor(cursor: &str) -> Result<(String, String)> {
    cursor
        .split_once(CURSOR_SEP)
        .map(|(k, id)| (k.to_string(), id.to_string()))
        .ok_or_else(|| Error::InvalidInput("Cursor de paginação inválido.".into()))
}

#[derive(sqlx::FromRow)]
struct KeyedRow {
    #[sqlx(flatten)]
    row: MediaRow,
    sort_value: String,
}

/// Rows matching `filter` in `sort` order, after (or before, reversed) a keyset position.
async fn fetch_keyed(
    pool: &SqlitePool,
    library_id: &str,
    filter: &MediaFilter,
    sort: MediaSort,
    from: Option<(&str, &str)>,
    forward: bool,
    limit: u32,
) -> Result<Vec<KeyedRow>> {
    let spec = sort.spec();
    let mut qb = QueryBuilder::<Sqlite>::new(format!(
        "SELECT {COLUMNS}, CAST({} AS TEXT) AS sort_value {FROM}",
        spec.key
    ));
    query::push_where(&mut qb, library_id, filter);
    if let Some((key, id)) = from {
        spec.push_keyset(&mut qb, key, id, forward)?;
    }
    qb.push(format!(" {} LIMIT ", spec.order_by(!forward)))
        .push_bind(i64::from(limit));
    Ok(qb.build_query_as::<KeyedRow>().fetch_all(pool).await?)
}

/// A page of active media of a library matching `query`.
pub async fn list(
    pool: &SqlitePool,
    library_id: &str,
    query: &MediaQuery,
    cursor: Option<&str>,
    limit: u32,
) -> Result<MediaPage> {
    let limit = limit.clamp(1, MAX_PAGE);
    query::validate(&query.filter)?;
    let filter = query::resolve(pool, query.filter.clone()).await?;
    let from = cursor.map(decode_cursor).transpose()?;
    let from_ref = from.as_ref().map(|(k, i)| (k.as_str(), i.as_str()));

    let mut rows = fetch_keyed(
        pool,
        library_id,
        &filter,
        query.sort,
        from_ref,
        true,
        limit + 1,
    )
    .await?;
    let has_more = rows.len() > limit as usize;
    rows.truncate(limit as usize);
    let next_cursor = has_more
        .then(|| rows.last().map(|r| encode_cursor(&r.sort_value, &r.row.id)))
        .flatten();

    Ok(MediaPage {
        items: rows.into_iter().map(|r| r.row.into()).collect(),
        next_cursor,
    })
}

/// How many items match (total, photos, videos).
pub async fn count(
    pool: &SqlitePool,
    library_id: &str,
    filter: &MediaFilter,
) -> Result<MediaCount> {
    query::validate(filter)?;
    let filter = query::resolve(pool, filter.clone()).await?;
    let mut qb = QueryBuilder::<Sqlite>::new(
        "SELECT COUNT(*), COUNT(CASE WHEN m.media_type = 'video' THEN 1 END) FROM media m",
    );
    query::push_where(&mut qb, library_id, &filter);
    let (total, videos): (i64, i64) = qb.build_query_as().fetch_one(pool).await?;
    Ok(MediaCount {
        total: total as u32,
        photos: (total - videos) as u32,
        videos: videos as u32,
    })
}

/// Position of `id` inside the gallery context, plus up to `radius` neighbours per side.
/// An item that doesn't match the context (e.g. opened from a link) gets its own context.
pub async fn context(
    pool: &SqlitePool,
    id: &str,
    query: &MediaQuery,
    radius: u32,
) -> Result<MediaContext> {
    let radius = radius.min(MAX_RADIUS);
    query::validate(&query.filter)?;
    let filter = query::resolve(pool, query.filter.clone()).await?;
    let spec = query.sort.spec();

    let library_id: String = sqlx::query_scalar("SELECT library_id FROM media WHERE id = ?1")
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or(Error::MediaNotFound)?;

    // The item itself, only if it matches the context.
    let mut qb = QueryBuilder::<Sqlite>::new(format!(
        "SELECT {COLUMNS}, CAST({} AS TEXT) AS sort_value {FROM}",
        spec.key
    ));
    query::push_where(&mut qb, &library_id, &filter);
    qb.push(" AND m.id = ").push_bind(id.to_string());
    let Some(current) = qb.build_query_as::<KeyedRow>().fetch_optional(pool).await? else {
        let item = get(pool, id).await?;
        return Ok(MediaContext {
            position: 1,
            total: 1,
            items: vec![item],
            index: 0,
        });
    };
    let key = (current.sort_value.as_str(), id);

    let mut before = fetch_keyed(
        pool,
        &library_id,
        &filter,
        query.sort,
        Some(key),
        false,
        radius,
    )
    .await?;
    before.reverse();
    let after = fetch_keyed(
        pool,
        &library_id,
        &filter,
        query.sort,
        Some(key),
        true,
        radius,
    )
    .await?;

    // Position = rows strictly before the item in this order.
    let mut qb = QueryBuilder::<Sqlite>::new("SELECT COUNT(*) FROM media m");
    query::push_where(&mut qb, &library_id, &filter);
    spec.push_keyset(&mut qb, key.0, key.1, false)?;
    let position: i64 = qb.build_query_scalar().fetch_one(pool).await?;
    let total = count(pool, &library_id, &filter).await?.total;

    let index = before.len() as u32;
    let items = before
        .into_iter()
        .chain(std::iter::once(current))
        .chain(after)
        .map(|r| r.row.into())
        .collect();
    Ok(MediaContext {
        position: position as u32 + 1,
        total,
        items,
        index,
    })
}

pub async fn get(pool: &SqlitePool, id: &str) -> Result<MediaItem> {
    sqlx::query_as::<_, MediaRow>(&format!("SELECT {COLUMNS} {FROM} WHERE m.id = ?1"))
        .bind(id)
        .fetch_optional(pool)
        .await?
        .map(Into::into)
        .ok_or(Error::MediaNotFound)
}

/// Several items by id (order not guaranteed; unknown ids are skipped).
pub async fn get_many(pool: &SqlitePool, ids: &[String]) -> Result<Vec<MediaItem>> {
    let mut items = Vec::with_capacity(ids.len());
    // SQLite caps bound parameters; 500 per query is well within it.
    for chunk in ids.chunks(500) {
        let placeholders = vec!["?"; chunk.len()].join(", ");
        let sql = format!("SELECT {COLUMNS} {FROM} WHERE m.id IN ({placeholders})");
        let mut query = sqlx::query_as::<_, MediaRow>(&sql);
        for id in chunk {
            query = query.bind(id);
        }
        items.extend(
            query
                .fetch_all(pool)
                .await?
                .into_iter()
                .map(MediaItem::from),
        );
    }
    Ok(items)
}

/// Mark or unmark favorites. Returns the updated items.
pub async fn set_favorite(
    pool: &SqlitePool,
    ids: &[String],
    favorite: bool,
) -> Result<Vec<MediaItem>> {
    let mut libraries: Vec<String> = get_many(pool, ids)
        .await?
        .into_iter()
        .map(|m| m.library_id)
        .collect();
    libraries.sort();
    libraries.dedup();
    let mut tx = pool.begin().await?;
    for chunk in ids.chunks(500) {
        let mut qb = QueryBuilder::<Sqlite>::new("UPDATE media SET is_favorite = ");
        qb.push_bind(favorite)
            .push(", updated_at = ")
            .push_bind(chrono::Utc::now().to_rfc3339());
        qb.push(" WHERE id IN (");
        let mut list = qb.separated(", ");
        for id in chunk {
            list.push_bind(id.clone());
        }
        qb.push(")");
        qb.build().execute(&mut *tx).await?;
        if favorite {
            // R5: a favorite is never a candidate, right away (the next pass agrees).
            for sql in [
                "DELETE FROM review_candidates WHERE status = 'pending' AND media_id IN (",
                "UPDATE media SET review_priority = NULL WHERE id IN (",
            ] {
                let mut qb = QueryBuilder::<Sqlite>::new(sql);
                let mut list = qb.separated(", ");
                for id in chunk {
                    list.push_bind(id.clone());
                }
                qb.push(")");
                qb.build().execute(&mut *tx).await?;
            }
        }
    }
    // Favorites win ties for "best candidate" in duplicate groups.
    for library_id in &libraries {
        crate::analysis::store::mark_dirty(&mut *tx, library_id).await?;
    }
    tx.commit().await?;
    get_many(pool, ids).await
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
pub(crate) mod tests {
    use super::*;
    use crate::catalog::libraries;
    use crate::db::tests::{temp_dir, test_db};

    /// Minimal media row for query tests.
    pub(crate) struct Row<'a> {
        pub id: &'a str,
        pub captured_at: Option<&'a str>,
        pub filename: &'a str,
        pub media_type: &'a str,
        pub size: i64,
        pub favorite: bool,
        pub camera: Option<&'a str>,
    }

    impl Default for Row<'_> {
        fn default() -> Self {
            Row {
                id: "",
                captured_at: None,
                filename: "",
                media_type: "image",
                size: 1,
                favorite: false,
                camera: None,
            }
        }
    }

    pub(crate) async fn insert(pool: &SqlitePool, library_id: &str, r: Row<'_>) {
        let filename = if r.filename.is_empty() {
            format!("{}.jpg", r.id)
        } else {
            r.filename.to_string()
        };
        sqlx::query(
            "INSERT INTO media (id, library_id, relative_path, filename, extension, media_type,
                                file_size, captured_at, is_favorite, camera_model, indexed_at, updated_at)
             VALUES (?1, ?2, ?3, ?3, 'jpg', ?4, ?5, ?6, ?7, ?8, '', '')",
        )
        .bind(r.id)
        .bind(library_id)
        .bind(filename)
        .bind(r.media_type)
        .bind(r.size)
        .bind(r.captured_at)
        .bind(r.favorite)
        .bind(r.camera)
        .execute(pool)
        .await
        .unwrap();
    }

    async fn all_ids(
        pool: &SqlitePool,
        library_id: &str,
        query: &MediaQuery,
        page: u32,
    ) -> Vec<String> {
        let mut ids = Vec::new();
        let mut cursor = None;
        loop {
            let p = list(pool, library_id, query, cursor.as_deref(), page)
                .await
                .unwrap();
            ids.extend(p.items.into_iter().map(|m| m.id));
            match p.next_cursor {
                Some(c) => cursor = Some(c),
                None => return ids,
            }
        }
    }

    fn by(filter: MediaFilter) -> MediaQuery {
        MediaQuery {
            filter,
            ..Default::default()
        }
    }

    async fn sample() -> (SqlitePool, std::path::PathBuf, String) {
        let (pool, dir) = test_db().await;
        let lib = libraries::create(&pool, "A", temp_dir().to_str().unwrap())
            .await
            .unwrap();
        let other = libraries::create(&pool, "B", temp_dir().to_str().unwrap())
            .await
            .unwrap();
        let rows = [
            Row {
                id: "a",
                captured_at: Some("2025-07-12T10:00:00"),
                filename: "Gramado_serra.jpg",
                size: 30,
                favorite: true,
                camera: Some("iPhone 15 Pro"),
                ..Default::default()
            },
            Row {
                id: "b",
                captured_at: Some("2025-07-11T10:00:00"),
                filename: "IMG_0002.jpg",
                size: 10,
                ..Default::default()
            },
            Row {
                id: "c",
                captured_at: Some("2025-07-11T10:00:00"),
                filename: "clip.mp4",
                media_type: "video",
                size: 99,
                ..Default::default()
            },
            Row {
                id: "d",
                captured_at: Some("2024-12-31T23:59:59"),
                filename: "reveillon.jpg",
                size: 20,
                favorite: true,
                camera: Some("Canon EOS R6"),
                ..Default::default()
            },
            Row {
                id: "e",
                captured_at: Some("2024-07-01T08:00:00"),
                filename: "praia.jpg",
                size: 5,
                ..Default::default()
            },
            Row {
                id: "f",
                filename: "sem_data.jpg",
                size: 1,
                ..Default::default()
            },
        ];
        for r in rows {
            insert(&pool, &lib.id, r).await;
        }
        insert(
            &pool,
            &other.id,
            Row {
                id: "z",
                captured_at: Some("2025-07-11T12:00:00"),
                ..Default::default()
            },
        )
        .await;
        (pool, dir, lib.id)
    }

    #[tokio::test]
    async fn every_sort_pages_consistently() {
        let (pool, dir, lib) = sample().await;
        let expected = [
            (MediaSort::Newest, vec!["a", "c", "b", "d", "e", "f"]),
            (MediaSort::Oldest, vec!["e", "d", "b", "c", "a", "f"]),
            (MediaSort::Name, vec!["c", "a", "b", "e", "d", "f"]),
            (MediaSort::Largest, vec!["c", "a", "d", "b", "e", "f"]),
        ];
        for (sort, ids) in expected {
            let q = MediaQuery {
                sort,
                ..Default::default()
            };
            for page in [1, 2, 4, 100] {
                assert_eq!(
                    all_ids(&pool, &lib, &q, page).await,
                    ids,
                    "{sort:?} page {page}"
                );
            }
        }
        assert!(matches!(
            list(&pool, &lib, &MediaQuery::default(), Some("garbage"), 10).await,
            Err(Error::InvalidInput(_))
        ));
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn filters_combine() {
        let (pool, dir, lib) = sample().await;
        let cases: Vec<(MediaFilter, Vec<&str>)> = vec![
            (
                MediaFilter {
                    favorite: Some(true),
                    ..Default::default()
                },
                vec!["a", "d"],
            ),
            (
                MediaFilter {
                    media_type: Some(MediaType::Video),
                    ..Default::default()
                },
                vec!["c"],
            ),
            (
                MediaFilter {
                    year: Some(2024),
                    ..Default::default()
                },
                vec!["d", "e"],
            ),
            (
                MediaFilter {
                    year: Some(2025),
                    month: Some(7),
                    day: Some(11),
                    ..Default::default()
                },
                vec!["c", "b"],
            ),
            (
                MediaFilter {
                    month: Some(7),
                    ..Default::default()
                },
                vec!["a", "c", "b", "e"],
            ),
            (
                MediaFilter {
                    month: Some(12),
                    year: Some(2024),
                    ..Default::default()
                },
                vec!["d"],
            ),
            (
                MediaFilter {
                    date_from: Some("2024-12-31".into()),
                    date_to: Some("2025-07-11".into()),
                    ..Default::default()
                },
                vec!["c", "b", "d"],
            ),
            (
                MediaFilter {
                    camera: Some("Canon EOS R6".into()),
                    ..Default::default()
                },
                vec!["d"],
            ),
            (
                MediaFilter {
                    favorite: Some(true),
                    year: Some(2025),
                    ..Default::default()
                },
                vec!["a"],
            ),
        ];
        for (filter, ids) in cases {
            assert_eq!(
                all_ids(&pool, &lib, &by(filter.clone()), 2).await,
                ids,
                "{filter:?}"
            );
            let n = count(&pool, &lib, &filter).await.unwrap();
            assert_eq!(n.total as usize, ids.len());
        }
        let n = count(&pool, &lib, &MediaFilter::default()).await.unwrap();
        assert_eq!(
            n,
            MediaCount {
                total: 6,
                photos: 5,
                videos: 1
            }
        );
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn review_and_trash_filters() {
        let (pool, dir, lib) = sample().await;
        for (id, priority) in [("b", 500), ("e", 900)] {
            sqlx::query("UPDATE media SET review_priority = ?1 WHERE id = ?2")
                .bind(priority)
                .bind(id)
                .execute(&pool)
                .await
                .unwrap();
        }
        sqlx::query(
            "INSERT INTO review_candidates (id, library_id, media_id, reason, score, created_at)
             VALUES ('r1', ?1, 'e', 'BLURRY', 0.8, 'now'), ('r2', ?1, 'b', 'DARK', 0.8, 'now')",
        )
        .bind(&lib)
        .execute(&pool)
        .await
        .unwrap();
        sqlx::query("UPDATE media SET status = 'trashed' WHERE id = 'f'")
            .execute(&pool)
            .await
            .unwrap();

        let priority = MediaQuery {
            sort: MediaSort::Priority,
            ..Default::default()
        };
        for page in [1, 2, 100] {
            assert_eq!(
                all_ids(&pool, &lib, &priority, page).await,
                ["e", "b", "d", "c", "a"],
                "page {page}"
            );
        }
        let cases = [
            (
                MediaFilter {
                    review: Some(true),
                    ..Default::default()
                },
                vec!["b", "e"],
            ),
            (
                MediaFilter {
                    review_reason: Some(crate::review::ReviewReason::Blurry),
                    ..Default::default()
                },
                vec!["e"],
            ),
            (
                MediaFilter {
                    trashed: Some(true),
                    ..Default::default()
                },
                vec!["f"],
            ),
        ];
        for (filter, ids) in cases {
            assert_eq!(
                all_ids(&pool, &lib, &by(filter.clone()), 1).await,
                ids,
                "{filter:?}"
            );
        }
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn text_search_uses_names_places_albums_and_dates() {
        let (pool, dir, lib) = sample().await;
        let text = |t: &str| {
            by(MediaFilter {
                text: Some(t.into()),
                ..Default::default()
            })
        };

        assert_eq!(
            all_ids(&pool, &lib, &text("gram"), 10).await,
            ["a"],
            "prefix, case-insensitive"
        );
        assert_eq!(all_ids(&pool, &lib, &text("REVEILLON"), 10).await, ["d"]);
        assert_eq!(
            all_ids(&pool, &lib, &text("julho 2025"), 10).await,
            ["a", "c", "b"]
        );
        assert_eq!(all_ids(&pool, &lib, &text("2024"), 10).await, ["d", "e"]);
        assert_eq!(all_ids(&pool, &lib, &text("praia julho"), 10).await, ["e"]);
        assert!(
            all_ids(&pool, &lib, &text("inexistente"), 10)
                .await
                .is_empty()
        );

        // Places are indexed when the ingest sets place_id (accents ignored).
        sqlx::query("INSERT INTO places (id, name, admin1, country_code, lat, lon) VALUES (1, 'São Paulo', 'SP', 'BR', 0, 0)")
            .execute(&pool).await.unwrap();
        sqlx::query("UPDATE media SET place_id = 1 WHERE id = 'e'")
            .execute(&pool)
            .await
            .unwrap();
        assert_eq!(all_ids(&pool, &lib, &text("sao paulo"), 10).await, ["e"]);

        // Album names: added, renamed, and removed on cascade (album deleted).
        let album = crate::catalog::albums::create(&pool, &lib, "Férias na serra", None)
            .await
            .unwrap();
        crate::catalog::albums::add_media(&pool, &album.id, &["b".into()])
            .await
            .unwrap();
        assert_eq!(all_ids(&pool, &lib, &text("ferias"), 10).await, ["b"]);
        crate::catalog::albums::rename(&pool, &album.id, "Inverno")
            .await
            .unwrap();
        assert!(all_ids(&pool, &lib, &text("ferias"), 10).await.is_empty());
        assert_eq!(all_ids(&pool, &lib, &text("inverno"), 10).await, ["b"]);
        crate::catalog::albums::delete(&pool, &album.id)
            .await
            .unwrap();
        assert!(all_ids(&pool, &lib, &text("inverno"), 10).await.is_empty());

        // Renames on disk (relinked moves) update the index; deleted rows leave it.
        sqlx::query("UPDATE media SET filename = 'natal.jpg' WHERE id = 'd'")
            .execute(&pool)
            .await
            .unwrap();
        assert_eq!(all_ids(&pool, &lib, &text("natal"), 10).await, ["d"]);
        sqlx::query("DELETE FROM media WHERE id = 'd'")
            .execute(&pool)
            .await
            .unwrap();
        assert!(all_ids(&pool, &lib, &text("natal"), 10).await.is_empty());
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn context_matches_list_order() {
        let (pool, dir, lib) = sample().await;
        for query in [
            MediaQuery::default(),
            MediaQuery {
                sort: MediaSort::Name,
                ..Default::default()
            },
            by(MediaFilter {
                favorite: Some(true),
                ..Default::default()
            }),
        ] {
            let ids = all_ids(&pool, &lib, &query, 100).await;
            for (i, id) in ids.iter().enumerate() {
                let ctx = context(&pool, id, &query, 2).await.unwrap();
                assert_eq!(
                    (ctx.position as usize, ctx.total as usize),
                    (i + 1, ids.len()),
                    "{query:?} {id}"
                );
                let window: Vec<_> = ctx.items.iter().map(|m| m.id.clone()).collect();
                let lo = i.saturating_sub(2);
                assert_eq!(window, ids[lo..(i + 3).min(ids.len())], "{query:?} {id}");
                assert_eq!(ctx.items[ctx.index as usize].id, *id);
            }
        }
        // Outside the context: standalone.
        let ctx = context(
            &pool,
            "b",
            &by(MediaFilter {
                favorite: Some(true),
                ..Default::default()
            }),
            2,
        )
        .await
        .unwrap();
        assert_eq!((ctx.position, ctx.total, ctx.items.len()), (1, 1, 1));
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn favorites_toggle_in_batch() {
        let (pool, dir, lib) = sample().await;
        let items = set_favorite(&pool, &["b".into(), "c".into()], true)
            .await
            .unwrap();
        assert!(items.iter().all(|m| m.is_favorite) && items.len() == 2);
        set_favorite(&pool, &["a".into()], false).await.unwrap();
        let favs = all_ids(
            &pool,
            &lib,
            &by(MediaFilter {
                favorite: Some(true),
                ..Default::default()
            }),
            10,
        )
        .await;
        assert_eq!(favs, ["c", "b", "d"]);
        let _ = std::fs::remove_dir_all(dir);
    }
}
