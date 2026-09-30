//! Time of `people::cluster` on a large synthetic library: `people` people with
//! `per_person` faces each, plus `strangers` faces of one photo each.
//!     cargo run --release -p photovault-core --example people_bench -- [people] [per_person] [strangers]
use photovault_core::ai::faces::DIM;
use photovault_core::people::cluster::{self, Input, PARAMS};
use std::collections::HashSet;

fn main() {
    let arg = |i: usize, d: usize| {
        std::env::args()
            .nth(i)
            .and_then(|a| a.parse().ok())
            .unwrap_or(d)
    };
    let (people, per_person, strangers) = (arg(1, 500), arg(2, 40), arg(3, 16_000));
    let mut seed = 42u64;
    let mut rand = move || {
        seed ^= seed << 13;
        seed ^= seed >> 7;
        seed ^= seed << 17;
        (seed % 10_000) as f32 / 5_000.0 - 1.0
    };
    let unit = |v: Vec<f32>| {
        let n = v.iter().map(|x| x * x).sum::<f32>().sqrt();
        v.into_iter().map(|x| x / n).collect::<Vec<_>>()
    };
    let mut vectors = Vec::new();
    for _ in 0..people {
        let center: Vec<f32> = unit((0..DIM).map(|_| rand()).collect());
        for _ in 0..per_person {
            let noisy: Vec<f32> = center.iter().map(|c| c + 0.06 * rand()).collect();
            vectors.extend(unit(noisy));
        }
    }
    for _ in 0..strangers {
        vectors.extend(unit((0..DIM).map(|_| rand()).collect()));
    }
    let n = vectors.len() / DIM;
    let confirmed = vec![None; n];
    let t = std::time::Instant::now();
    let out = cluster::cluster(
        &Input {
            vectors: &vectors,
            confirmed: &confirmed,
            rejected: &HashSet::new(),
        },
        &PARAMS,
    );
    println!(
        "{n} rostos → {} grupos em {:?}",
        out.groups.len(),
        t.elapsed()
    );
}
