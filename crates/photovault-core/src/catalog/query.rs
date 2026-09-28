//! Gallery queries: one filter model shared by the gallery, the viewer navigation,
//! counts and smart albums (whose `rule_json` is a serialized `MediaFilter`).

use super::media::MediaType;
use crate::error::{Error, Result};
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::{QueryBuilder, Sqlite, SqlitePool};

/// Every field is optional; unset fields don't restrict. All set fields combine with AND.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct MediaFilter {
    #[specta(optional)]
    pub media_type: Option<MediaType>,
    /// `true` = only favorites.
    #[specta(optional)]
    pub favorite: Option<bool>,
    #[specta(optional)]
    pub year: Option<u32>,
    /// 1–12. Without `year`, that month in any year.
    #[specta(optional)]
    pub month: Option<u32>,
    /// 1–31; needs `year` and `month`.
    #[specta(optional)]
    pub day: Option<u32>,
    /// Inclusive range, "YYYY-MM-DD".
    #[specta(optional)]
    pub date_from: Option<String>,
    #[specta(optional)]
    pub date_to: Option<String>,
    #[specta(optional)]
    pub place_id: Option<u32>,
    /// Exact `camera_model`.
    #[specta(optional)]
    pub camera: Option<String>,
    #[specta(optional)]
    pub album_id: Option<String>,
    /// Free text (Ctrl+K): years and month names become date filters, the rest is
    /// matched against file name, folder, place and album names.
    #[specta(optional)]
    pub text: Option<String>,
}

impl MediaFilter {
    pub fn is_empty(&self) -> bool {
        *self == MediaFilter::default()
    }

