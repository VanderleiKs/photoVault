//! Background ingest pipeline (PRD §9): a persistent job queue in SQLite processed
//! by bounded CPU workers, with a separate limit on concurrent disk reads so an
//! external USB drive is not saturated.
//!
//! One `ingest` job per media reads the file once and produces hashes, EXIF,
//! oriented thumbnails, the perceptual hash and the place. Later phases add stages
//! (quality, similarity…) as new job kinds.

mod gate;

use crate::analysis::{self, store::AnalyzeInput};
use crate::catalog::{MediaItem, MediaType, media, settings};
use crate::error::Result;
use crate::ingestion::geo;
use crate::ingestion::metadata::format_capture;
use crate::ingestion::processor::{self, Processed, SourceFile};
use crate::thumbnails;
use chrono::Utc;
use gate::IoGate;
use serde::Serialize;
use specta::Type;
use sqlx::{Sqlite, SqlitePool};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::sync::{Notify, Semaphore};
use tokio::task::JoinSet;

pub const INGEST: &str = "ingest";
/// Pixel analysis of the 1024 preview (quality, screenshot, momentary); after `ingest`.
pub const ANALYZE: &str = "analyze";

const BATCH: i64 = 256;
const PROGRESS_INTERVAL: Duration = Duration::from_millis(500);
/// Re-check disconnected libraries this often while idle.
const IDLE_RECHECK: Duration = Duration::from_secs(30);

/// Queue (or re-queue) the ingest of a media item. Idempotent.
pub async fn enqueue_ingest<'e, E>(executor: E, library_id: &str, media_id: &str) -> Result<()>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    enqueue(executor, library_id, media_id, INGEST).await
}

