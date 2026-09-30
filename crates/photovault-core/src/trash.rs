//! Trash (PRD §16, ADR 006). Sending a photo to the trash is a `rename` into
//! `<library>/.photovault-trash/<date>/<relative path>` on the same volume: atomic, no
//! copy, and restoring gives back the very same bytes. The catalog row follows the file
//! (status `trashed`, `relative_path` inside the trash), so the scanner, which skips
//! hidden folders and only compares active/missing rows, never sees it as missing.
//!
//! Every physical operation is written to `operations_log` before it happens and closed
//! after (R3); `recover` settles operations interrupted by a crash or a disconnected disk.
//! Optionally, files go to the operating system's trash instead (then they leave the
//! catalog and can only be restored from there).

use crate::analysis::store::mark_dirty;
use crate::error::{Error, Result};
use crate::{review, thumbnails};
use chrono::{Local, Utc};
use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::{Sqlite, SqlitePool};
use std::path::{Path, PathBuf};

pub const TRASH_DIR: &str = ".photovault-trash";

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct TrashFailure {
    pub media_id: String,
    pub filename: String,
    pub message: String,
}

#[derive(Debug, Clone, Default, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct TrashResult {
    pub done: Vec<String>,
    pub failed: Vec<TrashFailure>,
}

/// What to do when the original path is taken again.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum OnConflict {
    /// Leave it in the trash and report it (the UI asks).
    Ask,
    /// Restore as "name (restaurada).ext".
    Rename,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct RestoreConflict {
    pub media_id: String,
    pub filename: String,
    pub original_path: String,
}

#[derive(Debug, Clone, Default, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct RestoreResult {
    pub restored: Vec<String>,
    pub conflicts: Vec<RestoreConflict>,
    pub failed: Vec<TrashFailure>,
}

#[derive(Debug, Clone, Default, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct TrashSummary {
    pub count: u32,
    #[specta(type = specta_typescript::Number)]
    pub bytes: u64,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct TrashEntry {
    pub original_path: String,
    pub deleted_at: String,
}

#[derive(sqlx::FromRow)]
struct Located {
    id: String,
    library_id: String,
    root_path: String,
    relative_path: String,
    filename: String,
    status: String,
}

