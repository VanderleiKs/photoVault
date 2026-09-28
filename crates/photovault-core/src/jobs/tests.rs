use super::*;
use crate::catalog::libraries;
use crate::db::tests::{temp_dir, test_db};
use crate::ingestion::{ScanContext, ScanControl, ScanObserver, ScanProgress, scanner};
use std::collections::BTreeMap;

#[derive(Default)]
struct Recorder {
    progress: Mutex<Vec<JobProgress>>,
    updated: Mutex<Vec<MediaItem>>,
    removed: Mutex<Vec<String>>,
}

impl JobObserver for Recorder {
    fn on_progress(&self, p: &JobProgress) {
        self.progress.lock().unwrap().push(p.clone());
    }
    fn on_media_updated(&self, items: Vec<MediaItem>, removed_ids: Vec<String>) {
        self.updated.lock().unwrap().extend(items);
        self.removed.lock().unwrap().extend(removed_ids);
    }
}

struct Quiet;
impl ScanObserver for Quiet {
    fn on_progress(&self, _: &ScanProgress) {}
}

fn fixture(name: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("tests/fixtures")
        .join(name)
}

fn copy(name: &str, to: &Path) {
    std::fs::create_dir_all(to.parent().unwrap()).unwrap();
    std::fs::copy(fixture(name), to).unwrap();
}

fn snapshot(root: &Path) -> BTreeMap<PathBuf, Vec<u8>> {
    walkdir::WalkDir::new(root)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .map(|e| (e.path().to_path_buf(), std::fs::read(e.path()).unwrap()))
        .collect()
}

struct World {
    pool: SqlitePool,
    root: PathBuf,
    thumbs: PathBuf,
    library: crate::catalog::Library,
    scan: ScanContext,
    _dir: PathBuf,
}

async fn world() -> World {
    let (pool, dir) = test_db().await;
    let root = temp_dir();
    let library = libraries::create(&pool, "Teste", root.to_str().unwrap())
        .await
        .unwrap();
    World {
        scan: ScanContext {
            pool: pool.clone(),
            control: Arc::new(ScanControl::default()),
        },
        thumbs: dir.join("thumbnails"),
        pool,
        root,
        library,
        _dir: dir,
    }
}

impl World {
    async fn scan(&self) -> scanner::ScanSummary {
        scanner::scan(&self.scan, &self.library, Arc::new(Quiet))
            .await
            .unwrap()
    }

    async fn runner(&self, recorder: Arc<Recorder>) -> Arc<JobRunner> {
        JobRunner::new(self.pool.clone(), self.thumbs.clone(), recorder)
            .await
            .unwrap()
    }

    async fn item(&self, relative_path: &str) -> MediaItem {
        let id: String = sqlx::query_scalar("SELECT id FROM media WHERE relative_path = ?1")
            .bind(relative_path)
            .fetch_one(&self.pool)
            .await
            .unwrap();
        media::get(&self.pool, &id).await.unwrap()
    }

    async fn job_status(&self, relative_path: &str) -> (String, Option<String>) {
        sqlx::query_as(
            "SELECT j.status, j.error FROM jobs j JOIN media m ON m.id = j.media_id
             WHERE m.relative_path = ?1",
        )
        .bind(relative_path)
        .fetch_one(&self.pool)
        .await
        .unwrap()
    }
}

