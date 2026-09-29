//! Runs the analysis on any folder and lists the photos that got a label (false-positive
//! hunting on real photos without ground truth).
//!
//!     cargo run --release -p photovault-core --example label_dump -- <pasta> [document|accidental|screenshot|all]
use photovault_core::catalog::{MediaItem, libraries};
use photovault_core::ingestion::{ScanContext, ScanControl, ScanObserver, ScanProgress, scanner};
use photovault_core::jobs::{JobObserver, JobProgress, JobRunner};
use std::sync::Arc;

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
    let dir = args.next().expect("usage: label_dump <folder> [label]");
    let label = args.next().unwrap_or_else(|| "document".into());
    let work = std::env::temp_dir().join(format!("pv-dump-{}", std::process::id()));
    std::fs::create_dir_all(&work)?;
    let db = photovault_core::db::open(&work.join("catalog.db"), &work.join("thumbnails")).await?;
    let pool = &db.pool;
    let lib = libraries::create(pool, "dump", &dir).await?;
    let ctx = ScanContext {
        pool: pool.clone(),
        control: Arc::new(ScanControl::default()),
    };
    scanner::scan(&ctx, &lib, Arc::new(Quiet)).await?;
    JobRunner::new(pool.clone(), work.join("thumbnails"), Arc::new(Quiet))
        .await?
        .drain()
        .await?;
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM media_quality")
        .fetch_one(pool)
        .await?;
    // `all` lists every photo with the raw values behind the document rule.
    if label == "all" {
        let rows: Vec<(String, f64, f64, f64, Option<i64>)> = sqlx::query_as(
            "SELECT m.relative_path, q.saturation, q.brightness, q.edge_density, q.text_lines
             FROM media m JOIN media_quality q ON q.media_id = m.id ORDER BY m.relative_path",
        )
        .fetch_all(pool)
        .await?;
        for (path, sat, bright, edges, lines) in rows {
            println!(
                "  sat {sat:.2} brilho {bright:5.1} bordas {edges:.3} linhas {:3} {path}",
                lines.unwrap_or(-1)
            );
        }
        let _ = std::fs::remove_dir_all(work);
        return Ok(());
    }
    let rows: Vec<(String, f64, bool)> = sqlx::query_as(
        "SELECT m.relative_path, ml.score, ml.active FROM media_labels ml
         JOIN labels l ON l.id = ml.label_id JOIN media m ON m.id = ml.media_id
         WHERE l.value = ?1 ORDER BY ml.score DESC",
    )
    .bind(&label)
    .fetch_all(pool)
    .await?;
    let active = rows.iter().filter(|r| r.2).count();
    println!(
        "{active} de {total} fotos com \"{label}\" ativo ({} com score armazenado):",
        rows.len()
    );
    for (path, score, on) in rows {
        println!("  {score:.2} {} {path}", if on { "✓" } else { " " });
    }
    let _ = std::fs::remove_dir_all(work);
    Ok(())
}
