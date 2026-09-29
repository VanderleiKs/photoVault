//! Trips and events (PRD §17): suggestions rebuilt in the global pass from capture
//! dates and GPS (`detect`), and the user's decisions on them.
//!
//! - `suggested`: replaced on every pass (ids are kept when the same photos come back).
//! - `accepted`: kept; new photos taken within its dates join it.
//! - `edited`: the user changed title, dates or photos; never touched again.
//! - `ignored`: hidden, and a new suggestion mostly made of its photos is not made again.
//!
//! Photos in accepted/edited events are not used for new suggestions.

pub mod detect;

use crate::catalog::media::{self, MediaItem};
use crate::catalog::settings::{AppSettings, Home};
use crate::error::{Error, Result};
use crate::ingestion::geo;
use chrono::{Datelike, NaiveDateTime, Utc};
use detect::{Detected, Kind, Shot};
use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::{Sqlite, SqlitePool, Transaction};
use std::collections::{HashMap, HashSet};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum EventKind {
    Trip,
    Event,
}

impl EventKind {
    fn as_str(self) -> &'static str {
        match self {
            EventKind::Trip => "trip",
            EventKind::Event => "event",
        }
    }
    fn parse(s: &str) -> Self {
        if s == "trip" {
            EventKind::Trip
        } else {
            EventKind::Event
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum EventStatus {
    Suggested,
    Accepted,
    Edited,
    Ignored,
}

impl EventStatus {
    fn parse(s: &str) -> Self {
        match s {
            "accepted" => EventStatus::Accepted,
            "edited" => EventStatus::Edited,
            "ignored" => EventStatus::Ignored,
            _ => EventStatus::Suggested,
        }
    }
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct EventSummary {
    pub id: String,
    pub kind: EventKind,
    pub status: EventStatus,
    pub title: String,
    /// Local wall-clock times of the first and last photo.
    pub started_at: String,
    pub ended_at: String,
    /// "Gramado, RS · Canela, RS"
    pub place_summary: Option<String>,
    pub photos: u32,
    pub videos: u32,
    /// Distance from home (trips).
    pub distance_km: Option<u32>,
    pub cover: Option<MediaItem>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct EventDay {
    /// "2025-07-11"
    pub date: String,
    pub count: u32,
    /// Most photographed place of the day.
    pub place: Option<String>,
    pub cover: Option<MediaItem>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct EventRef {
    pub id: String,
    pub kind: EventKind,
    pub status: EventStatus,
    pub title: String,
}

/// What the user changes; unset fields stay.
#[derive(Debug, Clone, Default, Deserialize, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct EventUpdate {
    #[specta(optional)]
    pub title: Option<String>,
    /// "YYYY-MM-DD" (inclusive): the photos of these days become the event's photos.
    #[specta(optional)]
    pub start_date: Option<String>,
    #[specta(optional)]
    pub end_date: Option<String>,
    /// The detection got it wrong: a trip that is an event, or the other way round.
    #[specta(optional)]
    pub kind: Option<EventKind>,
}

const MAX_TITLE: usize = 120;
/// A new suggestion made mostly of an ignored event's photos is not suggested again.
const IGNORED_OVERLAP: f64 = 0.5;
/// Order of "best" photos: favorites, good quality, sharp (cover, highlights).
const BEST_ORDER: &str = "m.is_favorite DESC, m.review_priority IS NULL DESC,
     CASE q.level WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 3 ELSE 2 END,
     COALESCE(q.sharpness, 0) DESC, m.id";

/// Only the best shot of each duplicate/similar group and burst: highlights show
/// different moments, not five takes of the same one.
const DISTINCT_SHOTS: &str = "m.id NOT IN (SELECT s.media_id FROM similarity_members s
         JOIN similarity_groups g ON g.id = s.group_id WHERE g.best_media_id != s.media_id)
     AND m.id NOT IN (SELECT m2.id FROM media m2 JOIN sequences q2 ON q2.id = m2.sequence_id
         WHERE q2.best_media_id != m2.id)";

#[derive(sqlx::FromRow)]
struct ShotRow {
    id: String,
    captured_at: String,
    gps_lat: Option<f64>,
    gps_lon: Option<f64>,
    place: Option<String>,
    admin1: Option<String>,
}

fn parse_time(s: &str) -> Option<NaiveDateTime> {
    NaiveDateTime::parse_from_str(s.get(..19).unwrap_or(s), "%Y-%m-%dT%H:%M:%S").ok()
}

/// Recompute the suggestions of a library (global pass). Idempotent.
pub async fn rebuild(pool: &SqlitePool, library_id: &str, s: &AppSettings) -> Result<()> {
    let settings = &s.events;
    let rows = dated_shots(pool, library_id).await?;
    let homes: Vec<(f64, f64)> = if settings.homes.is_empty() {
        detect::home_base(&shots_of(&rows)).into_iter().collect()
    } else {
        settings.homes.iter().map(|h| (h.lat, h.lon)).collect()
    };

    let mut tx = pool.begin().await?;
    // Accepted events take in new photos of their dates (not claimed by another).
    sqlx::query(
        "INSERT OR IGNORE INTO event_media (event_id, media_id)
         SELECT e.id, m.id FROM events e JOIN media m ON m.library_id = e.library_id
         WHERE e.library_id = ?1 AND e.status = 'accepted' AND m.status = 'active'
           AND m.captured_at BETWEEN e.started_at AND e.ended_at
           AND m.date_source IS NOT NULL AND m.date_source != 'mtime'
           AND m.id NOT IN (SELECT em.media_id FROM event_media em JOIN events o ON o.id = em.event_id
                            WHERE o.status IN ('accepted', 'edited'))",
    )
    .bind(library_id)
    .execute(&mut *tx)
    .await?;

    let claimed: HashSet<String> = sqlx::query_scalar(
        "SELECT em.media_id FROM event_media em JOIN events e ON e.id = em.event_id
         WHERE e.library_id = ?1 AND e.status IN ('accepted', 'edited')",
    )
    .bind(library_id)
    .fetch_all(&mut *tx)
    .await?
    .into_iter()
    .collect();
    let free: Vec<&(ShotRow, NaiveDateTime)> = rows
        .iter()
        .filter(|(r, _)| !claimed.contains(&r.id))
        .collect();
    let shots: Vec<Shot> = free
        .iter()
        .map(|(r, t)| Shot {
            time: *t,
            gps: r.gps_lat.zip(r.gps_lon),
        })
        .collect();
    let found = detect::detect(&shots, &homes, settings);

    // Previous suggestions (to keep their ids) and ignored events (not to repeat them).
    let mut previous: HashMap<String, (String, HashSet<String>)> = HashMap::new();
    let members: Vec<(String, String, String)> = sqlx::query_as(
        "SELECT e.id, e.status, em.media_id FROM events e JOIN event_media em ON em.event_id = e.id
         WHERE e.library_id = ?1 AND e.status IN ('suggested', 'ignored')",
    )
    .bind(library_id)
    .fetch_all(&mut *tx)
    .await?;
    for (id, status, media) in members {
        previous
            .entry(id)
            .or_insert_with(|| (status, HashSet::new()))
            .1
            .insert(media);
    }

    let now = Utc::now().to_rfc3339();
    let mut kept: HashSet<String> = HashSet::new();
    for d in &found {
        let ids: HashSet<String> = d.members.iter().map(|&i| free[i].0.id.clone()).collect();
        let overlap = |other: &HashSet<String>| {
            ids.intersection(other).count() as f64 / ids.len().max(1) as f64
        };
        if previous
            .values()
            .any(|(status, m)| status == "ignored" && overlap(m) >= IGNORED_OVERLAP)
        {
            continue;
        }
        let reuse = previous
            .iter()
            .filter(|(id, (status, m))| {
                status == "suggested" && !kept.contains(*id) && overlap(m) >= 0.5
            })
            .max_by(|a, b| overlap(&a.1.1).total_cmp(&overlap(&b.1.1)))
            .map(|(id, _)| id.clone());
        let id = reuse.unwrap_or_else(|| uuid::Uuid::now_v7().to_string());
        kept.insert(id.clone());
        write_suggestion(&mut tx, library_id, &id, d, &free, &ids, &now).await?;
    }
    // Suggestions that no longer come out go away.
    for (id, (status, _)) in &previous {
        if status == "suggested" && !kept.contains(id) {
            sqlx::query("DELETE FROM events WHERE id = ?1")
                .bind(id)
                .execute(&mut *tx)
                .await?;
        }
    }
    tx.commit().await?;
    Ok(())
}

/// Real capture dates only: files dated by mtime (copies, downloads) say nothing.
async fn dated_shots(pool: &SqlitePool, library_id: &str) -> Result<Vec<(ShotRow, NaiveDateTime)>> {
    let rows: Vec<ShotRow> = sqlx::query_as(
        "SELECT m.id, m.captured_at, m.gps_lat, m.gps_lon, p.name AS place, p.admin1
         FROM media m LEFT JOIN places p ON p.id = m.place_id
         WHERE m.library_id = ?1 AND m.status = 'active' AND m.captured_at IS NOT NULL
           AND m.date_source IS NOT NULL AND m.date_source != 'mtime'
         ORDER BY m.captured_at, m.id",
    )
    .bind(library_id)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .filter_map(|r| {
            let t = parse_time(&r.captured_at)?;
            Some((r, t))
        })
        .collect())
}

fn shots_of(rows: &[(ShotRow, NaiveDateTime)]) -> Vec<Shot> {
    rows.iter()
        .map(|(r, t)| Shot {
            time: *t,
            gps: r.gps_lat.zip(r.gps_lon),
        })
        .collect()
}

/// The home the photos point to (Settings: "Sua casa parece ser…").
pub async fn detected_home(pool: &SqlitePool, library_id: &str) -> Result<Option<Home>> {
    let rows = dated_shots(pool, library_id).await?;
    Ok(detect::home_base(&shots_of(&rows)).map(|(lat, lon)| home_at(lat, lon)))
}

/// A home here, named after the place it is in.
pub fn home_at(lat: f64, lon: f64) -> Home {
    let place = geo::nearest_place(lat, lon);
    Home {
        name: place
            .as_ref()
            .map(place_name)
            .unwrap_or_else(|| format!("{lat:.3}, {lon:.3}")),
        country_code: place.map(|p| p.country_code),
        lat,
        lon,
    }
}

/// Places for the home search (Settings), most populous first.
pub fn search_homes(query: &str) -> Vec<Home> {
    geo::search(query, 8)
        .into_iter()
        .map(|p| Home {
            name: place_name(&p),
            country_code: Some(p.country_code),
            lat: p.lat,
            lon: p.lon,
        })
        .collect()
}

fn place_name(p: &geo::Place) -> String {
    match &p.admin1 {
        Some(a) if !a.is_empty() => format!("{}, {a}", p.name),
        _ => p.name.clone(),
    }
}

/// What "Reclassificar" redoes besides the suggestions (always redone).
#[derive(Debug, Clone, Copy, Default, Deserialize, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct ReclassifyOptions {
    /// Accepted (not edited) events are detected again: those that come back keep their id
    /// and stay accepted, the others go away. Edited events never change.
    pub accepted: bool,
    /// Forget the ignored events: they can be suggested again.
    pub ignored: bool,
}

/// After a reclassification, in the library (ignored events not counted).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct EventCounts {
    pub trips: u32,
    pub events: u32,
    /// Of those, waiting for a decision.
    pub suggested: u32,
}

