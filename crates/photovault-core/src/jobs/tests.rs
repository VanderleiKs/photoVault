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

/// Phase 5: suggestions from the analysis, decisions, examples and the trash, on a real
/// library folder. The safety bar: nothing moves without a call, and a restored file is
/// byte-for-byte the original.
mod review_and_trash {
    use super::*;
    use crate::analysis::metrics::tests::{photo, scene};
    use crate::catalog::{MediaFilter, MediaQuery};
    use crate::review::examples::{self, ExampleIntent};
    use crate::review::{self, Decision, ReviewReason, ReviewStatus};
    use crate::trash::{self, OnConflict, TRASH_DIR};
    use image::{DynamicImage, Rgb, RgbImage};
    use sha2::{Digest, Sha256};

    fn save(img: &DynamicImage, path: &Path) {
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        img.save(path).unwrap();
    }

    fn sha(path: &Path) -> String {
        format!("{:x}", Sha256::digest(std::fs::read(path).unwrap()))
    }

    fn page(shade: u8, seed: u32) -> DynamicImage {
        DynamicImage::ImageRgb8(RgbImage::from_fn(1240, 1754, |x, y| {
            let line = (y / 30) % 2 == 0
                && (100..1140 - seed * 40).contains(&x)
                && (120..1650).contains(&y);
            if line && (x / 7) % 3 != 0 && y % 30 < 14 {
                Rgb([30, 30, 30])
            } else {
                Rgb([shade, shade, shade - 3])
            }
        }))
    }

    impl World {
        async fn drain(&self) {
            self.runner(Arc::new(Recorder::default()))
                .await
                .drain()
                .await
                .unwrap();
        }

        async fn reasons(&self, relative_path: &str) -> Vec<(ReviewReason, ReviewStatus)> {
            let item = self.item(relative_path).await;
            review::for_media(&self.pool, &item.id)
                .await
                .unwrap()
                .into_iter()
                .map(|e| (e.reason, e.status))
                .collect()
        }

        async fn pending(&self, relative_path: &str) -> Vec<ReviewReason> {
            self.reasons(relative_path)
                .await
                .into_iter()
                .filter(|r| r.1 == ReviewStatus::Pending)
                .map(|r| r.0)
                .collect()
        }

        async fn names(&self, filter: MediaFilter) -> Vec<String> {
            let page = crate::catalog::media::list(
                &self.pool,
                &self.library.id,
                &MediaQuery {
                    filter,
                    ..Default::default()
                },
                None,
                100,
            )
            .await
            .unwrap();
            page.items.into_iter().map(|m| m.filename).collect()
        }
    }

