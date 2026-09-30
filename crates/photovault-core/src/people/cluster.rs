//! Grouping faces into people (pure; `people::rebuild` loads and stores). The user's
//! decisions come first: faces they confirmed are anchors, and other faces join an
//! anchored person when close enough to its confirmed faces. What is left is grouped by
//! "leader" clustering (each face joins the nearest group centroid or starts one), then
//! groups whose centroids are close are merged. Splitting a person in two is a small
//! annoyance (the user merges them); mixing two people is worse, so thresholds lean strict.

use crate::ai::faces::DIM;
use std::collections::HashSet;

#[derive(Debug, Clone, Copy)]
pub struct Params {
    /// Mean similarity to the closest confirmed faces of a person to join it.
    pub assign: f32,
    /// Similarity to a group centroid to join the group.
    pub join: f32,
    /// Similarity between two group centroids to merge them.
    pub merge: f32,
    /// Smallest group that becomes a (suggested) person.
    pub min_faces: usize,
}

/// Measured with `face_eval` on LFW (3 574 faces: 158 people with 10–30 photos + 600
/// strangers): join 0.55 / merge 0.60 = 158 groups, none mixed, pair precision 99.9 %,
/// recall 98.5 % (merge 0.50 mixed 3 groups). Assign 0.50 with 2 confirmed faces per
/// person: 97.2 % right, 0.5 % wrong.
pub const PARAMS: Params = Params {
    assign: 0.50,
    join: 0.55,
    merge: 0.60,
    min_faces: 3,
};

/// Confirmed faces compared per person (the closest ones: a person changes with age).
const TOP_K: usize = 3;

pub struct Input<'a> {
    /// `n × DIM` unit vectors, in the order faces should be considered (best first).
    pub vectors: &'a [f32],
    /// Per face: the person (index) the user put it in.
    pub confirmed: &'a [Option<u32>],
    /// (face, person) pairs the user said are wrong.
    pub rejected: &'a HashSet<(usize, u32)>,
}

#[derive(Debug, Default, PartialEq)]
pub struct Output {
    /// Per face without confirmation: the anchored person it joins.
    pub assigned: Vec<Option<u32>>,
    /// New groups of the remaining faces (indexes), largest first; `min_faces` or more.
    pub groups: Vec<Vec<usize>>,
}

fn dot(a: &[f32], b: &[f32]) -> f32 {
    a.iter().zip(b).map(|(x, y)| x * y).sum()
}

fn vector(vectors: &[f32], i: usize) -> &[f32] {
    &vectors[i * DIM..(i + 1) * DIM]
}