/// Detect again now, with the current settings (the global pass only redoes suggestions).
pub async fn reclassify(
    pool: &SqlitePool,
    library_id: &str,
    s: &AppSettings,
    opts: ReclassifyOptions,
) -> Result<EventCounts> {
    if opts.ignored {
        sqlx::query("DELETE FROM events WHERE library_id = ?1 AND status = 'ignored'")
            .bind(library_id)
            .execute(pool)
            .await?;
    }
    let accepted: Vec<String> = if opts.accepted {
        sqlx::query_scalar(
            "UPDATE events SET status = 'suggested' WHERE library_id = ?1 AND status = 'accepted'
             RETURNING id",
        )
        .bind(library_id)
        .fetch_all(pool)
        .await?
    } else {
        Vec::new()
    };
    let rebuilt = rebuild(pool, library_id, s).await;
    // Back to accepted, also when the rebuild failed (then nothing was replaced).
    for id in &accepted {
        sqlx::query("UPDATE events SET status = 'accepted' WHERE id = ?1")
            .bind(id)
            .execute(pool)
            .await?;
    }
    rebuilt?;
    counts(pool, library_id).await
}

pub async fn counts(pool: &SqlitePool, library_id: &str) -> Result<EventCounts> {
    let (trips, events, suggested): (i64, i64, i64) = sqlx::query_as(
        "SELECT COALESCE(SUM(kind = 'trip'), 0), COALESCE(SUM(kind = 'event'), 0),
                COALESCE(SUM(status = 'suggested'), 0)
         FROM events WHERE library_id = ?1 AND status != 'ignored'",
    )
    .bind(library_id)
    .fetch_one(pool)
    .await?;
    Ok(EventCounts {
        trips: trips as u32,
        events: events as u32,
        suggested: suggested as u32,
    })
}

