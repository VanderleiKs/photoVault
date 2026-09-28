//! Measure scan + ingest throughput on a real folder (read-only on the folder).
//!
//!     cargo run --release -p photovault-core --example ingest_bench -- <photos-dir> [cpu] [io]
use photovault_core::catalog::{AppSettings, MediaItem, libraries, settings};
use photovault_core::ingestion::{ScanContext, ScanControl, ScanObserver, ScanProgress, scanner};
use photovault_core::jobs::{JobObserver, JobProgress, JobRunner};
use std::sync::Arc;
use std::time::Instant;

struct Quiet;
impl ScanObserver for Quiet {
    fn on_progress(&self, _: &ScanProgress) {}
}
impl JobObserver for Quiet {
    fn on_progress(&self, _: &JobProgress) {}
    fn on_media_updated(&self, _: Vec<MediaItem>, _: Vec<String>) {}
}

#[tokio::main]
async fn main() -> photovault_core::Result<()> {
    let mut args = std::env::args().skip(1);
    let root = args
        .next()
        .expect("usage: ingest_bench <photos-dir> [cpu] [io]");
    let cpu: u32 = args.next().map_or(0, |a| a.parse().unwrap());
    let io: u32 = args.next().map_or(2, |a| a.parse().unwrap());

    let work = std::env::temp_dir().join(format!("pv-bench-{}", std::process::id()));
    std::fs::create_dir_all(&work)?;
    let db = photovault_core::db::open(&work.join("catalog.db"), &work.join("thumbnails")).await?;
    settings::save(
        &db.pool,
        &AppSettings {
            cpu_concurrency: cpu,
            io_concurrency: io,
            ..Default::default()
        },
    )
    .await?;
    let library = libraries::create(&db.pool, "bench", &root).await?;

    let t = Instant::now();
    let ctx = ScanContext {
        pool: db.pool.clone(),
        control: Arc::new(ScanControl::default()),
    };
    let summary = scanner::scan(&ctx, &library, Arc::new(Quiet)).await?;
    let scan_secs = t.elapsed().as_secs_f64();
    println!(
        "scan:   {} files in {scan_secs:.2}s ({:.0} files/s)",
        summary.total,
        summary.total as f64 / scan_secs
    );

    let t = Instant::now();
    let runner = JobRunner::new(db.pool.clone(), work.join("thumbnails"), Arc::new(Quiet)).await?;
    runner.drain().await?;
    let ingest_secs = t.elapsed().as_secs_f64();
    let progress = runner.progress().await?;
    println!(
        "ingest: {} files in {ingest_secs:.2}s ({:.1} files/s), failed {} [cpu={} io={}]",
        summary.total,
        summary.total as f64 / ingest_secs,
        progress.failed,
        if cpu == 0 {
            "auto".into()
        } else {
            cpu.to_string()
        },
        io
    );
    let _ = std::fs::remove_dir_all(work);
    Ok(())
}
