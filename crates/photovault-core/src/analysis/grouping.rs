//! Duplicate, similar and burst groups of a library (PRD §11). Pure: takes the
//! library's photos and thresholds, returns groups with their best candidate.
//!
//! The four concepts never mix: an exact duplicate is not also reported as a visual
//! duplicate of itself, and "similar" never repeats a visual-duplicate pair.

use super::bktree::{BkTree, hamming};
use super::metrics::color_distance;
use crate::catalog::AnalysisSettings;
use chrono::NaiveDateTime;
use std::cmp::Ordering;
use std::collections::HashMap;

#[derive(Debug, Clone, Default)]
pub struct Candidate {
    pub id: String,
    pub sha256: Option<String>,
    pub phash: Option<u64>,
    /// `metrics::color_layout` of the preview (absent before v1.0 analyses).
    pub colors: Option<Vec<u8>>,
    pub captured_at: Option<NaiveDateTime>,
    pub camera: Option<String>,
    pub gps: Option<(f64, f64)>,
    pub pixels: u64,
    pub sharpness: Option<f64>,
    /// |brightness - 128|: lower = better exposed.
    pub exposure_error: Option<f64>,
    pub favorite: bool,
    /// Older file = more likely the original.
    pub file_mtime: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum GroupKind {
    ExactDuplicate,
    VisualDuplicate,
    Similar,
    Sequence,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Group {
    pub kind: GroupKind,
    /// Indices into the input, best candidate first.
    pub members: Vec<usize>,
    /// pHash distance of each member to the best one (0 for exact duplicates).
    pub distances: Vec<u32>,
}

/// Similar photos taken this far apart (by GPS) are different scenes.
const SIMILAR_MAX_METERS: f64 = 1_000.0;

struct UnionFind(Vec<usize>);

impl UnionFind {
    fn new(n: usize) -> Self {
        Self((0..n).collect())
    }
    fn find(&mut self, x: usize) -> usize {
        let mut root = x;
        while self.0[root] != root {
            root = self.0[root];
        }
        let mut x = x;
        while self.0[x] != root {
            let next = self.0[x];
            self.0[x] = root;
            x = next;
        }
        root
    }
    fn union(&mut self, a: usize, b: usize) {
        let (ra, rb) = (self.find(a), self.find(b));
        if ra != rb {
            self.0[ra.max(rb)] = ra.min(rb);
        }
    }
    fn components(&mut self, min_size: usize) -> Vec<Vec<usize>> {
        let mut by_root: HashMap<usize, Vec<usize>> = HashMap::new();
        for i in 0..self.0.len() {
            let root = self.find(i);
            by_root.entry(root).or_default().push(i);
        }
        let mut groups: Vec<_> = by_root
            .into_values()
            .filter(|g| g.len() >= min_size)
            .collect();
        groups.sort_by_key(|g| g[0]);
        groups
    }
}

/// Best first: resolution, then sharpness, exposure, favorite, older file (PRD §11).
fn better(a: &Candidate, b: &Candidate) -> Ordering {
    b.pixels
        .cmp(&a.pixels)
        .then_with(|| cmp_desc(a.sharpness, b.sharpness))
        .then_with(|| cmp_asc(a.exposure_error, b.exposure_error))
        .then_with(|| b.favorite.cmp(&a.favorite))
        .then_with(|| match (&a.file_mtime, &b.file_mtime) {
            (Some(x), Some(y)) => x.cmp(y),
            (Some(_), None) => Ordering::Less,
            (None, Some(_)) => Ordering::Greater,
            (None, None) => Ordering::Equal,
        })
        .then_with(|| a.id.cmp(&b.id))
}

fn cmp_desc(a: Option<f64>, b: Option<f64>) -> Ordering {
    b.unwrap_or(f64::MIN).total_cmp(&a.unwrap_or(f64::MIN))
}

fn cmp_asc(a: Option<f64>, b: Option<f64>) -> Ordering {
    a.unwrap_or(f64::MAX).total_cmp(&b.unwrap_or(f64::MAX))
}

fn finish(kind: GroupKind, mut members: Vec<usize>, items: &[Candidate]) -> Group {
    members.sort_by(|&a, &b| better(&items[a], &items[b]));
    let best = items[members[0]].phash;
    let distances = members
        .iter()
        .map(|&m| match (kind, best, items[m].phash) {
            (GroupKind::ExactDuplicate, _, _) => 0,
            (_, Some(a), Some(b)) => hamming(a, b),
            _ => 0,
        })
        .collect();
    Group {
        kind,
        members,
        distances,
    }
}

fn meters((lat1, lon1): (f64, f64), (lat2, lon2): (f64, f64)) -> f64 {
    let (p1, p2) = (lat1.to_radians(), lat2.to_radians());
    let dp = (lat2 - lat1).to_radians();
    let dl = (lon2 - lon1).to_radians();
    let a = (dp / 2.0).sin().powi(2) + p1.cos() * p2.cos() * (dl / 2.0).sin().powi(2);
    6_371_000.0 * 2.0 * a.sqrt().asin()
}

/// The pHash ignores colour: a blue and a grey shirt shot alike share it.
fn same_colors(a: &Candidate, b: &Candidate, t: &AnalysisSettings) -> bool {
    match (&a.colors, &b.colors) {
        (Some(x), Some(y)) => color_distance(x, y) <= t.color_distance,
        _ => true,
    }
}

pub fn group(items: &[Candidate], t: &AnalysisSettings) -> Vec<Group> {
    let mut groups = Vec::new();

    // 1. Exact duplicates: same bytes.
    let mut by_sha: HashMap<&str, Vec<usize>> = HashMap::new();
    for (i, c) in items.iter().enumerate() {
        if let Some(sha) = &c.sha256 {
            by_sha.entry(sha).or_default().push(i);
        }
    }
    let mut exact: Vec<Vec<usize>> = by_sha.into_values().filter(|g| g.len() > 1).collect();
    exact.sort_by_key(|g| *g.iter().min().unwrap());
    groups.extend(
        exact
            .into_iter()
            .map(|g| finish(GroupKind::ExactDuplicate, g, items)),
    );

    // 2. Visual duplicates: pHash within `visual_distance` (transitively) and the same
    // colours, with at least two different files (identical copies are reported above).
    let mut tree = BkTree::new();
    for (i, c) in items.iter().enumerate() {
        if let Some(h) = c.phash {
            tree.insert(h, i);
        }
    }
    let mut visual = UnionFind::new(items.len());
    for (i, c) in items.iter().enumerate() {
        if let Some(h) = c.phash {
            for (j, _) in tree.find(h, t.visual_distance) {
                if same_colors(&items[i], &items[j], t) {
                    visual.union(i, j);
                }
            }
        }
    }
    let visual_groups = visual.components(2);
    let mut visual_of = vec![usize::MAX; items.len()];
    for (g, members) in visual_groups.iter().enumerate() {
        for &m in members {
            visual_of[m] = g;
        }
    }
    for members in &visual_groups {
        let mut distinct: Vec<&Option<String>> =
            members.iter().map(|&m| &items[m].sha256).collect();
        distinct.sort();
        distinct.dedup();
        if distinct.len() > 1 || distinct.iter().any(|s| s.is_none()) {
            groups.push(finish(GroupKind::VisualDuplicate, members.clone(), items));
        }
    }

    // 3. Similar: same scene (pHash within `similar_distance`), close in time (and place,
    // when both have GPS), and not already visual duplicates of each other.
    let mut timed: Vec<usize> = (0..items.len())
        .filter(|&i| items[i].phash.is_some() && items[i].captured_at.is_some())
        .collect();
    timed.sort_by_key(|&i| items[i].captured_at);
    let window = chrono::Duration::minutes(i64::from(t.similar_window_minutes));
    let mut similar = UnionFind::new(items.len());
    for (k, &i) in timed.iter().enumerate() {
        let (ti, hi) = (items[i].captured_at.unwrap(), items[i].phash.unwrap());
        for &j in &timed[k + 1..] {
            if items[j].captured_at.unwrap() - ti > window {
                break;
            }
            if visual_of[i] != usize::MAX && visual_of[i] == visual_of[j] {
                continue;
            }
            let d = hamming(hi, items[j].phash.unwrap());
            let far = matches!((items[i].gps, items[j].gps), (Some(a), Some(b)) if meters(a, b) > SIMILAR_MAX_METERS);
            if d <= t.similar_distance && !far {
                similar.union(i, j);
            }
        }
    }
    groups.extend(
        similar
            .components(2)
            .into_iter()
            .map(|g| finish(GroupKind::Similar, g, items)),
    );

    // 4. Bursts: same camera, consecutive shots at most `sequence_gap_seconds` apart.
    let mut shots: Vec<usize> = (0..items.len())
        .filter(|&i| items[i].camera.is_some() && items[i].captured_at.is_some())
        .collect();
    shots.sort_by(|&a, &b| {
        (&items[a].camera, items[a].captured_at).cmp(&(&items[b].camera, items[b].captured_at))
    });
    let gap = chrono::Duration::seconds(i64::from(t.sequence_gap_seconds));
    let mut run: Vec<usize> = Vec::new();
    let flush = |run: &mut Vec<usize>, groups: &mut Vec<Group>| {
        if run.len() >= t.sequence_min_size as usize {
            groups.push(finish(GroupKind::Sequence, std::mem::take(run), items));
        }
        run.clear();
    };
    for &i in &shots {
        if let Some(&last) = run.last() {
            let same_camera = items[last].camera == items[i].camera;
            let close = items[i].captured_at.unwrap() - items[last].captured_at.unwrap() <= gap;
            // Burst shots look alike; unrelated photos with the same timestamp (camera
            // clock never set) are not a burst.
            let alike = match (items[last].phash, items[i].phash) {
                (Some(a), Some(b)) => hamming(a, b) <= t.similar_distance,
                _ => true,
            };
            if !(same_camera && close && alike) {
                flush(&mut run, &mut groups);
            }
        }
        run.push(i);
    }
    flush(&mut run, &mut groups);

    groups
}

#[cfg(test)]
mod tests {
    use super::*;

    fn at(s: &str) -> Option<NaiveDateTime> {
        Some(NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S").unwrap())
    }

    fn c(id: &str, sha: &str, phash: u64, time: &str) -> Candidate {
        Candidate {
            id: id.into(),
            sha256: Some(sha.into()),
            phash: Some(phash),
            captured_at: at(time),
            camera: Some("iPhone".into()),
            pixels: 12_000_000,
            sharpness: Some(300.0),
            exposure_error: Some(10.0),
            ..Default::default()
        }
    }

    fn ids(items: &[Candidate], g: &Group) -> Vec<String> {
        g.members.iter().map(|&m| items[m].id.clone()).collect()
    }

    fn of(groups: &[Group], kind: GroupKind) -> Vec<&Group> {
        groups.iter().filter(|g| g.kind == kind).collect()
    }

    #[test]
    fn same_shape_in_another_colour_is_not_a_duplicate() {
        let hash: u64 = 0xF0F0_F0F0_0F0F_0F0F;
        let layout = |a: i8, b: i8| -> Vec<u8> {
            (0..crate::analysis::metrics::COLOR_LAYOUT_LEN / 2)
                .flat_map(|cell| {
                    if cell % 3 == 0 {
                        [a as u8, b as u8]
                    } else {
                        [0, 0]
                    }
                })
                .collect()
        };
        let items = vec![
            Candidate {
                colors: Some(layout(-10, -40)),
                ..c("blue", "s1", hash, "2025-07-12T10:00:00")
            },
            Candidate {
                colors: Some(layout(-9, -39)),
                pixels: 3_000_000,
                ..c("blue-small", "s2", hash ^ 1, "2025-07-12T10:00:00")
            },
            Candidate {
                colors: Some(layout(0, 0)),
                ..c("grey", "s3", hash ^ 0b10, "2025-07-12T10:01:00")
            },
        ];
        let groups = group(&items, &AnalysisSettings::default());
        let visual = of(&groups, GroupKind::VisualDuplicate);
        assert_eq!(visual.len(), 1);
        assert_eq!(ids(&items, visual[0]), ["blue", "blue-small"]);
        // Same session, same framing: still "similar" (informative, not a removal reason).
        let similar = of(&groups, GroupKind::Similar);
        assert_eq!(similar.len(), 1);
        assert_eq!(similar[0].members.len(), 3, "grey with the blue shots");
    }

    #[test]
    fn four_concepts_do_not_mix() {
        let base: u64 = 0xF0F0_F0F0_0F0F_0F0F;
        let items = vec![
            // Exact copies (same bytes).
            c("a", "s1", base, "2025-07-12T10:00:00"),
            c("a-copy", "s1", base, "2025-07-12T10:00:00"),
            // Recompressed version of a: visual duplicate (distance 2).
            Candidate {
                pixels: 3_000_000,
                ..c("a-small", "s2", base ^ 0b11, "2025-07-12T10:00:00")
            },
            // Same scene, reframed 5 min later: similar (distance 9).
            c("a-reframed", "s3", base ^ 0x1FF, "2025-07-12T10:05:00"),
            // Same scene next day (distance 6 to a-reframed): not similar, outside the window.
            c(
                "next-day",
                "s4",
                base ^ 0x1FF ^ 0x3F_0000_0000,
                "2025-07-13T10:05:00",
            ),
            // Unrelated photo.
            c("other", "s5", !base, "2025-07-12T10:02:00"),
        ];
        let groups = group(&items, &AnalysisSettings::default());

        let exact = of(&groups, GroupKind::ExactDuplicate);
        assert_eq!(exact.len(), 1);
        assert_eq!(ids(&items, exact[0]).len(), 2);

        let visual = of(&groups, GroupKind::VisualDuplicate);
        assert_eq!(visual.len(), 1);
        let v = ids(&items, visual[0]);
        assert_eq!(v.len(), 3, "{v:?}");
        assert!(
            v[0].starts_with('a') && v[0] != "a-small",
            "best = full resolution"
        );
        assert_eq!(visual[0].distances[..], [0, 0, 2]);

        let similar = of(&groups, GroupKind::Similar);
        assert_eq!(similar.len(), 1, "{groups:?}");
        let s = ids(&items, similar[0]);
        assert!(
            s.contains(&"a-reframed".to_string()) && !s.contains(&"next-day".to_string()),
            "{s:?}"
        );
        assert!(!s.contains(&"other".to_string()));
    }

    #[test]
    fn gps_separates_similar_scenes() {
        let base = 0xAAAA_0000_FFFF_5555;
        let porto_alegre = Some((-30.03, -51.23));
        let gramado = Some((-29.37, -50.87));
        let items = vec![
            Candidate {
                gps: porto_alegre,
                ..c("a", "1", base, "2025-07-12T10:00:00")
            },
            Candidate {
                gps: gramado,
                ..c("b", "2", base ^ 0x3F, "2025-07-12T10:10:00")
            },
        ];
        assert!(
            of(
                &group(&items, &AnalysisSettings::default()),
                GroupKind::Similar
            )
            .is_empty()
        );
    }

    #[test]
    fn bursts_by_camera_and_gap() {
        let mut items: Vec<Candidate> = (0..5)
            .map(|i| {
                c(
                    &format!("b{i}"),
                    &format!("s{i}"),
                    (i as u64) << 40 | 0xFFFF,
                    &format!("2025-07-12T10:00:0{}", i * 2),
                )
            })
            .collect();
        items[3].sharpness = Some(900.0); // sharpest wins among equal resolutions
        // Same moment, other camera: not part of the burst.
        items.push(Candidate {
            camera: Some("Canon".into()),
            ..c("canon", "sc", 1, "2025-07-12T10:00:03")
        });
        // Same camera, 10 s later: breaks the run.
        items.push(c("late", "sl", 2, "2025-07-12T10:00:18"));
        let seq = group(&items, &AnalysisSettings::default());
        let seq = of(&seq, GroupKind::Sequence);
        assert_eq!(seq.len(), 1);
        let s = ids(&items, seq[0]);
        assert_eq!(s.len(), 5);
        assert_eq!(s[0], "b3");

        // Same timestamp and camera but unrelated pictures: not a burst.
        let mut clock_reset: Vec<Candidate> = (0..6)
            .map(|i| c(&format!("r{i}"), &format!("r{i}"), 0, "2000-01-01T00:00:00"))
            .collect();
        for (i, item) in clock_reset.iter_mut().enumerate() {
            item.phash = Some(if i % 2 == 0 {
                0x0F0F_0F0F_0F0F_0F0F
            } else {
                0xF0F0_F0F0_F0F0_F0F0
            });
        }
        assert!(
            of(
                &group(&clock_reset, &AnalysisSettings::default()),
                GroupKind::Sequence
            )
            .is_empty()
        );

        let strict = AnalysisSettings {
            sequence_min_size: 6,
            ..Default::default()
        };
        assert!(of(&group(&items, &strict), GroupKind::Sequence).is_empty());
    }

    #[test]
    fn best_candidate_tie_breaks() {
        let base = Candidate {
            pixels: 100,
            sharpness: Some(1.0),
            exposure_error: Some(5.0),
            ..Default::default()
        };
        let fav = Candidate {
            id: "fav".into(),
            favorite: true,
            ..base.clone()
        };
        let plain = Candidate {
            id: "plain".into(),
            ..base.clone()
        };
        assert_eq!(better(&fav, &plain), Ordering::Less);
        let older = Candidate {
            id: "z".into(),
            file_mtime: Some("2020".into()),
            ..base.clone()
        };
        let newer = Candidate {
            id: "a".into(),
            file_mtime: Some("2024".into()),
            ..base
        };
        assert_eq!(better(&older, &newer), Ordering::Less);
    }
}