#[allow(clippy::too_many_arguments)]
async fn write_suggestion(
    tx: &mut Transaction<'_, Sqlite>,
    library_id: &str,
    id: &str,
    d: &Detected,
    free: &[&(ShotRow, NaiveDateTime)],
    ids: &HashSet<String>,
    now: &str,
) -> Result<()> {
    let times: Vec<NaiveDateTime> = d.members.iter().map(|&i| free[i].1).collect();
    let (start, end) = (times[0], *times.last().unwrap_or(&times[0]));
    let places = top_places(d.members.iter().map(|&i| &free[i].0));
    let kind = match d.kind {
        Kind::Trip => EventKind::Trip,
        Kind::Event => EventKind::Event,
    };
    let title = suggest_title(kind, &places, start);
    let summary = (!places.is_empty()).then(|| {
        places
            .iter()
            .take(3)
            .map(|(name, admin1)| match admin1 {
                Some(a) => format!("{name}, {a}"),
                None => name.clone(),
            })
            .collect::<Vec<_>>()
            .join(" · ")
    });
    let fmt = |t: NaiveDateTime| t.format("%Y-%m-%dT%H:%M:%S").to_string();
    sqlx::query(
        "INSERT INTO events (id, library_id, kind, title, started_at, ended_at, place_summary, status, created_at, distance_km)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'suggested', ?8, ?9)
         ON CONFLICT (id) DO UPDATE SET kind = excluded.kind, title = excluded.title,
            started_at = excluded.started_at, ended_at = excluded.ended_at,
            place_summary = excluded.place_summary, distance_km = excluded.distance_km",
    )
    .bind(id)
    .bind(library_id)
    .bind(kind.as_str())
    .bind(&title)
    .bind(fmt(start))
    .bind(fmt(end))
    .bind(summary)
    .bind(now)
    .bind(d.distance_km)
    .execute(&mut **tx)
    .await?;
    sqlx::query("DELETE FROM event_media WHERE event_id = ?1")
        .bind(id)
        .execute(&mut **tx)
        .await?;
    for media in ids {
        sqlx::query("INSERT INTO event_media (event_id, media_id) VALUES (?1, ?2)")
            .bind(id)
            .bind(media)
            .execute(&mut **tx)
            .await?;
    }
    Ok(())
}

/// Places by number of photos, most photographed first.
fn top_places<'a>(rows: impl Iterator<Item = &'a ShotRow>) -> Vec<(String, Option<String>)> {
    let mut count: HashMap<(String, Option<String>), usize> = HashMap::new();
    for r in rows {
        if let Some(name) = &r.place {
            *count.entry((name.clone(), r.admin1.clone())).or_default() += 1;
        }
    }
    let mut places: Vec<_> = count.into_iter().collect();
    places.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
    places.into_iter().map(|(p, _)| p).collect()
}

const MONTHS: [&str; 12] = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
];

/// "Viagem para Gramado e Canela", "Evento em Porto Alegre", "Evento de 12 de julho de 2025".
pub fn suggest_title(
    kind: EventKind,
    places: &[(String, Option<String>)],
    start: NaiveDateTime,
) -> String {
    let names: Vec<&str> = places.iter().take(2).map(|(n, _)| n.as_str()).collect();
    let joined = names.join(" e ");
    match (kind, names.is_empty()) {
        (EventKind::Trip, false) => format!("Viagem para {joined}"),
        (EventKind::Event, false) => format!("Evento em {joined}"),
        (kind, true) => format!(
            "{} de {} de {} de {}",
            if kind == EventKind::Trip {
                "Viagem"
            } else {
                "Evento"
            },
            start.day(),
            MONTHS[start.month0() as usize],
            start.year()
        ),
    }
}

#[derive(sqlx::FromRow)]
struct EventRow {
    id: String,
    kind: String,
    status: String,
    title: String,
    started_at: String,
    ended_at: String,
    place_summary: Option<String>,
    distance_km: Option<f64>,
    photos: i64,
    videos: i64,
}

const EVENT_SELECT: &str = "SELECT e.id, e.kind, e.status, e.title, e.started_at, e.ended_at, e.place_summary, e.distance_km,
        COUNT(CASE WHEN m.media_type = 'image' THEN 1 END) AS photos,
        COUNT(CASE WHEN m.media_type = 'video' THEN 1 END) AS videos
     FROM events e
     LEFT JOIN event_media em ON em.event_id = e.id
     LEFT JOIN media m ON m.id = em.media_id AND m.status = 'active'";

async fn summarize(pool: &SqlitePool, rows: Vec<EventRow>) -> Result<Vec<EventSummary>> {
    let mut out = Vec::with_capacity(rows.len());
    for r in rows {
        let cover = best(pool, &r.id, 1).await?.into_iter().next();
        out.push(EventSummary {
            kind: EventKind::parse(&r.kind),
            status: EventStatus::parse(&r.status),
            distance_km: r.distance_km.map(|d| d.round() as u32),
            photos: r.photos as u32,
            videos: r.videos as u32,
            cover,
            id: r.id,
            title: r.title,
            started_at: r.started_at,
            ended_at: r.ended_at,
            place_summary: r.place_summary,
        });
    }
    Ok(out)
}