async fn locate(pool: &SqlitePool, id: &str) -> Result<Located> {
    sqlx::query_as(
        "SELECT m.id, m.library_id, l.root_path, m.relative_path, m.filename, m.status
         FROM media m JOIN libraries l ON l.id = m.library_id WHERE m.id = ?1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?
    .ok_or(Error::MediaNotFound)
}

fn io_message(e: &std::io::Error) -> String {
    match e.kind() {
        std::io::ErrorKind::PermissionDenied => {
            "Sem permissão para mover o arquivo (disco somente leitura?).".into()
        }
        std::io::ErrorKind::NotFound => "O arquivo não foi encontrado no disco.".into(),
        _ => format!("Não foi possível mover o arquivo: {e}"),
    }
}

fn fail(failed: &mut Vec<TrashFailure>, loc: &Located, message: impl Into<String>) {
    failed.push(TrashFailure {
        media_id: loc.id.clone(),
        filename: loc.filename.clone(),
        message: message.into(),
    });
}

/// Send photos to the trash. Each file is independent: a failure is reported and the
/// others go on (R6).
pub async fn send(
    pool: &SqlitePool,
    thumbnails_dir: &Path,
    ids: &[String],
    use_system_trash: bool,
) -> Result<TrashResult> {
    let mut result = TrashResult::default();
    for id in ids {
        let loc = locate(pool, id).await?;
        if loc.status != "active" {
            fail(
                &mut result.failed,
                &loc,
                match loc.status.as_str() {
                    "trashed" => "Já está na lixeira.",
                    _ => "O arquivo não está disponível (ausente).",
                },
            );
            continue;
        }
        let root = Path::new(&loc.root_path);
        if !root.is_dir() {
            fail(&mut result.failed, &loc, "A biblioteca está desconectada.");
            continue;
        }
        let source = root.join(&loc.relative_path);
        if !source.is_file() {
            fail(
                &mut result.failed,
                &loc,
                "O arquivo não foi encontrado no disco.",
            );
            continue;
        }
        let outcome = if use_system_trash {
            to_system_trash(pool, thumbnails_dir, &loc, source).await
        } else {
            to_library_trash(pool, &loc, root, &source).await
        };
        match outcome {
            Ok(()) => result.done.push(loc.id),
            Err(message) => fail(&mut result.failed, &loc, message),
        }
    }
    Ok(result)
}

async fn to_library_trash(
    pool: &SqlitePool,
    loc: &Located,
    root: &Path,
    source: &Path,
) -> std::result::Result<(), String> {
    let day = Local::now().format("%Y-%m-%d").to_string();
    let wanted = format!("{TRASH_DIR}/{day}/{}", loc.relative_path);
    let trash_rel = free_path(pool, &loc.library_id, root, &wanted)
        .await
        .map_err(|e| e.to_string())?;
    let target = root.join(&trash_rel);
    let op = log_start(
        pool,
        "trash",
        serde_json::json!({ "mediaId": loc.id, "libraryId": loc.library_id,
                            "from": loc.relative_path, "to": trash_rel }),
    )
    .await
    .map_err(|e| e.to_string())?;
    if let Err(e) = move_file(source, &target).await {
        let _ = log_finish(pool, &op, "failed").await;
        return Err(io_message(&e));
    }
    let recorded = async {
        let now = Utc::now().to_rfc3339();
        let mut tx = pool.begin().await?;
        sqlx::query(
            "UPDATE media SET status = 'trashed', relative_path = ?1, review_priority = NULL, updated_at = ?2
             WHERE id = ?3",
        )
        .bind(&trash_rel)
        .bind(&now)
        .bind(&loc.id)
        .execute(&mut *tx)
        .await?;
        sqlx::query(
            "INSERT INTO trash_items (id, media_id, library_id, original_relative_path, trash_relative_path, deleted_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        )
        .bind(uuid::Uuid::now_v7().to_string())
        .bind(&loc.id)
        .bind(&loc.library_id)
        .bind(&loc.relative_path)
        .bind(&trash_rel)
        .bind(&now)
        .execute(&mut *tx)
        .await?;
        review::on_trash(&mut *tx, &loc.id, false).await?;
        mark_dirty(&mut *tx, &loc.library_id).await?;
        log_finish(&mut *tx, &op, "done").await?;
        tx.commit().await?;
        Ok::<_, Error>(())
    }
    .await;
    if let Err(e) = recorded {
        // Put the file back so disk and catalog agree.
        let back = move_file(&target, source).await;
        let _ = log_finish(
            pool,
            &op,
            if back.is_ok() {
                "rolled_back"
            } else {
                "failed"
            },
        )
        .await;
        return Err(e.to_string());
    }
    Ok(())
}

async fn to_system_trash(
    pool: &SqlitePool,
    thumbnails_dir: &Path,
    loc: &Located,
    source: PathBuf,
) -> std::result::Result<(), String> {
    let op = log_start(
        pool,
        "trash_system",
        serde_json::json!({ "mediaId": loc.id, "libraryId": loc.library_id, "from": loc.relative_path }),
    )
    .await
    .map_err(|e| e.to_string())?;
    let moved = tokio::task::spawn_blocking(move || trash::delete(&source))
        .await
        .map_err(|e| e.to_string())?;
    if let Err(e) = moved {
        let _ = log_finish(pool, &op, "failed").await;
        return Err(format!("A lixeira do sistema recusou o arquivo: {e}"));
    }
    let recorded = async {
        let now = Utc::now().to_rfc3339();
        let mut tx = pool.begin().await?;
        sqlx::query(
            "INSERT INTO trash_items (id, media_id, library_id, original_relative_path, trash_relative_path,
                                      deleted_at, purged_at)
             VALUES (?1, NULL, ?2, ?3, '', ?4, ?4)",
        )
        .bind(uuid::Uuid::now_v7().to_string())
        .bind(&loc.library_id)
        .bind(&loc.relative_path)
        .bind(&now)
        .execute(&mut *tx)
        .await?;
        sqlx::query("DELETE FROM media WHERE id = ?1")
            .bind(&loc.id)
            .execute(&mut *tx)
            .await?;
        mark_dirty(&mut *tx, &loc.library_id).await?;
        log_finish(&mut *tx, &op, "done").await?;
        tx.commit().await?;
        Ok::<_, Error>(())
    }
    .await;
    recorded.map_err(|e| e.to_string())?;
    thumbnails::remove(thumbnails_dir, std::slice::from_ref(&loc.id));
    Ok(())
}

/// Put photos back where they were. With `OnConflict::Ask`, photos whose original path
/// is taken stay in the trash and come back in `conflicts`.
pub async fn restore(
    pool: &SqlitePool,
    ids: &[String],
    on_conflict: OnConflict,
) -> Result<RestoreResult> {
    let mut result = RestoreResult::default();
    for id in ids {
        let loc = locate(pool, id).await?;
        if loc.status != "trashed" {
            fail(&mut result.failed, &loc, "Não está na lixeira.");
            continue;
        }
        let original: Option<(String, String)> = sqlx::query_as(
            "SELECT id, original_relative_path FROM trash_items
             WHERE media_id = ?1 AND restored_at IS NULL AND purged_at IS NULL
             ORDER BY deleted_at DESC LIMIT 1",
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;
        let Some((item_id, original)) = original else {
            fail(
                &mut result.failed,
                &loc,
                "O registro da lixeira não foi encontrado.",
            );
            continue;
        };
        let root = Path::new(&loc.root_path);
        if !root.is_dir() {
            fail(&mut result.failed, &loc, "A biblioteca está desconectada.");
            continue;
        }
        let source = root.join(&loc.relative_path);
        if !source.is_file() {
            fail(
                &mut result.failed,
                &loc,
                "O arquivo não está mais na lixeira.",
            );
            continue;
        }
        let mut target_rel = original.clone();
        if is_taken(pool, &loc.library_id, root, &target_rel).await? {
            if on_conflict == OnConflict::Ask {
                result.conflicts.push(RestoreConflict {
                    media_id: loc.id.clone(),
                    filename: loc.filename.clone(),
                    original_path: original.clone(),
                });
                continue;
            }
            target_rel = free_path(
                pool,
                &loc.library_id,
                root,
                &with_suffix(&original, " (restaurada)"),
            )
            .await?;
        }
        let target = root.join(&target_rel);
        let op = log_start(
            pool,
            "restore",
            serde_json::json!({ "mediaId": loc.id, "libraryId": loc.library_id,
                                "from": loc.relative_path, "to": target_rel }),
        )
        .await?;
        if let Err(e) = move_file(&source, &target).await {
            log_finish(pool, &op, "failed").await?;
            fail(&mut result.failed, &loc, io_message(&e));
            continue;
        }
        let filename = target_rel
            .rsplit('/')
            .next()
            .unwrap_or(&target_rel)
            .to_string();
        let now = Utc::now().to_rfc3339();
        let mut tx = pool.begin().await?;
        sqlx::query(
            "UPDATE media SET status = 'active', relative_path = ?1, filename = ?2, updated_at = ?3 WHERE id = ?4",
        )
        .bind(&target_rel)
        .bind(&filename)
        .bind(&now)
        .bind(&loc.id)
        .execute(&mut *tx)
        .await?;
        sqlx::query("UPDATE trash_items SET restored_at = ?1 WHERE id = ?2")
            .bind(&now)
            .bind(&item_id)
            .execute(&mut *tx)
            .await?;
        review::on_trash(&mut *tx, &loc.id, true).await?;
        mark_dirty(&mut *tx, &loc.library_id).await?;
        log_finish(&mut *tx, &op, "done").await?;
        tx.commit().await?;
        remove_empty_parents(root, &source);
        result.restored.push(loc.id);
    }
    Ok(result)
}

/// Delete trashed photos for good (the UI confirms twice).
pub async fn purge(
    pool: &SqlitePool,
    thumbnails_dir: &Path,
    ids: &[String],
) -> Result<TrashResult> {
    let mut result = TrashResult::default();
    for id in ids {
        let loc = locate(pool, id).await?;
        if loc.status != "trashed" {
            fail(
                &mut result.failed,
                &loc,
                "Só é possível excluir itens da lixeira.",
            );
            continue;
        }
        let root = Path::new(&loc.root_path);
        if !root.is_dir() {
            fail(&mut result.failed, &loc, "A biblioteca está desconectada.");
            continue;
        }
        let file = root.join(&loc.relative_path);
        let op = log_start(
            pool,
            "purge",
            serde_json::json!({ "mediaId": loc.id, "libraryId": loc.library_id, "path": loc.relative_path }),
        )
        .await?;
        match tokio::fs::remove_file(&file).await {
            Ok(()) => {}
            // Already gone (deleted outside the app): just forget it.
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
            Err(e) => {
                log_finish(pool, &op, "failed").await?;
                fail(
                    &mut result.failed,
                    &loc,
                    format!("Não foi possível excluir: {e}"),
                );
                continue;
            }
        }
        let mut tx = pool.begin().await?;
        sqlx::query(
            "UPDATE trash_items SET purged_at = ?1 WHERE media_id = ?2 AND restored_at IS NULL AND purged_at IS NULL",
        )
        .bind(Utc::now().to_rfc3339())
        .bind(&loc.id)
        .execute(&mut *tx)
        .await?;
        sqlx::query("DELETE FROM media WHERE id = ?1")
            .bind(&loc.id)
            .execute(&mut *tx)
            .await?;
        log_finish(&mut *tx, &op, "done").await?;
        tx.commit().await?;
        thumbnails::remove(thumbnails_dir, std::slice::from_ref(&loc.id));
        remove_empty_parents(root, &file);
        result.done.push(loc.id);
    }
    Ok(result)
}

/// "Esvaziar lixeira" of a library.
pub async fn empty(
    pool: &SqlitePool,
    thumbnails_dir: &Path,
    library_id: &str,
) -> Result<TrashResult> {
    let ids: Vec<String> =
        sqlx::query_scalar("SELECT id FROM media WHERE library_id = ?1 AND status = 'trashed'")
            .bind(library_id)
            .fetch_all(pool)
            .await?;
    purge(pool, thumbnails_dir, &ids).await
}

/// Optional cleanup (off by default): delete what has been in the trash for more than
/// `days`. Libraries that are disconnected are left for later.
pub async fn auto_purge(pool: &SqlitePool, thumbnails_dir: &Path, days: u32) -> Result<u32> {
    if days == 0 {
        return Ok(0);
    }
    let limit = (Utc::now() - chrono::Duration::days(i64::from(days))).to_rfc3339();
    let ids: Vec<String> = sqlx::query_scalar(
        "SELECT m.id FROM media m JOIN trash_items t ON t.media_id = m.id
         WHERE m.status = 'trashed' AND t.restored_at IS NULL AND t.purged_at IS NULL AND t.deleted_at < ?1",
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(purge(pool, thumbnails_dir, &ids).await?.done.len() as u32)
}

pub async fn summary(pool: &SqlitePool, library_id: &str) -> Result<TrashSummary> {
    let (count, bytes): (i64, Option<i64>) = sqlx::query_as(
        "SELECT COUNT(*), SUM(file_size) FROM media WHERE library_id = ?1 AND status = 'trashed'",
    )
    .bind(library_id)
    .fetch_one(pool)
    .await?;
    Ok(TrashSummary {
        count: count as u32,
        bytes: bytes.unwrap_or(0).max(0) as u64,
    })
}

/// Where a trashed photo came from (info panel).
pub async fn entry(pool: &SqlitePool, media_id: &str) -> Result<Option<TrashEntry>> {
    let row: Option<(String, String)> = sqlx::query_as(
        "SELECT original_relative_path, deleted_at FROM trash_items
         WHERE media_id = ?1 AND restored_at IS NULL AND purged_at IS NULL
         ORDER BY deleted_at DESC LIMIT 1",
    )
    .bind(media_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|(original_path, deleted_at)| TrashEntry {
        original_path,
        deleted_at,
    }))
}

/// Settle operations left `pending` by a crash or a disk unplugged mid-way: the file is
/// either still at the source (nothing happened) or already at the target (finish the
/// catalog side). Run on startup.
pub async fn recover(pool: &SqlitePool) -> Result<u32> {
    let pending: Vec<(String, String, String)> = sqlx::query_as(
        "SELECT id, kind, payload_json FROM operations_log WHERE status = 'pending' AND kind IN ('trash', 'restore')",
    )
    .fetch_all(pool)
    .await?;
    let mut settled = 0;
    for (op, kind, payload) in pending {
        let p: serde_json::Value = serde_json::from_str(&payload).unwrap_or_default();
        let field = |k: &str| p.get(k).and_then(|v| v.as_str()).map(str::to_string);
        let (Some(media_id), Some(from), Some(to)) = (field("mediaId"), field("from"), field("to"))
        else {
            log_finish(pool, &op, "failed").await?;
            continue;
        };
        let Ok(loc) = locate(pool, &media_id).await else {
            log_finish(pool, &op, "failed").await?;
            continue;
        };
        let root = Path::new(&loc.root_path);
        if !root.is_dir() {
            continue; // disk still unplugged: try again next time
        }
        let moved = root.join(&to).is_file() && !root.join(&from).is_file();
        if !moved {
            log_finish(pool, &op, "rolled_back").await?;
            settled += 1;
            continue;
        }
        let now = Utc::now().to_rfc3339();
        let mut tx = pool.begin().await?;
        if kind == "trash" && loc.status == "active" {
            sqlx::query("UPDATE media SET status = 'trashed', relative_path = ?1, review_priority = NULL, updated_at = ?2 WHERE id = ?3")
                .bind(&to)
                .bind(&now)
                .bind(&media_id)
                .execute(&mut *tx)
                .await?;
            sqlx::query(
                "INSERT INTO trash_items (id, media_id, library_id, original_relative_path, trash_relative_path, deleted_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            )
            .bind(uuid::Uuid::now_v7().to_string())
            .bind(&media_id)
            .bind(&loc.library_id)
            .bind(&from)
            .bind(&to)
            .bind(&now)
            .execute(&mut *tx)
            .await?;
            review::on_trash(&mut *tx, &media_id, false).await?;
        } else if kind == "restore" && loc.status == "trashed" {
            let filename = to.rsplit('/').next().unwrap_or(&to).to_string();
            sqlx::query("UPDATE media SET status = 'active', relative_path = ?1, filename = ?2, updated_at = ?3 WHERE id = ?4")
                .bind(&to)
                .bind(&filename)
                .bind(&now)
                .bind(&media_id)
                .execute(&mut *tx)
                .await?;
            sqlx::query("UPDATE trash_items SET restored_at = ?1 WHERE media_id = ?2 AND restored_at IS NULL AND purged_at IS NULL")
                .bind(&now)
                .bind(&media_id)
                .execute(&mut *tx)
                .await?;
            review::on_trash(&mut *tx, &media_id, true).await?;
        }
        mark_dirty(&mut *tx, &loc.library_id).await?;
        log_finish(&mut *tx, &op, "done").await?;
        tx.commit().await?;
        settled += 1;
    }
    Ok(settled)
}

pub(crate) async fn log_start(
    pool: &SqlitePool,
    kind: &str,
    payload: serde_json::Value,
) -> Result<String> {
    let id = uuid::Uuid::now_v7().to_string();
    sqlx::query(
        "INSERT INTO operations_log (id, kind, payload_json, status, created_at) VALUES (?1, ?2, ?3, 'pending', ?4)",
    )
    .bind(&id)
    .bind(kind)
    .bind(payload.to_string())
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;
    Ok(id)
}

pub(crate) async fn log_finish<'e, E>(executor: E, id: &str, status: &str) -> Result<()>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query("UPDATE operations_log SET status = ?1, finished_at = ?2 WHERE id = ?3")
        .bind(status)
        .bind(Utc::now().to_rfc3339())
        .bind(id)
        .execute(executor)
        .await?;
    Ok(())
}

pub(crate) async fn move_file(from: &Path, to: &Path) -> std::io::Result<()> {
    if let Some(parent) = to.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }
    // `rename` would silently replace an existing file on Unix.
    if tokio::fs::try_exists(to).await? {
        return Err(std::io::Error::new(
            std::io::ErrorKind::AlreadyExists,
            "o destino já existe",
        ));
    }
    tokio::fs::rename(from, to).await
}

/// A path is taken if a file is there or a catalog row points at it.
async fn is_taken(pool: &SqlitePool, library_id: &str, root: &Path, rel: &str) -> Result<bool> {
    if root.join(rel).exists() {
        return Ok(true);
    }
    let row: Option<i64> =
        sqlx::query_scalar("SELECT 1 FROM media WHERE library_id = ?1 AND relative_path = ?2")
            .bind(library_id)
            .bind(rel)
            .fetch_optional(pool)
            .await?;
    Ok(row.is_some())
}

/// `rel`, or "name (2).ext", "name (3).ext"… until it is free.
async fn free_path(pool: &SqlitePool, library_id: &str, root: &Path, rel: &str) -> Result<String> {
    if !is_taken(pool, library_id, root, rel).await? {
        return Ok(rel.to_string());
    }
    for n in 2..10_000 {
        let candidate = with_suffix(rel, &format!(" ({n})"));
        if !is_taken(pool, library_id, root, &candidate).await? {
            return Ok(candidate);
        }
    }
    Err(Error::Internal("Não há nome livre na lixeira.".into()))
}

/// "a/b/foto.jpg" + " (2)" → "a/b/foto (2).jpg"
pub(crate) fn with_suffix(rel: &str, suffix: &str) -> String {
    let (dir, name) = match rel.rsplit_once('/') {
        Some((d, n)) => (Some(d), n),
        None => (None, rel),
    };
    let name = match name.rsplit_once('.') {
        Some((stem, ext)) if !stem.is_empty() => format!("{stem}{suffix}.{ext}"),
        _ => format!("{name}{suffix}"),
    };
    match dir {
        Some(d) => format!("{d}/{name}"),
        None => name,
    }
}

/// Remove the folders left empty inside the trash (and the trash itself).
fn remove_empty_parents(root: &Path, file: &Path) {
    let trash = root.join(TRASH_DIR);
    let mut dir = file.parent();
    while let Some(d) = dir {
        if !d.starts_with(&trash) || std::fs::remove_dir(d).is_err() {
            break;
        }
        dir = d.parent();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn suffixes_keep_folder_and_extension() {
        assert_eq!(with_suffix("a/b/foto.jpg", " (2)"), "a/b/foto (2).jpg");
        assert_eq!(
            with_suffix("foto.jpg", " (restaurada)"),
            "foto (restaurada).jpg"
        );
        assert_eq!(with_suffix("a/LEIAME", " (2)"), "a/LEIAME (2)");
        assert_eq!(with_suffix("a/.oculto", " (2)"), "a/.oculto (2)");
    }

    #[test]
    fn empty_trash_folders_are_removed_up_to_the_trash() {
        let root = crate::db::tests::temp_dir();
        let deep = root.join(TRASH_DIR).join("2026-09-28/viagem/dia 1");
        std::fs::create_dir_all(&deep).unwrap();
        std::fs::create_dir_all(root.join("viagem")).unwrap();
        remove_empty_parents(&root, &deep.join("foto.jpg"));
        assert!(!root.join(TRASH_DIR).exists());
        assert!(
            root.join("viagem").is_dir(),
            "library folders are never touched"
        );
        let _ = std::fs::remove_dir_all(root);
    }
}
