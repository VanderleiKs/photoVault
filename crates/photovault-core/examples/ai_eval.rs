//! Phase 7a: content search and scene chips on a content-labeled folder
//! (`tests/labeled/content.py`: one subfolder per category), plus unlabeled distractors.
//!     cargo run --release -p photovault-core --example ai_eval -- <models-dir> <labeled> [distractors]
use photovault_core::ai::{self, clip::dot, index, scenes};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

/// Category folder → what a user would type.
const QUERIES: [(&str, &str, Option<&str>); 12] = [
    ("praia", "praia", Some("beach")),
    ("montanha", "montanha", Some("mountain")),
    ("cachorro", "cachorro", Some("dog")),
    ("gato", "gato", Some("cat")),
    ("comida", "comida", Some("food")),
    ("cidade-noite", "cidade à noite", Some("city_night")),
    ("flores", "flores", Some("flowers")),
    ("carro", "carro", Some("car")),
    ("por-do-sol", "pôr do sol", Some("sunset")),
    ("floresta", "floresta", Some("forest")),
    ("igreja", "interior de uma igreja", Some("church")),
    ("passaro", "pássaro", Some("bird")),
];
/// Nothing of this in the set: every hit is a false positive.
const ABSENT: [&str; 5] = [
    "bebê",
    "bicicleta",
    "festa de aniversário",
    "piscina",
    "avião",
];