/// Events of a library, newest first (ignored ones only with `ignored = true`).
pub async fn list(pool: &SqlitePool, library_id: &str, ignored: bool) -> Result<Vec<EventSummary>> {
    let rows: Vec<EventRow> = sqlx::query_as(&format!(
        "{EVENT_SELECT} WHERE e.library_id = ?1 AND (e.status = 'ignored') = ?2
         GROUP BY e.id ORDER BY e.started_at DESC"
    ))
    .bind(library_id)
    .bind(ignored)
    .fetch_all(pool)
    .await?;
    summarize(pool, rows).await
}

pub async fn get(pool: &SqlitePool, id: &str) -> Result<EventSummary> {
    let rows: Vec<EventRow> =
        sqlx::query_as(&format!("{EVENT_SELECT} WHERE e.id = ?1 GROUP BY e.id"))
            .bind(id)
            .fetch_all(pool)
            .await?;
    summarize(pool, rows)
        .await?
        .into_iter()
        .next()
        .ok_or_else(|| Error::InvalidInput("Evento não encontrado.".into()))
}

/// Best photos of an event (cover, highlight carousel).
pub async fn best(pool: &SqlitePool, event_id: &str, limit: u32) -> Result<Vec<MediaItem>> {
    let ids: Vec<String> = sqlx::query_scalar(&format!(
        "SELECT m.id FROM event_media em JOIN media m ON m.id = em.media_id
         LEFT JOIN media_quality q ON q.media_id = m.id
         WHERE em.event_id = ?1 AND m.status = 'active' AND m.media_type = 'image' AND m.thumb_version > 0
           AND {DISTINCT_SHOTS}
         ORDER BY {BEST_ORDER} LIMIT ?2"
    ))
    .bind(event_id)
    .bind(i64::from(limit.clamp(1, 60)))
    .fetch_all(pool)
    .await?;
    let items: HashMap<String, MediaItem> = media::get_many(pool, &ids)
        .await?
        .into_iter()
        .map(|m| (m.id.clone(), m))
        .collect();
    Ok(ids.iter().filter_map(|id| items.get(id).cloned()).collect())
}

/// One card per day ("11 JUL · Gramado · 212 fotos").
pub async fn days(pool: &SqlitePool, event_id: &str) -> Result<Vec<EventDay>> {
    let rows: Vec<(String, i64, Option<String>)> = sqlx::query_as(
        "SELECT substr(m.captured_at, 1, 10) AS day, COUNT(*),
                (SELECT p.name FROM event_media em2 JOIN media m2 ON m2.id = em2.media_id
                 JOIN places p ON p.id = m2.place_id
                 WHERE em2.event_id = ?1 AND m2.status = 'active' AND substr(m2.captured_at, 1, 10) = substr(m.captured_at, 1, 10)
                 GROUP BY p.id ORDER BY COUNT(*) DESC LIMIT 1)
         FROM event_media em JOIN media m ON m.id = em.media_id
         WHERE em.event_id = ?1 AND m.status = 'active' AND m.captured_at IS NOT NULL
         GROUP BY day ORDER BY day",
    )
    .bind(event_id)
    .fetch_all(pool)
    .await?;
    let mut out = Vec::with_capacity(rows.len());
    for (date, count, place) in rows {
        let cover: Option<String> = sqlx::query_scalar(&format!(
            "SELECT m.id FROM event_media em JOIN media m ON m.id = em.media_id
             LEFT JOIN media_quality q ON q.media_id = m.id
             WHERE em.event_id = ?1 AND m.status = 'active' AND m.media_type = 'image'
               AND m.thumb_version > 0 AND substr(m.captured_at, 1, 10) = ?2
             ORDER BY {BEST_ORDER} LIMIT 1"
        ))
        .bind(event_id)
        .bind(&date)
        .fetch_optional(pool)
        .await?;
        let cover = match cover {
            Some(id) => Some(media::get(pool, &id).await?),
            None => None,
        };
        out.push(EventDay {
            date,
            count: count as u32,
            place,
            cover,
        });
    }
    Ok(out)
}

/// Events a photo belongs to (info panel), ignored ones excluded.
pub async fn of_media(pool: &SqlitePool, media_id: &str) -> Result<Vec<EventRef>> {
    let rows: Vec<(String, String, String, String)> = sqlx::query_as(
        "SELECT e.id, e.kind, e.status, e.title FROM events e JOIN event_media em ON em.event_id = e.id
         WHERE em.media_id = ?1 AND e.status != 'ignored' ORDER BY e.started_at",
    )
    .bind(media_id)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|(id, kind, status, title)| EventRef {
            id,
            kind: EventKind::parse(&kind),
            status: EventStatus::parse(&status),
            title,
        })
        .collect())
}

/// Suggested events waiting for a decision (sidebar badge).
pub async fn pending_count(pool: &SqlitePool, library_id: &str) -> Result<u32> {
    let n: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM events WHERE library_id = ?1 AND status = 'suggested'",
    )
    .bind(library_id)
    .fetch_one(pool)
    .await?;
    Ok(n as u32)
}

async fn set_status(pool: &SqlitePool, id: &str, status: &str) -> Result<EventSummary> {
    let changed = sqlx::query("UPDATE events SET status = ?1, decided_at = ?2 WHERE id = ?3")
        .bind(status)
        .bind(Utc::now().to_rfc3339())
        .bind(id)
        .execute(pool)
        .await?
        .rows_affected();
    if changed == 0 {
        return Err(Error::InvalidInput("Evento não encontrado.".into()));
    }
    get(pool, id).await
}

pub async fn accept(pool: &SqlitePool, id: &str) -> Result<EventSummary> {
    let current = get(pool, id).await?;
    // An edited event stays edited (frozen); accepting a suggestion keeps it growing.
    let status = if current.status == EventStatus::Edited {
        "edited"
    } else {
        "accepted"
    };
    set_status(pool, id, status).await
}

pub async fn ignore(pool: &SqlitePool, id: &str) -> Result<EventSummary> {
    set_status(pool, id, "ignored").await
}

/// Undo "ignorar": it becomes a suggestion again.
pub async fn restore(pool: &SqlitePool, id: &str) -> Result<EventSummary> {
    set_status(pool, id, "suggested").await
}

