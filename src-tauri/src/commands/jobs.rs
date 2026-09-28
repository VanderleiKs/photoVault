use super::AppStateRef;
use crate::error::ApiResult;
use photovault_core::jobs::{self, JobFailure, JobProgress};

/// State of the background analysis queue.
#[tauri::command]
#[specta::specta]
pub async fn get_job_progress(state: AppStateRef<'_>) -> ApiResult<JobProgress> {
    Ok(state.jobs.progress().await?)
}

#[tauri::command]
#[specta::specta]
pub async fn pause_jobs(state: AppStateRef<'_>) -> ApiResult<JobProgress> {
    state.jobs.pause();
    Ok(state.jobs.progress().await?)
}

#[tauri::command]
#[specta::specta]
pub async fn resume_jobs(state: AppStateRef<'_>) -> ApiResult<JobProgress> {
    state.jobs.resume();
    Ok(state.jobs.progress().await?)
}

/// Files the pipeline could not fully process (unsupported format, corrupt, unreadable).
#[tauri::command]
#[specta::specta]
pub async fn list_job_failures(limit: u32, state: AppStateRef<'_>) -> ApiResult<Vec<JobFailure>> {
    Ok(jobs::failures(&state.pool, limit.min(1000)).await?)
}

/// Re-queue every failed item. Returns how many.
#[tauri::command]
#[specta::specta]
pub async fn retry_failed_jobs(state: AppStateRef<'_>) -> ApiResult<u32> {
    let count = jobs::retry_failed(&state.pool).await?;
    state.jobs.wake();
    Ok(count)
}