#[tokio::test]
async fn ingest_fills_metadata_thumbnails_and_place() {
    let w = world().await;
    copy("exif_full.jpg", &w.root.join("viagem/IMG_1234.jpg"));
    copy(
        "IMG_20240315_101112.jpg",
        &w.root.join("IMG_20240315_101112.jpg"),
    );
    std::fs::write(w.root.join("quebrada.jpg"), vec![7u8; 4096]).unwrap();
    std::fs::write(w.root.join("IMG_0001.HEIC"), vec![7u8; 4096]).unwrap();
    let original = snapshot(&w.root);

    assert_eq!(w.scan().await.new_files, 4);
    let recorder = Arc::new(Recorder::default());
    w.runner(recorder.clone()).await.drain().await.unwrap();

    // EXIF applied: date, camera, exposure, oriented size, GPS → place.
    let photo = w.item("viagem/IMG_1234.jpg").await;
    assert_eq!(photo.captured_at.as_deref(), Some("2025-07-12T14:32:01"));
    assert_eq!(photo.date_source.as_deref(), Some("exif_original"));
    assert_eq!(photo.camera_model.as_deref(), Some("iPhone 15 Pro"));
    assert_eq!(
        (photo.iso, photo.aperture, photo.shutter.as_deref()),
        (Some(32), Some(1.8), Some("1/1200"))
    );
    assert_eq!((photo.width, photo.height), (Some(200), Some(320)));
    assert_eq!(photo.place_admin1.as_deref(), Some("RS"));
    assert_eq!(photo.place_country.as_deref(), Some("BR"));
    assert_eq!(photo.thumb_version, 1);
    for size in thumbnails::SIZES {
        assert!(
            thumbnails::path(&w.thumbs, &photo.id, size).exists(),
            "thumb {size}"
        );
    }

    // Date from the filename when there is no EXIF.
    let named = w.item("IMG_20240315_101112.jpg").await;
    assert_eq!(named.captured_at.as_deref(), Some("2024-03-15T10:11:12"));
    assert_eq!(named.date_source.as_deref(), Some("filename"));

    // A corrupt file fails its job (with a reason) without stopping the others.
    let (status, error) = w.job_status("quebrada.jpg").await;
    assert_eq!(status, "failed");
    assert!(error.unwrap().contains("decodificar"));
    // Unsupported format (HEIC): not a problem with the file, not counted as failure.
    assert_eq!(w.job_status("IMG_0001.HEIC").await.0, "skipped");
    let broken = w.item("quebrada.jpg").await;
    assert_eq!(broken.thumb_version, 0);
    let failures = failures(&w.pool, 10).await.unwrap();
    assert_eq!(failures.len(), 1);
    assert_eq!(failures[0].relative_path, "quebrada.jpg");

    // Observer got the updated items and a final idle progress.
    assert!(
        recorder
            .updated
            .lock()
            .unwrap()
            .iter()
            .any(|m| m.id == photo.id)
    );
    let last = recorder.progress.lock().unwrap().last().cloned().unwrap();
    assert!(!last.active);
    assert_eq!((last.queued, last.failed), (0, 1));

    // Retrying re-queues the failure.
    assert_eq!(retry_failed(&w.pool).await.unwrap(), 1);
    assert_eq!(w.job_status("quebrada.jpg").await.0, "queued");

    assert_eq!(snapshot(&w.root), original, "pipeline modified the library");
}

#[tokio::test]
async fn interrupted_jobs_resume_after_restart() {
    let w = world().await;
    copy("similar_a.jpg", &w.root.join("a.jpg"));
    copy("similar_b.jpg", &w.root.join("b.jpg"));
    w.scan().await;

    // Simulate the app closing mid-batch.
    sqlx::query("UPDATE jobs SET status = 'running'")
        .execute(&w.pool)
        .await
        .unwrap();

    let runner = w.runner(Arc::new(Recorder::default())).await;
    assert_eq!(
        runner.progress().await.unwrap().queued,
        2,
        "running jobs went back to the queue"
    );
    runner.drain().await.unwrap();
    assert_eq!(w.job_status("a.jpg").await.0, "done");
    assert_eq!(w.job_status("b.jpg").await.0, "done");
}

#[tokio::test]
async fn paused_runner_does_nothing_until_resumed() {
    let w = world().await;
    copy("similar_a.jpg", &w.root.join("a.jpg"));
    w.scan().await;

    let runner = w.runner(Arc::new(Recorder::default())).await;
    runner.pause();
    runner.drain().await.unwrap();
    assert_eq!(w.job_status("a.jpg").await.0, "queued");
    assert!(runner.progress().await.unwrap().paused);

    runner.resume();
    runner.drain().await.unwrap();
    assert_eq!(w.job_status("a.jpg").await.0, "done");
}

