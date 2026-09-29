//! Precision/recall of the analysis heuristics on a labeled set (PLANO, Fase 4).
//!
//!     python3 crates/photovault-core/tests/labeled/generate.py <real-photos> <dir>
//!     cargo run --release -p photovault-core --example analysis_eval -- <dir>
use photovault_core::catalog::{MediaItem, libraries};
use photovault_core::ingestion::{ScanContext, ScanControl, ScanObserver, ScanProgress, scanner};
use photovault_core::jobs::{JobObserver, JobProgress, JobRunner};
use serde::Deserialize;
use std::collections::{BTreeSet, HashMap};
use std::sync::Arc;

/// Example category: name and which paths belong to it.
type Scenario = (&'static str, fn(&str) -> bool);

/// (path, quality flags JSON, is screenshot, is document)
type ClassRow = (String, Option<String>, Option<i64>, Option<i64>);

struct Quiet;
impl ScanObserver for Quiet {
    fn on_progress(&self, _: &ScanProgress) {}
}
impl JobObserver for Quiet {
    fn on_progress(&self, _: &JobProgress) {}
    fn on_media_updated(&self, _: Vec<MediaItem>, _: Vec<String>) {}
}

#[derive(Deserialize, Default)]
#[serde(default)]
struct Label {
    file: String,
    base: Option<u32>,
    exact_of: Option<String>,
    visual_of: Option<String>,
    screenshot: Option<bool>,
    blurry: bool,
    dark: bool,
    document: bool,
    derived: bool,
}

#[derive(Default)]
struct Score {
    tp: u32,
    fp: u32,
    fn_: u32,
    errors: Vec<String>,
}

impl Score {
    fn add(&mut self, predicted: bool, truth: bool, what: &str) {
        match (predicted, truth) {
            (true, true) => self.tp += 1,
            (true, false) => {
                self.fp += 1;
                self.errors.push(format!("FP {what}"));
            }
            (false, true) => {
                self.fn_ += 1;
                self.errors.push(format!("FN {what}"));
            }
            _ => {}
        }
    }
    fn line(&self, name: &str) -> String {
        let p = self.tp as f64 / (self.tp + self.fp).max(1) as f64;
        let r = self.tp as f64 / (self.tp + self.fn_).max(1) as f64;
        format!(
            "{name:18} precisão {:>6.1}%  recall {:>6.1}%   (VP {}, FP {}, FN {})",
            100.0 * p,
            100.0 * r,
            self.tp,
            self.fp,
            self.fn_
        )
    }
}

fn pairs(members: &[String]) -> Vec<(String, String)> {
    let mut out = Vec::new();
    for i in 0..members.len() {
        for j in i + 1..members.len() {
            let (a, b) = (&members[i], &members[j]);
            out.push(if a < b {
                (a.clone(), b.clone())
            } else {
                (b.clone(), a.clone())
            });
        }
    }
    out
}

#[tokio::main]
async fn main() -> photovault_core::Result<()> {
    let dir = std::env::args()
        .nth(1)
        .expect("usage: analysis_eval <labeled-dir>");
    let labels: Vec<Label> =
        serde_json::from_str(&std::fs::read_to_string(format!("{dir}/labels.json"))?)
            .map_err(|e| photovault_core::Error::Internal(e.to_string()))?;
    let by_file: HashMap<&str, &Label> = labels.iter().map(|l| (l.file.as_str(), l)).collect();

    let work = std::env::temp_dir().join(format!("pv-eval-{}", std::process::id()));
    std::fs::create_dir_all(&work)?;
    let db = photovault_core::db::open(&work.join("catalog.db"), &work.join("thumbnails")).await?;
    let pool = &db.pool;
    let lib = libraries::create(pool, "eval", &dir).await?;
    // Threshold sweeps: PV_EVAL_VISUAL=<pHash distance>, PV_EVAL_COLOR_MAX=<colour distance>.
    let env = |k: &str| std::env::var(k).ok();
    let mut s = photovault_core::catalog::settings::get(pool).await?;
    if let Some(d) = env("PV_EVAL_VISUAL").and_then(|v| v.parse().ok()) {
        s.analysis.visual_distance = d;
    }
    if let Some(c) = env("PV_EVAL_COLOR_MAX").and_then(|v| v.parse().ok()) {
        s.analysis.color_distance = c;
    }
    photovault_core::catalog::settings::save(pool, &s).await?;
    let ctx = ScanContext {
        pool: pool.clone(),
        control: Arc::new(ScanControl::default()),
    };
    scanner::scan(&ctx, &lib, Arc::new(Quiet)).await?;
    let t = std::time::Instant::now();
    let runner = JobRunner::new(pool.clone(), work.join("thumbnails"), Arc::new(Quiet)).await?;
    runner.drain().await?;
    println!("{} imagens analisadas em {:?}\n", labels.len(), t.elapsed());

    let groups: Vec<(String, String, String)> = sqlx::query_as(
        "SELECT g.id, g.kind, m.relative_path FROM similarity_groups g
         JOIN similarity_members s ON s.group_id = g.id JOIN media m ON m.id = s.media_id",
    )
    .fetch_all(pool)
    .await?;
    let mut members: HashMap<(String, String), Vec<String>> = HashMap::new();
    for (id, kind, path) in groups {
        members.entry((kind, id)).or_default().push(path);
    }
    let predicted = |kind: &str| -> BTreeSet<(String, String)> {
        members
            .iter()
            .filter(|((k, _), _)| k == kind)
            .flat_map(|(_, m)| pairs(m))
            .collect()
    };

    // Exact duplicates: pairs with identical bytes.
    let exact_truth: BTreeSet<(String, String)> = labels
        .iter()
        .filter_map(|l| {
            l.exact_of
                .as_ref()
                .map(|o| pairs(&[l.file.clone(), o.clone()])[0].clone())
        })
        .collect();
    let mut exact = Score::default();
    let exact_pred = predicted("exact_duplicate");
    for p in exact_pred.union(&exact_truth) {
        exact.add(
            exact_pred.contains(p),
            exact_truth.contains(p),
            &format!("{p:?}"),
        );
    }

    // Visual duplicates: same base picture (original, copies, resized/recompressed/cropped/
    // brightened versions). Pairs with heavily degraded versions (blur, dark) are not scored.
    let group_of = |f: &str| -> Option<(u32, bool)> {
        by_file.get(f).and_then(|l| l.base.map(|b| (b, l.derived)))
    };
    let visual_pred = predicted("visual_duplicate");
    let mut visual_truth = BTreeSet::new();
    let dupes: Vec<&Label> = labels
        .iter()
        .filter(|l| l.base.is_some() && !l.derived)
        .collect();
    for (i, a) in dupes.iter().enumerate() {
        for b in &dupes[i + 1..] {
            if a.base == b.base && (a.visual_of.is_some() || b.visual_of.is_some()) {
                visual_truth.insert(pairs(&[a.file.clone(), b.file.clone()])[0].clone());
            }
        }
    }
    let mut visual = Score::default();
    for p in visual_pred.union(&visual_truth) {
        let scored = matches!(
            (group_of(&p.0), group_of(&p.1)),
            (Some((_, false)), Some((_, false)))
        );
        if scored {
            visual.add(
                visual_pred.contains(p),
                visual_truth.contains(p),
                &format!("{p:?}"),
            );
        }
    }

    // Per-image classifications.
    let rows: Vec<ClassRow> = sqlx::query_as(
        "SELECT m.relative_path, q.flags,
                (SELECT 1 FROM media_labels ml JOIN labels l ON l.id = ml.label_id
                 WHERE ml.media_id = m.id AND ml.active = 1 AND l.value = 'screenshot'),
                (SELECT 1 FROM media_labels ml JOIN labels l ON l.id = ml.label_id
                 WHERE ml.media_id = m.id AND ml.active = 1 AND l.value = 'document')
         FROM media m LEFT JOIN media_quality q ON q.media_id = m.id",
    )
    .fetch_all(pool)
    .await?;
    let (mut screenshot, mut blurry, mut dark, mut document) = (
        Score::default(),
        Score::default(),
        Score::default(),
        Score::default(),
    );
    for (path, flags, is_screenshot, is_document) in rows {
        let Some(l) = by_file.get(path.as_str()) else {
            continue;
        };
        let flags = flags.unwrap_or_default();
        screenshot.add(is_screenshot.is_some(), l.screenshot == Some(true), &path);
        document.add(is_document.is_some(), l.document, &path);
        // Quality flags are scored on camera photos (bases and their blur/dark versions).
        if l.base.is_some()
            && l.visual_of.is_none()
            && l.exact_of.is_none()
            && l.screenshot.is_none()
        {
            blurry.add(flags.contains("\"blurry\""), l.blurry, &path);
            dark.add(flags.contains("\"dark\""), l.dark, &path);
        }
    }

    for (name, s) in [
        ("Duplicata exata", &exact),
        ("Duplicata visual", &visual),
        ("Screenshot", &screenshot),
        ("Borrada", &blurry),
        ("Escura", &dark),
        ("Documento", &document),
    ] {
        println!("{}", s.line(name));
    }
    println!();
    for (name, s) in [
        ("visual", &visual),
        ("screenshot", &screenshot),
        ("borrada", &blurry),
        ("escura", &dark),
        ("documento", &document),
    ] {
        for e in s.errors.iter().take(8) {
            println!("  {name}: {e}");
        }
    }
    // Examples (phase 5): give 2 photos of a kind as "remove" examples; the others of
    // that kind should come back as EXAMPLE suggestions, and nothing else.
    let scenarios: [Scenario; 4] = [
        ("Documentos", |p| p.starts_with("documentos/")),
        ("Screenshots", |p| {
            p.starts_with("Screenshot_")
                || p.starts_with("Pictures/Screenshots/")
                || p.starts_with("imagens/tela_")
        }),
        ("Escuras", |p| p.starts_with("escuras/")),
        ("Camisas", |p| p.starts_with("produtos/")),
    ];
    let paths: Vec<(String, String)> =
        sqlx::query_as("SELECT id, relative_path FROM media ORDER BY relative_path")
            .fetch_all(pool)
            .await?;
    let sim = std::env::var("PV_EVAL_EXAMPLE_SIM")
        .ok()
        .and_then(|v| v.parse().ok());
    if let Some(sim) = sim {
        let mut s = photovault_core::catalog::settings::get(pool).await?;
        s.review.example_similarity = sim;
        photovault_core::catalog::settings::save(pool, &s).await?;
    }
    if std::env::var_os("PV_EVAL_DESCRIPTOR").is_some() {
        use photovault_core::analysis::descriptor;
        let rows: Vec<(String, Vec<u8>)> = sqlx::query_as(
            "SELECT m.relative_path, q.descriptor FROM media m JOIN media_quality q ON q.media_id = m.id
             WHERE q.descriptor IS NOT NULL",
        )
        .fetch_all(pool)
        .await?;
        let rows: Vec<(String, Vec<f32>)> = rows
            .into_iter()
            .map(|(p, d)| (p, descriptor::from_bytes(&d)))
            .collect();
        for (name, of_kind) in &scenarios {
            let (mut inside, mut outside) = ([0.0; 5], [0.0; 5]);
            let (mut n_in, mut n_out) = (0.0, 0.0);
            let (mut s_in, mut s_out) = (Vec::new(), Vec::new());
            for (i, a) in rows.iter().enumerate() {
                if !of_kind(&a.0) {
                    continue;
                }
                for (j, b) in rows.iter().enumerate() {
                    if i == j {
                        continue;
                    }
                    let g = descriptor::group_distances(&a.1, &b.1);
                    let sim = descriptor::similarity(&a.1, &b.1);
                    let (acc, n, sims) = if of_kind(&b.0) {
                        (&mut inside, &mut n_in, &mut s_in)
                    } else {
                        (&mut outside, &mut n_out, &mut s_out)
                    };
                    for k in 0..5 {
                        acc[k] += g[k];
                    }
                    *n += 1.0;
                    sims.push(sim);
                }
            }
            let fmt = |acc: [f64; 5], n: f64| {
                acc.iter()
                    .map(|v| format!("{:.4}", v / n))
                    .collect::<Vec<_>>()
                    .join(" ")
            };
            let pct = |v: &mut Vec<f64>, p: f64| {
                v.sort_by(|a, b| a.total_cmp(b));
                v[((v.len() - 1) as f64 * p) as usize]
            };
            println!(
                "{name:12} tom/cor/textura/layout/tipo  dentro {}  fora {}   sim dentro p50 {:.2} p90 {:.2} | fora p90 {:.2} p99 {:.2}",
                fmt(inside, n_in),
                fmt(outside, n_out),
                pct(&mut s_in, 0.5),
                pct(&mut s_in, 0.9),
                pct(&mut s_out, 0.9),
                pct(&mut s_out, 0.99)
            );
        }
    }
    let mut example_lines = Vec::new();
    let mut example_errors = Vec::new();
    for (name, of_kind) in scenarios {
        sqlx::query("DELETE FROM review_examples")
            .execute(pool)
            .await?;
        let kind: Vec<&(String, String)> = paths.iter().filter(|(_, p)| of_kind(p)).collect();
        let chosen: Vec<String> = kind.iter().take(2).map(|(id, _)| id.clone()).collect();
        photovault_core::review::examples::add_from_media(
            pool,
            &work.join("thumbnails"),
            &chosen,
            photovault_core::review::examples::ExampleIntent::Remove,
        )
        .await?;
        runner.drain().await?;
        let suggested: BTreeSet<String> = sqlx::query_scalar(
            "SELECT m.relative_path FROM review_candidates c JOIN media m ON m.id = c.media_id
             WHERE c.reason = 'EXAMPLE' AND c.status = 'pending'",
        )
        .fetch_all(pool)
        .await?
        .into_iter()
        .collect();
        let mut score = Score::default();
        for (id, path) in &paths {
            if chosen.contains(id) {
                continue;
            }
            score.add(suggested.contains(path), of_kind(path), path);
        }
        example_lines.push(score.line(&format!("Exemplo: {name}")));
        example_errors.extend(
            score
                .errors
                .iter()
                .take(4)
                .map(|e| format!("  {name}: {e}")),
        );
    }
    sqlx::query("DELETE FROM review_examples")
        .execute(pool)
        .await?;
    println!();
    for l in &example_lines {
        println!("{l}");
    }
    for e in &example_errors {
        println!("{e}");
    }

    if std::env::var_os("PV_EVAL_COLOR").is_some() {
        // Pairs with close pHashes: colour distance of true duplicates vs. the rest.
        let rows: Vec<(String, String, Vec<u8>)> = sqlx::query_as(
            "SELECT m.relative_path, m.phash, q.color_layout FROM media m
             JOIN media_quality q ON q.media_id = m.id
             WHERE m.phash IS NOT NULL AND q.color_layout IS NOT NULL",
        )
        .fetch_all(pool)
        .await?;
        let parsed: Vec<(String, u64, Vec<u8>)> = rows
            .into_iter()
            .filter_map(|(p, h, c)| Some((p, u64::from_str_radix(&h, 16).ok()?, c)))
            .collect();
        let (mut same, mut other) = (Vec::new(), Vec::new());
        for (i, a) in parsed.iter().enumerate() {
            for b in &parsed[i + 1..] {
                let d = (a.1 ^ b.1).count_ones();
                if d > 6 {
                    continue;
                }
                let c = photovault_core::analysis::metrics::color_distance(&a.2, &b.2);
                let base = |f: &str| by_file.get(f).and_then(|l| l.base);
                let truth = base(&a.0).is_some() && base(&a.0) == base(&b.0);
                if truth { &mut same } else { &mut other }.push((c, d, a.0.clone(), b.0.clone()));
            }
        }
        for (name, v) in [("mesma foto", &mut same), ("fotos diferentes", &mut other)] {
            v.sort_by(|x, y| x.0.total_cmp(&y.0));
            println!("\ncor — {name} ({} pares com pHash ≤ 6):", v.len());
            for (c, d, a, b) in v.iter() {
                println!("  cor {c:6.2}  pHash {d}  {a}  ×  {b}");
            }
        }
    }
    if std::env::var_os("PV_EVAL_SHARPNESS").is_some() {
        let rows: Vec<(String, f64)> = sqlx::query_as(
            "SELECT m.relative_path, q.sharpness FROM media m JOIN media_quality q ON q.media_id = m.id",
        )
        .fetch_all(pool)
        .await?;
        let mut by: HashMap<String, Vec<f64>> = HashMap::new();
        for (path, sharpness) in rows {
            by.entry(path.split('/').next().unwrap().to_string())
                .or_default()
                .push(sharpness);
        }
        for (cat, mut v) in by {
            v.sort_by(|a, b| a.total_cmp(b));
            let at = |p: f64| v[((v.len() - 1) as f64 * p).round() as usize];
            println!(
                "sharpness {cat:28} min {:.3} p10 {:.3} p25 {:.3} med {:.3} max {:.3}",
                at(0.0),
                at(0.1),
                at(0.25),
                at(0.5),
                at(1.0)
            );
        }
    }
    let _ = std::fs::remove_dir_all(work);
    Ok(())
}