    #[tokio::test]
    async fn suggestions_decisions_and_trash() {
        let w = world().await;
        let base = photo(1600, 1200);
        save(&base, &w.root.join("viagem/a.jpg"));
        std::fs::create_dir_all(w.root.join("backup")).unwrap();
        std::fs::copy(w.root.join("viagem/a.jpg"), w.root.join("backup/a (1).jpg")).unwrap();
        save(
            &base.resize_exact(800, 600, image::imageops::FilterType::Triangle),
            &w.root.join("whatsapp/IMG-20250712-WA0001.jpg"),
        );
        save(
            &scene(1600, 1200, 7).blur(6.0),
            &w.root.join("viagem/tremida.jpg"),
        );
        save(&page(236, 0), &w.root.join("docs/recibo.jpg"));
        save(&page(226, 3), &w.root.join("docs/nota.jpg"));
        save(&scene(1600, 1200, 9), &w.root.join("viagem/paisagem.jpg"));
        w.scan().await;
        w.drain().await;

        // Suggestions: the best copy is never one of them.
        let (copy, best) = {
            let a = w.pending("viagem/a.jpg").await;
            let b = w.pending("backup/a (1).jpg").await;
            assert!(
                a.contains(&ReviewReason::ExactDuplicate)
                    != b.contains(&ReviewReason::ExactDuplicate),
                "exactly one copy is suggested: {a:?} / {b:?}"
            );
            if b.contains(&ReviewReason::ExactDuplicate) {
                ("backup/a (1).jpg", "viagem/a.jpg")
            } else {
                ("viagem/a.jpg", "backup/a (1).jpg")
            }
        };
        assert!(
            !w.pending(best)
                .await
                .contains(&ReviewReason::VisualDuplicate)
        );
        assert!(
            w.pending("whatsapp/IMG-20250712-WA0001.jpg")
                .await
                .contains(&ReviewReason::VisualDuplicate)
        );
        assert!(
            w.pending("viagem/tremida.jpg")
                .await
                .contains(&ReviewReason::Blurry)
        );
        assert!(
            w.pending("docs/recibo.jpg")
                .await
                .contains(&ReviewReason::Momentary)
        );
        assert!(w.pending("viagem/paisagem.jpg").await.is_empty());

        let summary = review::summary(&w.pool, &w.library.id).await.unwrap();
        assert!(summary.pending >= 5, "{summary:?}");
        let prioritized = crate::catalog::media::list(
            &w.pool,
            &w.library.id,
            &MediaQuery {
                filter: MediaFilter {
                    review: Some(true),
                    ..Default::default()
                },
                sort: crate::catalog::MediaSort::Priority,
            },
            None,
            100,
        )
        .await
        .unwrap();
        assert_eq!(prioritized.items.len() as u32, summary.pending);
        let first: Vec<&str> = prioritized.items[..2]
            .iter()
            .map(|m| m.relative_path.as_str())
            .collect();
        assert!(
            first.contains(&copy) && first.contains(&"whatsapp/IMG-20250712-WA0001.jpg"),
            "copies come first: {first:?}"
        );

        // R5: a favorite is never a candidate.
        let wa = w.item("whatsapp/IMG-20250712-WA0001.jpg").await;
        crate::catalog::media::set_favorite(&w.pool, std::slice::from_ref(&wa.id), true)
            .await
            .unwrap();
        w.drain().await;
        assert!(
            w.pending("whatsapp/IMG-20250712-WA0001.jpg")
                .await
                .is_empty()
        );

        // "Manter" survives every rebuild; "reabrir" brings it back.
        let weights = settings::get(&w.pool).await.unwrap().review.weights;
        let blurry = w.item("viagem/tremida.jpg").await;
        let changed = review::decide(
            &w.pool,
            std::slice::from_ref(&blurry.id),
            Decision::Keep,
            None,
            &weights,
        )
        .await
        .unwrap();
        assert!(changed >= 1);
        assert!(w.item("viagem/tremida.jpg").await.id == blurry.id);
        crate::analysis::store::mark_all_dirty(&w.pool)
            .await
            .unwrap();
        w.drain().await;
        assert!(w.pending("viagem/tremida.jpg").await.is_empty());
        assert!(
            w.reasons("viagem/tremida.jpg")
                .await
                .contains(&(ReviewReason::Blurry, ReviewStatus::Kept))
        );
        let history = review::history(&w.pool, &w.library.id, None, 50)
            .await
            .unwrap();
        assert_eq!(history.entries[0].item.id, blurry.id);
        review::decide(
            &w.pool,
            std::slice::from_ref(&blurry.id),
            Decision::Reopen,
            None,
            &weights,
        )
        .await
        .unwrap();
        w.drain().await;
        assert!(
            w.pending("viagem/tremida.jpg")
                .await
                .contains(&ReviewReason::Blurry)
        );

        // Examples: a receipt given as "remove" finds the other one, not the landscape.
        let receipt = w.item("docs/recibo.jpg").await;
        examples::add_from_media(
            &w.pool,
            &w.thumbs,
            std::slice::from_ref(&receipt.id),
            ExampleIntent::Remove,
        )
        .await
        .unwrap();
        w.drain().await;
        assert!(
            w.pending("docs/nota.jpg")
                .await
                .contains(&ReviewReason::Example)
        );
        assert!(
            !w.pending("viagem/paisagem.jpg")
                .await
                .contains(&ReviewReason::Example)
        );
        let listed = examples::list(&w.pool).await.unwrap();
        assert_eq!(listed.len(), 1);
        assert!(listed[0].thumbnail.starts_with("data:image/webp;base64,"));
        assert!(listed[0].matches >= 1);
        examples::remove(&w.pool, &listed[0].id).await.unwrap();
        w.drain().await;
        assert!(
            !w.pending("docs/nota.jpg")
                .await
                .contains(&ReviewReason::Example)
        );

        // Trash: a rename inside the library; the scanner doesn't see it as missing.
        let original = w.root.join("viagem/tremida.jpg");
        let hash = sha(&original);
        let sent = trash::send(&w.pool, &w.thumbs, std::slice::from_ref(&blurry.id), false)
            .await
            .unwrap();
        assert_eq!((sent.done.len(), sent.failed.len()), (1, 0), "{sent:?}");
        assert!(!original.exists());
        let item = crate::catalog::media::get(&w.pool, &blurry.id)
            .await
            .unwrap();
        assert!(
            item.relative_path.starts_with(TRASH_DIR),
            "{}",
            item.relative_path
        );
        assert_eq!(sha(&w.root.join(&item.relative_path)), hash);
        assert!(
            w.names(MediaFilter::default())
                .await
                .iter()
                .all(|n| n != "tremida.jpg"),
            "not in the gallery"
        );
        assert_eq!(
            w.names(MediaFilter {
                trashed: Some(true),
                ..Default::default()
            })
            .await,
            ["tremida.jpg"]
        );
        assert!(
            w.reasons(&item.relative_path)
                .await
                .contains(&(ReviewReason::Blurry, ReviewStatus::Trashed))
        );
        let rescan = w.scan().await;
        assert_eq!(
            (rescan.missing_files, rescan.new_files),
            (0, 0),
            "{rescan:?}"
        );
        assert_eq!(
            trash::summary(&w.pool, &w.library.id).await.unwrap().count,
            1
        );
        let again = trash::send(&w.pool, &w.thumbs, std::slice::from_ref(&blurry.id), false)
            .await
            .unwrap();
        assert_eq!(again.failed.len(), 1, "can't trash twice");

        // Restore: same path, same bytes; the suggestion becomes "kept".
        let back = trash::restore(&w.pool, std::slice::from_ref(&blurry.id), OnConflict::Ask)
            .await
            .unwrap();
        assert_eq!(back.restored, std::slice::from_ref(&blurry.id), "{back:?}");
        assert_eq!(sha(&original), hash);
        assert!(
            !w.root.join(TRASH_DIR).exists(),
            "empty trash folders are cleaned"
        );
        assert!(
            w.reasons("viagem/tremida.jpg")
                .await
                .contains(&(ReviewReason::Blurry, ReviewStatus::Kept))
        );

        // Conflict: something new took the original path.
        trash::send(&w.pool, &w.thumbs, std::slice::from_ref(&blurry.id), false)
            .await
            .unwrap();
        save(&scene(400, 300, 3), &original);
        let other = sha(&original);
        let asked = trash::restore(&w.pool, std::slice::from_ref(&blurry.id), OnConflict::Ask)
            .await
            .unwrap();
        assert_eq!(asked.conflicts.len(), 1);
        assert_eq!(sha(&original), other, "the new file is untouched");
        let renamed = trash::restore(
            &w.pool,
            std::slice::from_ref(&blurry.id),
            OnConflict::Rename,
        )
        .await
        .unwrap();
        assert_eq!(renamed.restored.len(), 1);
        let restored = w.root.join("viagem/tremida (restaurada).jpg");
        assert_eq!(sha(&restored), hash);
        assert_eq!(
            crate::catalog::media::get(&w.pool, &blurry.id)
                .await
                .unwrap()
                .filename,
            "tremida (restaurada).jpg"
        );

        // Delete for good.
        trash::send(&w.pool, &w.thumbs, std::slice::from_ref(&blurry.id), false)
            .await
            .unwrap();
        let active = trash::purge(&w.pool, &w.thumbs, std::slice::from_ref(&wa.id))
            .await
            .unwrap();
        assert_eq!(active.failed.len(), 1, "only trashed items can be purged");
        let purged = trash::empty(&w.pool, &w.thumbs, &w.library.id)
            .await
            .unwrap();
        assert_eq!(purged.done, std::slice::from_ref(&blurry.id));
        assert!(!restored.exists());
        assert!(matches!(
            crate::catalog::media::get(&w.pool, &blurry.id).await,
            Err(crate::Error::MediaNotFound)
        ));
        assert!(!w.root.join(TRASH_DIR).exists());

        // Every physical operation was logged and closed.
        let ops: Vec<(String, String)> =
            sqlx::query_as("SELECT kind, status FROM operations_log ORDER BY created_at")
                .fetch_all(&w.pool)
                .await
                .unwrap();
        let kinds: Vec<&str> = ops.iter().map(|o| o.0.as_str()).collect();
        assert_eq!(
            kinds,
            ["trash", "restore", "trash", "restore", "trash", "purge"],
            "{ops:?}"
        );
        assert!(ops.iter().all(|o| o.1 == "done"), "{ops:?}");
        assert_eq!(trash::recover(&w.pool).await.unwrap(), 0);
    }

