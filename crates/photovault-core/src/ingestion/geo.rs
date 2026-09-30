//! Offline reverse geocoding (no network): GeoNames `cities1000` (CC BY 4.0), populated
//! places with 1000+ inhabitants, without neighbourhoods. Built by
//! `data/build_cities.py` and embedded (~2.5 MB), indexed on first use.

use crate::error::Result;
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::io::Read;
use std::sync::LazyLock;

static DATA: &[u8] = include_bytes!("../../data/cities.tsv.gz");

/// Bumped when the data or the lookup changes: catalogued places are recomputed once
/// (`refresh_places`).
pub const GEOCODER_VERSION: &str = "geonames-cities1000-2026-09";
const VERSION_KEY: &str = "geocoder";
/// Farther than this from any known place (open sea): no place.
const MAX_KM: f64 = 150.0;

#[derive(Debug, Clone, PartialEq)]
pub struct Place {
    pub name: String,
    /// State/province; Brazilian states as their two-letter code ("RS").
    pub admin1: Option<String>,
    /// ISO 3166-1 alpha-2 ("BR"). The UI localizes the country name.
    pub country_code: String,
    /// Of the place (not of the photo).
    pub lat: f64,
    pub lon: f64,
}

struct City {
    name: Box<str>,
    lat: f32,
    lon: f32,
    cc: [u8; 2],
    admin: Option<u32>,
    population: u32,
}

struct Index {
    cities: Vec<City>,
    admins: Vec<Box<str>>,
    /// 1° cells → cities.
    grid: HashMap<(i16, i16), Vec<u32>>,
}

static INDEX: LazyLock<Index> = LazyLock::new(load);

fn cell(lat: f64, lon: f64) -> (i16, i16) {
    (lat.floor() as i16, lon.floor() as i16)
}

fn load() -> Index {
    let mut text = String::new();
    flate2::read::GzDecoder::new(DATA)
        .read_to_string(&mut text)
        .expect("embedded cities table");
    let mut admin_ids: HashMap<&str, u32> = HashMap::new();
    let mut admins = Vec::new();
    let mut cities = Vec::new();
    let mut grid: HashMap<(i16, i16), Vec<u32>> = HashMap::new();
    for line in text.lines() {
        let mut f = line.split('\t');
        if let Some(code) = line.strip_prefix('@') {
            let (code, name) = code.split_once('\t').unwrap_or((code, ""));
            let shown = state_code(code)
                .map(str::to_string)
                .unwrap_or_else(|| name.to_string());
            admin_ids.insert(code, admins.len() as u32);
            admins.push(shown.into_boxed_str());
            continue;
        }
        let (Some(name), Some(lat), Some(lon), Some(cc), admin, population) =
            (f.next(), f.next(), f.next(), f.next(), f.next(), f.next())
        else {
            continue;
        };
        let (Ok(lat), Ok(lon)) = (lat.parse::<f32>(), lon.parse::<f32>()) else {
            continue;
        };
        let cc_bytes = cc.as_bytes();
        if cc_bytes.len() != 2 {
            continue;
        }
        let admin = admin.and_then(|a| admin_ids.get(format!("{cc}.{a}").as_str()).copied());
        grid.entry(cell(f64::from(lat), f64::from(lon)))
            .or_default()
            .push(cities.len() as u32);
        cities.push(City {
            name: name.into(),
            lat,
            lon,
            cc: [cc_bytes[0], cc_bytes[1]],
            admin,
            population: population.and_then(|p| p.parse().ok()).unwrap_or(0),
        });
    }
    Index {
        cities,
        admins,
        grid,
    }
}

/// Brazilian states as shown on Brazilian documents ("BR.23" → "RS").
fn state_code(code: &str) -> Option<&'static str> {
    Some(match code {
        "BR.01" => "AC",
        "BR.02" => "AL",
        "BR.03" => "AP",
        "BR.04" => "AM",
        "BR.05" => "BA",
        "BR.06" => "CE",
        "BR.07" => "DF",
        "BR.08" => "ES",
        "BR.11" => "MS",
        "BR.13" => "MA",
        "BR.14" => "MT",
        "BR.15" => "MG",
        "BR.16" => "PA",
        "BR.17" => "PB",
        "BR.18" => "PR",
        "BR.20" => "PI",
        "BR.21" => "RJ",
        "BR.22" => "RN",
        "BR.23" => "RS",
        "BR.24" => "RO",
        "BR.25" => "RR",
        "BR.26" => "SC",
        "BR.27" => "SP",
        "BR.28" => "SE",
        "BR.29" => "GO",
        "BR.30" => "PE",
        "BR.31" => "TO",
        _ => return None,
    })
}

fn km(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    let (p1, p2) = (lat1.to_radians(), lat2.to_radians());
    let dp = p2 - p1;
    let dl = (lon2 - lon1).to_radians();
    let a = (dp / 2.0).sin().powi(2) + p1.cos() * p2.cos() * (dl / 2.0).sin().powi(2);
    6371.0 * 2.0 * a.sqrt().asin()
}

