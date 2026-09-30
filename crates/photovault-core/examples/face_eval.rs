//! Faces: detection, same/different-person similarity and grouping, on a folder laid out
//! as `<person>/<photo>` (LFW: `lfw/<Name>/<Name>_0001.jpg`). The labeled face is the one
//! nearest the center (LFW crops are centered; other people appear in the background).
//!
//! cargo run --release -p photovault-core --example face_eval -- <models> <lfw> [cache.bin]
//!
//! `PV_SCALE=0.4`: each photo is shrunk and pasted on a 1024 × 768 canvas, as a face of
//! that size (LFW faces are ~100 px) would be in a real 1024 px preview.

use photovault_core::ai::faces::{DIM, Faces};
use photovault_core::people::cluster::{self, Input, PARAMS, Params};
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::time::Instant;

/// People with at least this many photos (capped) are the "family"; the rest are
/// strangers with a single photo.
const MIN_PHOTOS: usize = 10;
const MAX_PHOTOS: usize = 30;
const STRANGERS: usize = 600;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let (models, root) = (Path::new(&args[1]), Path::new(&args[2]));
    let cache = args.get(3).map(PathBuf::from);
    let (labels, vectors) = match cache.as_ref().filter(|c| c.exists()) {
        Some(c) => load(c),
        None => {
            let (l, v) = embed_all(models, root);
            if let Some(c) = &cache {
                save(c, &l, &v);
            }
            (l, v)
        }
    };
    println!(
        "{} rostos rotulados, {} pessoas",
        labels.len(),
        labels.iter().collect::<HashSet<_>>().len()
    );
    pairs(&labels, &vectors);
    for join in [0.45, 0.50, 0.55, 0.60] {
        for merge in [join + 0.05, join + 0.10] {
            let p = Params {
                join,
                merge,
                ..PARAMS
            };
            grouping(&labels, &vectors, &p);
        }
    }
    for assign in [0.40, 0.45, 0.50, 0.55] {
        confirmed(&labels, &vectors, &Params { assign, ..PARAMS });
    }
}

fn select(root: &Path) -> Vec<(String, PathBuf)> {
    let mut people: Vec<(String, Vec<PathBuf>)> = std::fs::read_dir(root)
        .unwrap()
        .flatten()
        .filter(|e| e.path().is_dir())
        .map(|e| {
            let mut files: Vec<PathBuf> = std::fs::read_dir(e.path())
                .unwrap()
                .flatten()
                .map(|f| f.path())
                .collect();
            files.sort();
            (e.file_name().to_string_lossy().into_owned(), files)
        })
        .collect();
    people.sort();
    let mut out = Vec::new();
    let mut strangers = 0;
    for (name, files) in people {
        if files.len() >= MIN_PHOTOS {
            out.extend(
                files
                    .into_iter()
                    .take(MAX_PHOTOS)
                    .map(|f| (name.clone(), f)),
            );
        } else if files.len() == 1 && strangers < STRANGERS {
            strangers += 1;
            out.extend(files.into_iter().map(|f| (name.clone(), f)));
        }
    }
    out
}