    #[tokio::test]
    async fn interrupted_trash_is_settled_on_startup() {
        let w = world().await;
        save(&photo(800, 600), &w.root.join("a.jpg"));
        w.scan().await;
        w.drain().await;
        let item = w.item("a.jpg").await;
        // Crash after the rename, before the catalog was updated.
        let to = format!("{TRASH_DIR}/2026-09-28/a.jpg");
        std::fs::create_dir_all(w.root.join(TRASH_DIR).join("2026-09-28")).unwrap();
        std::fs::rename(w.root.join("a.jpg"), w.root.join(&to)).unwrap();
        sqlx::query(
            "INSERT INTO operations_log (id, kind, payload_json, status, created_at)
             VALUES ('op', 'trash', ?1, 'pending', 'now')",
        )
        .bind(serde_json::json!({ "mediaId": item.id, "libraryId": w.library.id, "from": "a.jpg", "to": to }).to_string())
        .execute(&w.pool)
        .await
        .unwrap();
        assert_eq!(trash::recover(&w.pool).await.unwrap(), 1);
        let item = crate::catalog::media::get(&w.pool, &item.id).await.unwrap();
        assert_eq!(item.relative_path, to);
        let restored = trash::restore(&w.pool, std::slice::from_ref(&item.id), OnConflict::Ask)
            .await
            .unwrap();
        assert_eq!(restored.restored.len(), 1);
        assert!(w.root.join("a.jpg").is_file());
    }
}