#[tokio::test]
async fn moved_file_keeps_its_identity() {
    let w = world().await;
    copy("exif_full.jpg", &w.root.join("celular/IMG_1234.jpg"));
    w.scan().await;
    let runner = w.runner(Arc::new(Recorder::default())).await;
    runner.drain().await.unwrap();
    let before = w.item("celular/IMG_1234.jpg").await;
    sqlx::query("UPDATE media SET is_favorite = 1 WHERE id = ?1")
        .bind(&before.id)
        .execute(&w.pool)
        .await
        .unwrap();

    // User reorganizes the folder outside the app.
    std::fs::create_dir_all(w.root.join("2025/Gramado")).unwrap();
    std::fs::rename(
        w.root.join("celular/IMG_1234.jpg"),
        w.root.join("2025/Gramado/IMG_1234.jpg"),
    )
    .unwrap();
    let s = w.scan().await;
    assert_eq!((s.new_files, s.missing_files), (1, 1));

    let recorder = Arc::new(Recorder::default());
    let runner = w.runner(recorder.clone()).await;
    runner.drain().await.unwrap();

    let after = w.item("2025/Gramado/IMG_1234.jpg").await;
    assert_eq!(after.id, before.id, "same record, new path");
    assert!(after.is_favorite, "favorite survives the move");
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM media")
        .fetch_one(&w.pool)
        .await
        .unwrap();
    assert_eq!(total, 1, "the temporary new row was removed");
    assert_eq!(recorder.removed.lock().unwrap().len(), 1);
    assert!(thumbnails::path(&w.thumbs, &after.id, thumbnails::GRID_SIZE).exists());
}

#[tokio::test]
async fn disconnected_library_stays_queued() {
    let w = world().await;
    copy("similar_a.jpg", &w.root.join("a.jpg"));
    w.scan().await;
    sqlx::query("UPDATE libraries SET root_path = '/nao/existe'")
        .execute(&w.pool)
        .await
        .unwrap();

    let runner = w.runner(Arc::new(Recorder::default())).await;
    runner.drain().await.unwrap();
    assert_eq!(w.job_status("a.jpg").await.0, "queued");
}

/// Pauses the runner as soon as the first result is reported.
struct PauseOnFirst(std::sync::OnceLock<Arc<JobRunner>>);

impl JobObserver for PauseOnFirst {
    fn on_progress(&self, _: &JobProgress) {
        if let Some(runner) = self.0.get() {
            runner.pause();
        }
    }
    fn on_media_updated(&self, _: Vec<MediaItem>, _: Vec<String>) {}
}

#[tokio::test]
async fn pause_stops_a_batch_midway() {
    let w = world().await;
    for i in 0..5 {
        copy("similar_a.jpg", &w.root.join(format!("f{i}.jpg")));
    }
    w.scan().await;
    settings::save(
        &w.pool,
        &settings::AppSettings {
            cpu_concurrency: 1,
            ..Default::default()
        },
    )
    .await
    .unwrap();

    let observer = Arc::new(PauseOnFirst(Default::default()));
    let runner = JobRunner::new(w.pool.clone(), w.thumbs.clone(), observer.clone())
        .await
        .unwrap();
    let _ = observer.0.set(Arc::clone(&runner));
    runner.drain().await.unwrap();

    // Only work already started when the pause arrived may finish (1 CPU slot:
    // the job running + the one that grabbed the slot right after). Nothing is
    // left "running", and the rest waits in the queue.
    let counts: std::collections::HashMap<String, i64> =
        sqlx::query_as("SELECT status, COUNT(*) FROM jobs WHERE stage = 'ingest' GROUP BY status")
            .fetch_all(&w.pool)
            .await
            .unwrap()
            .into_iter()
            .collect();
    let (done, queued) = (
        counts.get("done").copied().unwrap_or(0),
        counts.get("queued").copied().unwrap_or(0),
    );
    assert!((1..=2).contains(&done), "{counts:?}");
    assert_eq!(done + queued, 5, "{counts:?}");
    // Every item still has work pending (ingest, or the analysis ingest queued).
    assert_eq!(runner.progress().await.unwrap().queued, 5);
}

mod analysis_pipeline {
    use super::*;
    use crate::analysis::metrics::tests::photo;
    use crate::catalog::organize::{self, GroupKind};
    use crate::catalog::query::MomentaryFilter;
    use crate::catalog::{MediaFilter, MediaQuery};
    use image::{DynamicImage, Rgb, RgbImage};

