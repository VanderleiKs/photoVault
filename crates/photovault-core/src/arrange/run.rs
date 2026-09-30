//! Carrying out a confirmed batch: one file at a time, logged in `operations_log` before
//! touching the disk, the catalog updated in the same breath. Pausing, a disconnected
//! disk or a crash leave a consistent state: the batch is `paused` and `recover` (on
//! startup) settles a move cut in half. Undoing walks the done items backwards.

use super::{ArrangeBatch, BatchStatus, get, parent, set_status};
use crate::error::{Error, Result};
use crate::trash::{log_finish, log_start, move_file};
use chrono::Utc;
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, LazyLock, Mutex};

/// Running batches → their pause flag.
static RUNNING: LazyLock<Mutex<HashMap<String, Arc<AtomicBool>>>> = LazyLock::new(Default::default);
const CHUNK: i64 = 200;

pub fn is_running(batch_id: &str) -> bool {
    RUNNING.lock().is_ok_and(|r| r.contains_key(batch_id))
}

/// Stop after the current file (the batch becomes `paused` / `undo_paused`).
pub fn pause(batch_id: &str) {
    if let Some(flag) = RUNNING.lock().ok().and_then(|r| r.get(batch_id).cloned()) {
        flag.store(true, Ordering::Release);
    }
}

struct Registration(String);

impl Drop for Registration {
    fn drop(&mut self) {
        if let Ok(mut r) = RUNNING.lock() {
            r.remove(&self.0);
        }
    }
}

fn register(batch_id: &str) -> Result<(Registration, Arc<AtomicBool>)> {
    let mut r = RUNNING
        .lock()
        .map_err(|_| Error::Internal("estado travado".into()))?;
    if r.contains_key(batch_id) {
        return Err(Error::InvalidInput(
            "Esta organização já está em andamento.".into(),
        ));
    }
    let flag = Arc::new(AtomicBool::new(false));
    r.insert(batch_id.to_string(), Arc::clone(&flag));
    Ok((Registration(batch_id.to_string()), flag))
}

#[derive(Clone, Copy, PartialEq)]
enum Direction {
    Forward,
    Back,
}

async fn root_of(pool: &SqlitePool, batch: &ArrangeBatch) -> Result<String> {
    Ok(crate::catalog::libraries::get(pool, &batch.library_id)
        .await?
        .root_path)
}

const DISCONNECTED: &str = "A pasta da biblioteca não está acessível (disco desconectado?). Conecte e retome: nada se perdeu.";

/// Carry out (or resume) a confirmed batch until it's done, paused or the disk goes away.
pub async fn execute(pool: &SqlitePool, batch_id: &str) -> Result<ArrangeBatch> {
    let batch = get(pool, batch_id).await?;
    if !matches!(batch.status, BatchStatus::Planned | BatchStatus::Paused) {
        return Err(Error::InvalidInput(
            "Esta organização não pode ser iniciada agora.".into(),
        ));
    }
    walk(pool, batch, Direction::Forward).await
}

/// Put every moved file back (or resume undoing).
pub async fn undo(pool: &SqlitePool, batch_id: &str) -> Result<ArrangeBatch> {
    let batch = get(pool, batch_id).await?;
    if !matches!(
        batch.status,
        BatchStatus::Done | BatchStatus::Paused | BatchStatus::UndoPaused
    ) {
        return Err(Error::InvalidInput(
            "Esta organização não pode ser desfeita agora.".into(),
        ));
    }
    walk(pool, batch, Direction::Back).await
}