fn images(dir: &Path) -> Vec<PathBuf> {
    let mut v: Vec<PathBuf> = walkdir::WalkDir::new(dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .map(|e| e.into_path())
        .filter(|p| p.extension().is_some_and(|x| x.eq_ignore_ascii_case("jpg")))
        .collect();
    v.sort();
    v
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let (models, labeled) = (Path::new(&args[1]), Path::new(&args[2]));
    assert!(
        ai::load(
            models,
            std::env::var("PV_THREADS")
                .ok()
                .and_then(|t| t.parse().ok())
        )
        .unwrap(),
        "models not installed in {models:?}"
    );
    let engine = ai::engine().unwrap();
    let mut files: Vec<(PathBuf, Option<String>)> = images(labeled)
        .into_iter()
        .map(|p| {
            let cat = p
                .parent()
                .unwrap()
                .file_name()
                .unwrap()
                .to_string_lossy()
                .to_string();
            (p, Some(cat))
        })
        .collect();
    if let Some(d) = args.get(3) {
        files.extend(images(Path::new(d)).into_iter().map(|p| (p, None)));
    }
    let t = std::time::Instant::now();
    let mut vectors = Vec::new();
    let mut model_time = std::time::Duration::ZERO;
    let batch: usize = std::env::var("PV_BATCH")
        .ok()
        .and_then(|t| t.parse().ok())
        .unwrap_or(16);
    for chunk in files.chunks(batch) {
        // As in the app: from the 1024 px preview.
        let imgs: Vec<_> = chunk
            .iter()
            .map(|(p, _)| image::open(p).unwrap().thumbnail(1024, 1024))
            .collect();
        let m = std::time::Instant::now();
        let embedded = engine.clip.embed_images(&imgs).unwrap();
        model_time += m.elapsed();
        for v in embedded {
            vectors.extend(index::decode(&index::encode(&v)).unwrap());
        }
    }
    println!(
        "{} images embedded in {:?} (resize to 224 + model: {:?}/image)",
        files.len(),
        t.elapsed(),
        model_time / files.len().max(1) as u32
    );
    let ids: Vec<String> = (0..files.len()).map(|i| i.to_string()).collect();
    let cat_of = |id: &str| files[id.parse::<usize>().unwrap()].1.clone();

    let queries: Vec<(String, Vec<f32>, &str)> = QUERIES
        .iter()
        .map(|(cat, q, _)| (cat.to_string(), embed_query(&engine, q), *q))
        .collect();
    let absent: Vec<Vec<f32>> = ABSENT.iter().map(|q| embed_query(&engine, q)).collect();
    let totals: HashMap<String, usize> =
        files
            .iter()
            .filter_map(|f| f.1.clone())
            .fold(HashMap::new(), |mut m, c| {
                *m.entry(c).or_default() += 1;
                m
            });

    // Threshold sweep (same ranking rule as the app, with other constants).
    println!("\nmin   below  precision recall  F1    false hits on absent queries");
    for min in [0.20f32, 0.22, 0.23, 0.24, 0.25, 0.26] {
        for below in [0.03f32, 0.04, 0.05, 0.06, 0.08, 1.0] {
            let (mut tp, mut fp, mut fneg) = (0, 0, 0);
            for (cat, q, _) in &queries {
                let hits = rank_with(&ids, &vectors, q, min, below);
                let good = hits
                    .iter()
                    .filter(|h| cat_of(h).as_deref() == Some(cat.as_str()))
                    .count();
                tp += good;
                fp += hits.len() - good;
                fneg += totals[cat] - good;
            }
            let absent_hits: usize = absent
                .iter()
                .map(|q| rank_with(&ids, &vectors, q, min, below).len())
                .sum();
            let p = tp as f64 / (tp + fp).max(1) as f64;
            let r = tp as f64 / (tp + fneg).max(1) as f64;
            println!(
                "{min:.2}  {below:.2}   {:5.1} %   {:5.1} %  {:.2}  {absent_hits}",
                p * 100.0,
                r * 100.0,
                2.0 * p * r / (p + r).max(1e-9)
            );
        }
    }

    println!(
        "\nWith the app's constants (min {} / below {}):",
        index::MIN_SIMILARITY,
        index::MAX_BELOW_BEST
    );
    for (cat, q, text) in &queries {
        let hits = index::rank(&ids, &vectors, q);
        let good = hits
            .iter()
            .filter(|h| cat_of(h).as_deref() == Some(cat.as_str()))
            .count();
        let wrong: Vec<String> = hits
            .iter()
            .filter(|h| cat_of(h).as_deref() != Some(cat.as_str()))
            .take(3)
            .map(|h| cat_of(h).unwrap_or_else(|| "distração".into()))
            .collect();
        println!(
            "  {text:24} {good:2}/{:2} certas, {:2} erradas {wrong:?}",
            totals[cat],
            hits.len() - good
        );
    }
    for (q, v) in ABSENT.iter().zip(&absent) {
        println!(
            "  {q:24} {} resultados (não existe no conjunto)",
            index::rank(&ids, &vectors, v).len()
        );
    }

    // Scene chips: is the expected scene among the chips?
    let (mut right, mut first, mut labeled_n, mut chipless) = (0, 0, 0, 0);
    let mut confusions: HashMap<(String, String), usize> = HashMap::new();
    for (i, (_, cat)) in files.iter().enumerate() {
        let v = &vectors[i * 512..(i + 1) * 512];
        let chips = scenes::chips(v, &engine.scenes);
        let Some(cat) = cat else { continue };
        let Some(expected) = QUERIES.iter().find(|q| q.0 == cat).and_then(|q| q.2) else {
            continue;
        };
        labeled_n += 1;
        if chips.is_empty() {
            chipless += 1;
        }
        if chips.iter().any(|c| c.value == expected) {
            right += 1;
        } else if let Some(c) = chips.first() {
            *confusions
                .entry((cat.clone(), c.value.clone()))
                .or_default() += 1;
        }
        if chips.first().is_some_and(|c| c.value == expected) {
            first += 1;
        }
    }
    println!(
        "\nScenes: expected chip present {right}/{labeled_n}, first {first}/{labeled_n}, no chip {chipless}"
    );
    let mut c: Vec<_> = confusions.into_iter().collect();
    c.sort_by_key(|x| std::cmp::Reverse(x.1));
    println!(
        "  most common misses (category → chip shown): {:?}",
        &c[..c.len().min(8)]
    );
    let _ = dot;
}

/// PV_TEMPLATE: how the typed text becomes the sentence embedded (app (default) | raw | foto | mix).
fn embed_query(engine: &ai::Engine, q: &str) -> Vec<f32> {
    match std::env::var("PV_TEMPLATE").as_deref() {
        Ok("app") | Err(_) => engine.clip.embed_text(&index::sentence(q)).unwrap(),
        Ok("foto") => engine.clip.embed_text(&format!("uma foto de {q}")).unwrap(),
        Ok("mix") => {
            let a = engine.clip.embed_text(q).unwrap();
            let b = engine.clip.embed_text(&format!("uma foto de {q}")).unwrap();
            ai::clip::normalized(a.iter().zip(&b).map(|(x, y)| x + y).collect())
        }
        Ok(_) => engine.clip.embed_text(q).unwrap(),
    }
}

fn rank_with(ids: &[String], vectors: &[f32], q: &[f32], min: f32, below: f32) -> Vec<String> {
    let mut s: Vec<(f32, usize)> = vectors
        .as_chunks::<512>()
        .0
        .iter()
        .enumerate()
        .map(|(i, v)| (dot(v, q), i))
        .collect();
    let best = s.iter().map(|x| x.0).fold(f32::MIN, f32::max);
    let floor = min.max(best - below);
    s.retain(|x| x.0 >= floor);
    s.into_iter().map(|(_, i)| ids[i].clone()).collect()
}