/// Edit title and/or dates (the photos of the new days replace the event's photos).
pub async fn update(pool: &SqlitePool, id: &str, change: &EventUpdate) -> Result<EventSummary> {
    let current = get(pool, id).await?;
    let mut tx = pool.begin().await?;
    if let Some(title) = &change.title {
        let title = title.trim();
        if title.is_empty() || title.chars().count() > MAX_TITLE {
            return Err(Error::InvalidInput(format!(
                "O título precisa ter de 1 a {MAX_TITLE} caracteres."
            )));
        }
        sqlx::query("UPDATE events SET title = ?1 WHERE id = ?2")
            .bind(title)
            .bind(id)
            .execute(&mut *tx)
            .await?;
    }
    if change.start_date.is_some() || change.end_date.is_some() {
        let start = change
            .start_date
            .clone()
            .unwrap_or_else(|| current.started_at[..10].to_string());
        let end = change
            .end_date
            .clone()
            .unwrap_or_else(|| current.ended_at[..10].to_string());
        let valid = |d: &str| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").is_ok();
        if !valid(&start) || !valid(&end) || start > end {
            return Err(Error::InvalidInput("Período inválido.".into()));
        }
        let library_id: String = sqlx::query_scalar("SELECT library_id FROM events WHERE id = ?1")
            .bind(id)
            .fetch_one(&mut *tx)
            .await?;
        sqlx::query("DELETE FROM event_media WHERE event_id = ?1")
            .bind(id)
            .execute(&mut *tx)
            .await?;
        sqlx::query(
            "INSERT INTO event_media (event_id, media_id)
             SELECT ?1, m.id FROM media m
             WHERE m.library_id = ?2 AND m.status = 'active'
               AND m.captured_at >= ?3 AND m.captured_at <= ?4 || 'T23:59:59'
               AND m.id NOT IN (SELECT em.media_id FROM event_media em JOIN events o ON o.id = em.event_id
                                WHERE o.id != ?1 AND o.status IN ('accepted', 'edited'))",
        )
        .bind(id)
        .bind(&library_id)
        .bind(&start)
        .bind(&end)
        .execute(&mut *tx)
        .await?;
        refresh_range(&mut tx, id).await?;
    }
    if let Some(kind) = change.kind.filter(|&k| k != current.kind) {
        // An automatic title follows the new kind; one the user wrote stays.
        let title = match &change.title {
            None => retitle(kind, &current.title),
            Some(_) => None,
        };
        sqlx::query("UPDATE events SET kind = ?1, title = COALESCE(?2, title) WHERE id = ?3")
            .bind(kind.as_str())
            .bind(title)
            .bind(id)
            .execute(&mut *tx)
            .await?;
    }
    mark_edited(&mut tx, id).await?;
    tx.commit().await?;
    get(pool, id).await
}

/// "Evento em Gramado" → "Viagem para Gramado" (and back); `None` for a title of the user.
fn retitle(kind: EventKind, title: &str) -> Option<String> {
    let (from, to) = match kind {
        EventKind::Trip => (["Evento em ", "Evento de "], ["Viagem para ", "Viagem de "]),
        EventKind::Event => (["Viagem para ", "Viagem de "], ["Evento em ", "Evento de "]),
    };
    from.iter()
        .zip(to)
        .find_map(|(f, t)| title.strip_prefix(f).map(|rest| format!("{t}{rest}")))
}

/// "Juntar": several events become one (e.g. a trip without GPS, split into one event per
/// day). Takes their photos and the free photos between them (not in another accepted or
/// edited event); the result is "edited", and suggestions left inside it go away.
#[derive(Debug, Clone, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct EventMerge {
    pub event_ids: Vec<String>,
    pub kind: EventKind,
    /// Empty/absent: from the place, or from the places of the photos.
    #[specta(optional)]
    pub title: Option<String>,
    /// Where it was, when the photos don't say ("Salvador, BA").
    #[specta(optional)]
    pub place: Option<String>,
}