fn embed_all(models: &Path, root: &Path) -> (Vec<String>, Vec<f32>) {
    let faces = Faces::load(models, None).unwrap();
    let chosen = select(root);
    let (mut labels, mut vectors) = (Vec::new(), Vec::new());
    let (mut missed, mut extra) = (0, 0);
    let mut sizes: Vec<f32> = Vec::new();
    let (mut t_detect, mut t_embed) = (0f64, 0f64);
    for (i, (name, path)) in chosen.iter().enumerate() {
        let img = image::open(path).unwrap().to_rgb8();
        let img = match std::env::var("PV_SCALE")
            .ok()
            .and_then(|s| s.parse::<f32>().ok())
        {
            Some(scale) => {
                let (w, h) = (
                    (img.width() as f32 * scale) as u32,
                    (img.height() as f32 * scale) as u32,
                );
                let small =
                    image::imageops::resize(&img, w, h, image::imageops::FilterType::CatmullRom);
                let mut canvas =
                    image::RgbImage::from_pixel(1024, 768, image::Rgb([120, 120, 120]));
                image::imageops::overlay(
                    &mut canvas,
                    &small,
                    i64::from((1024 - w) / 2),
                    i64::from((768 - h) / 2),
                );
                canvas
            }
            None => img,
        };
        let t = Instant::now();
        let found = faces.detect(&img).unwrap();
        t_detect += t.elapsed().as_secs_f64();
        let (cx, cy) = (img.width() as f32 / 2.0, img.height() as f32 / 2.0);
        let Some(face) = found.iter().min_by(|a, b| {
            let d = |f: &&photovault_core::ai::faces::Detection| {
                (f.x + f.w / 2.0 - cx).powi(2) + (f.y + f.h / 2.0 - cy).powi(2)
            };
            d(a).total_cmp(&d(b))
        }) else {
            missed += 1;
            continue;
        };
        extra += found.len() - 1;
        sizes.push(face.w.min(face.h));
        let t = Instant::now();
        vectors.extend(faces.embed(&img, face).unwrap());
        t_embed += t.elapsed().as_secs_f64();
        labels.push(name.clone());
        if i % 500 == 0 {
            eprintln!("{i}/{}", chosen.len());
        }
    }
    let n = chosen.len() as f64;
    sizes.sort_by(f32::total_cmp);
    if !sizes.is_empty() {
        println!(
            "tamanho do rosto (lado menor, px): mediana {:.0}",
            sizes[sizes.len() / 2]
        );
    }
    println!(
        "detecção: {}/{} fotos com rosto ({missed} sem), {extra} rostos a mais (fundo); {:.1} ms detectar, {:.1} ms vetor por rosto",
        chosen.len() - missed,
        chosen.len(),
        t_detect / n * 1000.0,
        t_embed / labels.len() as f64 * 1000.0
    );
    (labels, vectors)
}

fn dot(a: &[f32], b: &[f32]) -> f32 {
    a.iter().zip(b).map(|(x, y)| x * y).sum()
}

/// Similarity of same-person and different-person pairs; false matches per threshold.
fn pairs(labels: &[String], v: &[f32]) {
    let (mut same, mut diff) = (Vec::new(), Vec::new());
    for i in 0..labels.len() {
        for j in i + 1..labels.len() {
            let s = dot(&v[i * DIM..(i + 1) * DIM], &v[j * DIM..(j + 1) * DIM]);
            if labels[i] == labels[j] {
                same.push(s)
            } else {
                diff.push(s)
            }
        }
    }
    println!(
        "pares: {} da mesma pessoa, {} de pessoas diferentes",
        same.len(),
        diff.len()
    );
    for t in [0.30, 0.363, 0.40, 0.45, 0.50, 0.55, 0.60] {
        let tp = same.iter().filter(|&&s| s >= t).count() as f64 / same.len() as f64;
        let fp = diff.iter().filter(|&&s| s >= t).count() as f64 / diff.len() as f64;
        println!(
            "  limiar {t:.3}: mesma pessoa reconhecida {:.1} %, falsos {:.3} %",
            tp * 100.0,
            fp * 100.0
        );
    }
}

/// Pairwise precision/recall of the groups (faces outside groups pair with nobody).
fn grouping(labels: &[String], v: &[f32], p: &Params) {
    let n = labels.len();
    let confirmed = vec![None; n];
    let rejected = HashSet::new();
    let t = Instant::now();
    let out = cluster::cluster(
        &Input {
            vectors: v,
            confirmed: &confirmed,
            rejected: &rejected,
        },
        p,
    );
    let took = t.elapsed();
    report(
        labels,
        &out.groups,
        &format!("join {:.2} merge {:.2}", p.join, p.merge),
        took,
    );
}

