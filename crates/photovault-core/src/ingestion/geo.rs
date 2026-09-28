//! Offline reverse geocoding (GeoNames cities1000 embedded; no network).

use reverse_geocoder::ReverseGeocoder;
use std::sync::LazyLock;

/// Built once (~150k cities) on first use.
static GEOCODER: LazyLock<ReverseGeocoder> = LazyLock::new(ReverseGeocoder::new);

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Place {
    pub name: String,
    /// State/province; Brazilian states as their two-letter code ("RS").
    pub admin1: Option<String>,
    /// ISO 3166-1 alpha-2 ("BR"). The UI localizes the country name.
    pub country_code: String,
}

/// Nearest known city. Small towns missing from the dataset resolve to the closest
/// larger one.
pub fn nearest_place(lat: f64, lon: f64) -> Option<Place> {
    let record = GEOCODER.search((lat, lon)).record;
    if record.name.is_empty() {
        return None;
    }
    let admin1 = Some(record.admin1.trim())
        .filter(|a| !a.is_empty())
        .map(|a| match record.cc.as_str() {
            "BR" => brazilian_state_code(a).unwrap_or(a).to_string(),
            _ => a.to_string(),
        });
    Some(Place {
        name: record.name.clone(),
        admin1,
        country_code: record.cc.clone(),
    })
}

fn brazilian_state_code(name: &str) -> Option<&'static str> {
    Some(match name {
        "Acre" => "AC",
        "Alagoas" => "AL",
        "Amapa" => "AP",
        "Amazonas" => "AM",
        "Bahia" => "BA",
        "Ceara" => "CE",
        "Federal District" => "DF",
        "Espirito Santo" => "ES",
        "Goias" => "GO",
        "Maranhao" => "MA",
        "Mato Grosso" => "MT",
        "Mato Grosso do Sul" => "MS",
        "Minas Gerais" => "MG",
        "Para" => "PA",
        "Paraiba" => "PB",
        "Parana" => "PR",
        "Pernambuco" => "PE",
        "Piaui" => "PI",
        "Rio de Janeiro" => "RJ",
        "Rio Grande do Norte" => "RN",
        "Rio Grande do Sul" => "RS",
        "Rondonia" => "RO",
        "Roraima" => "RR",
        "Santa Catarina" => "SC",
        "Sao Paulo" => "SP",
        "Sergipe" => "SE",
        "Tocantins" => "TO",
        _ => return None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_serra_gaucha() {
        // Gramado itself is not in cities1000; the nearest city is Canela.
        let place = nearest_place(-29.3789, -50.8739).unwrap();
        assert_eq!(place.admin1.as_deref(), Some("RS"));
        assert_eq!(place.country_code, "BR");
        assert!(
            ["Canela", "Gramado"].contains(&place.name.as_str()),
            "{place:?}"
        );
    }

    #[test]
    fn resolves_abroad() {
        let place = nearest_place(48.8584, 2.2945).unwrap();
        assert_eq!(place.country_code, "FR");
    }
}