async fn walk(pool: &SqlitePool, batch: ArrangeBatch, dir: Direction) -> Result<ArrangeBatch> {
    let (_registration, paused) = register(&batch.id)?;
    let (running, stopped) = match dir {
        Direction::Forward => (BatchStatus::Running, BatchStatus::Paused),
        Direction::Back => (BatchStatus::Undoing, BatchStatus::UndoPaused),
    };
    set_status(pool, &batch.id, running, None).await?;
    let root_path = root_of(pool, &batch).await?;
    let root = Path::new(&root_path);
    // Undo: items that failed to go back are passed over (and reported), not retried now.
    let mut last_seq: i64 = match dir {
        Direction::Forward => -1,
        Direction::Back => i64::MAX,
    };
    loop {
        type Item = (i64, String, String, String, String);
        let chunk: Vec<Item> = match dir {
            Direction::Forward => sqlx::query_as(
                "SELECT seq, media_id, from_path, to_path, sidecars_json FROM arrange_items
                 WHERE batch_id = ?1 AND status = 'pending' AND seq > ?2 ORDER BY seq LIMIT ?3",
            ),
            Direction::Back => sqlx::query_as(
                "SELECT seq, media_id, from_path, to_path, sidecars_json FROM arrange_items
                 WHERE batch_id = ?1 AND status = 'done' AND seq < ?2 ORDER BY seq DESC LIMIT ?3",
            ),
        }
        .bind(&batch.id)
        .bind(last_seq)
        .bind(CHUNK)
        .fetch_all(pool)
        .await?;
        if chunk.is_empty() {
            break;
        }
        for (seq, media_id, from, to, sidecars) in chunk {
            last_seq = seq;
            if paused.load(Ordering::Acquire) {
                set_status(pool, &batch.id, stopped, Some("Pausada por você.")).await?;
                return get(pool, &batch.id).await;
            }
            if !root.is_dir() {
                set_status(pool, &batch.id, stopped, Some(DISCONNECTED)).await?;
                return get(pool, &batch.id).await;
            }
            let sidecars: Vec<(String, String)> =
                serde_json::from_str(&sidecars).unwrap_or_default();
            let (src, dst, pairs) = match dir {
                Direction::Forward => (from, to, sidecars),
                Direction::Back => (
                    to,
                    from,
                    sidecars.into_iter().map(|(a, b)| (b, a)).collect(),
                ),
            };
            let item = Move {
                batch_id: &batch.id,
                library_id: &batch.library_id,
                seq,
                media_id: &media_id,
                src: &src,
                dst: &dst,
                sidecars: &pairs,
                dir,
            };
            if let Err(message) = item.carry_out(pool, root).await {
                // The disk went away mid-file: stop instead of failing every file.
                if !root.is_dir() {
                    set_status(pool, &batch.id, stopped, Some(DISCONNECTED)).await?;
                    return get(pool, &batch.id).await;
                }
                let status = match dir {
                    Direction::Forward => "failed",
                    Direction::Back => "done", // still where the batch put it
                };
                sqlx::query("UPDATE arrange_items SET status = ?1, error = ?2 WHERE batch_id = ?3 AND seq = ?4")
                    .bind(status)
                    .bind(message)
                    .bind(&batch.id)
                    .bind(seq)
                    .execute(pool)
                    .await?;
            }
        }
    }
    let after = get(pool, &batch.id).await?;
    match dir {
        Direction::Forward => set_status(pool, &batch.id, BatchStatus::Done, None).await?,
        Direction::Back if after.done == 0 => {
            set_status(pool, &batch.id, BatchStatus::Undone, None).await?
        }
        Direction::Back => {
            let message = format!(
                "{} {} não {} voltar (o lugar original está ocupado ou o arquivo sumiu). Veja os detalhes.",
                after.done,
                if after.done == 1 {
                    "arquivo"
                } else {
                    "arquivos"
                },
                if after.done == 1 { "pôde" } else { "puderam" },
            );
            set_status(pool, &batch.id, BatchStatus::UndoPaused, Some(&message)).await?;
        }
    }
    get(pool, &batch.id).await
}

struct Move<'a> {
    batch_id: &'a str,
    library_id: &'a str,
    seq: i64,
    media_id: &'a str,
    src: &'a str,
    dst: &'a str,
    sidecars: &'a [(String, String)],
    dir: Direction,
}

fn io_message(e: &std::io::Error) -> String {
    match e.kind() {
        std::io::ErrorKind::AlreadyExists => "o destino já existe".into(),
        std::io::ErrorKind::NotFound => "o arquivo não está mais lá".into(),
        std::io::ErrorKind::PermissionDenied => "sem permissão para mover".into(),
        std::io::ErrorKind::CrossesDevices => "o destino está em outro disco".into(),
        _ => e.to_string(),
    }
}

impl Move<'_> {
    /// One file and its sidecars; Err = why it didn't move (and nothing moved).
    async fn carry_out(&self, pool: &SqlitePool, root: &Path) -> std::result::Result<(), String> {
        // The photo must still be where the plan found it.
        if self.dir == Direction::Forward {
            let now: Option<(String, String)> =
                sqlx::query_as("SELECT status, relative_path FROM media WHERE id = ?1")
                    .bind(self.media_id)
                    .fetch_optional(pool)
                    .await
                    .map_err(|e| e.to_string())?;
            if now
                .as_ref()
                .is_none_or(|(s, p)| s != "active" || p != self.src)
            {
                let _ = sqlx::query(
                    "UPDATE arrange_items SET status = 'skipped', error = 'a foto mudou desde o plano' WHERE batch_id = ?1 AND seq = ?2",
                )
                .bind(self.batch_id)
                .bind(self.seq)
                .execute(pool)
                .await;
                return Ok(());
            }
        }
        let op = log_start(
            pool,
            "move",
            serde_json::json!({
                "batchId": self.batch_id, "seq": self.seq, "mediaId": self.media_id,
                "libraryId": self.library_id, "from": self.src, "to": self.dst,
                "sidecars": self.sidecars, "undo": self.dir == Direction::Back,
            }),
        )
        .await
        .map_err(|e| e.to_string())?;
        let (src, dst) = (root.join(self.src), root.join(self.dst));
        if let Err(e) = move_file(&src, &dst).await {
            let _ = log_finish(pool, &op, "failed").await;
            return Err(io_message(&e));
        }
        let mut moved: Vec<(&str, &str)> = Vec::new();
        for (s, d) in self.sidecars {
            if !root.join(s).is_file() {
                continue; // gone since the plan: nothing to carry
            }
            if let Err(e) = move_file(&root.join(s), &root.join(d)).await {
                self.put_back(root, &moved).await;
                let _ = log_finish(pool, &op, "rolled_back").await;
                return Err(format!("{s}: {}", io_message(&e)));
            }
            moved.push((s, d));
        }
        let recorded = record(pool, self, &op).await;
        if let Err(e) = recorded {
            self.put_back(root, &moved).await;
            let _ = log_finish(pool, &op, "rolled_back").await;
            return Err(e.to_string());
        }
        remove_empty_dirs(root, parent(self.src));
        Ok(())
    }

    /// Undo a half-done move (the photo and the sidecars already moved).
    async fn put_back(&self, root: &Path, sidecars: &[(&str, &str)]) {
        for (s, d) in sidecars.iter().rev() {
            let _ = move_file(&root.join(d), &root.join(s)).await;
        }
        let _ = move_file(&root.join(self.dst), &root.join(self.src)).await;
    }
}

