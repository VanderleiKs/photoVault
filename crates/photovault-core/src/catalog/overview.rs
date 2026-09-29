//! Aggregates for the home page, the timeline scrubber and the filter menus.

use super::media::{self, MediaItem};
use super::query::{self, MediaFilter};
use crate::error::Result;
use serde::Serialize;
use specta::Type;
use sqlx::{QueryBuilder, Sqlite, SqlitePool};

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct YearSummary {
    pub year: u32,
    pub count: u32,
    pub cover: Option<MediaItem>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LibraryOverview {
    pub photos: u32,
    pub videos: u32,
    pub favorites: u32,
    pub albums: u32,
    /// Trips not ignored (suggested or accepted).
    pub trips: u32,
    /// Newest first.
    pub years: Vec<YearSummary>,
    /// Hero image: a landscape favorite if there is one, else any landscape photo.
    pub highlight: Option<MediaItem>,
}

/// Month bucket; `year` 0 = undated.
#[derive(Debug, Clone, PartialEq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct TimelineBucket {
    pub year: u32,
    /// 1–12; 0 for undated.
    pub month: u32,
    pub count: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Type, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PlaceOption {
    #[sqlx(try_from = "i64")]
    pub id: u32,
    pub name: String,
    pub admin1: Option<String>,
    pub country_code: String,
    #[sqlx(try_from = "i64")]
    pub count: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Type, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct CameraOption {
    pub make: Option<String>,
    pub model: String,
    #[sqlx(try_from = "i64")]
    pub count: u32,
}

pub async fn overview(pool: &SqlitePool, library_id: &str) -> Result<LibraryOverview> {
    let (photos, videos, favorites): (i64, i64, i64) = sqlx::query_as(
        "SELECT COUNT(CASE WHEN media_type = 'image' THEN 1 END),
                COUNT(CASE WHEN media_type = 'video' THEN 1 END),
                COUNT(CASE WHEN is_favorite = 1 THEN 1 END)
         FROM media WHERE library_id = ?1 AND status = 'active'",
    )
    .bind(library_id)
    .fetch_one(pool)
    .await?;
    let albums: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM albums WHERE library_id = ?1")
        .bind(library_id)
        .fetch_one(pool)
        .await?;

    let trips: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM events WHERE library_id = ?1 AND kind = 'trip' AND status != 'ignored'",
    )
    .bind(library_id)
    .fetch_one(pool)
    .await?;

    // Year cover: the newest favorite, else the newest photo (both walk an index backwards).
    let rows: Vec<(String, i64, Option<String>)> = sqlx::query_as(
        "SELECT y, n, COALESCE(
                (SELECT c.id FROM media c
                 WHERE c.library_id = ?1 AND c.status = 'active' AND c.is_favorite = 1
                   AND c.sort_key >= y AND c.sort_key < printf('%04d', y + 1)
                   AND c.media_type = 'image' AND c.thumb_version > 0
                 ORDER BY c.sort_key DESC LIMIT 1),
                (SELECT c.id FROM media c
                 WHERE c.library_id = ?1 AND c.status = 'active'
                   AND c.sort_key >= y AND c.sort_key < printf('%04d', y + 1)
                   AND c.media_type = 'image' AND c.thumb_version > 0
                 ORDER BY c.sort_key DESC LIMIT 1))
         FROM (SELECT substr(sort_key, 1, 4) AS y, COUNT(*) AS n FROM media
               WHERE library_id = ?1 AND status = 'active' AND sort_key != ''
               GROUP BY y)
         ORDER BY y DESC",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?;
    let cover_ids: Vec<String> = rows.iter().filter_map(|r| r.2.clone()).collect();
    let covers = media::get_many(pool, &cover_ids).await?;
    let years = rows
        .into_iter()
        .filter_map(|(y, n, cover)| {
            Some(YearSummary {
                year: y.parse().ok()?,
                count: n as u32,
                cover: cover.and_then(|id| covers.iter().find(|m| m.id == id).cloned()),
            })
        })
        .collect();

    // Hero: a random landscape favorite, else a random landscape among recent photos.
    let highlight_id: Option<String> = sqlx::query_scalar(
        "SELECT id FROM (
             SELECT id, 1 AS favorite, width, height FROM media
             WHERE library_id = ?1 AND status = 'active' AND is_favorite = 1
               AND media_type = 'image' AND thumb_version > 0
             UNION ALL
             SELECT * FROM (
                 SELECT id, 0, width, height FROM media
                 WHERE library_id = ?1 AND status = 'active' AND media_type = 'image' AND thumb_version > 0
                 ORDER BY sort_key DESC LIMIT 500))
         ORDER BY favorite DESC, (COALESCE(width, 0) > COALESCE(height, 0)) DESC, random()
         LIMIT 1",
    )
    .bind(library_id)
    .fetch_optional(pool)
    .await?;
    let highlight = match highlight_id {
        Some(id) => Some(media::get(pool, &id).await?),
        None => None,
    };

    Ok(LibraryOverview {
        photos: photos as u32,
        videos: videos as u32,
        favorites: favorites as u32,
        albums: albums as u32,
        trips: trips as u32,
        years,
        highlight,
    })
}