    fn save(img: &DynamicImage, path: &Path) {
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        img.save(path).unwrap();
    }

    fn screenshot() -> DynamicImage {
        // Flat "app UI": bars and buttons in a few colours, phone resolution.
        DynamicImage::ImageRgb8(RgbImage::from_fn(1080, 2400, |x, y| match (x, y) {
            (_, 0..=180) => Rgb([33, 150, 243]),
            (60..=1020, 400..=520) | (60..=1020, 700..=820) => Rgb([240, 240, 240]),
            (100..=500, 2200..=2300) => Rgb([76, 175, 80]),
            _ => Rgb([255, 255, 255]),
        }))
    }

    fn document() -> DynamicImage {
        // White page with rows of dark "text" strokes, A4 proportions.
        DynamicImage::ImageRgb8(RgbImage::from_fn(1240, 1754, |x, y| {
            let line = (y / 30) % 2 == 0 && (100..1140).contains(&x) && (120..1650).contains(&y);
            let glyph = (x / 7) % 3 != 0;
            if line && glyph && y % 30 < 14 {
                Rgb([30, 30, 30])
            } else {
                Rgb([235, 235, 232])
            }
        }))
    }

    async fn ids(w: &World, filter: MediaFilter) -> Vec<String> {
        let page = crate::catalog::media::list(
            &w.pool,
            &w.library.id,
            &MediaQuery {
                filter,
                ..Default::default()
            },
            None,
            100,
        )
        .await
        .unwrap();
        let mut names: Vec<String> = page.items.into_iter().map(|m| m.filename).collect();
        names.sort();
        names
    }