/// Scan → ingest → analysis → content analysis → search, with the real model.
/// Needs the downloaded files and a content-labeled folder (`tests/labeled/content.py`):
///     PHOTOVAULT_TEST_MODELS=<models> PHOTOVAULT_TEST_CONTENT=<content> \
///     cargo test --release -p photovault-core content_search_end_to_end -- --ignored
#[tokio::test(flavor = "multi_thread")]
#[ignore = "needs the AI models (PHOTOVAULT_TEST_MODELS) and photos (PHOTOVAULT_TEST_CONTENT)"]
async fn content_search_end_to_end() {
    let models = PathBuf::from(std::env::var("PHOTOVAULT_TEST_MODELS").unwrap());
    let content = PathBuf::from(std::env::var("PHOTOVAULT_TEST_CONTENT").unwrap());
    let w = world().await;
    for category in ["flores", "carro", "gato"] {
        for entry in std::fs::read_dir(content.join(category))
            .unwrap()
            .flatten()
            .take(6)
        {
            // Neutral names: only the content can find them.
            std::fs::copy(
                entry.path(),
                w.root
                    .join(format!("IMG_{}.jpg", uuid::Uuid::new_v4().simple())),
            )
            .unwrap();
        }
    }
    w.scan().await;
    assert!(crate::ai::load(&models, None).unwrap());
    let runner = w.runner(Arc::new(Recorder::default())).await;
    runner.drain().await.unwrap();
    assert_eq!(crate::ai::index::pending_count(&w.pool).await.unwrap(), 0);
    assert_eq!(crate::ai::index::indexed_count(&w.pool).await.unwrap(), 18);

    let search = |text: &str| {
        let (pool, lib) = (w.pool.clone(), w.library.id.clone());
        let text = text.to_string();
        async move {
            media::list(
                &pool,
                &lib,
                &crate::catalog::MediaQuery {
                    filter: crate::catalog::MediaFilter {
                        text: Some(text),
                        ..Default::default()
                    },
                    ..Default::default()
                },
                None,
                100,
            )
            .await
            .unwrap()
            .items
        }
    };
    let flowers = search("flores").await;
    assert!(
        (4..=8).contains(&flowers.len()),
        "{} results",
        flowers.len()
    );
    let cats = search("gato").await;
    assert!((4..=8).contains(&cats.len()), "{} results", cats.len());
    assert!(cats.iter().all(|c| !flowers.iter().any(|f| f.id == c.id)));
    // Dates and content together: nothing was taken in 1990.
    assert!(search("gato 1990").await.is_empty());
    // A scene chip on a photo.
    let scenes = crate::ai::index::scenes_of(&w.pool, &cats[0].id)
        .await
        .unwrap();
    assert!(scenes.iter().any(|s| s.value == "cat"), "{scenes:?}");
    crate::ai::unload();
}

