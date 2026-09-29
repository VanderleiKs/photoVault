//! Trip and event detection (PRD §17). Pure: photos in, suggested groups out.
//!
//! 1. Photos split into stretches wherever more than `gap_hours` pass without one.
//! 2. "Home" is the ~20 km GPS cell photographed on the most distinct days, unless the user
//!    set their homes (distances are then to the closest one).
//!    A stretch is also split where its photos cross the away line (see `place_cuts`).
//! 3. A stretch is *away* when the median distance of its GPS photos from home exceeds
//!    `trip_min_km`; without GPS it is *unknown*.
//! 4. Consecutive away stretches (nights in between, up to `trip_join_hours`) form one
//!    trip; unknown stretches in the middle of a trip join it, at its edges they don't.
//!    A trip lasts at least two calendar days; a single away day is an event (day trip).
//! 5. Other stretches with at least `min_event_items` are events.

use crate::catalog::settings::EventSettings;
use chrono::NaiveDateTime;
use std::collections::{HashMap, HashSet};
use std::ops::Range;

#[derive(Debug, Clone)]
pub struct Shot {
    pub time: NaiveDateTime,
    pub gps: Option<(f64, f64)>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Kind {
    Trip,
    Event,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Detected {
    pub kind: Kind,
    /// Indices into the input (time order).
    pub members: Vec<usize>,
    /// Median distance from home of the photos with GPS.
    pub distance_km: Option<f64>,
}

/// Home cell size, in degrees (~22 km of latitude).
const CELL: f64 = 0.2;

pub fn meters((lat1, lon1): (f64, f64), (lat2, lon2): (f64, f64)) -> f64 {
    let (p1, p2) = (lat1.to_radians(), lat2.to_radians());
    let dp = (lat2 - lat1).to_radians();
    let dl = (lon2 - lon1).to_radians();
    let a = (dp / 2.0).sin().powi(2) + p1.cos() * p2.cos() * (dl / 2.0).sin().powi(2);
    6_371_000.0 * 2.0 * a.sqrt().asin()
}

/// Mean position of the photos in the cell photographed on the most distinct days.
pub fn home_base(shots: &[Shot]) -> Option<(f64, f64)> {
    let cell = |(lat, lon): (f64, f64)| ((lat / CELL).floor() as i64, (lon / CELL).floor() as i64);
    let mut days: HashMap<(i64, i64), HashSet<chrono::NaiveDate>> = HashMap::new();
    for s in shots {
        if let Some(gps) = s.gps {
            days.entry(cell(gps)).or_default().insert(s.time.date());
        }
    }
    let (&home, _) = days
        .iter()
        .max_by(|a, b| a.1.len().cmp(&b.1.len()).then_with(|| b.0.cmp(a.0)))?;
    let inside: Vec<(f64, f64)> = shots
        .iter()
        .filter_map(|s| s.gps)
        .filter(|&g| cell(g) == home)
        .collect();
    let n = inside.len() as f64;
    Some((
        inside.iter().map(|g| g.0).sum::<f64>() / n,
        inside.iter().map(|g| g.1).sum::<f64>() / n,
    ))
}

#[derive(Debug, Clone, Copy, PartialEq)]
enum Where {
    Home,
    Away(f64),
    Unknown,
}

struct Stretch {
    from: usize,
    to: usize, // exclusive
    place: Where,
}

/// To the closest home.
fn from_home(homes: &[(f64, f64)], g: (f64, f64)) -> f64 {
    homes.iter().map(|&h| meters(h, g)).fold(f64::MAX, f64::min)
}

fn median(mut v: Vec<f64>) -> Option<f64> {
    if v.is_empty() {
        return None;
    }
    v.sort_by(|a, b| a.total_cmp(b));
    Some(v[v.len() / 2])
}

/// Fewer GPS photos in a row than this on the other side of the away line are noise
/// (a stale position), not a departure or an arrival.
const MIN_SIDE_RUN: usize = 3;

/// Where, inside `range`, the photos cross the away line: leaving home without a long
/// gap (a party in the evening, driving at dawn) starts a new stretch. Each cut goes in the
/// largest time gap between the last GPS photo on one side and the first on the other.
fn place_cuts(
    shots: &[Shot],
    range: Range<usize>,
    homes: &[(f64, f64)],
    away_m: f64,
) -> Vec<usize> {
    struct Run {
        away: bool,
        first: usize,
        last: usize,
        len: usize,
    }
    let mut runs: Vec<Run> = Vec::new();
    for i in range {
        let Some(g) = shots[i].gps else { continue };
        let away = from_home(homes, g) > away_m;
        match runs.last_mut() {
            Some(r) if r.away == away => {
                r.last = i;
                r.len += 1;
            }
            _ => runs.push(Run {
                away,
                first: i,
                last: i,
                len: 1,
            }),
        }
    }
    let mut sides: Vec<Run> = Vec::new();
    for r in runs.into_iter().filter(|r| r.len >= MIN_SIDE_RUN) {
        match sides.last_mut() {
            Some(s) if s.away == r.away => s.last = r.last,
            _ => sides.push(r),
        }
    }
    sides
        .windows(2)
        .filter_map(|w| {
            (w[0].last + 1..=w[1].first).max_by_key(|&k| shots[k].time - shots[k - 1].time)
        })
        .collect()
}

/// `shots` must be sorted by time.
pub fn detect(shots: &[Shot], homes: &[(f64, f64)], s: &EventSettings) -> Vec<Detected> {
    if shots.is_empty() {
        return Vec::new();
    }
    let gap = chrono::Duration::hours(i64::from(s.gap_hours));
    let join = chrono::Duration::hours(i64::from(s.trip_join_hours));
    let away_m = f64::from(s.trip_min_km) * 1000.0;

    // 1. Stretches: split by long gaps, then where the photos cross the away line.
    let mut cuts = Vec::new();
    let mut from = 0;
    for i in 1..=shots.len() {
        if i == shots.len() || shots[i].time - shots[i - 1].time > gap {
            if !homes.is_empty() {
                cuts.extend(place_cuts(shots, from..i, homes, away_m));
            }
            cuts.push(i);
            from = i;
        }
    }
    let mut stretches = Vec::new();
    let mut from = 0;
    for to in cuts {
        let distance = if homes.is_empty() {
            None
        } else {
            median(
                shots[from..to]
                    .iter()
                    .filter_map(|s| s.gps)
                    .map(|g| from_home(homes, g))
                    .collect(),
            )
        };
        let place = match distance {
            Some(d) if d > away_m => Where::Away(d / 1000.0),
            Some(_) => Where::Home,
            None => Where::Unknown,
        };
        stretches.push(Stretch { from, to, place });
        from = to;
    }

    // 2. Trips: runs of away (and, inside them, unknown) stretches close in time.
    let mut out = Vec::new();
    let mut used = vec![false; stretches.len()];
    let mut i = 0;
    while i < stretches.len() {
        if !matches!(stretches[i].place, Where::Away(_)) {
            i += 1;
            continue;
        }
        let mut last_away = i;
        let mut j = i + 1;
        while j < stretches.len() {
            let close = shots[stretches[j].from].time - shots[stretches[j - 1].to - 1].time <= join;
            match stretches[j].place {
                _ if !close => break,
                Where::Home => break,
                Where::Away(_) => last_away = j,
                Where::Unknown => {}
            }
            j += 1;
        }
        let run = i..=last_away;
        let members: Vec<usize> = run
            .clone()
            .flat_map(|k| stretches[k].from..stretches[k].to)
            .collect();
        let days: HashSet<_> = members.iter().map(|&m| shots[m].time.date()).collect();
        let distance = median(
            run.clone()
                .filter_map(|k| match stretches[k].place {
                    Where::Away(d) => Some(d),
                    _ => None,
                })
                .collect(),
        );
        let kind = if days.len() >= 2 && members.len() >= s.min_trip_items as usize {
            Some(Kind::Trip)
        } else if members.len() >= s.min_event_items as usize {
            Some(Kind::Event) // a day trip
        } else {
            None
        };
        if let Some(kind) = kind {
            for k in run {
                used[k] = true;
            }
            out.push(Detected {
                kind,
                members,
                distance_km: distance,
            });
        }
        i = last_away + 1;
    }

    // 3. Events: the other stretches big enough.
    for (k, st) in stretches.iter().enumerate() {
        if !used[k] && st.to - st.from >= s.min_event_items as usize {
            out.push(Detected {
                kind: Kind::Event,
                members: (st.from..st.to).collect(),
                distance_km: match st.place {
                    Where::Away(d) => Some(d),
                    _ => None,
                },
            });
        }
    }
    out.sort_by_key(|d| d.members[0]);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    const HOME: (f64, f64) = (-30.03, -51.23); // Porto Alegre
    const GRAMADO: (f64, f64) = (-29.37, -50.87); // ~80 km
    const FLORIPA: (f64, f64) = (-27.59, -48.55); // ~380 km

    fn at(s: &str) -> NaiveDateTime {
        NaiveDateTime::parse_from_str(s, "%Y-%m-%d %H:%M").unwrap()
    }

    /// `n` photos from `start`, every `every` minutes.
    fn burst(start: &str, n: usize, every: i64, gps: Option<(f64, f64)>) -> Vec<Shot> {
        (0..n)
            .map(|i| Shot {
                time: at(start) + chrono::Duration::minutes(every * i as i64),
                gps,
            })
            .collect()
    }

    fn everyday_life() -> Vec<Shot> {
        // A few photos at home on 40 different days.
        (1..=40)
            .flat_map(|d| {
                burst(
                    &format!("2025-{:02}-{:02} 12:00", 3 + d / 28, 1 + d % 28),
                    2,
                    30,
                    Some(HOME),
                )
            })
            .collect()
    }

    fn kinds(found: &[Detected]) -> Vec<(Kind, usize)> {
        found.iter().map(|d| (d.kind, d.members.len())).collect()
    }

    #[test]
    fn trips_span_nights_and_events_are_dense_stretches() {
        let mut shots = everyday_life();
        // Trip to Florianópolis: 3 days, nights without photos, one day without GPS.
        shots.extend(burst("2025-07-10 09:00", 30, 10, Some(FLORIPA)));
        shots.extend(burst("2025-07-11 10:00", 25, 10, None));
        shots.extend(burst("2025-07-12 09:30", 20, 10, Some(FLORIPA)));
        // Birthday party at home: 40 photos in 3 h.
        shots.extend(burst("2025-08-02 19:00", 40, 4, Some(HOME)));
        // Scattered photos without GPS: nothing.
        shots.extend(burst("2025-08-20 10:00", 5, 60, None));
        shots.sort_by_key(|s| s.time);

        let home = home_base(&shots).unwrap();
        assert!(meters(home, HOME) < 1000.0);
        let found = detect(&shots, &[home], &EventSettings::default());
        assert_eq!(
            kinds(&found),
            [(Kind::Trip, 75), (Kind::Event, 40)],
            "{found:?}"
        );
        let km = found[0].distance_km.unwrap();
        assert!((300.0..450.0).contains(&km), "{km}");
    }

    #[test]
    fn short_or_near_outings_are_not_trips() {
        let mut shots = everyday_life();
        // Day trip to Gramado, ~80 km: one day → just an event.
        shots.extend(burst("2025-06-01 10:00", 30, 10, Some(GRAMADO)));
        // Day trip far away but in one day → event (a trip needs two days).
        shots.extend(burst("2025-06-15 08:00", 25, 20, Some(FLORIPA)));
        // Two far weekends a month apart → two trips, not one.
        shots.extend(burst("2025-09-06 10:00", 12, 60, Some(FLORIPA)));
        shots.extend(burst("2025-09-07 10:00", 12, 60, Some(FLORIPA)));
        shots.extend(burst("2025-10-04 10:00", 12, 60, Some(FLORIPA)));
        shots.extend(burst("2025-10-05 10:00", 12, 60, Some(FLORIPA)));
        shots.sort_by_key(|s| s.time);
        let home = home_base(&shots);
        let found = detect(&shots, home.as_slice(), &EventSettings::default());
        assert_eq!(
            kinds(&found),
            [
                (Kind::Event, 30),
                (Kind::Event, 25),
                (Kind::Trip, 24),
                (Kind::Trip, 24)
            ],
            "{found:?}"
        );
        // Beyond the "away" distance, Gramado still is a single day: an event.
        let near = EventSettings {
            trip_min_km: 30,
            ..Default::default()
        };
        assert_eq!(detect(&shots, home.as_slice(), &near)[0].kind, Kind::Event);
    }

    #[test]
    fn leaving_home_without_a_long_gap_splits_the_stretch() {
        let mut shots = everyday_life();
        // Party at home in the afternoon, driving at dawn (no 6 h gap), 2 days away.
        shots.extend(burst("2025-07-10 14:00", 25, 20, Some(HOME)));
        shots.extend(burst("2025-07-11 03:00", 30, 20, Some(FLORIPA)));
        shots.extend(burst("2025-07-11 17:00", 10, 20, None));
        shots.extend(burst("2025-07-12 08:00", 20, 20, Some(FLORIPA)));
        // Home until past midnight, then a day far away: the median said "home" and the
        // whole thing was one event at home.
        shots.extend(burst("2025-08-01 16:00", 31, 20, Some(HOME)));
        shots.extend(burst("2025-08-02 04:00", 30, 20, Some(FLORIPA)));
        shots.sort_by_key(|s| s.time);
        let home = home_base(&shots);
        let found = detect(&shots, home.as_slice(), &EventSettings::default());
        assert_eq!(
            kinds(&found),
            [
                (Kind::Event, 25),
                (Kind::Trip, 60),
                (Kind::Event, 31),
                (Kind::Event, 30)
            ],
            "{found:?}"
        );
        assert!(found[0].distance_km.is_none());
        assert!(found[3].distance_km.unwrap() > 300.0);
    }

    #[test]
    fn a_few_stray_positions_do_not_split_a_trip() {
        let mut shots = everyday_life();
        let mut trip = burst("2025-07-10 09:00", 40, 30, Some(FLORIPA));
        // Two photos with a stale position from home, in the middle of the trip.
        trip[15].gps = Some(HOME);
        trip[16].gps = Some(HOME);
        shots.extend(trip);
        shots.sort_by_key(|s| s.time);
        let home = home_base(&shots);
        let found = detect(&shots, home.as_slice(), &EventSettings::default());
        assert_eq!(kinds(&found), [(Kind::Trip, 40)], "{found:?}");
    }

    #[test]
    fn a_second_home_is_not_a_trip() {
        let mut shots = everyday_life();
        shots.extend(burst("2025-07-10 09:00", 30, 60, Some(FLORIPA)));
        shots.sort_by_key(|s| s.time);
        let home = home_base(&shots).unwrap();
        let s = EventSettings::default();
        assert_eq!(kinds(&detect(&shots, &[home], &s)), [(Kind::Trip, 30)]);
        let two = detect(&shots, &[home, FLORIPA], &s);
        assert_eq!(kinds(&two), [(Kind::Event, 30)], "{two:?}");
        assert!(two[0].distance_km.is_none());
    }

    #[test]
    fn without_gps_there_are_only_events() {
        let shots = burst("2025-01-01 10:00", 50, 5, None);
        assert_eq!(home_base(&shots), None);
        assert_eq!(
            kinds(&detect(&shots, &[], &EventSettings::default())),
            [(Kind::Event, 50)]
        );
        assert!(detect(&[], &[], &EventSettings::default()).is_empty());
    }
}