pub async fn merge(pool: &SqlitePool, m: &EventMerge) -> Result<EventSummary> {
    let mut ids: Vec<&String> = m.event_ids.iter().collect();
    ids.sort();
    ids.dedup();
    if ids.len() < 2 {
        return Err(Error::InvalidInput(
            "Escolha pelo menos dois eventos para juntar.".into(),
        ));
    }
    let mut events = Vec::with_capacity(ids.len());
    for id in &ids {
        events.push(get(pool, id).await?);
    }
    if events.iter().any(|e| e.status == EventStatus::Ignored) {
        return Err(Error::InvalidInput(
            "Eventos ignorados não podem ser juntados.".into(),
        ));
    }
    events.sort_by(|a, b| a.started_at.cmp(&b.started_at));
    let place = m.place.as_deref().map(str::trim).filter(|p| !p.is_empty());
    let custom = m.title.as_deref().map(str::trim).filter(|t| !t.is_empty());
    if let Some(t) = custom
        && t.chars().count() > MAX_TITLE
    {
        return Err(Error::InvalidInput(format!(
            "O título pode ter até {MAX_TITLE} caracteres."
        )));
    }
    if place.is_some_and(|p| p.chars().count() > MAX_TITLE) {
        return Err(Error::InvalidInput("Nome de lugar longo demais.".into()));
    }
    let libraries: Vec<String> = {
        let mut out = Vec::new();
        for e in &events {
            let lib: String = sqlx::query_scalar("SELECT library_id FROM events WHERE id = ?1")
                .bind(&e.id)
                .fetch_one(pool)
                .await?;
            out.push(lib);
        }
        out
    };
    if libraries.iter().any(|l| l != &libraries[0]) {
        return Err(Error::InvalidInput(
            "Os eventos são de bibliotecas diferentes.".into(),
        ));
    }
    let library_id = &libraries[0];
    let target = &events[0].id;
    let start = events
        .iter()
        .map(|e| e.started_at.as_str())
        .min()
        .unwrap_or_default()
        .to_string();
    let end = events
        .iter()
        .map(|e| e.ended_at.as_str())
        .max()
        .unwrap_or_default()
        .to_string();
    let others: Vec<&str> = events[1..].iter().map(|e| e.id.as_str()).collect();

    let mut tx = pool.begin().await?;
    for other in &others {
        sqlx::query(
            "INSERT OR IGNORE INTO event_media (event_id, media_id)
             SELECT ?1, media_id FROM event_media WHERE event_id = ?2",
        )
        .bind(target)
        .bind(other)
        .execute(&mut *tx)
        .await?;
        sqlx::query("DELETE FROM events WHERE id = ?1")
            .bind(other)
            .execute(&mut *tx)
            .await?;
    }
    // The photos in between (the evenings, the day with few photos).
    sqlx::query(
        "INSERT OR IGNORE INTO event_media (event_id, media_id)
         SELECT ?1, m.id FROM media m
         WHERE m.library_id = ?2 AND m.status = 'active'
           AND m.captured_at BETWEEN ?3 AND ?4
           AND m.date_source IS NOT NULL AND m.date_source != 'mtime'
           AND m.id NOT IN (SELECT em.media_id FROM event_media em JOIN events o ON o.id = em.event_id
                            WHERE o.id != ?1 AND o.status IN ('accepted', 'edited'))",
    )
    .bind(target)
    .bind(library_id)
    .bind(&start)
    .bind(&end)
    .execute(&mut *tx)
    .await?;
    // Suggestions now inside it.
    sqlx::query(
        "DELETE FROM events WHERE library_id = ?1 AND status = 'suggested' AND id != ?2
           AND NOT EXISTS (SELECT 1 FROM event_media em WHERE em.event_id = events.id
                           AND em.media_id NOT IN (SELECT media_id FROM event_media WHERE event_id = ?2))",
    )
    .bind(library_id)
    .bind(target)
    .execute(&mut *tx)
    .await?;

    let photo_places: Vec<(String, Option<String>)> = sqlx::query_as(
        "SELECT p.name, p.admin1 FROM event_media em JOIN media m ON m.id = em.media_id
         JOIN places p ON p.id = m.place_id WHERE em.event_id = ?1
         GROUP BY p.id ORDER BY COUNT(*) DESC, p.name LIMIT 3",
    )
    .bind(target)
    .fetch_all(&mut *tx)
    .await?;
    let summary = match place {
        Some(p) => Some(p.to_string()),
        None => (!photo_places.is_empty()).then(|| {
            photo_places
                .iter()
                .map(|(n, a)| match a {
                    Some(a) => format!("{n}, {a}"),
                    None => n.clone(),
                })
                .collect::<Vec<_>>()
                .join(" · ")
        }),
    };
    let title = match (custom, place) {
        (Some(t), _) => t.to_string(),
        // "Salvador, BA" → "Viagem para Salvador"
        (None, Some(p)) => {
            let name = p.split(',').next().unwrap_or(p).trim().to_string();
            suggest_title(
                m.kind,
                &[(name, None)],
                parse_time(&start).unwrap_or_default(),
            )
        }
        (None, None) => suggest_title(
            m.kind,
            &photo_places,
            parse_time(&start).unwrap_or_default(),
        ),
    };
    sqlx::query("UPDATE events SET kind = ?1, title = ?2, place_summary = ?3 WHERE id = ?4")
        .bind(m.kind.as_str())
        .bind(&title)
        .bind(summary)
        .bind(target)
        .execute(&mut *tx)
        .await?;
    refresh_range(&mut tx, target).await?;
    mark_edited(&mut tx, target).await?;
    tx.commit().await?;
    get(pool, target).await
}

/// Take photos out of an event (it becomes "edited").
pub async fn remove_media(
    pool: &SqlitePool,
    id: &str,
    media_ids: &[String],
) -> Result<EventSummary> {
    let mut tx = pool.begin().await?;
    for media in media_ids {
        sqlx::query("DELETE FROM event_media WHERE event_id = ?1 AND media_id = ?2")
            .bind(id)
            .bind(media)
            .execute(&mut *tx)
            .await?;
    }
    refresh_range(&mut tx, id).await?;
    mark_edited(&mut tx, id).await?;
    tx.commit().await?;
    get(pool, id).await
}

async fn mark_edited(tx: &mut Transaction<'_, Sqlite>, id: &str) -> Result<()> {
    sqlx::query("UPDATE events SET status = 'edited', decided_at = ?1 WHERE id = ?2")
        .bind(Utc::now().to_rfc3339())
        .bind(id)
        .execute(&mut **tx)
        .await?;
    Ok(())
}