fn report(labels: &[String], groups: &[Vec<usize>], title: &str, took: std::time::Duration) {
    let mut total: HashMap<&str, usize> = HashMap::new();
    for l in labels {
        *total.entry(l).or_default() += 1;
    }
    let family: HashSet<&str> = total
        .iter()
        .filter(|(_, n)| **n >= MIN_PHOTOS)
        .map(|(l, _)| *l)
        .collect();
    let (mut tp, mut grouped_pairs, mut mixed, mut in_groups) = (0usize, 0usize, 0, 0);
    let mut groups_per_person: HashMap<&str, usize> = HashMap::new();
    let mut stranger_faces = 0;
    for g in groups {
        let mut count: HashMap<&str, usize> = HashMap::new();
        for &i in g {
            *count.entry(&labels[i]).or_default() += 1;
        }
        let (major, m) = count
            .iter()
            .max_by_key(|(_, n)| **n)
            .map(|(l, n)| (*l, *n))
            .unwrap();
        if m * 10 < g.len() * 9 {
            mixed += 1;
        }
        *groups_per_person.entry(major).or_default() += 1;
        tp += count.values().map(|c| c * (c - 1) / 2).sum::<usize>();
        grouped_pairs += g.len() * (g.len() - 1) / 2;
        in_groups += g.len();
        stranger_faces += g
            .iter()
            .filter(|&&i| !family.contains(labels[i].as_str()))
            .count();
    }
    let true_pairs: usize = total.values().map(|c| c * (c - 1) / 2).sum();
    let found = family
        .iter()
        .filter(|p| groups_per_person.contains_key(*p))
        .count();
    let split = groups_per_person
        .iter()
        .filter(|(p, n)| family.contains(*p) && **n > 1)
        .count();
    println!(
        "{title}: {} grupos ({mixed} misturados), precisão {:.1} %, recall {:.1} %, {}/{} pessoas encontradas ({split} divididas), {:.0} % dos rostos em grupos, {stranger_faces} desconhecidos em grupos, {:?}",
        groups.len(),
        tp as f64 / grouped_pairs.max(1) as f64 * 100.0,
        tp as f64 / true_pairs.max(1) as f64 * 100.0,
        found,
        family.len(),
        in_groups as f64 / labels.len() as f64 * 100.0,
        took
    );
}

/// The user confirms 2 faces of each person; how many of the others join the right one?
fn confirmed(labels: &[String], v: &[f32], p: &Params) {
    let mut ids: HashMap<&str, u32> = HashMap::new();
    let mut seen: HashMap<&str, usize> = HashMap::new();
    let mut confirmed = vec![None; labels.len()];
    for (i, l) in labels.iter().enumerate() {
        let n = seen.entry(l).or_default();
        if *n < 2 {
            let next = ids.len() as u32;
            confirmed[i] = Some(*ids.entry(l).or_insert(next));
        }
        *n += 1;
    }
    let rejected = HashSet::new();
    let out = cluster::cluster(
        &Input {
            vectors: v,
            confirmed: &confirmed,
            rejected: &rejected,
        },
        p,
    );
    let (mut right, mut wrong, mut none) = (0, 0, 0);
    for (i, a) in out.assigned.iter().enumerate() {
        if confirmed[i].is_some() || seen[labels[i].as_str()] < 3 {
            continue;
        }
        match a {
            Some(p) if *p == ids[labels[i].as_str()] => right += 1,
            Some(_) => wrong += 1,
            None => none += 1,
        }
    }
    println!(
        "com 2 rostos confirmados por pessoa (assign {:.2}): {right} certos, {wrong} errados, {none} sem pessoa",
        p.assign
    );
}

fn save(path: &Path, labels: &[String], v: &[f32]) {
    let mut out = labels.join("\n").into_bytes();
    out.push(0);
    for x in v {
        out.extend(x.to_le_bytes());
    }
    std::fs::write(path, out).unwrap();
}

fn load(path: &Path) -> (Vec<String>, Vec<f32>) {
    let bytes = std::fs::read(path).unwrap();
    let sep = bytes.iter().position(|&b| b == 0).unwrap();
    let labels = String::from_utf8_lossy(&bytes[..sep])
        .lines()
        .map(String::from)
        .collect();
    let v = bytes[sep + 1..]
        .as_chunks::<4>()
        .0
        .iter()
        .map(|c| f32::from_le_bytes(*c))
        .collect();
    (labels, v)
}