/// Places whose name starts with `query` (or has a word starting with it), ignoring case
/// and accents, most populous first ("sao pa" → São Paulo, São Pedro da Aldeia…).
pub fn search(query: &str, limit: usize) -> Vec<Place> {
    let q = fold(query.trim());
    if q.chars().count() < 2 {
        return Vec::new();
    }
    let index = &*INDEX;
    let mut hits: Vec<(bool, u32, &City)> = index
        .cities
        .iter()
        .filter_map(|c| {
            let name = fold(&c.name);
            if name.starts_with(&q) {
                Some((true, c.population, c))
            } else if name
                .match_indices(&q)
                .any(|(i, _)| name[..i].ends_with([' ', '-', '\'']))
            {
                Some((false, c.population, c))
            } else {
                None
            }
        })
        .collect();
    // Name matches first, then by population.
    hits.sort_by(|a, b| b.0.cmp(&a.0).then(b.1.cmp(&a.1)));
    hits.into_iter()
        .take(limit)
        .map(|(_, _, c)| Place {
            name: c.name.to_string(),
            admin1: c.admin.map(|a| index.admins[a as usize].to_string()),
            country_code: String::from_utf8_lossy(&c.cc).into_owned(),
            lat: f64::from(c.lat),
            lon: f64::from(c.lon),
        })
        .collect()
}

/// Lowercase without accents ("São" → "sao"), for matching typed names.
pub(crate) fn fold(s: &str) -> String {
    s.chars()
        .flat_map(char::to_lowercase)
        .map(|c| match c {
            'á' | 'à' | 'â' | 'ã' | 'ä' | 'å' => 'a',
            'é' | 'è' | 'ê' | 'ë' => 'e',
            'í' | 'ì' | 'î' | 'ï' => 'i',
            'ó' | 'ò' | 'ô' | 'õ' | 'ö' => 'o',
            'ú' | 'ù' | 'û' | 'ü' => 'u',
            'ç' => 'c',
            'ñ' => 'n',
            c => c,
        })
        .collect()
}

/// The place a photo taken here is "in" (within 150 km): among the places near the
/// closest one, the most populous relative to distance, so a district or village next to
/// a city doesn't stand for it, while a town where the photo was taken still wins over a
/// big city 15 km away.
pub fn nearest_place(lat: f64, lon: f64) -> Option<Place> {
    let index = &*INDEX;
    let (cy, cx) = cell(lat, lon);
    let mut near: Vec<(f64, u32)> = Vec::new();
    // Rings of 1° cells, until something is found and one ring past it (a closer city
    // can sit in the next cell).
    for ring in 0i16..=2 {
        for dy in -ring..=ring {
            for dx in -ring..=ring {
                if dy.abs() != ring && dx.abs() != ring {
                    continue;
                }
                let Some(ids) = index.grid.get(&(cy + dy, cx + dx)) else {
                    continue;
                };
                for &id in ids {
                    let c = &index.cities[id as usize];
                    near.push((km(lat, lon, f64::from(c.lat), f64::from(c.lon)), id));
                }
            }
        }
        let closest = near.iter().map(|n| n.0).fold(f64::MAX, f64::min);
        if closest < f64::from(ring) * 60.0 + 30.0 {
            break;
        }
    }
    let closest = near.iter().map(|n| n.0).fold(f64::MAX, f64::min);
    let reach = closest * 3.0 + 5.0;
    let score = |(d, id): (f64, u32)| {
        f64::from(index.cities[id as usize].population.max(1000)) / (d + 1.0).powi(3)
    };
    let best = near
        .into_iter()
        .filter(|n| n.0 <= reach)
        .max_by(|a, b| score(*a).total_cmp(&score(*b)));
    let (d, id) = best?;
    if closest > MAX_KM || d > MAX_KM {
        return None;
    }
    let c = &index.cities[id as usize];
    Some(Place {
        name: c.name.to_string(),
        admin1: c.admin.map(|a| index.admins[a as usize].to_string()),
        country_code: String::from_utf8_lossy(&c.cc).into_owned(),
        lat: f64::from(c.lat),
        lon: f64::from(c.lon),
    })
}

/// Id of `place` in `places`, inserted if new.
pub async fn place_id(conn: &mut sqlx::SqliteConnection, place: &Place) -> Result<i64> {
    sqlx::query(
        "INSERT INTO places (name, admin1, country_code, lat, lon) VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT (name, admin1, country_code) DO NOTHING",
    )
    .bind(&place.name)
    .bind(&place.admin1)
    .bind(&place.country_code)
    .bind(place.lat)
    .bind(place.lon)
    .execute(&mut *conn)
    .await?;
    Ok(sqlx::query_scalar(
        "SELECT id FROM places WHERE name = ?1 AND admin1 IS ?2 AND country_code = ?3",
    )
    .bind(&place.name)
    .bind(&place.admin1)
    .bind(&place.country_code)
    .fetch_one(&mut *conn)
    .await?)
}

