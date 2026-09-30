//! Reorganizing files on disk (PRD §24, phase 8): move and rename the photos of a library
//! by a rule ("{ano}/{mes} - {mes_nome}", "{data}_{hora}"). Nothing moves before the user
//! sees the plan (`preview`: before → after per file) and confirms it (`create_batch`,
//! then `run::start`). Each file is moved with a `rename` (same volume), logged in
//! `operations_log` first; a batch can be paused, resumed after a disconnection and undone.
//!
//! Sidecars (`IMG_1.xmp`, `IMG_1.AAE`, `IMG_1.jpg.json`) go with their photo. Only active
//! photos move (never the trash, never missing files). Names that would collide get
//! " (2)"; collisions are checked ignoring case (the library may live on Windows/exFAT).

pub mod run;
pub mod template;

use crate::catalog::{MediaFilter, query};
use crate::error::{Error, Result};
use chrono::{NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use std::collections::{HashMap, HashSet};
use std::path::Path;
use template::Facts;

/// How files are laid out. `None` = keep (the folder, the name).
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct ArrangeRule {
    /// Folders, `/`-separated: "{ano}/{mes} - {mes_nome}". Relative to the library root.
    #[specta(optional)]
    pub folders: Option<String>,
    /// File name without the extension: "{data}_{hora}".
    #[specta(optional)]
    pub name: Option<String>,
}

/// Which photos: a gallery filter (album, event, the whole library…) and, optionally,
/// only these ids (a selection).
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase", default)]
pub struct ArrangeScope {
    pub filter: MediaFilter,
    #[specta(optional)]
    pub media_ids: Option<Vec<String>>,
}

/// One file to move.
#[derive(Debug, Clone, PartialEq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PlannedMove {
    pub media_id: String,
    pub from: String,
    pub to: String,
    /// The wanted name was taken: " (2)" was added.
    pub renamed: bool,
    /// Files that go with it (before, after).
    pub sidecars: Vec<(String, String)>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FolderCount {
    pub path: String,
    pub count: u32,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ArrangePreview {
    /// Photos in the scope.
    pub total: u32,
    /// Photos that change place or name.
    pub moving: u32,
    /// Already where the rule puts them.
    pub unchanged: u32,
    /// Moving with " (2)" because the name was taken.
    pub renamed: u32,
    /// Without a reliable date (go to "Sem data").
    pub undated: u32,
    pub sidecars: u32,
    /// The first moves (before → after), in plan order.
    pub items: Vec<PlannedMove>,
    /// Destination folders with the most photos arriving.
    pub folders: Vec<FolderCount>,
}

/// Sidecar extensions matched by stem (`IMG_1.xmp` next to `IMG_1.jpg`).
const SIDECAR_BY_STEM: [&str; 3] = ["xmp", "aae", "thm"];
/// Sidecar suffixes added to the full name (`IMG_1.jpg.json`, Google Takeout; `IMG_1.jpg.xmp`).
const SIDECAR_BY_NAME: [&str; 2] = ["json", "xmp"];
const PREVIEW_FOLDERS: usize = 40;

struct Row {
    id: String,
    relative_path: String,
    filename: String,
    is_video: bool,
    captured_at: Option<String>,
    date_source: Option<String>,
    camera: Option<String>,
    place: Option<String>,
    event: Option<String>,
}

fn split_name(filename: &str) -> (&str, Option<&str>) {
    match filename.rsplit_once('.') {
        Some((stem, ext)) if !stem.is_empty() => (stem, Some(ext)),
        _ => (filename, None),
    }
}

fn facts(r: &Row) -> Facts {
    let dated = r.date_source.as_deref().is_some_and(|s| s != "mtime");
    Facts {
        captured_at: r
            .captured_at
            .as_deref()
            .filter(|_| dated)
            .and_then(|d| NaiveDateTime::parse_from_str(d, "%Y-%m-%dT%H:%M:%S").ok()),
        event: r.event.clone(),
        place: r.place.clone(),
        camera: r.camera.clone(),
        stem: split_name(&r.filename).0.to_string(),
        is_video: r.is_video,
    }
}

fn parent(rel: &str) -> &str {
    rel.rsplit_once('/').map_or("", |(d, _)| d)
}

fn join(dir: &str, name: &str) -> String {
    if dir.is_empty() {
        name.to_string()
    } else {
        format!("{dir}/{name}")
    }
}

/// Where the rule puts one photo (before collisions).
fn wanted(rule: &ArrangeRule, r: &Row) -> Result<(String, bool)> {
    let f = facts(r);
    let dir = match &rule.folders {
        Some(t) => template::folders(t, &f)?.join("/"),
        None => parent(&r.relative_path).to_string(),
    };
    let (stem, ext) = split_name(&r.filename);
    let new_stem = match &rule.name {
        Some(t) => template::name(t, &f)?.unwrap_or_else(|| stem.to_string()),
        None => stem.to_string(),
    };
    let name = match ext {
        Some(e) => format!("{new_stem}.{e}"),
        None => new_stem,
    };
    Ok((join(&dir, &name), f.captured_at.is_none()))
}

async fn rows(pool: &SqlitePool, library_id: &str, scope: &ArrangeScope) -> Result<Vec<Row>> {
    query::validate(&scope.filter)?;
    let mut filter = query::resolve(pool, library_id, scope.filter.clone()).await?;
    filter.trashed = None; // only active photos ever move
    let mut qb = QueryBuilder::<Sqlite>::new(
        "SELECT m.id, m.relative_path, m.filename, m.media_type = 'video', m.captured_at, m.date_source,
                m.camera_model, p.name,
                (SELECT e.title FROM event_media em JOIN events e ON e.id = em.event_id
                 WHERE em.media_id = m.id AND e.status IN ('accepted', 'edited')
                 ORDER BY e.started_at LIMIT 1)
         FROM media m LEFT JOIN places p ON p.id = m.place_id",
    );
    query::push_where(&mut qb, library_id, &filter);
    if let Some(ids) = &scope.media_ids {
        qb.push(" AND m.id IN (SELECT value FROM json_each(")
            .push_bind(serde_json::to_string(ids).unwrap_or_else(|_| "[]".into()))
            .push("))");
    }
    // Oldest first: when two photos want the same name, the older keeps it.
    qb.push(" ORDER BY m.captured_at IS NULL, m.captured_at, m.relative_path");
    type Raw = (
        String,
        String,
        String,
        bool,
        Option<String>,
        Option<String>,
        Option<String>,
        Option<String>,
        Option<String>,
    );
    let raw: Vec<Raw> = qb.build_query_as().fetch_all(pool).await?;
    Ok(raw
        .into_iter()
        .map(
            |(
                id,
                relative_path,
                filename,
                is_video,
                captured_at,
                date_source,
                camera,
                place,
                event,
            )| Row {
                id,
                relative_path,
                filename,
                is_video,
                captured_at,
                date_source,
                camera,
                place,
                event,
            },
        )
        .collect())
}

/// Sidecars of `rel` on disk (reads each source folder once).
fn sidecars_of(
    root: &Path,
    rel: &str,
    listing: &mut HashMap<String, Vec<String>>,
    cataloged: &HashSet<String>,
) -> Vec<String> {
    let dir = parent(rel).to_string();
    let names = listing.entry(dir.clone()).or_insert_with(|| {
        std::fs::read_dir(root.join(&dir))
            .map(|entries| {
                entries
                    .flatten()
                    .filter(|e| e.file_type().is_ok_and(|t| t.is_file()))
                    .filter_map(|e| e.file_name().into_string().ok())
                    .collect()
            })
            .unwrap_or_default()
    });
    let filename = rel.rsplit('/').next().unwrap_or(rel);
    let (stem, _) = split_name(filename);
    names
        .iter()
        .filter(|n| {
            let lower = n.to_lowercase();
            let by_stem = split_name(n).0 == stem
                && split_name(n)
                    .1
                    .is_some_and(|e| SIDECAR_BY_STEM.contains(&e.to_lowercase().as_str()));
            let by_name = SIDECAR_BY_NAME
                .iter()
                .any(|s| lower == format!("{}.{s}", filename.to_lowercase()));
            (by_stem || by_name) && n.as_str() != filename
        })
        .map(|n| join(&dir, n))
        .filter(|p| !cataloged.contains(&p.to_lowercase()))
        .collect()
}

/// Names on disk in `dir` (lowercase), read once per folder: "is it taken?" must ignore
/// case even on Linux, since the library may be opened on Windows or live on exFAT.
fn on_disk(root: &Path, rel: &str, cache: &mut HashMap<String, HashSet<String>>) -> bool {
    let dir = parent(rel).to_lowercase();
    let names = cache.entry(dir).or_insert_with(|| {
        std::fs::read_dir(root.join(parent(rel)))
            .map(|entries| {
                entries
                    .flatten()
                    .filter_map(|e| e.file_name().into_string().ok())
                    .map(|n| n.to_lowercase())
                    .collect()
            })
            .unwrap_or_default()
    });
    let name = rel.rsplit('/').next().unwrap_or(rel).to_lowercase();
    names.contains(&name) || root.join(rel).exists()
}

/// The sidecar's new path: same relation to the photo's new name.
fn sidecar_target(sidecar: &str, from: &str, to: &str) -> String {
    let side_name = sidecar.rsplit('/').next().unwrap_or(sidecar);
    let (from_name, to_name) = (
        from.rsplit('/').next().unwrap_or(from),
        to.rsplit('/').next().unwrap_or(to),
    );
    let new_name = if let Some(rest) = side_name.strip_prefix(from_name) {
        format!("{to_name}{rest}") // IMG_1.jpg.json → 2025-07-12.jpg.json
    } else {
        let (to_stem, _) = split_name(to_name);
        let ext = split_name(side_name).1.unwrap_or_default();
        format!("{to_stem}.{ext}") // IMG_1.xmp → 2025-07-12.xmp
    };
    join(parent(to), &new_name)
}

/// The plan: every photo in scope that changes place or name. Deterministic; reads the
/// disk only to find sidecars and taken names.
pub async fn plan(
    pool: &SqlitePool,
    library_id: &str,
    rule: &ArrangeRule,
    scope: &ArrangeScope,
) -> Result<(Vec<PlannedMove>, ArrangePreview)> {
    template::validate(rule.folders.as_deref(), rule.name.as_deref())?;
    if rule.folders.is_none() && rule.name.is_none() {
        return Err(Error::InvalidInput(
            "Escolha como organizar as pastas ou os nomes.".into(),
        ));
    }
    let library = crate::catalog::libraries::get(pool, library_id).await?;
    let root = Path::new(&library.root_path);
    if !root.is_dir() {
        return Err(Error::PathNotAccessible(library.root_path.clone()));
    }
    let rows = rows(pool, library_id, scope).await?;
    // Every path the catalog knows (any status): never a target.
    let known: Vec<String> =
        sqlx::query_scalar("SELECT relative_path FROM media WHERE library_id = ?1")
            .bind(library_id)
            .fetch_all(pool)
            .await?;
    let cataloged: HashSet<String> = known.iter().map(|p| p.to_lowercase()).collect();

    let mut taken: HashSet<String> = HashSet::new(); // targets already given (lowercase)
    let mut listing = HashMap::new();
    let mut disk: HashMap<String, HashSet<String>> = HashMap::new();
    let mut moves = Vec::new();
    let (mut unchanged, mut undated, mut renamed, mut sidecar_count) = (0u32, 0u32, 0u32, 0u32);
    let mut folders: HashMap<String, u32> = HashMap::new();
    for r in &rows {
        let (want, is_undated) = wanted(rule, r)?;
        if is_undated {
            undated += 1;
        }
        // Same place (a change of case only counts as the same: on Windows/exFAT it is).
        if want.to_lowercase() == r.relative_path.to_lowercase() {
            unchanged += 1;
            taken.insert(want.to_lowercase());
            continue;
        }
        let sidecars = sidecars_of(root, &r.relative_path, &mut listing, &cataloged);
        // Free = not given to another photo, not in the catalog, not on disk; the same
        // for its sidecars.
        let mut free = |candidate: &str, taken: &HashSet<String>| {
            let mut clear = |p: &str| {
                let l = p.to_lowercase();
                !taken.contains(&l) && !cataloged.contains(&l) && !on_disk(root, p, &mut disk)
            };
            clear(candidate)
                && sidecars
                    .iter()
                    .all(|s| clear(&sidecar_target(s, &r.relative_path, candidate)))
        };
        let mut to = want.clone();
        let mut n = 2;
        while !free(&to, &taken) {
            to = crate::trash::with_suffix(&want, &format!(" ({n})"));
            n += 1;
            if n > 10_000 {
                return Err(Error::Internal(format!("Não há nome livre para {want}.")));
            }
        }
        if to == r.relative_path {
            unchanged += 1;
            continue;
        }
        let was_renamed = to != want;
        if was_renamed {
            renamed += 1;
        }
        taken.insert(to.to_lowercase());
        let sidecars: Vec<(String, String)> = sidecars
            .iter()
            .map(|s| {
                let t = sidecar_target(s, &r.relative_path, &to);
                taken.insert(t.to_lowercase());
                (s.clone(), t)
            })
            .collect();
        sidecar_count += sidecars.len() as u32;
        *folders.entry(parent(&to).to_string()).or_default() += 1;
        moves.push(PlannedMove {
            media_id: r.id.clone(),
            from: r.relative_path.clone(),
            to,
            renamed: was_renamed,
            sidecars,
        });
    }
    let mut folders: Vec<FolderCount> = folders
        .into_iter()
        .map(|(path, count)| FolderCount { path, count })
        .collect();
    folders.sort_by(|a, b| b.count.cmp(&a.count).then(a.path.cmp(&b.path)));
    folders.truncate(PREVIEW_FOLDERS);
    let preview = ArrangePreview {
        total: rows.len() as u32,
        moving: moves.len() as u32,
        unchanged,
        renamed,
        undated,
        sidecars: sidecar_count,
        items: Vec::new(),
        folders,
    };
    Ok((moves, preview))
}

/// The plan as the user sees it before confirming (the first `limit` moves).
pub async fn preview(
    pool: &SqlitePool,
    library_id: &str,
    rule: &ArrangeRule,
    scope: &ArrangeScope,
    limit: u32,
) -> Result<ArrangePreview> {
    let (moves, mut preview) = plan(pool, library_id, rule, scope).await?;
    preview.items = moves.into_iter().take(limit as usize).collect();
    Ok(preview)
}

// ---- Batches -----------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum BatchStatus {
    /// Planned, waiting for confirmation.
    Planned,
    Running,
    /// Stopped by the user or by a disconnection: can be resumed.
    Paused,
    Done,
    Undoing,
    UndoPaused,
    Undone,
    /// Planned and not confirmed.
    Discarded,
}

impl BatchStatus {
    fn as_str(self) -> &'static str {
        match self {
            BatchStatus::Planned => "planned",
            BatchStatus::Running => "running",
            BatchStatus::Paused => "paused",
            BatchStatus::Done => "done",
            BatchStatus::Undoing => "undoing",
            BatchStatus::UndoPaused => "undo_paused",
            BatchStatus::Undone => "undone",
            BatchStatus::Discarded => "discarded",
        }
    }

    fn parse(s: &str) -> Self {
        match s {
            "running" => BatchStatus::Running,
            "paused" => BatchStatus::Paused,
            "done" => BatchStatus::Done,
            "undoing" => BatchStatus::Undoing,
            "undo_paused" => BatchStatus::UndoPaused,
            "undone" => BatchStatus::Undone,
            "discarded" => BatchStatus::Discarded,
            _ => BatchStatus::Planned,
        }
    }
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ArrangeBatch {
    pub id: String,
    pub library_id: String,
    pub rule: ArrangeRule,
    pub status: BatchStatus,
    pub message: Option<String>,
    pub total: u32,
    pub pending: u32,
    pub done: u32,
    pub failed: u32,
    pub skipped: u32,
    pub undone: u32,
    pub sidecars: u32,
    pub created_at: String,
    pub finished_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ArrangeItem {
    pub seq: u32,
    pub media_id: String,
    pub from: String,
    pub to: String,
    pub status: String,
    pub error: Option<String>,
}

/// The user asked to organize: the plan is recomputed now (the library may have changed
/// since the preview) and kept, waiting for the confirmation (`run::start`).
pub async fn create_batch(
    pool: &SqlitePool,
    library_id: &str,
    rule: &ArrangeRule,
    scope: &ArrangeScope,
) -> Result<ArrangeBatch> {
    let (moves, _) = plan(pool, library_id, rule, scope).await?;
    if moves.is_empty() {
        return Err(Error::InvalidInput(
            "Nada a organizar: as fotos já estão onde a regra as coloca.".into(),
        ));
    }
    if active(pool, library_id).await?.is_some() {
        return Err(Error::InvalidInput(
            "Já há uma organização em andamento nesta biblioteca: termine, desfaça ou descarte antes."
                .into(),
        ));
    }
    let id = uuid::Uuid::now_v7().to_string();
    let now = Utc::now().to_rfc3339();
    let mut tx = pool.begin().await?;
    // An old plan never confirmed is dropped.
    sqlx::query("UPDATE arrange_batches SET status = 'discarded' WHERE library_id = ?1 AND status = 'planned'")
        .bind(library_id)
        .execute(&mut *tx)
        .await?;
    sqlx::query(
        "INSERT INTO arrange_batches (id, library_id, rule_json, status, created_at) VALUES (?1, ?2, ?3, 'planned', ?4)",
    )
    .bind(&id)
    .bind(library_id)
    .bind(serde_json::to_string(rule).unwrap_or_default())
    .bind(&now)
    .execute(&mut *tx)
    .await?;
    for (seq, m) in moves.iter().enumerate() {
        sqlx::query(
            "INSERT INTO arrange_items (batch_id, seq, media_id, from_path, to_path, sidecars_json, status)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'pending')",
        )
        .bind(&id)
        .bind(seq as i64)
        .bind(&m.media_id)
        .bind(&m.from)
        .bind(&m.to)
        .bind(serde_json::to_string(&m.sidecars).unwrap_or_else(|_| "[]".into()))
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;
    get(pool, &id).await
}

/// A batch that is running, paused or being undone (only one per library).
pub async fn active(pool: &SqlitePool, library_id: &str) -> Result<Option<String>> {
    Ok(sqlx::query_scalar(
        "SELECT id FROM arrange_batches WHERE library_id = ?1
         AND status IN ('running', 'paused', 'undoing', 'undo_paused') LIMIT 1",
    )
    .bind(library_id)
    .fetch_optional(pool)
    .await?)
}

pub async fn get(pool: &SqlitePool, batch_id: &str) -> Result<ArrangeBatch> {
    type R = (
        String,
        String,
        String,
        String,
        Option<String>,
        String,
        Option<String>,
    );
    let row: Option<R> = sqlx::query_as(
        "SELECT id, library_id, rule_json, status, message, created_at, finished_at FROM arrange_batches WHERE id = ?1",
    )
    .bind(batch_id)
    .fetch_optional(pool)
    .await?;
    let (id, library_id, rule, status, message, created_at, finished_at) =
        row.ok_or_else(|| Error::InvalidInput("Organização não encontrada.".into()))?;
    let counts: Vec<(String, i64, i64)> = sqlx::query_as(
        "SELECT status, COUNT(*), COALESCE(SUM(json_array_length(sidecars_json)), 0)
         FROM arrange_items WHERE batch_id = ?1 GROUP BY status",
    )
    .bind(&id)
    .fetch_all(pool)
    .await?;
    let n = |s: &str| counts.iter().find(|c| c.0 == s).map_or(0, |c| c.1 as u32);
    Ok(ArrangeBatch {
        rule: serde_json::from_str(&rule).unwrap_or_default(),
        status: BatchStatus::parse(&status),
        total: counts.iter().map(|c| c.1 as u32).sum(),
        pending: n("pending"),
        done: n("done"),
        failed: n("failed"),
        skipped: n("skipped"),
        undone: n("undone"),
        sidecars: counts.iter().map(|c| c.2 as u32).sum(),
        id,
        library_id,
        message,
        created_at,
        finished_at,
    })
}

/// Batches of a library, newest first (not the discarded ones).
pub async fn list(pool: &SqlitePool, library_id: &str, limit: u32) -> Result<Vec<ArrangeBatch>> {
    let ids: Vec<String> = sqlx::query_scalar(
        "SELECT id FROM arrange_batches WHERE library_id = ?1 AND status != 'discarded'
         ORDER BY created_at DESC LIMIT ?2",
    )
    .bind(library_id)
    .bind(i64::from(limit))
    .fetch_all(pool)
    .await?;
    let mut out = Vec::with_capacity(ids.len());
    for id in ids {
        out.push(get(pool, &id).await?);
    }
    Ok(out)
}

/// Items of a batch (`status` = only those: "failed" to show the problems).
pub async fn items(
    pool: &SqlitePool,
    batch_id: &str,
    status: Option<&str>,
    offset: u32,
    limit: u32,
) -> Result<Vec<ArrangeItem>> {
    type R = (i64, String, String, String, String, Option<String>);
    let rows: Vec<R> = sqlx::query_as(
        "SELECT seq, media_id, from_path, to_path, status, error FROM arrange_items
         WHERE batch_id = ?1 AND (?2 IS NULL OR status = ?2) ORDER BY seq LIMIT ?3 OFFSET ?4",
    )
    .bind(batch_id)
    .bind(status)
    .bind(i64::from(limit))
    .bind(i64::from(offset))
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|(seq, media_id, from, to, status, error)| ArrangeItem {
            seq: seq as u32,
            media_id,
            from,
            to,
            status,
            error,
        })
        .collect())
}

/// The user didn't confirm.
pub async fn discard(pool: &SqlitePool, batch_id: &str) -> Result<()> {
    sqlx::query(
        "UPDATE arrange_batches SET status = 'discarded' WHERE id = ?1 AND status = 'planned'",
    )
    .bind(batch_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub(crate) async fn set_status(
    pool: &SqlitePool,
    batch_id: &str,
    status: BatchStatus,
    message: Option<&str>,
) -> Result<()> {
    let finished = matches!(status, BatchStatus::Done | BatchStatus::Undone);
    sqlx::query(
        "UPDATE arrange_batches SET status = ?1, message = ?2,
            started_at = COALESCE(started_at, CASE WHEN ?1 = 'running' THEN ?3 END),
            finished_at = CASE WHEN ?4 THEN ?3 ELSE finished_at END
         WHERE id = ?5",
    )
    .bind(status.as_str())
    .bind(message)
    .bind(Utc::now().to_rfc3339())
    .bind(finished)
    .bind(batch_id)
    .execute(pool)
    .await?;
    Ok(())
}

#[cfg(test)]
mod tests;