    #[tokio::test]
    async fn analysis_end_to_end() {
        let w = world().await;
        let base = photo(1600, 1200);
        save(&base, &w.root.join("viagem/a.jpg"));
        std::fs::create_dir_all(w.root.join("backup")).unwrap();
        std::fs::copy(w.root.join("viagem/a.jpg"), w.root.join("backup/a (1).jpg")).unwrap();
        save(
            &base.resize_exact(800, 600, image::imageops::FilterType::Triangle),
            &w.root.join("whatsapp/IMG-20250712-WA0001.jpg"),
        );
        save(&base.blur(6.0), &w.root.join("viagem/tremida.jpg"));
        save(
            &DynamicImage::ImageRgb8(RgbImage::from_fn(1600, 1200, |x, y| {
                Rgb([(x % 13) as u8, (y % 11) as u8, 6])
            })),
            &w.root.join("viagem/escura.jpg"),
        );
        save(
            &screenshot(),
            &w.root.join("Screenshot_20250712-143201.png"),
        );
        save(&document(), &w.root.join("recibo.jpg"));
        let original = snapshot(&w.root);

        w.scan().await;
        let recorder = Arc::new(Recorder::default());
        w.runner(recorder).await.drain().await.unwrap();

        let c = organize::counts(&w.pool, &w.library.id).await.unwrap();
        assert_eq!((c.exact_groups, c.exact_extra), (1, 1), "{c:?}");
        assert_eq!(c.visual_groups, 1, "{c:?}");
        assert_eq!(c.screenshots, 1, "{c:?}");
        assert_eq!(c.pending, 0);
        assert_eq!(c.analyzed, 7);

        // Visual duplicate: the full-resolution original wins over the WhatsApp copy.
        let visual = organize::groups(&w.pool, &w.library.id, GroupKind::VisualDuplicate, 0, 10)
            .await
            .unwrap();
        let names: Vec<&str> = visual.groups[0]
            .members
            .iter()
            .map(|m| m.item.filename.as_str())
            .collect();
        assert!(
            names.contains(&"IMG-20250712-WA0001.jpg") && names[0] != "IMG-20250712-WA0001.jpg",
            "{names:?}"
        );

        let low = ids(
            &w,
            MediaFilter {
                quality: Some(crate::analysis::classify::QualityLevel::Low),
                ..Default::default()
            },
        )
        .await;
        assert!(
            low.contains(&"tremida.jpg".to_string()) && low.contains(&"escura.jpg".to_string()),
            "{low:?}"
        );
        assert!(!low.contains(&"a.jpg".to_string()), "{low:?}");
        assert_eq!(
            ids(
                &w,
                MediaFilter {
                    screenshot: Some(true),
                    ..Default::default()
                }
            )
            .await,
            ["Screenshot_20250712-143201.png"]
        );
        // Screenshots get no quality verdict (a white UI is not "overexposed").
        let shot = w.item("Screenshot_20250712-143201.png").await;
        let shot = organize::media_analysis(&w.pool, &shot.id).await.unwrap();
        assert!(
            shot.analyzed && shot.quality.is_none() && shot.flags.is_empty(),
            "{shot:?}"
        );
        assert_eq!(
            ids(
                &w,
                MediaFilter {
                    momentary: Some(MomentaryFilter::Document),
                    ..Default::default()
                }
            )
            .await,
            ["recibo.jpg"]
        );

        // Per-item analysis for the info panel.
        let wa = w.item("whatsapp/IMG-20250712-WA0001.jpg").await;
        let info = organize::media_analysis(&w.pool, &wa.id).await.unwrap();
        assert!(info.analyzed);
        assert!(info.labels.iter().any(|l| l.value == "whatsapp"));
        assert!(
            info.groups
                .iter()
                .any(|g| g.kind == GroupKind::VisualDuplicate && !g.is_best)
        );

        // Manual tags: filter and search ("captura" finds the screenshot too).
        organize::add_tag(&w.pool, std::slice::from_ref(&wa.id), "  Família  ")
            .await
            .unwrap();
        assert_eq!(
            ids(
                &w,
                MediaFilter {
                    tag: Some("família".into()),
                    ..Default::default()
                }
            )
            .await,
            ["IMG-20250712-WA0001.jpg"]
        );
        assert_eq!(
            ids(
                &w,
                MediaFilter {
                    text: Some("familia".into()),
                    ..Default::default()
                }
            )
            .await,
            ["IMG-20250712-WA0001.jpg"]
        );
        assert_eq!(
            ids(
                &w,
                MediaFilter {
                    text: Some("captura".into()),
                    ..Default::default()
                }
            )
            .await,
            ["Screenshot_20250712-143201.png"]
        );
        assert_eq!(
            organize::tags(&w.pool, &w.library.id).await.unwrap()[0].tag,
            "família"
        );
        organize::remove_tag(&w.pool, std::slice::from_ref(&wa.id), "família")
            .await
            .unwrap();
        assert!(
            ids(
                &w,
                MediaFilter {
                    tag: Some("família".into()),
                    ..Default::default()
                }
            )
            .await
            .is_empty()
        );

        // New thresholds apply without re-reading any photo.
        let jobs_before: i64 = sqlx::query_scalar("SELECT SUM(attempts) FROM jobs")
            .fetch_one(&w.pool)
            .await
            .unwrap();
        let mut s = settings::get(&w.pool).await.unwrap();
        s.analysis.momentary_threshold = 1.0;
        s.analysis.blur_threshold = 0.0;
        settings::save(&w.pool, &s).await.unwrap();
        crate::analysis::store::mark_all_dirty(&w.pool)
            .await
            .unwrap();
        w.runner(Arc::new(Recorder::default()))
            .await
            .drain()
            .await
            .unwrap();
        let c = organize::counts(&w.pool, &w.library.id).await.unwrap();
        assert_eq!((c.momentary, c.screenshots), (0, 1), "{c:?}");
        assert!(
            !ids(
                &w,
                MediaFilter {
                    quality_flag: Some(crate::analysis::classify::QualityFlag::Blurry),
                    ..Default::default()
                }
            )
            .await
            .contains(&"tremida.jpg".to_string())
        );
        let jobs_after: i64 = sqlx::query_scalar("SELECT SUM(attempts) FROM jobs")
            .fetch_one(&w.pool)
            .await
            .unwrap();
        assert_eq!(jobs_before, jobs_after, "no job re-ran");

        assert_eq!(snapshot(&w.root), original, "analysis modified the library");
    }
}
