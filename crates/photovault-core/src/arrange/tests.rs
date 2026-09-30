use super::*;
use crate::catalog::libraries;
use crate::db::tests::{temp_dir, test_db};
use std::path::PathBuf;

struct World {
    pool: SqlitePool,
    lib: String,
    root: PathBuf,
    dirs: Vec<PathBuf>,
}

impl Drop for World {
    fn drop(&mut self) {
        for d in &self.dirs {
            let _ = std::fs::remove_dir_all(d);
        }
    }
}

/// Photos on disk and in the catalog: (id, relative path, captured_at, date source).
async fn world(photos: &[(&str, &str, Option<&str>, &str)]) -> World {
    let (pool, dir) = test_db().await;
    let root = temp_dir();
    let lib = libraries::create(&pool, "A", root.to_str().unwrap())
        .await
        .unwrap()
        .id;
    let w = World {
        pool,
        lib,
        root: root.clone(),
        dirs: vec![dir, root],
    };
    for (id, rel, at, source) in photos {
        w.file(rel, id);
        let filename = rel.rsplit('/').next().unwrap();
        sqlx::query(
            "INSERT INTO media (id, library_id, relative_path, filename, extension, media_type, file_size,
                                captured_at, date_source, indexed_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, 'jpg', 'image', 1, ?5, ?6, 'now', 'now')",
        )
        .bind(id)
        .bind(&w.lib)
        .bind(rel)
        .bind(filename)
        .bind(at)
        .bind(source)
        .execute(&w.pool)
        .await
        .unwrap();
    }
    w
}

impl World {
    fn file(&self, rel: &str, content: &str) {
        let path = self.root.join(rel);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(path, content).unwrap();
    }

    fn read(&self, rel: &str) -> Option<String> {
        std::fs::read_to_string(self.root.join(rel)).ok()
    }

    async fn path_of(&self, id: &str) -> String {
        sqlx::query_scalar("SELECT relative_path FROM media WHERE id = ?1")
            .bind(id)
            .fetch_one(&self.pool)
            .await
            .unwrap()
    }

    async fn plan(&self, rule: &ArrangeRule) -> (Vec<PlannedMove>, ArrangePreview) {
        plan(&self.pool, &self.lib, rule, &ArrangeScope::default())
            .await
            .unwrap()
    }
}

fn by_month() -> ArrangeRule {
    ArrangeRule {
        folders: Some("{ano}/{mes} - {mes_nome}".into()),
        name: None,
    }
}

const JUL: Option<&str> = Some("2025-07-12T14:32:01");
const DEC: Option<&str> = Some("2024-12-25T20:00:00");

#[tokio::test]
async fn the_plan_shows_every_move_before_anything_happens() {
    let w = world(&[
        ("a", "DCIM/IMG_1.jpg", JUL, "exif_original"),
        ("b", "DCIM/IMG_2.jpg", DEC, "exif_original"),
        ("c", "2025/07 - Julho/ok.jpg", JUL, "exif_original"),
        (
            "d",
            "Downloads/copia.jpg",
            Some("2023-01-01T00:00:00"),
            "mtime",
        ),
    ])
    .await;
    w.file("DCIM/IMG_1.xmp", "xmp");
    w.file("DCIM/IMG_1.jpg.json", "json");
    let (moves, p) = w.plan(&by_month()).await;
    assert_eq!((p.total, p.moving, p.unchanged, p.undated), (4, 3, 1, 1));
    let to: Vec<(&str, &str)> = moves
        .iter()
        .map(|m| (m.media_id.as_str(), m.to.as_str()))
        .collect();
    assert_eq!(
        to,
        [
            // The mtime is a copy date, not the capture date.
            ("d", "Sem data/copia.jpg"),
            ("b", "2024/12 - Dezembro/IMG_2.jpg"),
            ("a", "2025/07 - Julho/IMG_1.jpg"),
        ]
    );
    let a = moves.iter().find(|m| m.media_id == "a").unwrap();
    let mut sidecars = a.sidecars.clone();
    sidecars.sort();
    assert_eq!(
        sidecars,
        [
            (
                "DCIM/IMG_1.jpg.json".to_string(),
                "2025/07 - Julho/IMG_1.jpg.json".to_string()
            ),
            (
                "DCIM/IMG_1.xmp".to_string(),
                "2025/07 - Julho/IMG_1.xmp".to_string()
            ),
        ]
    );
    assert_eq!(p.sidecars, 2);
    // Nothing moved yet.
    assert_eq!(w.read("DCIM/IMG_1.jpg").as_deref(), Some("a"));
    assert_eq!(w.path_of("a").await, "DCIM/IMG_1.jpg");
}

