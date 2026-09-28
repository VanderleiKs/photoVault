//! Query latency on a synthetic 50k-item catalog (PRD §26: search/filter < 100 ms).
//!
//!     cargo run --release -p photovault-core --example query_bench
use photovault_core::catalog::{
    MediaFilter, MediaQuery, MediaSort, albums, libraries, media, overview,
};
use std::time::Instant;

#[tokio::main]
async fn main() -> photovault_core::Result<()> {
    let work = std::env::temp_dir().join(format!("pv-qbench-{}", std::process::id()));
    std::fs::create_dir_all(work.join("root"))?;
    let db = photovault_core::db::open(&work.join("catalog.db"), &work.join("thumbnails")).await?;
    let pool = &db.pool;
    let lib = libraries::create(pool, "bench", work.join("root").to_str().unwrap()).await?;

    let words = [
        "praia",
        "serra",
        "aniversario",
        "natal",
        "viagem",
        "escola",
        "cachorro",
        "casamento",
    ];
    let t = Instant::now();
    let mut tx = pool.begin().await?;
    for i in 0..50_000u32 {
        let (y, m, d) = (2005 + i % 20, 1 + i % 12, 1 + i % 28);
        sqlx::query(
            "INSERT INTO media (id, library_id, relative_path, filename, extension, media_type, file_size,
                                captured_at, is_favorite, camera_model, thumb_version, indexed_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, 'jpg', ?5, ?6, ?7, ?8, ?9, 1, '', '')",
        )
        .bind(format!("{:08}-{i}", 50_000 - i))
        .bind(&lib.id)
        .bind(format!("{y}/{}/IMG_{i:05}.jpg", words[(i % 8) as usize]))
        .bind(format!("IMG_{i:05}_{}.jpg", words[(i / 8 % 8) as usize]))
        .bind(if i % 25 == 0 { "video" } else { "image" })
        .bind(i64::from(i % 5000) * 1000)
        .bind(format!("{y:04}-{m:02}-{d:02}T{:02}:00:00", i % 24))
        .bind(i % 40 == 0)
        .bind(if i % 3 == 0 { "iPhone 15 Pro" } else { "Canon EOS R6" })
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;
    println!("insert 50k: {:?}", t.elapsed());
    let smart = albums::create(
        pool,
        &lib.id,
        "Favoritas 2019",
        Some(&MediaFilter {
            year: Some(2019),
            favorite: Some(true),
            ..Default::default()
        }),
    )
    .await?;

    let f = |filter: MediaFilter, sort| MediaQuery { filter, sort };
    let cases = [
        (
            "first page, newest",
            f(MediaFilter::default(), MediaSort::Newest),
        ),
        (
            "first page, oldest",
            f(MediaFilter::default(), MediaSort::Oldest),
        ),
        (
            "first page, name",
            f(MediaFilter::default(), MediaSort::Name),
        ),
        (
            "first page, largest",
            f(MediaFilter::default(), MediaSort::Largest),
        ),
        (
            "year 2019",
            f(
                MediaFilter {
                    year: Some(2019),
                    ..Default::default()
                },
                MediaSort::Newest,
            ),
        ),
        (
            "favorites",
            f(
                MediaFilter {
                    favorite: Some(true),
                    ..Default::default()
                },
                MediaSort::Newest,
            ),
        ),
        (
            "videos + camera",
            f(
                MediaFilter {
                    media_type: Some(photovault_core::catalog::MediaType::Video),
                    camera: Some("iPhone 15 Pro".into()),
                    ..Default::default()
                },
                MediaSort::Newest,
            ),
        ),
        (
            "search 'praia'",
            f(
                MediaFilter {
                    text: Some("praia".into()),
                    ..Default::default()
                },
                MediaSort::Newest,
            ),
        ),
        (
            "search 'natal julho 2019'",
            f(
                MediaFilter {
                    text: Some("natal julho 2019".into()),
                    ..Default::default()
                },
                MediaSort::Newest,
            ),
        ),
        (
            "smart album",
            f(
                MediaFilter {
                    album_id: Some(smart.id.clone()),
                    ..Default::default()
                },
                MediaSort::Newest,
            ),
        ),
    ];
    for (label, q) in &cases {
        let t = Instant::now();
        let page = media::list(pool, &lib.id, q, None, 120).await?;
        let list_ms = t.elapsed();
        let t = Instant::now();
        let n = media::count(pool, &lib.id, &q.filter).await?;
        let count_ms = t.elapsed();
        let t = Instant::now();
        if let Some(first) = page.items.get(page.items.len() / 2) {
            media::context(pool, &first.id, q, 12).await?;
        }
        println!(
            "{label:28} list {list_ms:>10.2?}  count {count_ms:>10.2?} ({:>5})  context {:>10.2?}",
            n.total,
            t.elapsed()
        );
    }
    // Deep page: cursor far down the list.
    let mut cursor = None;
    let t = Instant::now();
    for _ in 0..100 {
        let p = media::list(
            pool,
            &lib.id,
            &MediaQuery::default(),
            cursor.as_deref(),
            500,
        )
        .await?;
        cursor = p.next_cursor;
    }
    println!("100 pages of 500 (whole library): {:?}", t.elapsed());
    let t = Instant::now();
    overview::overview(pool, &lib.id).await?;
    println!("overview: {:?}", t.elapsed());
    let t = Instant::now();
    overview::timeline(pool, &lib.id, &MediaFilter::default()).await?;
    println!("timeline buckets: {:?}", t.elapsed());
    let _ = std::fs::remove_dir_all(work);
    Ok(())
}