pub fn cluster(input: &Input, p: &Params) -> Output {
    let n = input.confirmed.len().min(input.vectors.len() / DIM);
    let mut assigned = vec![None; n];

    // 1. Faces near the confirmed faces of a person.
    let mut anchors: Vec<(u32, Vec<usize>)> = Vec::new();
    for (i, c) in input.confirmed.iter().enumerate().take(n) {
        if let Some(person) = *c {
            match anchors.iter_mut().find(|(p, _)| *p == person) {
                Some((_, faces)) => faces.push(i),
                None => anchors.push((person, vec![i])),
            }
        }
    }
    let mut free = Vec::new();
    for (i, slot) in assigned.iter_mut().enumerate() {
        if input.confirmed[i].is_some() {
            continue;
        }
        let v = vector(input.vectors, i);
        let best = anchors
            .iter()
            .filter(|(person, _)| !input.rejected.contains(&(i, *person)))
            .map(|(person, faces)| {
                let mut sims: Vec<f32> = faces
                    .iter()
                    .map(|&f| dot(v, vector(input.vectors, f)))
                    .collect();
                sims.sort_by(|a, b| b.total_cmp(a));
                sims.truncate(TOP_K);
                (*person, sims.iter().sum::<f32>() / sims.len() as f32)
            })
            .max_by(|a, b| a.1.total_cmp(&b.1));
        match best {
            Some((person, score)) if score >= p.assign => *slot = Some(person),
            _ => free.push(i),
        }
    }

    // 2. Leader clustering of the rest.
    let mut sums: Vec<Vec<f32>> = Vec::new();
    let mut centroids: Vec<Vec<f32>> = Vec::new();
    let mut members: Vec<Vec<usize>> = Vec::new();
    for &i in &free {
        let v = vector(input.vectors, i);
        let best = centroids
            .iter()
            .enumerate()
            .map(|(g, c)| (g, dot(v, c)))
            .max_by(|a, b| a.1.total_cmp(&b.1));
        match best {
            Some((g, s)) if s >= p.join => {
                members[g].push(i);
                sums[g].iter_mut().zip(v).for_each(|(a, b)| *a += b);
                centroids[g] = unit(&sums[g]);
            }
            _ => {
                sums.push(v.to_vec());
                centroids.push(v.to_vec());
                members.push(vec![i]);
            }
        }
    }

    // 3. Merge groups whose centroids are close (only groups of 2+: singletons were
    // already compared with every centroid when they arrived).
    let mut alive: Vec<bool> = members.iter().map(|m| !m.is_empty()).collect();
    loop {
        let mut best: Option<(usize, usize, f32)> = None;
        for a in 0..members.len() {
            if !alive[a] || members[a].len() < 2 {
                continue;
            }
            for b in a + 1..members.len() {
                if !alive[b] || members[b].len() < 2 {
                    continue;
                }
                let s = dot(&centroids[a], &centroids[b]);
                if s >= p.merge && best.is_none_or(|(_, _, bs)| s > bs) {
                    best = Some((a, b, s));
                }
            }
        }
        let Some((a, b, _)) = best else { break };
        let moved = std::mem::take(&mut members[b]);
        members[a].extend(moved);
        let sb = std::mem::take(&mut sums[b]);
        sums[a].iter_mut().zip(&sb).for_each(|(x, y)| *x += y);
        centroids[a] = unit(&sums[a]);
        alive[b] = false;
    }

    let mut groups: Vec<Vec<usize>> = members
        .into_iter()
        .filter(|m| m.len() >= p.min_faces)
        .map(|mut m| {
            m.sort_unstable();
            m
        })
        .collect();
    groups.sort_by(|a, b| b.len().cmp(&a.len()).then(a[0].cmp(&b[0])));
    Output { assigned, groups }
}

fn unit(v: &[f32]) -> Vec<f32> {
    let n = v.iter().map(|x| x * x).sum::<f32>().sqrt().max(1e-9);
    v.iter().map(|x| x / n).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Unit vector near axis `axis`, nudged along `jitter` so faces aren't identical.
    fn face(axis: usize, jitter: usize, amount: f32) -> Vec<f32> {
        let mut v = vec![0f32; DIM];
        v[axis] = 1.0;
        v[jitter] += amount;
        unit(&v)
    }

    fn run(faces: &[Vec<f32>], confirmed: &[Option<u32>], rejected: &[(usize, u32)]) -> Output {
        let vectors: Vec<f32> = faces.concat();
        let rejected: HashSet<_> = rejected.iter().copied().collect();
        cluster(
            &Input {
                vectors: &vectors,
                confirmed,
                rejected: &rejected,
            },
            &PARAMS,
        )
    }

    #[test]
    fn groups_people_and_leaves_strangers_out() {
        // Three faces of A (axis 0), four of B (axis 1), one stranger (axis 2).
        let faces = vec![
            face(0, 10, 0.3),
            face(1, 11, 0.2),
            face(0, 12, 0.4),
            face(1, 13, 0.3),
            face(2, 14, 0.1),
            face(0, 15, 0.2),
            face(1, 16, 0.4),
            face(1, 17, 0.1),
        ];
        let out = run(&faces, &[None; 8], &[]);
        assert_eq!(out.groups, vec![vec![1, 3, 6, 7], vec![0, 2, 5]]);
        assert!(out.assigned.iter().all(Option::is_none));
    }

    #[test]
    fn confirmed_faces_attract_and_rejections_are_respected() {
        let faces = vec![
            face(0, 10, 0.2), // confirmed as person 7
            face(0, 11, 0.3), // joins 7
            face(0, 12, 0.3), // rejected for 7: free (alone, no group)
            face(1, 13, 0.2), // someone else
        ];
        let out = run(&faces, &[Some(7), None, None, None], &[(2, 7)]);
        assert_eq!(out.assigned, vec![None, Some(7), None, None]);
        assert!(out.groups.is_empty());
    }

    #[test]
    fn small_groups_stay_unnamed_faces() {
        let faces = vec![face(0, 10, 0.2), face(0, 11, 0.3)];
        assert!(run(&faces, &[None, None], &[]).groups.is_empty());
    }
}