/// Catalog side of a move: the photo's path, the item, the log (one transaction).
async fn record(pool: &SqlitePool, m: &Move<'_>, op: &str) -> Result<()> {
    let filename = m.dst.rsplit('/').next().unwrap_or(m.dst);
    let mut tx = pool.begin().await?;
    sqlx::query(
        "UPDATE media SET relative_path = ?1, filename = ?2, updated_at = ?3 WHERE id = ?4",
    )
    .bind(m.dst)
    .bind(filename)
    .bind(Utc::now().to_rfc3339())
    .bind(m.media_id)
    .execute(&mut *tx)
    .await?;
    sqlx::query(
        "UPDATE arrange_items SET status = ?1, error = NULL WHERE batch_id = ?2 AND seq = ?3",
    )
    .bind(if m.dir == Direction::Forward {
        "done"
    } else {
        "undone"
    })
    .bind(m.batch_id)
    .bind(m.seq)
    .execute(&mut *tx)
    .await?;
    log_finish(&mut *tx, op, "done").await?;
    tx.commit().await?;
    Ok(())
}

/// Folders left empty by a move, up to (never including) the library root. A folder with
/// anything in it (even a hidden file) stays.
fn remove_empty_dirs(root: &Path, dir: &str) {
    let mut dir = dir.to_string();
    while !dir.is_empty() {
        if std::fs::remove_dir(root.join(&dir)).is_err() {
            break;
        }
        dir = parent(&dir).to_string();
    }
}

/// On startup: moves cut in half by a crash or a disconnection are finished (the photo
/// already at the target) or taken back (still at the source); running batches become
/// paused, to be resumed by the user.
pub async fn recover(pool: &SqlitePool) -> Result<u32> {
    let pending: Vec<(String, String)> = sqlx::query_as(
        "SELECT id, payload_json FROM operations_log WHERE status = 'pending' AND kind = 'move'",
    )
    .fetch_all(pool)
    .await?;
    let mut settled = 0;
    for (op, payload) in pending {
        let p: serde_json::Value = serde_json::from_str(&payload).unwrap_or_default();
        let text = |k: &str| p.get(k).and_then(|v| v.as_str()).map(str::to_string);
        let (Some(batch_id), Some(media_id), Some(library_id), Some(from), Some(to)) = (
            text("batchId"),
            text("mediaId"),
            text("libraryId"),
            text("from"),
            text("to"),
        ) else {
            log_finish(pool, &op, "failed").await?;
            continue;
        };
        let seq = p.get("seq").and_then(|v| v.as_i64()).unwrap_or(-1);
        let back = p.get("undo").and_then(|v| v.as_bool()).unwrap_or(false);
        let sidecars: Vec<(String, String)> = p
            .get("sidecars")
            .and_then(|v| serde_json::from_value(v.clone()).ok())
            .unwrap_or_default();
        let Ok(library) = crate::catalog::libraries::get(pool, &library_id).await else {
            log_finish(pool, &op, "failed").await?;
            continue;
        };
        let root = Path::new(&library.root_path);
        if !root.is_dir() {
            continue; // still unplugged: next time
        }
        let arrived = root.join(&to).is_file() && !root.join(&from).is_file();
        let m = Move {
            batch_id: &batch_id,
            library_id: &library_id,
            seq,
            media_id: &media_id,
            src: &from,
            dst: &to,
            sidecars: &sidecars,
            dir: if back {
                Direction::Back
            } else {
                Direction::Forward
            },
        };
        if arrived {
            for (s, d) in &sidecars {
                if root.join(s).is_file() && !root.join(d).exists() {
                    let _ = move_file(&root.join(s), &root.join(d)).await;
                }
            }
            record(pool, &m, &op).await?;
        } else {
            for (s, d) in &sidecars {
                if root.join(d).is_file() && !root.join(s).exists() {
                    let _ = move_file(&root.join(d), &root.join(s)).await;
                }
            }
            log_finish(pool, &op, "rolled_back").await?;
        }
        settled += 1;
    }
    sqlx::query(
        "UPDATE arrange_batches SET status = CASE status WHEN 'running' THEN 'paused' ELSE 'undo_paused' END,
            message = 'Interrompida quando o app fechou. Retome para continuar.'
         WHERE status IN ('running', 'undoing')",
    )
    .execute(pool)
    .await?;
    Ok(settled)
}
