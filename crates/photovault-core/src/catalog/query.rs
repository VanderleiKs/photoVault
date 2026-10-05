//! Gallery queries: one filter model shared by the gallery, the viewer navigation,
//! counts and smart albums (whose `rule_json` is a serialized `MediaFilter`).

use super::media::MediaType;
use crate::analysis::classify::{QualityFlag, QualityLevel};
use crate::error::{Error, Result};
use crate::review::ReviewReason;
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
    /// Technical quality level (phase 4).
    #[specta(optional)]
    pub quality: Option<QualityLevel>,
    #[specta(optional)]
    pub quality_flag: Option<QualityFlag>,
    /// `true` = screenshots only (score above the configured threshold).
    #[specta(optional)]
    pub screenshot: Option<bool>,
    #[specta(optional)]
    pub momentary: Option<MomentaryFilter>,
    /// Manual tag.
    #[specta(optional)]
    pub tag: Option<String>,
    /// Members of a duplicate/similar group or of a burst (viewer navigation).
    #[specta(optional)]
    pub group_id: Option<String>,
    #[specta(optional)]
    pub sequence_id: Option<String>,
    /// `true` = photos with pending review suggestions (phase 5).
    #[specta(optional)]
    pub review: Option<bool>,
    /// Pending suggestions for this reason.
    #[specta(optional)]
    pub review_reason: Option<ReviewReason>,
    /// `true` = the trash instead of the active photos.
    #[specta(optional)]
    pub trashed: Option<bool>,
    /// Photos of a trip/event (phase 6).
    #[specta(optional)]
    pub event_id: Option<String>,
    /// Photos where this person appears (phase 7b).
    #[specta(optional)]
    pub person_id: Option<String>,
    /// `true` = improved photos only ("Melhoradas", phase 9); `false` = not improved.
    #[specta(optional)]
    pub edited: Option<bool>,
    /// Filled by `resolve` from `text` when the local AI is available: photos whose
    /// content matches (phase 7a). Never part of the API or of a smart album's rule.
    #[serde(skip)]
    #[specta(skip)]
    pub content_hits: Option<std::sync::Arc<Vec<String>>>,
    /// Filled by `resolve` from `text` while a name is being typed ("an" → Ana): their
    /// photos join the usual results. Same rules as `content_hits`.
    #[serde(skip)]
    #[specta(skip)]
    pub people_hits: Option<Vec<String>>,
    /// Filled by `resolve` from names in `text` ("Ana praia", "Ana Bruno"): photos must
    /// show someone of each group (AND across, OR within: two "Ana"s). Same rules.
    #[serde(skip)]
    #[specta(skip)]
    pub people_all: Vec<Vec<String>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum MomentaryFilter {
    Any,
    Document,
    Accidental,
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
            media_type,
            favorite,
            year,
            month,
            day,
            date_from,
            date_to,
            place_id,
            camera,
            text,
            quality,
            quality_flag,
            screenshot,
            momentary,
            tag,
            group_id,
            sequence_id,
            review,
            review_reason,
            trashed,
            event_id,
            person_id,
            edited
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
    /// Review priority, highest first (photos without suggestions last).
    Priority,
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
            // Uses idx_media_review (migration 0005).
            MediaSort::Priority => SortSpec {
                key: "COALESCE(m.review_priority, -1)",
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
    /// The text without the dates, as typed (stop words kept: "pôr do sol"), for the
    /// content search.
    pub content: Option<String>,
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

/// Names in a search ("Ana praia 2024", "ana bruno"): each word equal to a word of a named
/// person's name requires that person; the rest of the text stays for the usual search.
/// Without such a word, a name being typed ("an", "ana sou": every word starts a word of
/// the same name) only adds that person's photos to the results.
#[derive(Debug, Default, PartialEq)]
pub(crate) struct NameSearch {
    pub required: Vec<Vec<String>>,
    pub rest: String,
    pub typing: Vec<String>,
}

pub(crate) fn split_names(text: &str, named: &[(String, String)]) -> NameSearch {
    use crate::ingestion::geo::fold;
    let names: Vec<(&str, Vec<String>)> = named
        .iter()
        .map(|(id, n)| {
            (
                id.as_str(),
                fold(n).split_whitespace().map(String::from).collect(),
            )
        })
        .collect();
    let mut out = NameSearch::default();
    // (as typed, folded if it may be part of a name being typed)
    let mut rest: Vec<(&str, Option<String>)> = Vec::new();
    for raw in text.split_whitespace() {
        let word = fold(raw.trim_matches(|c: char| !c.is_alphanumeric()));
        let is_date = (word.len() == 4
            && word
                .parse::<u32>()
                .is_ok_and(|y| (1900..=2100).contains(&y)))
            || MONTHS.iter().any(|m| m.contains(&word.as_str()));
        if word.chars().count() < 2 || is_date || STOP_WORDS.contains(&word.as_str()) {
            rest.push((raw, None));
            continue;
        }
        let people: Vec<String> = names
            .iter()
            .filter(|(_, words)| words.contains(&word))
            .map(|(id, _)| id.to_string())
            .collect();
        if people.is_empty() {
            rest.push((raw, Some(word)));
        } else if !out.required.contains(&people) {
            out.required.push(people);
        }
    }
    let starts_a_name_of = |p: &str, ids: &[String]| {
        names.iter().any(|(id, words)| {
            ids.iter().any(|i| i == id) && words.iter().any(|w| w.starts_with(p))
        })
    };
    // "ana sou": the rest of a required person's name, still being typed.
    let required: Vec<String> = out.required.concat();
    rest.retain(|(_, plain)| {
        plain
            .as_deref()
            .is_none_or(|p| !starts_a_name_of(p, &required))
    });
    out.rest = rest
        .iter()
        .map(|(raw, _)| *raw)
        .collect::<Vec<_>>()
        .join(" ");
    let plain: Vec<&str> = rest.iter().filter_map(|(_, p)| p.as_deref()).collect();
    if out.required.is_empty() && !plain.is_empty() {
        out.typing = names
            .iter()
            .filter(|(_, words)| plain.iter().all(|p| words.iter().any(|w| w.starts_with(p))))
            .map(|(id, _)| id.to_string())
            .collect();
    }
    out
}

pub(super) fn parse_text(text: &str) -> ParsedText {
    let mut parsed = ParsedText::default();
    let mut terms = Vec::new();
    let mut content: Vec<&str> = Vec::new();
    for raw in text.split_whitespace() {
        let word = raw.to_lowercase();
        let word = word.trim_matches(|c: char| !c.is_alphanumeric());
        if word.is_empty() {
            continue;
        }
        if STOP_WORDS.contains(&word) {
            content.push(raw);
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
        content.push(raw);
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
        // Connectors at the edges go ("Gramado julho de 2025" → "Gramado"), inner ones stay
        // ("pôr do sol").
        let is_stop = |w: &&str| STOP_WORDS.contains(&w.to_lowercase().as_str());
        while content.last().is_some_and(is_stop) {
            content.pop();
        }
        let start = content
            .iter()
            .position(|w| !is_stop(w))
            .unwrap_or(content.len());
        parsed.content = Some(content[start..].join(" ")).filter(|c| !c.is_empty());
    }
    parsed
}

/// Smart album: the album's rule replaces the album reference (one level only). Then the
/// text also searches the content of the photos, if the local AI is available.
pub(crate) async fn resolve(
    pool: &SqlitePool,
    library_id: &str,
    filter: MediaFilter,
) -> Result<MediaFilter> {
    let mut filter = resolve_album(pool, filter).await?;
    filter.content_hits = None;
    filter.people_hits = None;
    filter.people_all = Vec::new();
    if let Some(text) = filter.text.clone() {
        let names = split_names(&text, &crate::people::names(pool).await?);
        if !names.required.is_empty() {
            // "Ana praia": Ana's photos, searched for the rest.
            filter.people_all = names.required;
            filter.text = Some(names.rest).filter(|t| !t.trim().is_empty());
        } else if !names.typing.is_empty() {
            filter.people_hits = Some(names.typing);
        }
    }
    if let Some(content) = filter
        .text
        .as_deref()
        .map(parse_text)
        .and_then(|p| p.content)
    {
        filter.content_hits = crate::ai::index::search(pool, library_id, &content).await?;
    }
    Ok(filter)
}

async fn resolve_album(pool: &SqlitePool, mut filter: MediaFilter) -> Result<MediaFilter> {
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

pub(crate) fn validate(filter: &MediaFilter) -> Result<()> {
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
pub(crate) fn push_where(
    qb: &mut QueryBuilder<'_, Sqlite>,
    library_id: &str,
    filter: &MediaFilter,
) {
    qb.push(" WHERE m.library_id = ")
        .push_bind(library_id.to_string())
        .push(if filter.trashed == Some(true) {
            " AND m.status = 'trashed'"
        } else {
            " AND m.status = 'active'"
        });

    if let Some(kind) = filter.media_type {
        qb.push(" AND m.media_type = ").push_bind(kind.as_str());
    }
    if filter.favorite == Some(true) {
        qb.push(" AND m.is_favorite = 1");
    }
    match filter.edited {
        Some(true) => qb.push(" AND m.id IN (SELECT media_id FROM media_edits)"),
        Some(false) => qb.push(" AND m.id NOT IN (SELECT media_id FROM media_edits)"),
        None => qb,
    };
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

    if let Some(level) = filter.quality {
        qb.push(" AND m.id IN (SELECT media_id FROM media_quality WHERE level = ")
            .push_bind(level.as_str())
            .push(")");
    }
    if let Some(flag) = filter.quality_flag {
        qb.push(" AND m.id IN (SELECT q.media_id FROM media_quality q, json_each(q.flags) f WHERE f.value = ")
            .push_bind(flag.as_str())
            .push(")");
    }
    if filter.screenshot == Some(true) {
        push_label(qb, "category", Some("screenshot"));
    }
    match filter.momentary {
        Some(MomentaryFilter::Any) => push_label(qb, "momentary", None),
        Some(MomentaryFilter::Document) => push_label(qb, "momentary", Some("document")),
        Some(MomentaryFilter::Accidental) => push_label(qb, "momentary", Some("accidental")),
        None => {}
    }
    if let Some(tag) = &filter.tag {
        qb.push(
            " AND m.id IN (SELECT ml.media_id FROM media_labels ml JOIN labels l ON l.id = ml.label_id
               WHERE l.dimension = 'tag' AND l.value = ",
        )
        .push_bind(tag.clone())
        .push(")");
    }
    if let Some(group) = &filter.group_id {
        qb.push(" AND m.id IN (SELECT media_id FROM similarity_members WHERE group_id = ")
            .push_bind(group.clone())
            .push(")");
    }
    if let Some(sequence) = &filter.sequence_id {
        qb.push(" AND m.sequence_id = ").push_bind(sequence.clone());
    }
    for group in &filter.people_all {
        qb.push(" AND m.id IN (SELECT media_id FROM faces WHERE person_id IN (SELECT value FROM json_each(")
            .push_bind(serde_json::to_string(group).unwrap_or_else(|_| "[]".into()))
            .push(")))");
    }
    if let Some(person) = &filter.person_id {
        qb.push(" AND m.id IN (SELECT media_id FROM faces WHERE person_id = ")
            .push_bind(person.clone())
            .push(")");
    }
    if let Some(event) = &filter.event_id {
        qb.push(" AND m.id IN (SELECT media_id FROM event_media WHERE event_id = ")
            .push_bind(event.clone())
            .push(")");
    }
    if filter.review == Some(true) || filter.review_reason.is_some() {
        qb.push(" AND m.review_priority IS NOT NULL");
    }
    if let Some(reason) = filter.review_reason {
        qb.push(
            " AND m.id IN (SELECT media_id FROM review_candidates WHERE status = 'pending' AND reason = ",
        )
        .push_bind(reason.as_str())
        .push(")");
    }

    if let Some(fts) = parsed.fts {
        // Name, folder, place, album… or, with the local AI, what is in the photo and who.
        qb.push(" AND (m.rowid IN (SELECT rowid FROM media_fts WHERE media_fts MATCH ")
            .push_bind(fts)
            .push(")");
        if let Some(hits) = filter.content_hits.as_ref().filter(|h| !h.is_empty()) {
            qb.push(" OR m.id IN (SELECT value FROM json_each(")
                .push_bind(serde_json::to_string(hits.as_ref()).unwrap_or_else(|_| "[]".into()))
                .push("))");
        }
        if let Some(people) = &filter.people_hits {
            qb.push(" OR m.id IN (SELECT media_id FROM faces WHERE person_id IN (SELECT value FROM json_each(")
                .push_bind(serde_json::to_string(people).unwrap_or_else(|_| "[]".into()))
                .push(")))");
        }
        qb.push(")");
    }
}

/// Item has an active label of `dimension` (and `value`, if given).
fn push_label(
    qb: &mut QueryBuilder<'_, Sqlite>,
    dimension: &'static str,
    value: Option<&'static str>,
) {
    qb.push(
        " AND m.id IN (SELECT ml.media_id FROM media_labels ml JOIN labels l ON l.id = ml.label_id
           WHERE ml.active = 1 AND l.dimension = ",
    )
    .push_bind(dimension);
    if let Some(value) = value {
        qb.push(" AND l.value = ").push_bind(value);
    }
    qb.push(")");
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
    fn names_in_the_search_require_their_people() {
        let named = [
            ("ana-s".to_string(), "Ana Souza".to_string()),
            ("ana-l".to_string(), "Ana Lima".to_string()),
            ("bruno".to_string(), "Bruno".to_string()),
        ];
        // A first name shared by two people: either of them.
        let s = split_names("Ana praia 2024", &named);
        assert_eq!(
            s.required,
            vec![vec!["ana-s".to_string(), "ana-l".to_string()]]
        );
        assert_eq!(s.rest, "praia 2024");
        // Full name: the two words narrow down to one person.
        let s = split_names("ana souza", &named);
        assert_eq!(s.required.len(), 2);
        assert_eq!(s.rest, "");
        // Two people: photos with both.
        let s = split_names("Âna e BRUNO", &named);
        assert_eq!(
            s.required,
            vec![
                vec!["ana-s".to_string(), "ana-l".to_string()],
                vec!["bruno".to_string()]
            ]
        );
        assert_eq!(s.rest, "e");
        // Being typed: only adds.
        let s = split_names("an", &named);
        assert!(s.required.is_empty());
        assert_eq!(s.typing, ["ana-s", "ana-l"]);
        assert_eq!(split_names("ana sou", &named).required.len(), 1);
        assert!(split_names("praia", &named).typing.is_empty());
        // Dates and connectors are never names.
        assert_eq!(
            split_names("julho de 2025", &named),
            NameSearch {
                rest: "julho de 2025".into(),
                ..Default::default()
            }
        );
    }

    #[test]
    fn parses_dates_and_terms() {
        assert_eq!(
            parse_text("Gramado julho de 2025"),
            ParsedText {
                year: Some(2025),
                month: Some(7),
                fts: Some("\"gramado\"*".into()),
                content: Some("Gramado".into()),
            }
        );
        // The content search keeps the words as typed, inner connectors included.
        assert_eq!(
            parse_text("fotos do pôr do sol 2024").content.as_deref(),
            Some("pôr do sol")
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