/// Dates follow the photos that are left.
async fn refresh_range(tx: &mut Transaction<'_, Sqlite>, id: &str) -> Result<()> {
    sqlx::query(
        "UPDATE events SET
            started_at = COALESCE((SELECT MIN(m.captured_at) FROM event_media em JOIN media m ON m.id = em.media_id WHERE em.event_id = ?1), started_at),
            ended_at = COALESCE((SELECT MAX(m.captured_at) FROM event_media em JOIN media m ON m.id = em.media_id WHERE em.event_id = ?1), ended_at)
         WHERE id = ?1",
    )
    .bind(id)
    .execute(&mut **tx)
    .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    use crate::catalog::settings::EventSettings;
    use crate::catalog::{MediaFilter, MediaQuery, libraries};
    use crate::db::tests::test_db;

    /// `n` photos from `start` (every 10 min) at a place, as the ingest leaves them.
    async fn shoot(
        pool: &SqlitePool,
        library: &str,
        prefix: &str,
        start: &str,
        n: usize,
        place: Option<(i64, f64, f64)>,
    ) {
        let t0 = NaiveDateTime::parse_from_str(start, "%Y-%m-%d %H:%M").unwrap();
        for i in 0..n {
            let at = (t0 + chrono::Duration::minutes(10 * i as i64))
                .format("%Y-%m-%dT%H:%M:%S")
                .to_string();
            sqlx::query(
                "INSERT INTO media (id, library_id, relative_path, filename, extension, media_type, file_size,
                                    captured_at, date_source, gps_lat, gps_lon, place_id, indexed_at, updated_at)
                 VALUES (?1, ?2, ?1, ?1, 'jpg', 'image', 1, ?3, 'exif_original', ?4, ?5, ?6, 'now', 'now')",
            )
            .bind(format!("{prefix}{i:03}"))
            .bind(library)
            .bind(at)
            .bind(place.map(|p| p.1))
            .bind(place.map(|p| p.2))
            .bind(place.map(|p| p.0))
            .execute(pool)
            .await
            .unwrap();
        }
    }

    const FLORIPA: Option<(i64, f64, f64)> = Some((2, -27.59, -48.55));

    /// Home in Porto Alegre, 2 days in Florianópolis, a party at home.
    async fn floripa_library(pool: &SqlitePool, dir: &std::path::Path) -> String {
        let lib = libraries::create(pool, "A", dir.to_str().unwrap())
            .await
            .unwrap()
            .id;
        sqlx::query(
            "INSERT INTO places (id, name, admin1, country_code, lat, lon) VALUES
             (1, 'Porto Alegre', 'RS', 'BR', -30.03, -51.23), (2, 'Florianópolis', 'SC', 'BR', -27.59, -48.55)",
        )
        .execute(pool)
        .await
        .unwrap();
        let home = Some((1, -30.03, -51.23));
        for d in 1..=20 {
            shoot(
                pool,
                &lib,
                &format!("h{d:02}-"),
                &format!("2025-03-{d:02} 12:00"),
                2,
                home,
            )
            .await;
        }
        shoot(pool, &lib, "t1-", "2025-07-10 09:00", 15, FLORIPA).await;
        shoot(pool, &lib, "t2-", "2025-07-11 09:00", 15, FLORIPA).await;
        shoot(pool, &lib, "party-", "2025-08-02 19:00", 25, home).await;
        lib
    }

    #[tokio::test]
    async fn decisions_survive_rebuilds() {
        let (pool, dir) = test_db().await;
        let lib = floripa_library(&pool, &dir).await;
        let s = AppSettings::default();
        rebuild(&pool, &lib, &s).await.unwrap();

        let events = list(&pool, &lib, false).await.unwrap();
        assert_eq!(events.len(), 2, "{events:?}");
        let (party, trip) = (&events[0], &events[1]);
        assert_eq!(
            (trip.kind, trip.status, trip.photos),
            (EventKind::Trip, EventStatus::Suggested, 30)
        );
        assert_eq!(trip.title, "Viagem para Florianópolis");
        assert_eq!(trip.place_summary.as_deref(), Some("Florianópolis, SC"));
        assert!(trip.distance_km.unwrap() > 300);
        assert_eq!(
            (party.kind, party.title.as_str()),
            (EventKind::Event, "Evento em Porto Alegre")
        );
        assert_eq!(pending_count(&pool, &lib).await.unwrap(), 2);

        // Same photos next pass: same ids.
        rebuild(&pool, &lib, &s).await.unwrap();
        let again = list(&pool, &lib, false).await.unwrap();
        assert_eq!(
            again.iter().map(|e| &e.id).collect::<Vec<_>>(),
            [&party.id, &trip.id]
        );

        // Gallery of the trip; per-day cards.
        let page = media::list(
            &pool,
            &lib,
            &MediaQuery {
                filter: MediaFilter {
                    event_id: Some(trip.id.clone()),
                    ..Default::default()
                },
                ..Default::default()
            },
            None,
            100,
        )
        .await
        .unwrap();
        assert_eq!(page.items.len(), 30);
        let d = days(&pool, &trip.id).await.unwrap();
        assert_eq!(
            d.iter()
                .map(|d| (d.date.as_str(), d.count))
                .collect::<Vec<_>>(),
            [("2025-07-10", 15), ("2025-07-11", 15)]
        );
        assert_eq!(d[0].place.as_deref(), Some("Florianópolis"));

        // Accepted: new photos of those dates join it; ignored: not suggested again.
        accept(&pool, &trip.id).await.unwrap();
        ignore(&pool, &party.id).await.unwrap();
        shoot(&pool, &lib, "late-", "2025-07-10 12:00", 3, FLORIPA).await;
        rebuild(&pool, &lib, &s).await.unwrap();
        let now = list(&pool, &lib, false).await.unwrap();
        assert_eq!(now.len(), 1, "the party stays ignored: {now:?}");
        assert_eq!((now[0].status, now[0].photos), (EventStatus::Accepted, 33));
        assert_eq!(list(&pool, &lib, true).await.unwrap()[0].id, party.id);
        assert_eq!(of_media(&pool, "late-000").await.unwrap()[0].id, trip.id);

        // Edited: title, then photos out; frozen afterwards.
        let edited = update(
            &pool,
            &trip.id,
            &EventUpdate {
                title: Some("  Férias em Floripa ".into()),
                ..Default::default()
            },
        )
        .await
        .unwrap();
        assert_eq!(
            (edited.title.as_str(), edited.status),
            ("Férias em Floripa", EventStatus::Edited)
        );
        // Kind: a title of the user stays.
        let as_event = update(
            &pool,
            &trip.id,
            &EventUpdate {
                kind: Some(EventKind::Event),
                ..Default::default()
            },
        )
        .await
        .unwrap();
        assert_eq!(
            (as_event.kind, as_event.title.as_str()),
            (EventKind::Event, "Férias em Floripa")
        );
        let fewer = remove_media(&pool, &trip.id, &["t2-014".into()])
            .await
            .unwrap();
        assert_eq!(fewer.photos, 32);
        rebuild(&pool, &lib, &s).await.unwrap();
        assert_eq!(get(&pool, &trip.id).await.unwrap().photos, 32);
        // Dates: only the first day.
        let one_day = update(
            &pool,
            &trip.id,
            &EventUpdate {
                start_date: Some("2025-07-10".into()),
                end_date: Some("2025-07-10".into()),
                ..Default::default()
            },
        )
        .await
        .unwrap();
        assert_eq!(
            (one_day.photos, &one_day.ended_at[..10]),
            (18, "2025-07-10")
        );
        assert!(
            update(
                &pool,
                &trip.id,
                &EventUpdate {
                    title: Some(" ".into()),
                    ..Default::default()
                }
            )
            .await
            .is_err()
        );

        // Restoring the ignored party makes it a suggestion again.
        restore(&pool, &party.id).await.unwrap();
        assert_eq!(pending_count(&pool, &lib).await.unwrap(), 1);
        let _ = std::fs::remove_dir_all(dir);
    }

    #[test]
    fn titles_from_places_or_dates() {
        let at = NaiveDateTime::parse_from_str("2025-07-12 10:00", "%Y-%m-%d %H:%M").unwrap();
        let places = vec![
            ("Gramado".to_string(), Some("RS".to_string())),
            ("Canela".to_string(), Some("RS".to_string())),
            ("Nova Petrópolis".to_string(), Some("RS".to_string())),
        ];
        assert_eq!(
            suggest_title(EventKind::Trip, &places, at),
            "Viagem para Gramado e Canela"
        );
        assert_eq!(
            suggest_title(EventKind::Event, &places[..1], at),
            "Evento em Gramado"
        );
        assert_eq!(
            suggest_title(EventKind::Event, &[], at),
            "Evento de 12 de julho de 2025"
        );
    }

    #[tokio::test]
    async fn reclassify_redoes_what_was_asked() {
        let (pool, dir) = test_db().await;
        let lib = floripa_library(&pool, &dir).await;
        let s = AppSettings::default();
        rebuild(&pool, &lib, &s).await.unwrap();
        let events = list(&pool, &lib, false).await.unwrap();
        let (party, trip) = (events[0].id.clone(), events[1].id.clone());
        accept(&pool, &trip).await.unwrap();
        ignore(&pool, &party).await.unwrap();
        let count = |trips, events, suggested| EventCounts {
            trips,
            events,
            suggested,
        };

        // Accepted again from the same photos: same id, still accepted.
        let same = reclassify(
            &pool,
            &lib,
            &s,
            ReclassifyOptions {
                accepted: true,
                ..Default::default()
            },
        )
        .await
        .unwrap();
        assert_eq!(same, count(1, 0, 0));
        assert_eq!(
            get(&pool, &trip).await.unwrap().status,
            EventStatus::Accepted
        );

        // Florianópolis no longer "away": only suggestions are redone by default...
        let far = AppSettings {
            events: EventSettings {
                trip_min_km: 1000,
                ..Default::default()
            },
            ..Default::default()
        };
        let kept = reclassify(&pool, &lib, &far, ReclassifyOptions::default())
            .await
            .unwrap();
        assert_eq!(kept, count(1, 0, 0));
        // ...unless asked to redo the accepted ones too.
        let redone = reclassify(
            &pool,
            &lib,
            &far,
            ReclassifyOptions {
                accepted: true,
                ..Default::default()
            },
        )
        .await
        .unwrap();
        assert_eq!(redone, count(0, 0, 0));
        // Forgetting the ignored ones brings the party back.
        let all = reclassify(
            &pool,
            &lib,
            &s,
            ReclassifyOptions {
                ignored: true,
                ..Default::default()
            },
        )
        .await
        .unwrap();
        assert_eq!(all, count(1, 1, 2));
        // Florianópolis as a second home: no trip there.
        let two_homes = AppSettings {
            events: EventSettings {
                homes: vec![home_at(-30.03, -51.23), home_at(-27.59, -48.55)],
                ..Default::default()
            },
            ..Default::default()
        };
        assert_eq!(two_homes.events.homes[1].name, "Florianópolis, SC");
        let at_home = reclassify(&pool, &lib, &two_homes, ReclassifyOptions::default())
            .await
            .unwrap();
        assert_eq!(at_home, count(0, 1, 1));
    }

    #[tokio::test]
    async fn events_of_a_trip_without_gps_can_be_merged() {
        let (pool, dir) = test_db().await;
        let lib = libraries::create(&pool, "A", dir.to_str().unwrap())
            .await
            .unwrap()
            .id;
        // Three days away without GPS: three events (and a few photos on the evening of
        // the second day, too few for an event).
        shoot(&pool, &lib, "d1-", "2025-01-10 09:00", 25, None).await;
        shoot(&pool, &lib, "d2-", "2025-01-11 09:00", 25, None).await;
        shoot(&pool, &lib, "eve-", "2025-01-11 20:00", 3, None).await;
        shoot(&pool, &lib, "d3-", "2025-01-12 09:00", 25, None).await;
        shoot(&pool, &lib, "later-", "2025-02-01 09:00", 25, None).await;
        let s = AppSettings::default();
        rebuild(&pool, &lib, &s).await.unwrap();
        let events = list(&pool, &lib, false).await.unwrap();
        assert_eq!(events.len(), 4, "{events:?}");
        assert!(events.iter().all(|e| e.kind == EventKind::Event));
        let days: Vec<String> = events[1..].iter().map(|e| e.id.clone()).collect();

        let bad = EventMerge {
            event_ids: vec![days[0].clone()],
            kind: EventKind::Trip,
            title: None,
            place: None,
        };
        assert!(merge(&pool, &bad).await.is_err(), "needs two");

        let trip = merge(
            &pool,
            &EventMerge {
                event_ids: days.clone(),
                kind: EventKind::Trip,
                title: None,
                place: Some("Salvador, BA".into()),
            },
        )
        .await
        .unwrap();
        assert_eq!(
            (trip.kind, trip.status, trip.photos, trip.title.as_str()),
            (
                EventKind::Trip,
                EventStatus::Edited,
                78,
                "Viagem para Salvador"
            )
        );
        assert_eq!(trip.place_summary.as_deref(), Some("Salvador, BA"));
        assert_eq!(
            (&trip.started_at[..10], &trip.ended_at[..10]),
            ("2025-01-10", "2025-01-12")
        );
        assert!(days.contains(&trip.id));

        // The pass afterwards doesn't split it again; the other event stays.
        rebuild(&pool, &lib, &s).await.unwrap();
        let now = list(&pool, &lib, false).await.unwrap();
        assert_eq!(now.len(), 2, "{now:?}");
        assert_eq!(get(&pool, &trip.id).await.unwrap().photos, 78);
        let _ = std::fs::remove_dir_all(dir);
    }

    #[test]
    fn automatic_titles_follow_the_kind() {
        assert_eq!(
            retitle(EventKind::Trip, "Evento em Gramado e Canela").as_deref(),
            Some("Viagem para Gramado e Canela")
        );
        assert_eq!(
            retitle(EventKind::Event, "Viagem de 12 de julho de 2025").as_deref(),
            Some("Evento de 12 de julho de 2025")
        );
        assert_eq!(retitle(EventKind::Trip, "Aniversário da Ana"), None);
    }
}