async fn enqueue<'e, E>(executor: E, library_id: &str, media_id: &str, stage: &str) -> Result<()>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query(
        "INSERT INTO jobs (id, library_id, media_id, stage, status, attempts, updated_at)
         VALUES (?1, ?2, ?3, ?4, 'queued', 0, ?5)
         ON CONFLICT (media_id, stage) DO UPDATE
         SET status = 'queued', attempts = 0, error = NULL, updated_at = excluded.updated_at",
    )
    .bind(uuid::Uuid::now_v7().to_string())
    .bind(library_id)
    .bind(media_id)
    .bind(stage)
    .bind(Utc::now().to_rfc3339())
    .execute(executor)
    .await?;
    Ok(())
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct JobProgress {
    /// Working right now (false when idle or paused).
    pub active: bool,
    pub paused: bool,
    /// Waiting to be processed (includes items of disconnected libraries).
    pub queued: u32,
    /// Processed since the queue last became busy.
    pub done_in_session: u32,
    /// Items with a problem (see diagnostics).
    pub failed: u32,
    pub per_minute: u32,
    pub eta_seconds: Option<u32>,
    pub current_path: Option<String>,
    /// Recomputing duplicates, similar photos and bursts (after the queue drains).
    pub grouping: bool,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct JobFailure {
    pub media_id: String,
    pub library_name: String,
    pub relative_path: String,
    pub error: String,
    pub attempts: u32,
    pub updated_at: String,
}

/// Receives pipeline updates (already throttled / batched).
pub trait JobObserver: Send + Sync {
    fn on_progress(&self, progress: &JobProgress);
    /// Items whose metadata/thumbnails changed, and ids that no longer exist
    /// (a moved file was relinked to its previous record).
    fn on_media_updated(&self, items: Vec<MediaItem>, removed_ids: Vec<String>);
    /// Groups, flags and labels of a library were recomputed.
    fn on_analysis_updated(&self, _library_id: &str) {}
}

pub struct JobRunner {
    pool: SqlitePool,
    thumbnails_dir: PathBuf,
    observer: Arc<dyn JobObserver>,
    /// Shared with in-flight tasks so pausing stops a batch midway.
    paused: Arc<AtomicBool>,
    wake: Notify,
    session: Mutex<Session>,
}

#[derive(Default)]
struct Session {
    started: Option<Instant>,
    grouping: bool,
    done: u32,
    current_path: Option<String>,
    last_emit: Option<Instant>,
}

#[derive(sqlx::FromRow)]
struct Job {
    job_id: String,
    media_id: String,
    library_id: String,
    /// Library root on this computer.
    root: String,
    relative_path: String,
    filename: String,
    extension: String,
    media_type: MediaType,
    file_mtime: Option<String>,
}

impl JobRunner {
    /// Prepare the runner; spawn `run()` on the app's async runtime.
    pub async fn new(
        pool: SqlitePool,
        thumbnails_dir: PathBuf,
        observer: Arc<dyn JobObserver>,
    ) -> Result<Arc<Self>> {
        // Jobs interrupted by closing the app go back to the queue.
        sqlx::query("UPDATE jobs SET status = 'queued' WHERE status = 'running'")
            .execute(&pool)
            .await?;
        Ok(Arc::new(Self {
            pool,
            thumbnails_dir,
            observer,
            paused: Arc::new(AtomicBool::new(false)),
            wake: Notify::new(),
            session: Mutex::new(Session::default()),
        }))
    }

    /// New work was queued (e.g. after a scan).
    pub fn wake(&self) {
        self.wake.notify_one();
    }

    pub fn pause(&self) {
        self.paused.store(true, Ordering::Release);
        self.wake();
    }

    pub fn resume(&self) {
        self.paused.store(false, Ordering::Release);
        self.wake();
    }

    pub fn is_paused(&self) -> bool {
        self.paused.load(Ordering::Acquire)
    }

    /// Main loop; never returns.
    pub async fn run(self: Arc<Self>) {
        loop {
            match self.step().await {
                Ok(true) => {}
                Ok(false) => {
                    self.end_session().await;
                    tokio::select! {
                        _ = self.wake.notified() => {}
                        _ = tokio::time::sleep(IDLE_RECHECK) => {}
                    }
                }
                Err(e) => {
                    tracing::error!("Job runner error: {e}");
                    tokio::time::sleep(Duration::from_secs(5)).await;
                }
            }
        }
    }

    /// Process until the queue is empty (tests / synchronous callers).
    pub async fn drain(&self) -> Result<()> {
        while self.step().await? {}
        self.end_session().await;
        Ok(())
    }

    /// One unit of work. Returns false when there is nothing (processable) to do.
    /// Order: ingest (new files first), then pixel analysis, then the global pass.
    async fn step(&self) -> Result<bool> {
        if self.is_paused() {
            return Ok(false);
        }
        Ok(self.step_ingest().await? || self.step_analyze().await? || self.step_groups().await?)
    }

    fn cpu_workers(settings: &settings::AppSettings) -> usize {
        match settings.cpu_concurrency {
            0 => std::thread::available_parallelism()
                .map(|n| n.get().saturating_sub(1))
                .unwrap_or(1)
                .max(1),
            n => n as usize,
        }
    }

    async fn step_ingest(&self) -> Result<bool> {
        let batch = self.next_batch().await?;
        if batch.is_empty() {
            return Ok(false);
        }

        let settings = settings::get(&self.pool).await?;
        let io = IoGate::new(settings.io_concurrency.max(1) as usize);
        let cpu_slots = Arc::new(Semaphore::new(Self::cpu_workers(&settings)));

        let ids: Vec<&str> = batch.iter().map(|j| j.job_id.as_str()).collect();
        self.mark_running(&ids).await?;
        {
            let mut session = self.lock_session();
            session.started.get_or_insert_with(Instant::now);
        }

        let mut tasks = JoinSet::new();
        for job in batch {
            let (io, cpu_slots, paused) =
                (io.clone(), Arc::clone(&cpu_slots), Arc::clone(&self.paused));
            tasks.spawn(async move {
                let _slot = cpu_slots.acquire_owned().await.ok();
                let job = Arc::new(job);
                // Paused while waiting for a slot: leave it for later.
                if paused.load(Ordering::Acquire) {
                    return (job, None);
                }
                let worker = Arc::clone(&job);
                let result = tokio::task::spawn_blocking(move || process(&worker, &io))
                    .await
                    .unwrap_or_else(|e| Err(format!("Falha interna: {e}")));
                (job, Some(result))
            });
        }

        let mut updated = Vec::new();
        let mut removed = Vec::new();
        let mut deferred = Vec::new();
        while let Some(joined) = tasks.join_next().await {
            let Ok((job, result)) = joined else { continue };
            let Some(result) = result else {
                deferred.push(job.job_id.clone());
                continue;
            };
            match self.apply(&job, result).await {
                Ok(Applied {
                    media_id,
                    removed_id,
                }) => {
                    updated.extend(media_id);
                    removed.extend(removed_id);
                }
                Err(e) => tracing::warn!("Could not record result for {}: {e}", job.relative_path),
            }
            {
                let mut session = self.lock_session();
                session.done += 1;
                session.current_path = Some(job.relative_path.clone());
            }
            if self.should_emit() {
                self.flush(&mut updated, &mut removed).await;
                self.emit_progress(true).await;
            }
        }
        self.requeue(&deferred).await?;
        self.flush(&mut updated, &mut removed).await;
        self.emit_progress(true).await;
        Ok(true)
    }

    /// Pixel analysis of items that already have a preview (local disk only).
    async fn step_analyze(&self) -> Result<bool> {
        let batch: Vec<(String, AnalyzeInput)> = sqlx::query_as::<_, AnalyzeRow>(
            "SELECT j.id AS job_id, m.id AS media_id, m.library_id, m.filename, m.relative_path,
                    m.extension, m.width, m.height, m.camera_model, m.camera_make
             FROM jobs j JOIN media m ON m.id = j.media_id
             WHERE j.stage = ?1 AND j.status = 'queued' AND m.status = 'active'
             ORDER BY m.sort_key DESC, m.id DESC
             LIMIT ?2",
        )
        .bind(ANALYZE)
        .bind(BATCH)
        .fetch_all(&self.pool)
        .await?
        .into_iter()
        .map(|r| (r.job_id, r.input))
        .collect();
        if batch.is_empty() {
            return Ok(false);
        }

        let settings = settings::get(&self.pool).await?;
        let thresholds = Arc::new(settings.analysis.clone());
        let cpu_slots = Arc::new(Semaphore::new(Self::cpu_workers(&settings)));
        let ids: Vec<&str> = batch.iter().map(|(id, _)| id.as_str()).collect();
        self.mark_running(&ids).await?;
        self.lock_session().started.get_or_insert_with(Instant::now);

        let mut tasks = JoinSet::new();
        for (job_id, input) in batch {
            let (cpu_slots, paused, thresholds) = (
                Arc::clone(&cpu_slots),
                Arc::clone(&self.paused),
                Arc::clone(&thresholds),
            );
            let dir = self.thumbnails_dir.clone();
            tasks.spawn(async move {
                let _slot = cpu_slots.acquire_owned().await.ok();
                if paused.load(Ordering::Acquire) {
                    return (job_id, input, None);
                }
                let worker = input.clone();
                let result = tokio::task::spawn_blocking(move || {
                    analysis::store::compute(&dir, &worker, &thresholds)
                })
                .await
                .unwrap_or_else(|e| Err(format!("Falha interna: {e}")));
                (job_id, input, Some(result))
            });
        }
        let mut deferred = Vec::new();
        while let Some(joined) = tasks.join_next().await {
            let Ok((job_id, input, result)) = joined else {
                continue;
            };
            let Some(result) = result else {
                deferred.push(job_id);
                continue;
            };
            let outcome = match result {
                Ok(found) => {
                    match analysis::store::store(&self.pool, &input, &found, &thresholds).await {
                        Ok(()) => Ok(()),
                        Err(e) => Err(e.to_string()),
                    }
                }
                Err(e) => Err(e),
            };
            let finished = match &outcome {
                Ok(()) => {
                    self.finish_job(&input.media_id, ANALYZE, Outcome::Done)
                        .await
                }
                Err(e) => {
                    self.finish_job(&input.media_id, ANALYZE, Outcome::Failed(e))
                        .await
                }
            };
            if let Err(e) = finished {
                tracing::warn!("Could not record analysis of {}: {e}", input.relative_path);
            }
            {
                let mut session = self.lock_session();
                session.done += 1;
                session.current_path = Some(input.relative_path.clone());
            }
            if self.should_emit() {
                self.emit_progress(true).await;
            }
        }
        self.requeue(&deferred).await?;
        self.emit_progress(true).await;
        Ok(true)
    }

    /// Global pass (flags, labels, groups) for libraries changed since the last one.
    async fn step_groups(&self) -> Result<bool> {
        let dirty = analysis::store::dirty_libraries(&self.pool).await?;
        let Some(library_id) = dirty.first() else {
            return Ok(false);
        };
        let thresholds = settings::get(&self.pool).await?.analysis;
        self.lock_session().grouping = true;
        self.emit_progress(true).await;
        let result = analysis::store::refresh_library(&self.pool, library_id, &thresholds).await;
        self.lock_session().grouping = false;
        result?;
        self.observer.on_analysis_updated(library_id);
        Ok(true)
    }

    async fn next_batch(&self) -> Result<Vec<Job>> {
        let rows: Vec<Job> = sqlx::query_as(
            "SELECT j.id AS job_id, m.id AS media_id, m.library_id, l.root_path AS root,
                    m.relative_path, m.filename, m.extension, m.media_type, m.file_mtime
             FROM jobs j
             JOIN media m ON m.id = j.media_id
             JOIN libraries l ON l.id = m.library_id
             WHERE j.stage = ?1 AND j.status = 'queued' AND m.status = 'active'
             ORDER BY m.sort_key DESC, m.id DESC
             LIMIT ?2",
        )
        .bind(INGEST)
        .bind(BATCH)
        .fetch_all(&self.pool)
        .await?;

        // Skip libraries whose drive is not connected; they stay queued.
        let mut connected: HashMap<String, bool> = HashMap::new();
        Ok(rows
            .into_iter()
            .filter(|job| {
                *connected
                    .entry(job.root.clone())
                    .or_insert_with(|| Path::new(&job.root).is_dir())
            })
            .collect())
    }

    /// Jobs skipped because of a pause go back to the queue untouched.
    async fn requeue(&self, job_ids: &[String]) -> Result<()> {
        if job_ids.is_empty() {
            return Ok(());
        }
        let mut tx = self.pool.begin().await?;
        for id in job_ids {
            sqlx::query("UPDATE jobs SET status = 'queued' WHERE id = ?1 AND status = 'running'")
                .bind(id)
                .execute(&mut *tx)
                .await?;
        }
        tx.commit().await?;
        Ok(())
    }

    async fn mark_running(&self, job_ids: &[&str]) -> Result<()> {
        let mut tx = self.pool.begin().await?;
        for id in job_ids {
            sqlx::query("UPDATE jobs SET status = 'running', updated_at = ?1 WHERE id = ?2")
                .bind(Utc::now().to_rfc3339())
                .bind(id)
                .execute(&mut *tx)
                .await?;
        }
        tx.commit().await?;
        Ok(())
    }

    /// Persist a job result. Thumbnails are written before the row points at them.
    async fn apply(
        &self,
        job: &Job,
        result: std::result::Result<Processed, String>,
    ) -> Result<Applied> {
        let processed = match result {
            Ok(p) => p,
            Err(error) => {
                self.finish_job(&job.media_id, INGEST, Outcome::Failed(&error))
                    .await?;
                return Ok(Applied::default());
            }
        };

        // A "new" file with the content of a missing one is that file, moved/renamed:
        // keep the old record (favorites, albums, reviews) and drop the new one.
        let relinked = self.relink_moved(job, &processed.sha256).await?;
        let target = relinked.as_deref().unwrap_or(&job.media_id).to_string();

        let has_thumbs = !processed.thumbnails.is_empty();
        if has_thumbs {
            let (dir, id, thumbs) = (
                self.thumbnails_dir.clone(),
                target.clone(),
                processed.thumbnails.clone(),
            );
            tokio::task::spawn_blocking(move || {
                thumbs
                    .iter()
                    .try_for_each(|(size, bytes)| thumbnails::write(&dir, &id, *size, bytes))
            })
            .await??;
        }

        let place_id = match processed.capture.gps {
            Some((lat, lon)) => self.place_for(lat, lon).await?,
            None => None,
        };

        let c = &processed.capture;
        let offset_time = match (c.local_time, c.offset_minutes) {
            (Some(local), Some(offset)) => chrono::FixedOffset::east_opt(offset * 60)
                .and_then(|tz| local.and_local_timezone(tz).single())
                .map(|t| t.to_rfc3339()),
            _ => None,
        };
        let updated = sqlx::query(
            "UPDATE media SET
                width = ?1, height = ?2, orientation = ?3, duration_ms = ?4,
                captured_at = COALESCE(?5, captured_at), captured_at_local = ?6,
                date_source = COALESCE(?7, date_source),
                gps_lat = ?8, gps_lon = ?9, place_id = ?10,
                camera_make = ?11, camera_model = ?12, lens = ?13, iso = ?14,
                aperture = ?15, shutter = ?16, focal_length = ?17,
                sha256 = ?18, phash = ?19,
                thumb_version = thumb_version + ?20,
                updated_at = ?21
             WHERE id = ?22",
        )
        .bind(processed.width.map(i64::from))
        .bind(processed.height.map(i64::from))
        .bind(c.orientation.map(i64::from))
        .bind(c.duration_ms.map(|d| d as i64))
        .bind(c.local_time.map(format_capture))
        .bind(offset_time)
        .bind(c.date_source.map(|d| d.as_str()))
        .bind(c.gps.map(|g| g.0))
        .bind(c.gps.map(|g| g.1))
        .bind(place_id)
        .bind(&c.camera_make)
        .bind(&c.camera_model)
        .bind(&c.lens)
        .bind(c.iso.map(i64::from))
        .bind(c.aperture)
        .bind(&c.shutter)
        .bind(c.focal_length)
        .bind(&processed.sha256)
        // Perceptual hash comes from the `analyze` stage (DCT over the preview).
        .bind(None::<String>)
        .bind(i64::from(has_thumbs))
        .bind(Utc::now().to_rfc3339())
        .bind(&target)
        .execute(&self.pool)
        .await?;

        if updated.rows_affected() == 0 {
            // Deleted meanwhile (library removed): don't leave orphan thumbnails.
            thumbnails::remove(&self.thumbnails_dir, std::slice::from_ref(&target));
            return Ok(Applied::default());
        }

        let outcome = match processed.decode_error.as_deref() {
            None => Outcome::Done,
            Some(e) if processed.unsupported_format => Outcome::Skipped(e),
            Some(e) => Outcome::Failed(e),
        };
        let analyzable = has_thumbs && job.media_type == MediaType::Image;
        self.finish_job(&target, INGEST, outcome).await?;
        if analyzable {
            enqueue(&self.pool, &job.library_id, &target, ANALYZE).await?;
        }
        Ok(Applied {
            media_id: Some(target),
            removed_id: relinked.map(|_| job.media_id.clone()),
        })
    }

    /// Returns the id of the missing record this file was relinked to.
    async fn relink_moved(&self, job: &Job, sha256: &str) -> Result<Option<String>> {
        let old: Option<String> = sqlx::query_scalar(
            "SELECT id FROM media
             WHERE library_id = ?1 AND sha256 = ?2 AND status = 'missing' AND id != ?3
             ORDER BY updated_at DESC LIMIT 1",
        )
        .bind(&job.library_id)
        .bind(sha256)
        .bind(&job.media_id)
        .fetch_optional(&self.pool)
        .await?;
        let Some(old) = old else { return Ok(None) };

        let mut tx = self.pool.begin().await?;
        let row: Option<(String, String, String, i64, Option<String>)> = sqlx::query_as(
            "SELECT relative_path, filename, extension, file_size, file_mtime FROM media WHERE id = ?1",
        )
        .bind(&job.media_id)
        .fetch_optional(&mut *tx)
        .await?;
        let Some((relative_path, filename, extension, size, mtime)) = row else {
            return Ok(None);
        };
        // Free the path first (UNIQUE(library_id, relative_path)); cascades the new job.
        sqlx::query("DELETE FROM media WHERE id = ?1")
            .bind(&job.media_id)
            .execute(&mut *tx)
            .await?;
        sqlx::query(
            "UPDATE media SET relative_path = ?1, filename = ?2, extension = ?3, file_size = ?4,
                              file_mtime = ?5, status = 'active', updated_at = ?6
             WHERE id = ?7",
        )
        .bind(&relative_path)
        .bind(&filename)
        .bind(&extension)
        .bind(size)
        .bind(&mtime)
        .bind(Utc::now().to_rfc3339())
        .bind(&old)
        .execute(&mut *tx)
        .await?;
        enqueue_ingest(&mut *tx, &job.library_id, &old).await?;
        tx.commit().await?;

        tracing::info!(
            "Relinked moved file {} to existing record {old}",
            relative_path
        );
        Ok(Some(old))
    }

    async fn place_for(&self, lat: f64, lon: f64) -> Result<Option<i64>> {
        let Some(place) = tokio::task::spawn_blocking(move || geo::nearest_place(lat, lon)).await?
        else {
            return Ok(None);
        };
        sqlx::query(
            "INSERT INTO places (name, admin1, country_code, lat, lon) VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT (name, admin1, country_code) DO NOTHING",
        )
        .bind(&place.name)
        .bind(&place.admin1)
        .bind(&place.country_code)
        .bind(lat)
        .bind(lon)
        .execute(&self.pool)
        .await?;
        Ok(sqlx::query_scalar(
            "SELECT id FROM places WHERE name = ?1 AND admin1 IS ?2 AND country_code = ?3",
        )
        .bind(&place.name)
        .bind(&place.admin1)
        .bind(&place.country_code)
        .fetch_optional(&self.pool)
        .await?)
    }

    async fn finish_job(&self, media_id: &str, stage: &str, outcome: Outcome<'_>) -> Result<()> {
        let (status, error) = match outcome {
            Outcome::Done => ("done", None),
            Outcome::Skipped(e) => ("skipped", Some(e)),
            Outcome::Failed(e) => ("failed", Some(e)),
        };
        sqlx::query(
            "UPDATE jobs SET status = ?1, error = ?2, attempts = attempts + 1, updated_at = ?3
             WHERE media_id = ?4 AND stage = ?5",
        )
        .bind(status)
        .bind(error)
        .bind(Utc::now().to_rfc3339())
        .bind(media_id)
        .bind(stage)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    fn lock_session(&self) -> std::sync::MutexGuard<'_, Session> {
        self.session.lock().unwrap_or_else(|e| e.into_inner())
    }

    fn should_emit(&self) -> bool {
        let session = self.lock_session();
        session
            .last_emit
            .is_none_or(|t| t.elapsed() >= PROGRESS_INTERVAL)
    }

    async fn flush(&self, updated: &mut Vec<String>, removed: &mut Vec<String>) {
        if updated.is_empty() && removed.is_empty() {
            return;
        }
        let ids = std::mem::take(updated);
        let items = media::get_many(&self.pool, &ids).await.unwrap_or_default();
        self.observer
            .on_media_updated(items, std::mem::take(removed));
    }

    async fn emit_progress(&self, active: bool) {
        match self.progress_with(active).await {
            Ok(progress) => {
                self.lock_session().last_emit = Some(Instant::now());
                self.observer.on_progress(&progress);
            }
            Err(e) => tracing::warn!("Could not compute job progress: {e}"),
        }
    }

    async fn end_session(&self) {
        let had_session = self.lock_session().started.is_some();
        if had_session {
            self.emit_progress(false).await;
            *self.lock_session() = Session::default();
        }
    }

    /// Current state of the queue.
    pub async fn progress(&self) -> Result<JobProgress> {
        let active = self.lock_session().started.is_some() && !self.is_paused();
        self.progress_with(active).await
    }

    async fn progress_with(&self, active: bool) -> Result<JobProgress> {
        // Items (not jobs): a file waiting for ingest and analysis counts once.
        let (queued, failed): (i64, i64) = sqlx::query_as(
            "SELECT COUNT(DISTINCT CASE WHEN j.status IN ('queued', 'running') THEN j.media_id END),
                    COUNT(DISTINCT CASE WHEN j.status = 'failed' THEN j.media_id END)
             FROM jobs j JOIN media m ON m.id = j.media_id
             WHERE j.stage IN (?1, ?2) AND m.status = 'active'",
        )
        .bind(INGEST)
        .bind(ANALYZE)
        .fetch_one(&self.pool)
        .await?;

        let session = self.lock_session();
        let elapsed = session
            .started
            .map(|s| s.elapsed().as_secs_f64())
            .unwrap_or(0.0);
        let per_second = if elapsed > 1.0 {
            session.done as f64 / elapsed
        } else {
            0.0
        };
        let eta = (per_second > 0.0 && active).then(|| (queued as f64 / per_second).round() as u32);
        Ok(JobProgress {
            active,
            paused: self.is_paused(),
            queued: queued as u32,
            done_in_session: session.done,
            failed: failed as u32,
            per_minute: (per_second * 60.0).round() as u32,
            eta_seconds: eta,
            current_path: if active {
                session.current_path.clone()
            } else {
                None
            },
            grouping: session.grouping,
        })
    }
}

/// How a job ended. `Skipped`: format not supported yet; re-queued on upgrade.
enum Outcome<'a> {
    Done,
    Skipped(&'a str),
    Failed(&'a str),
}

#[derive(Default)]
struct Applied {
    media_id: Option<String>,
    removed_id: Option<String>,
}

/// Blocking: read the file (under the I/O gate) and run the CPU pipeline.
fn process(job: &Job, io: &IoGate) -> std::result::Result<Processed, String> {
    let path = Path::new(&job.root).join(&job.relative_path);
    let file = SourceFile {
        filename: &job.filename,
        extension: &job.extension,
        media_type: job.media_type,
        modified: job.file_mtime.as_deref(),
    };
    let not_found = |e: std::io::Error| match e.kind() {
        std::io::ErrorKind::NotFound => {
            "Arquivo não encontrado (movido ou apagado depois do scan).".to_string()
        }
        _ => format!("Não foi possível ler o arquivo: {e}"),
    };
    match job.media_type {
        MediaType::Image => {
            let bytes = {
                let _permit = io.acquire();
                std::fs::read(&path).map_err(not_found)?
            };
            Ok(processor::process_image(&bytes, &file))
        }
        MediaType::Video => {
            let _permit = io.acquire();
            processor::process_video(&path, &file).map_err(not_found)
        }
    }
}

#[derive(sqlx::FromRow)]
struct AnalyzeRow {
    job_id: String,
    #[sqlx(flatten)]
    input: AnalyzeInput,
}

/// Problems recorded by the pipeline, newest first.
pub async fn failures(pool: &SqlitePool, limit: u32) -> Result<Vec<JobFailure>> {
    let rows: Vec<(String, String, String, Option<String>, i64, String)> = sqlx::query_as(
        "SELECT m.id, l.name, m.relative_path, j.error, j.attempts, j.updated_at
         FROM jobs j
         JOIN media m ON m.id = j.media_id
         JOIN libraries l ON l.id = m.library_id
         WHERE j.status = 'failed' AND m.status = 'active'
         ORDER BY j.updated_at DESC
         LIMIT ?1",
    )
    .bind(i64::from(limit))
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(media_id, library_name, relative_path, error, attempts, updated_at)| JobFailure {
                media_id,
                library_name,
                relative_path,
                error: error.unwrap_or_default(),
                attempts: attempts as u32,
                updated_at,
            },
        )
        .collect())
}

/// Put every failed job back in the queue. Returns how many.
pub async fn retry_failed(pool: &SqlitePool) -> Result<u32> {
    let result = sqlx::query(
        "UPDATE jobs SET status = 'queued', error = NULL, updated_at = ?1 WHERE status = 'failed'",
    )
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;
    Ok(result.rows_affected() as u32)
}

#[cfg(test)]
mod tests;