    /// Fields of `self` win; unset ones come from `base` (smart album rule + UI filter).
    fn merged_over(mut self, base: MediaFilter) -> MediaFilter {
        macro_rules! fill {
            ($($f:ident),*) => { $( if self.$f.is_none() { self.$f = base.$f; } )* };
        }
        fill!(
            media_type, favorite, year, month, day, date_from, date_to, place_id, camera, text
        );
        self
    }
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum MediaSort {
    /// Capture date, newest first; undated last.
    #[default]
    Newest,
    /// Capture date, oldest first; undated last.
    Oldest,
    /// File name A→Z.
    Name,
    /// Largest files first.
    Largest,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct MediaQuery {
    pub filter: MediaFilter,
    pub sort: MediaSort,
}

/// SQL pieces of a sort order: `key` is the (single-column) sort expression. Each one has
/// a matching index in migration 0003; keep them in sync.
pub(super) struct SortSpec {
    pub key: &'static str,
    pub descending: bool,
    pub numeric: bool,
}

impl MediaSort {
    pub(super) fn spec(self) -> SortSpec {
        match self {
            // Uses idx_media_gallery.
            MediaSort::Newest => SortSpec {
                key: "m.sort_key",
                descending: true,
                numeric: false,
            },
            // '~' sorts after digits: undated items go last.
            MediaSort::Oldest => SortSpec {
                key: "COALESCE(m.captured_at, '~')",
                descending: false,
                numeric: false,
            },
            MediaSort::Name => SortSpec {
                key: "lower(m.filename)",
                descending: false,
                numeric: false,
            },
            MediaSort::Largest => SortSpec {
                key: "m.file_size",
                descending: true,
                numeric: true,
            },
        }
    }
}

impl SortSpec {
    /// `reverse` walks backwards (nearest previous rows first).
    pub fn order_by(&self, reverse: bool) -> String {
        let dir = if self.descending != reverse {
            "DESC"
        } else {
            "ASC"
        };
        format!("ORDER BY {} {dir}, m.id {dir}", self.key)
    }

    /// Keyset condition for rows after (`after = true`) or before `(key, id)`.
    pub fn push_keyset(
        &self,
        qb: &mut QueryBuilder<'_, Sqlite>,
        key: &str,
        id: &str,
        after: bool,
    ) -> Result<()> {
        let op = if self.descending == after { "<" } else { ">" };
        qb.push(format!(" AND ({}, m.id) {op} (", self.key));
        if self.numeric {
            let n: i64 = key
                .parse()
                .map_err(|_| Error::InvalidInput("Cursor de paginação inválido.".into()))?;
            qb.push_bind(n);
        } else {
            qb.push_bind(key.to_string());
        }
        qb.push(", ").push_bind(id.to_string()).push(")");
        Ok(())
    }
}

/// Text search split into date parts and full-text terms.
#[derive(Debug, Default, PartialEq)]
pub(super) struct ParsedText {
    pub year: Option<u32>,
    pub month: Option<u32>,
    /// FTS5 MATCH expression (every term as a quoted prefix), if any terms remain.
    pub fts: Option<String>,
}

/// Full month names only: abbreviations ("mar", "set") are common words.
const MONTHS: [&[&str]; 12] = [
    &["janeiro"],
    &["fevereiro"],
    &["março", "marco"],
    &["abril"],
    &["maio"],
    &["junho"],
    &["julho"],
    &["agosto"],
    &["setembro"],
    &["outubro"],
    &["novembro"],
    &["dezembro"],
];
/// Words that only connect others ("julho de 2025", "fotos do gramado").
const STOP_WORDS: &[&str] = &["de", "do", "da", "dos", "das", "em", "e", "fotos", "foto"];

pub(super) fn parse_text(text: &str) -> ParsedText {
    let mut parsed = ParsedText::default();
    let mut terms = Vec::new();
    for raw in text.split_whitespace() {
        let word = raw.to_lowercase();
        let word = word.trim_matches(|c: char| !c.is_alphanumeric());
        if word.is_empty() || STOP_WORDS.contains(&word) {
            continue;
        }
        if parsed.year.is_none()
            && word.len() == 4
            && let Ok(year) = word.parse::<u32>()
            && (1900..=2100).contains(&year)
        {
            parsed.year = Some(year);
            continue;
        }
        if parsed.month.is_none()
            && let Some(index) = MONTHS.iter().position(|names| names.contains(&word))
        {
            parsed.month = Some(index as u32 + 1);
            continue;
        }
        // FTS5 syntax is stripped; each term is a quoted prefix query.
        let clean: String = word
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-')
            .collect();
        if !clean.is_empty() {
            terms.push(format!("\"{clean}\"*"));
        }
    }
    if !terms.is_empty() {
        parsed.fts = Some(terms.join(" "));
    }
    parsed
}

/// Smart album: the album's rule replaces the album reference (one level only).
pub(super) async fn resolve(pool: &SqlitePool, mut filter: MediaFilter) -> Result<MediaFilter> {
    let Some(album_id) = filter.album_id.clone() else {
        return Ok(filter);
    };
    let rule: Option<(String, Option<String>)> =
        sqlx::query_as("SELECT kind, rule_json FROM albums WHERE id = ?1")
            .bind(&album_id)
            .fetch_optional(pool)
            .await?;
    match rule {
        None => Err(Error::AlbumNotFound),
        Some((kind, Some(json))) if kind == "smart" => {
            let mut rule: MediaFilter = serde_json::from_str(&json)
                .map_err(|e| Error::Internal(format!("Regra de álbum inválida: {e}")))?;
            rule.album_id = None;
            filter.album_id = None;
            Ok(filter.merged_over(rule))
        }
        Some(_) => Ok(filter),
    }
}

pub(super) fn validate(filter: &MediaFilter) -> Result<()> {
    let invalid = |msg: &str| Err(Error::InvalidInput(msg.into()));
    if filter.month.is_some_and(|m| !(1..=12).contains(&m)) {
        return invalid("Mês inválido.");
    }
    if let Some(day) = filter.day {
        let date = match (filter.year, filter.month) {
            (Some(y), Some(m)) => NaiveDate::from_ymd_opt(y as i32, m, day),
            _ => return invalid("O filtro de dia precisa de ano e mês."),
        };
        if date.is_none() {
            return invalid("Dia inválido.");
        }
    }
    for date in [&filter.date_from, &filter.date_to].into_iter().flatten() {
        if NaiveDate::parse_from_str(date, "%Y-%m-%d").is_err() {
            return invalid("Data inválida (use AAAA-MM-DD).");
        }
    }
    Ok(())
}

/// Appends `WHERE …` for active media of a library matching `filter` (already resolved).
pub(super) fn push_where(
    qb: &mut QueryBuilder<'_, Sqlite>,
    library_id: &str,
    filter: &MediaFilter,
) {
    qb.push(" WHERE m.library_id = ")
        .push_bind(library_id.to_string())
        .push(" AND m.status = 'active'");

    if let Some(kind) = filter.media_type {
        qb.push(" AND m.media_type = ").push_bind(kind.as_str());
    }
    if filter.favorite == Some(true) {
        qb.push(" AND m.is_favorite = 1");
    }
    if let Some(place) = filter.place_id {
        qb.push(" AND m.place_id = ").push_bind(i64::from(place));
    }
    if let Some(camera) = &filter.camera {
        qb.push(" AND m.camera_model = ").push_bind(camera.clone());
    }
    if let Some(album) = &filter.album_id {
        qb.push(" AND m.id IN (SELECT media_id FROM album_media WHERE album_id = ")
            .push_bind(album.clone())
            .push(")");
    }

    let parsed = filter.text.as_deref().map(parse_text).unwrap_or_default();
    let year = filter.year.or(parsed.year);
    let month = filter.month.or(parsed.month);

    // Dates are "YYYY-MM-DDTHH:MM:SS" strings: ranges on sort_key use the gallery index.
    match (year, month, filter.day) {
        (Some(y), Some(m), Some(d)) => {
            let start = format!("{y:04}-{m:02}-{d:02}");
            let end = NaiveDate::from_ymd_opt(y as i32, m, d)
                .and_then(|date| date.succ_opt())
                .map(|next| next.format("%Y-%m-%d").to_string())
                .unwrap_or_else(|| format!("{y:04}-{m:02}-{d:02}~"));
            push_range(qb, &start, &end);
        }
        (Some(y), Some(m), None) => {
            let (ny, nm) = if m == 12 { (y + 1, 1) } else { (y, m + 1) };
            push_range(qb, &format!("{y:04}-{m:02}"), &format!("{ny:04}-{nm:02}"));
        }
        (Some(y), None, _) => push_range(qb, &format!("{y:04}"), &format!("{:04}", y + 1)),
        (None, Some(m), _) => {
            qb.push(" AND substr(m.captured_at, 6, 2) = ")
                .push_bind(format!("{m:02}"));
        }
        (None, None, _) => {}
    }
    if let Some(from) = &filter.date_from {
        qb.push(" AND m.sort_key >= ").push_bind(from.clone());
    }
    if let Some(to) = &filter.date_to {
        // Inclusive: everything on that day ("2025-07-12T23:59:59" < "2025-07-12~").
        qb.push(" AND m.sort_key <= ")
            .push_bind(format!("{to}~"))
            .push(" AND m.sort_key != ''");
    }

    if let Some(fts) = parsed.fts {
        qb.push(" AND m.rowid IN (SELECT rowid FROM media_fts WHERE media_fts MATCH ")
            .push_bind(fts)
            .push(")");
    }
}

fn push_range(qb: &mut QueryBuilder<'_, Sqlite>, start: &str, end: &str) {
    qb.push(" AND m.sort_key >= ")
        .push_bind(start.to_string())
        .push(" AND m.sort_key < ")
        .push_bind(end.to_string());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_dates_and_terms() {
        assert_eq!(
            parse_text("Gramado julho de 2025"),
            ParsedText {
                year: Some(2025),
                month: Some(7),
                fts: Some("\"gramado\"*".into())
            }
        );
        assert_eq!(
            parse_text("março"),
            ParsedText {
                month: Some(3),
                ..Default::default()
            }
        );
        // Abbreviations are words ("mar" = sea), not months.
        assert_eq!(parse_text("mar").fts.as_deref(), Some("\"mar\"*"));
        assert_eq!(parse_text("IMG_1234").fts.as_deref(), Some("\"img_1234\"*"));
        // FTS syntax can't be injected.
        assert_eq!(
            parse_text("a\" OR b*").fts.as_deref(),
            Some("\"a\"* \"or\"* \"b\"*")
        );
        assert_eq!(parse_text("  de  "), ParsedText::default());
        // Only the first year counts; a second 4-digit number is a term.
        assert_eq!(parse_text("2024 2025").fts.as_deref(), Some("\"2025\"*"));
    }

    #[test]
    fn validates_filters() {
        let f = |month, day| MediaFilter {
            year: Some(2025),
            month,
            day,
            ..Default::default()
        };
        assert!(validate(&f(Some(2), Some(28))).is_ok());
        assert!(validate(&f(Some(2), Some(30))).is_err());
        assert!(validate(&f(Some(13), None)).is_err());
        assert!(
            validate(&MediaFilter {
                day: Some(1),
                ..Default::default()
            })
            .is_err()
        );
        assert!(
            validate(&MediaFilter {
                date_from: Some("12/07/2025".into()),
                ..Default::default()
            })
            .is_err()
        );
    }

    #[test]
    fn filter_json_is_compact_and_tolerant() {
        let filter: MediaFilter = serde_json::from_str(r#"{"favorite":true,"year":2025}"#).unwrap();
        assert_eq!(filter.favorite, Some(true));
        assert_eq!(filter.year, Some(2025));
        assert!(!filter.is_empty());
        assert!(
            serde_json::from_str::<MediaFilter>("{}")
                .unwrap()
                .is_empty()
        );
    }

    #[test]
    fn ui_filter_wins_over_album_rule() {
        let rule = MediaFilter {
            year: Some(2025),
            favorite: Some(true),
            ..Default::default()
        };
        let ui = MediaFilter {
            year: Some(2024),
            media_type: Some(MediaType::Video),
            ..Default::default()
        };
        let merged = ui.merged_over(rule);
        assert_eq!(
            (merged.year, merged.favorite, merged.media_type),
            (Some(2024), Some(true), Some(MediaType::Video))
        );
    }
}