/// Real face models, real faces (LFW): scan → previews → faces → people → name → search.
///     PHOTOVAULT_TEST_MODELS=<models> PHOTOVAULT_TEST_FACES=<lfw> \
///     cargo test --release -p photovault-core people_end_to_end -- --ignored
#[tokio::test(flavor = "multi_thread")]
#[ignore = "needs the face models (PHOTOVAULT_TEST_MODELS) and LFW (PHOTOVAULT_TEST_FACES)"]
async fn people_end_to_end() {
    let models = PathBuf::from(std::env::var("PHOTOVAULT_TEST_MODELS").unwrap());
    let lfw = PathBuf::from(std::env::var("PHOTOVAULT_TEST_FACES").unwrap());
    let w = world().await;
    // Neutral names; which LFW person each photo shows, for checking the groups.
    let mut truth = std::collections::HashMap::new();
    for person in [
        "Colin_Powell",
        "Tony_Blair",
        "Serena_Williams",
        "Hugo_Chavez",
    ] {
        let mut files: Vec<_> = std::fs::read_dir(lfw.join(person))
            .unwrap()
            .flatten()
            .map(|e| e.path())
            .collect();
        files.sort();
        // One photo only of Hugo Chávez: a stranger, never a person.
        let n = if person == "Hugo_Chavez" { 1 } else { 6 };
        for f in files.into_iter().take(n) {
            let name = format!("IMG_{}.jpg", uuid::Uuid::new_v4().simple());
            std::fs::copy(&f, w.root.join(&name)).unwrap();
            truth.insert(name, person);
        }
    }
    w.scan().await;
    assert!(crate::ai::load_faces(&models, None).unwrap());
    let runner = w.runner(Arc::new(Recorder::default())).await;
    runner.drain().await.unwrap();
    assert_eq!(crate::people::pending_count(&w.pool).await.unwrap(), 0);
    assert!(!crate::people::is_dirty(&w.pool).await.unwrap());

    let people = crate::people::list(&w.pool, &w.library.id, false)
        .await
        .unwrap();
    assert_eq!(people.len(), 3, "{people:?}");
    let photos_of = |person_id: String| {
        let (pool, lib) = (w.pool.clone(), w.library.id.clone());
        async move {
            media::list(
                &pool,
                &lib,
                &crate::catalog::MediaQuery {
                    filter: crate::catalog::MediaFilter {
                        person_id: Some(person_id),
                        ..Default::default()
                    },
                    ..Default::default()
                },
                None,
                100,
            )
            .await
            .unwrap()
            .items
        }
    };
    for p in &people {
        let photos = photos_of(p.id.clone()).await;
        assert!(photos.len() >= 5, "{} photos", photos.len());
        let who: std::collections::HashSet<_> = photos.iter().map(|m| truth[&m.filename]).collect();
        assert_eq!(who.len(), 1, "a group mixes people: {who:?}");
    }

    // Named, then found by name.
    let first = &people[0];
    crate::people::rename(&w.pool, &first.id, "Fulano de Tal")
        .await
        .unwrap();
    let found = media::list(
        &w.pool,
        &w.library.id,
        &crate::catalog::MediaQuery {
            filter: crate::catalog::MediaFilter {
                text: Some("fulano".into()),
                ..Default::default()
            },
            ..Default::default()
        },
        None,
        100,
    )
    .await
    .unwrap()
    .items;
    assert_eq!(found.len() as u32, first.photo_count);
    // The face picture can be cut from the preview.
    let cover = crate::people::face_location(&w.pool, first.cover_face_id.as_deref().unwrap())
        .await
        .unwrap()
        .unwrap();
    let jpeg = crate::people::crop(&w.thumbs, &cover.0, cover.1).unwrap();
    assert_eq!(
        image::load_from_memory(&jpeg).unwrap().width(),
        crate::people::CROP_SIZE
    );
    crate::ai::unload_faces();
}