#[tokio::test]
async fn taken_names_get_a_number_and_nothing_is_overwritten() {
    let w = world(&[
        ("a", "cam1/IMG_1.jpg", JUL, "exif_original"),
        ("b", "cam2/IMG_1.jpg", JUL, "exif_original"),
        ("c", "cam3/img_1.JPG", JUL, "exif_original"),
    ])
    .await;
    // Not in the catalog, but on disk: never overwritten.
    w.file("2025/07 - Julho/IMG_1 (2).jpg", "foreign");
    let rule = ArrangeRule {
        folders: Some("{ano}/{mes} - {mes_nome}".into()),
        name: None,
    };
    let (moves, p) = w.plan(&rule).await;
    let to: Vec<&str> = moves.iter().map(|m| m.to.as_str()).collect();
    assert_eq!(
        to,
        [
            "2025/07 - Julho/IMG_1.jpg",
            // "(2)" is a file on disk that isn't in the catalog.
            "2025/07 - Julho/IMG_1 (3).jpg",
            // Same name ignoring case is taken too (Windows, exFAT).
            "2025/07 - Julho/img_1 (4).JPG",
        ]
    );
    assert_eq!(p.renamed, 2);

    let batch = create_batch(&w.pool, &w.lib, &rule, &ArrangeScope::default())
        .await
        .unwrap();
    let done = run::execute(&w.pool, &batch.id).await.unwrap();
    assert_eq!(
        (done.status, done.done, done.failed),
        (BatchStatus::Done, 3, 0)
    );
    assert_eq!(
        w.read("2025/07 - Julho/IMG_1 (2).jpg").as_deref(),
        Some("foreign")
    );
    assert!(!w.root.join("cam1").exists(), "empty folders are removed");
}

#[tokio::test]
async fn organize_then_undo_restores_every_byte_and_path() {
    let w = world(&[
        ("a", "DCIM/100/IMG_1.jpg", JUL, "exif_original"),
        ("b", "DCIM/100/IMG_2.jpg", DEC, "exif_original"),
    ])
    .await;
    w.file("DCIM/100/IMG_1.AAE", "aae");
    w.file("DCIM/leia.txt", "not a photo");
    let rule = ArrangeRule {
        folders: Some("{ano}".into()),
        name: Some("{data}_{hora}".into()),
    };
    let batch = create_batch(&w.pool, &w.lib, &rule, &ArrangeScope::default())
        .await
        .unwrap();
    assert_eq!(batch.status, BatchStatus::Planned);
    assert_eq!(
        w.path_of("a").await,
        "DCIM/100/IMG_1.jpg",
        "planned is not done"
    );

    let done = run::execute(&w.pool, &batch.id).await.unwrap();
    assert_eq!((done.status, done.done), (BatchStatus::Done, 2));
    assert_eq!(w.path_of("a").await, "2025/2025-07-12_14-32-01.jpg");
    assert_eq!(w.read("2025/2025-07-12_14-32-01.jpg").as_deref(), Some("a"));
    assert_eq!(
        w.read("2025/2025-07-12_14-32-01.AAE").as_deref(),
        Some("aae")
    );
    assert!(!w.root.join("DCIM/100").exists());
    assert!(
        w.root.join("DCIM/leia.txt").is_file(),
        "other files are never touched"
    );
    let name: String = sqlx::query_scalar("SELECT filename FROM media WHERE id = 'b'")
        .fetch_one(&w.pool)
        .await
        .unwrap();
    assert_eq!(name, "2024-12-25_20-00-00.jpg");
    let ops: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM operations_log WHERE kind = 'move' AND status = 'done'",
    )
    .fetch_one(&w.pool)
    .await
    .unwrap();
    assert_eq!(ops, 2);

    let undone = run::undo(&w.pool, &batch.id).await.unwrap();
    assert_eq!((undone.status, undone.undone), (BatchStatus::Undone, 2));
    assert_eq!(w.path_of("a").await, "DCIM/100/IMG_1.jpg");
    assert_eq!(w.read("DCIM/100/IMG_1.jpg").as_deref(), Some("a"));
    assert_eq!(w.read("DCIM/100/IMG_1.AAE").as_deref(), Some("aae"));
    assert!(!w.root.join("2025").exists());
    assert!(run::undo(&w.pool, &batch.id).await.is_err(), "undone once");
}

#[tokio::test]
async fn a_disconnected_disk_pauses_and_the_batch_resumes() {
    let w = world(&[
        ("a", "x/IMG_1.jpg", JUL, "exif_original"),
        ("b", "x/IMG_2.jpg", JUL, "exif_original"),
    ])
    .await;
    let batch = create_batch(&w.pool, &w.lib, &by_month(), &ArrangeScope::default())
        .await
        .unwrap();
    // Unplugged before it starts: nothing fails, the batch waits.
    let moved_root = w.root.with_extension("away");
    std::fs::rename(&w.root, &moved_root).unwrap();
    let paused = run::execute(&w.pool, &batch.id).await.unwrap();
    assert_eq!(
        (paused.status, paused.pending, paused.failed),
        (BatchStatus::Paused, 2, 0)
    );
    assert!(paused.message.unwrap().contains("desconectado"));
    assert_eq!(
        active(&w.pool, &w.lib).await.unwrap().as_deref(),
        Some(batch.id.as_str())
    );
    // Another plan can't start meanwhile.
    assert!(
        create_batch(&w.pool, &w.lib, &by_month(), &ArrangeScope::default())
            .await
            .is_err()
    );

    std::fs::rename(&moved_root, &w.root).unwrap();
    let done = run::execute(&w.pool, &batch.id).await.unwrap();
    assert_eq!((done.status, done.done), (BatchStatus::Done, 2));
}