/// Places of catalogs geocoded with an older table are recomputed once (all libraries
/// are marked for a new global pass). Returns whether anything was recomputed.
pub async fn refresh_places(pool: &SqlitePool) -> Result<bool> {
    let stored: Option<String> = sqlx::query_scalar("SELECT value FROM settings WHERE key = ?1")
        .bind(VERSION_KEY)
        .fetch_optional(pool)
        .await?;
    if stored.as_deref() == Some(GEOCODER_VERSION) {
        return Ok(false);
    }
    let started = std::time::Instant::now();
    let rows: Vec<(String, f64, f64, Option<i64>)> = sqlx::query_as(
        "SELECT id, gps_lat, gps_lon, place_id FROM media WHERE gps_lat IS NOT NULL AND gps_lon IS NOT NULL",
    )
    .fetch_all(pool)
    .await?;
    let located: Vec<(String, Option<Place>, Option<i64>)> =
        tokio::task::spawn_blocking(move || {
            rows.into_iter()
                .map(|(id, lat, lon, old)| (id, nearest_place(lat, lon), old))
                .collect()
        })
        .await?;
    let mut tx = pool.begin().await?;
    let mut ids: HashMap<(String, Option<String>, String), i64> = HashMap::new();
    let mut changed = 0;
    for (media, place, old) in located {
        let new = match place {
            Some(p) => {
                let key = (p.name.clone(), p.admin1.clone(), p.country_code.clone());
                match ids.get(&key) {
                    Some(&id) => Some(id),
                    None => {
                        let id = place_id(&mut tx, &p).await?;
                        ids.insert(key, id);
                        Some(id)
                    }
                }
            }
            None => None,
        };
        if new != old {
            sqlx::query("UPDATE media SET place_id = ?1 WHERE id = ?2")
                .bind(new)
                .bind(&media)
                .execute(&mut *tx)
                .await?;
            changed += 1;
        }
    }
    sqlx::query("DELETE FROM places WHERE id NOT IN (SELECT place_id FROM media WHERE place_id IS NOT NULL)")
        .execute(&mut *tx)
        .await?;
    sqlx::query("INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT (key) DO UPDATE SET value = excluded.value")
        .bind(VERSION_KEY)
        .bind(GEOCODER_VERSION)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    crate::analysis::store::mark_all_dirty(pool).await?;
    tracing::info!(
        "Places recomputed ({changed} photos changed) in {:?}",
        started.elapsed()
    );
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn search_ignores_accents_and_prefers_big_places() {
        let found = search("sao pau", 3);
        assert_eq!(found[0].name, "São Paulo", "{found:?}");
        let found = search("tramandai", 3);
        assert_eq!(
            (found[0].name.as_str(), found[0].admin1.as_deref()),
            ("Tramandaí", Some("RS"))
        );
        // A word inside the name: "Alegre" finds Porto Alegre.
        assert!(
            search("alegre", 20)
                .iter()
                .any(|p| p.name == "Porto Alegre")
        );
        assert!(search("x", 5).is_empty());
    }

    #[test]
    fn resolves_serra_gaucha_with_accents() {
        let gramado = nearest_place(-29.3789, -50.8739).unwrap();
        assert_eq!(
            (
                gramado.name.as_str(),
                gramado.admin1.as_deref(),
                gramado.country_code.as_str()
            ),
            ("Gramado", Some("RS"), "BR")
        );
        assert_eq!(nearest_place(-29.365, -50.816).unwrap().name, "Canela");
        assert_eq!(nearest_place(-29.985, -50.133).unwrap().name, "Tramandaí");
        // A capital and the big city next to it keep their own names.
        assert_eq!(
            nearest_place(-30.0277, -51.2287).unwrap().name,
            "Porto Alegre"
        );
        assert_eq!(nearest_place(-29.9178, -51.1839).unwrap().name, "Canoas");
    }

    #[test]
    fn neighbourhoods_are_not_places() {
        // Retiro, a barrio of Buenos Aires, must not stand for the city.
        let place = nearest_place(-34.5915, -58.3747).unwrap();
        assert_ne!(place.name, "Retiro", "{place:?}");
        assert_eq!(place.country_code, "AR");
    }

    #[test]
    fn resolves_abroad_and_not_at_sea() {
        let paris = nearest_place(48.8584, 2.2945).unwrap();
        assert_eq!(
            (paris.name.as_str(), paris.country_code.as_str()),
            ("Paris", "FR")
        );
        assert!(
            nearest_place(-30.0, -35.0).is_none(),
            "middle of the Atlantic"
        );
    }
}