/// Items per month for everything matching `filter`, newest first, undated last.
pub async fn timeline(
    pool: &SqlitePool,
    library_id: &str,
    filter: &MediaFilter,
) -> Result<Vec<TimelineBucket>> {
    query::validate(filter)?;
    let filter = query::resolve(pool, library_id, filter.clone()).await?;
    let mut qb =
        QueryBuilder::<Sqlite>::new("SELECT substr(m.sort_key, 1, 7) AS ym, COUNT(*) FROM media m");
    query::push_where(&mut qb, library_id, &filter);
    qb.push(" GROUP BY ym ORDER BY ym = '' ASC, ym DESC");
    let rows: Vec<(String, i64)> = qb.build_query_as().fetch_all(pool).await?;
    Ok(rows
        .into_iter()
        .map(|(ym, n)| {
            let year = ym.get(..4).and_then(|y| y.parse().ok()).unwrap_or(0);
            let month = ym.get(5..7).and_then(|m| m.parse().ok()).unwrap_or(0);
            TimelineBucket {
                year,
                month,
                count: n as u32,
            }
        })
        .collect())
}

/// Places with photos, most photographed first.
pub async fn places(pool: &SqlitePool, library_id: &str) -> Result<Vec<PlaceOption>> {
    Ok(sqlx::query_as(
        "SELECT p.id, p.name, p.admin1, p.country_code, COUNT(*) AS count
         FROM media m JOIN places p ON p.id = m.place_id
         WHERE m.library_id = ?1 AND m.status = 'active'
         GROUP BY p.id ORDER BY count DESC, p.name",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?)
}

pub async fn cameras(pool: &SqlitePool, library_id: &str) -> Result<Vec<CameraOption>> {
    Ok(sqlx::query_as(
        "SELECT MAX(camera_make) AS make, camera_model AS model, COUNT(*) AS count
         FROM media
         WHERE library_id = ?1 AND status = 'active' AND camera_model IS NOT NULL
         GROUP BY camera_model ORDER BY count DESC, camera_model",
    )
    .bind(library_id)
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
    async fn overview_and_timeline() {
        let (pool, dir) = test_db().await;
        let lib = libraries::create(&pool, "A", temp_dir().to_str().unwrap())
            .await
            .unwrap();
        let rows = [
            Row {
                id: "a",
                captured_at: Some("2025-07-12T10:00:00"),
                ..Default::default()
            },
            Row {
                id: "b",
                captured_at: Some("2025-07-01T10:00:00"),
                favorite: true,
                ..Default::default()
            },
            Row {
                id: "c",
                captured_at: Some("2025-01-05T10:00:00"),
                media_type: "video",
                ..Default::default()
            },
            Row {
                id: "d",
                captured_at: Some("2019-03-01T10:00:00"),
                camera: Some("Canon EOS R6"),
                ..Default::default()
            },
            Row {
                id: "e",
                ..Default::default()
            },
        ];
        for r in rows {
            insert(&pool, &lib.id, r).await;
        }
        // Only items with thumbnails can be covers/highlight.
        sqlx::query("UPDATE media SET thumb_version = 1 WHERE id IN ('a', 'b', 'd')")
            .execute(&pool)
            .await
            .unwrap();

        let o = overview(&pool, &lib.id).await.unwrap();
        assert_eq!((o.photos, o.videos, o.favorites, o.albums), (4, 1, 1, 0));
        let years: Vec<_> = o
            .years
            .iter()
            .map(|y| (y.year, y.count, y.cover.as_ref().map(|c| c.id.as_str())))
            .collect();
        assert_eq!(
            years,
            [(2025, 3, Some("b")), (2019, 1, Some("d"))],
            "favorite wins the year cover"
        );
        assert_eq!(o.highlight.unwrap().id, "b");

        let t = timeline(&pool, &lib.id, &MediaFilter::default())
            .await
            .unwrap();
        let t: Vec<_> = t.iter().map(|b| (b.year, b.month, b.count)).collect();
        assert_eq!(t, [(2025, 7, 2), (2025, 1, 1), (2019, 3, 1), (0, 0, 1)]);

        let cams = cameras(&pool, &lib.id).await.unwrap();
        assert_eq!(cams.len(), 1);
        assert_eq!((cams[0].model.as_str(), cams[0].count), ("Canon EOS R6", 1));
        assert!(places(&pool, &lib.id).await.unwrap().is_empty());
        let _ = std::fs::remove_dir_all(dir);
    }
}