#[tokio::test]
async fn a_move_cut_in_half_is_settled_on_startup() {
    let w = world(&[
        ("a", "x/IMG_1.jpg", JUL, "exif_original"),
        ("b", "x/IMG_2.jpg", JUL, "exif_original"),
    ])
    .await;
    let batch = create_batch(&w.pool, &w.lib, &by_month(), &ArrangeScope::default())
        .await
        .unwrap();
    set_status(&w.pool, &batch.id, BatchStatus::Running, None)
        .await
        .unwrap();
    // The app died after moving IMG_1 on disk, before the catalog knew; and before
    // touching IMG_2 (logged, not moved).
    for (seq, id, from, to) in [
        (0, "a", "x/IMG_1.jpg", "2025/07 - Julho/IMG_1.jpg"),
        (1, "b", "x/IMG_2.jpg", "2025/07 - Julho/IMG_2.jpg"),
    ] {
        crate::trash::log_start(
            &w.pool,
            "move",
            serde_json::json!({ "batchId": batch.id, "seq": seq, "mediaId": id, "libraryId": w.lib,
                                "from": from, "to": to, "sidecars": [], "undo": false }),
        )
        .await
        .unwrap();
    }
    std::fs::create_dir_all(w.root.join("2025/07 - Julho")).unwrap();
    std::fs::rename(
        w.root.join("x/IMG_1.jpg"),
        w.root.join("2025/07 - Julho/IMG_1.jpg"),
    )
    .unwrap();

    assert_eq!(run::recover(&w.pool).await.unwrap(), 2);
    assert_eq!(w.path_of("a").await, "2025/07 - Julho/IMG_1.jpg");
    assert_eq!(w.path_of("b").await, "x/IMG_2.jpg");
    let b = get(&w.pool, &batch.id).await.unwrap();
    assert_eq!((b.status, b.done, b.pending), (BatchStatus::Paused, 1, 1));
    let done = run::execute(&w.pool, &batch.id).await.unwrap();
    assert_eq!((done.status, done.done), (BatchStatus::Done, 2));
    assert_eq!(w.read("2025/07 - Julho/IMG_2.jpg").as_deref(), Some("b"));
}

#[tokio::test]
async fn only_the_scope_moves_and_a_changed_photo_is_skipped() {
    let w = world(&[
        ("a", "x/IMG_1.jpg", JUL, "exif_original"),
        ("b", "x/IMG_2.jpg", JUL, "exif_original"),
        ("c", "x/IMG_3.jpg", JUL, "exif_original"),
    ])
    .await;
    sqlx::query("UPDATE media SET status = 'trashed' WHERE id = 'c'")
        .execute(&w.pool)
        .await
        .unwrap();
    let scope = ArrangeScope {
        media_ids: Some(vec!["a".into(), "b".into(), "c".into()]),
        ..Default::default()
    };
    let batch = create_batch(&w.pool, &w.lib, &by_month(), &scope)
        .await
        .unwrap();
    assert_eq!(batch.total, 2, "the trash never moves");
    // Renamed outside the app after the plan: left alone.
    std::fs::rename(w.root.join("x/IMG_2.jpg"), w.root.join("x/outro.jpg")).unwrap();
    sqlx::query("UPDATE media SET relative_path = 'x/outro.jpg' WHERE id = 'b'")
        .execute(&w.pool)
        .await
        .unwrap();
    let done = run::execute(&w.pool, &batch.id).await.unwrap();
    assert_eq!((done.done, done.skipped, done.failed), (1, 1, 0));
    assert_eq!(w.path_of("b").await, "x/outro.jpg");
}

#[tokio::test]
async fn rules_are_checked_before_planning() {
    let w = world(&[("a", "x/IMG_1.jpg", JUL, "exif_original")]).await;
    let bad = ArrangeRule {
        folders: Some("{ano}/{mês}".into()),
        name: None,
    };
    assert!(
        plan(&w.pool, &w.lib, &bad, &ArrangeScope::default())
            .await
            .is_err()
    );
    assert!(
        plan(
            &w.pool,
            &w.lib,
            &ArrangeRule::default(),
            &ArrangeScope::default()
        )
        .await
        .is_err()
    );
    // Already organized: nothing to confirm.
    let keep = ArrangeRule {
        folders: Some("x".into()),
        name: None,
    };
    assert!(
        create_batch(&w.pool, &w.lib, &keep, &ArrangeScope::default())
            .await
            .is_err()
    );
}
