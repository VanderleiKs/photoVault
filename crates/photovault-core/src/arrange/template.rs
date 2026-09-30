//! Folder and file name templates ("{ano}/{mes} - {mes_nome}", "{data}_{hora}"): pure.
//!
//! A token is `{name}` or `{a|b}` (the first one known: `{evento|mes}` = the event, else
//! the month). A folder segment with a token that is unknown for the photo is dropped
//! ("{ano}/{evento}" without an event = "{ano}"); a name with one keeps the original name.
//! Undated photos (and dates that only come from the file's mtime, usually a copy date)
//! go to "Sem data".

use crate::error::{Error, Result};
use chrono::{Datelike, NaiveDateTime, Timelike};

pub const UNDATED: &str = "Sem data";
/// Longest folder or file name produced (before the extension).
const MAX_SEGMENT: usize = 80;
const MONTHS: [&str; 12] = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
];

/// Tokens and what they become (for the UI help).
pub const TOKENS: [(&str, &str); 11] = [
    ("ano", "2025 (sem data: \"Sem data\")"),
    ("mes", "07"),
    ("mes_nome", "Julho"),
    ("dia", "12"),
    ("data", "2025-07-12"),
    ("hora", "14-32-01"),
    ("evento", "título da viagem ou evento aceito"),
    ("local", "cidade (GPS)"),
    ("camera", "modelo da câmera"),
    ("nome", "nome original, sem extensão"),
    ("tipo", "Fotos ou Vídeos"),
];

/// What the templates can use about one photo.
#[derive(Debug, Clone, Default)]
pub struct Facts {
    /// `None` = undated (or dated only by mtime).
    pub captured_at: Option<NaiveDateTime>,
    pub event: Option<String>,
    pub place: Option<String>,
    pub camera: Option<String>,
    /// File name without the extension.
    pub stem: String,
    pub is_video: bool,
}

fn value(token: &str, f: &Facts) -> Option<String> {
    let d = f.captured_at;
    let nonempty = |s: &Option<String>| {
        s.as_ref()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
    };
    match token {
        "ano" => Some(d.map_or_else(|| UNDATED.to_string(), |d| d.year().to_string())),
        "mes" => d.map(|d| format!("{:02}", d.month())),
        "mes_nome" => d.map(|d| MONTHS[d.month0() as usize].to_string()),
        "dia" => d.map(|d| format!("{:02}", d.day())),
        "data" => d.map(|d| d.format("%Y-%m-%d").to_string()),
        "hora" => d.map(|d| format!("{:02}-{:02}-{:02}", d.hour(), d.minute(), d.second())),
        "evento" => nonempty(&f.event),
        "local" => nonempty(&f.place),
        "camera" => nonempty(&f.camera),
        "nome" => Some(f.stem.clone()).filter(|s| !s.is_empty()),
        "tipo" => Some(if f.is_video { "Vídeos" } else { "Fotos" }.to_string()),
        _ => None,
    }
}

enum Part<'a> {
    Text(&'a str),
    Token(Vec<&'a str>),
}

fn parse(template: &str) -> Result<Vec<Part<'_>>> {
    let mut parts = Vec::new();
    let mut rest = template;
    while let Some(open) = rest.find('{') {
        if open > 0 {
            parts.push(Part::Text(&rest[..open]));
        }
        let close = rest[open..]
            .find('}')
            .ok_or_else(|| Error::InvalidInput("Falta fechar uma chave \"}\" no modelo.".into()))?;
        let names: Vec<&str> = rest[open + 1..open + close]
            .split('|')
            .map(str::trim)
            .collect();
        for n in &names {
            if !TOKENS.iter().any(|(t, _)| t == n) {
                let known = TOKENS.map(|(t, _)| format!("{{{t}}}")).join(", ");
                return Err(Error::InvalidInput(format!(
                    "\"{{{n}}}\" não existe. Use: {known}."
                )));
            }
        }
        parts.push(Part::Token(names));
        rest = &rest[open + close + 1..];
    }
    if rest.contains('}') {
        return Err(Error::InvalidInput("Há uma chave \"}\" sem abrir.".into()));
    }
    if !rest.is_empty() {
        parts.push(Part::Text(rest));
    }
    Ok(parts)
}

/// `None` = some token has no value for this photo.
fn render(template: &str, f: &Facts) -> Result<Option<String>> {
    let mut out = String::new();
    for part in parse(template)? {
        match part {
            Part::Text(t) => out.push_str(t),
            Part::Token(names) => match names.iter().find_map(|n| value(n, f)) {
                Some(v) => out.push_str(&v),
                None => return Ok(None),
            },
        }
    }
    Ok(Some(out))
}

/// Check both templates (syntax, known tokens, no escaping the library).
pub fn validate(folders: Option<&str>, name: Option<&str>) -> Result<()> {
    if let Some(t) = folders {
        parse(t)?;
        if t.split(['/', '\\']).any(|s| s.trim() == "..") {
            return Err(Error::InvalidInput(
                "O modelo de pastas não pode usar \"..\".".into(),
            ));
        }
        if t.split(['/', '\\'])
            .any(|s| s.trim().starts_with(".photovault"))
        {
            return Err(Error::InvalidInput(
                "O modelo de pastas não pode usar as pastas internas do PhotoVault.".into(),
            ));
        }
    }
    if let Some(t) = name {
        parse(t)?;
        if t.contains(['/', '\\']) {
            return Err(Error::InvalidInput(
                "O nome do arquivo não pode ter \"/\": use o modelo de pastas.".into(),
            ));
        }
        if t.trim().is_empty() {
            return Err(Error::InvalidInput("O modelo do nome está vazio.".into()));
        }
    }
    Ok(())
}

/// Folder segments for a photo (sanitized; unknown ones dropped).
pub fn folders(template: &str, f: &Facts) -> Result<Vec<String>> {
    let mut out = Vec::new();
    for segment in template.split(['/', '\\']) {
        if segment.trim().is_empty() {
            continue;
        }
        if let Some(s) = render(segment, f)?
            .map(|s| sanitize(&s))
            .filter(|s| !s.is_empty())
        {
            out.push(s);
        }
    }
    Ok(out)
}

/// New file name without extension; `None` = keep the original.
pub fn name(template: &str, f: &Facts) -> Result<Option<String>> {
    Ok(render(template, f)?
        .map(|s| sanitize(&s))
        .filter(|s| !s.is_empty()))
}

/// A valid folder/file name on Windows, macOS and Linux: no reserved characters, no
/// trailing dots or spaces, not a reserved device name, at most 80 characters.
pub fn sanitize(s: &str) -> String {
    let cleaned: String = s
        .chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '-',
            c if c.is_control() => ' ',
            c => c,
        })
        .collect();
    let mut out = cleaned.split_whitespace().collect::<Vec<_>>().join(" ");
    if out.chars().count() > MAX_SEGMENT {
        out = out.chars().take(MAX_SEGMENT).collect();
    }
    let out = out
        .trim_end_matches(['.', ' '])
        .trim_start_matches(' ')
        .to_string();
    let upper = out
        .split('.')
        .next()
        .unwrap_or_default()
        .to_ascii_uppercase();
    let reserved = matches!(upper.as_str(), "CON" | "PRN" | "AUX" | "NUL")
        || (upper.len() == 4
            && (upper.starts_with("COM") || upper.starts_with("LPT"))
            && upper.as_bytes()[3].is_ascii_digit());
    if reserved { format!("{out}_") } else { out }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn facts() -> Facts {
        Facts {
            captured_at: NaiveDateTime::parse_from_str("2025-07-12 14:32:01", "%Y-%m-%d %H:%M:%S")
                .ok(),
            event: Some("Viagem para Gramado e Canela".into()),
            place: Some("Gramado".into()),
            camera: None,
            stem: "IMG_1234".into(),
            is_video: false,
        }
    }

    #[test]
    fn folders_by_date_event_and_place() {
        let f = facts();
        assert_eq!(
            folders("{ano}/{mes} - {mes_nome}", &f).unwrap(),
            ["2025", "07 - Julho"]
        );
        assert_eq!(
            folders("{ano}/{evento}", &f).unwrap(),
            ["2025", "Viagem para Gramado e Canela"]
        );
        assert_eq!(
            folders("Fotos/{ano}/{local}", &f).unwrap(),
            ["Fotos", "2025", "Gramado"]
        );
        // Unknown for this photo: the segment goes away; alternatives fill it.
        assert_eq!(folders("{ano}/{camera}", &f).unwrap(), ["2025"]);
        assert_eq!(
            folders("{ano}/{camera|local}", &f).unwrap(),
            ["2025", "Gramado"]
        );
        let no_event = Facts {
            event: None,
            ..facts()
        };
        assert_eq!(
            folders("{ano}/{evento|mes}", &no_event).unwrap(),
            ["2025", "07"]
        );
        // Undated.
        let undated = Facts {
            captured_at: None,
            ..facts()
        };
        assert_eq!(
            folders("{ano}/{mes} - {mes_nome}", &undated).unwrap(),
            [UNDATED]
        );
    }

    #[test]
    fn names_keep_the_original_when_unknown() {
        let f = facts();
        assert_eq!(
            name("{data}_{hora}", &f).unwrap().as_deref(),
            Some("2025-07-12_14-32-01")
        );
        assert_eq!(
            name("{data} {nome}", &f).unwrap().as_deref(),
            Some("2025-07-12 IMG_1234")
        );
        let undated = Facts {
            captured_at: None,
            ..facts()
        };
        assert_eq!(name("{data}_{hora}", &undated).unwrap(), None);
    }

    #[test]
    fn bad_templates_are_explained() {
        assert!(
            validate(Some("{ano}/{mês}"), None)
                .unwrap_err()
                .to_string()
                .contains("{mês}")
        );
        assert!(validate(Some("{ano"), None).is_err());
        assert!(validate(Some("../{ano}"), None).is_err());
        assert!(validate(Some(".photovault-trash/{ano}"), None).is_err());
        assert!(validate(None, Some("{ano}/{nome}")).is_err());
        assert!(validate(Some("{ano}/{mes}"), Some("{data}_{hora}")).is_ok());
    }

    #[test]
    fn names_are_valid_everywhere() {
        assert_eq!(sanitize("Festa: 10/07?"), "Festa- 10-07-");
        assert_eq!(sanitize("  Praia...  "), "Praia");
        assert_eq!(sanitize("CON"), "CON_");
        assert_eq!(sanitize("com1.txt"), "com1.txt_");
        assert_eq!(sanitize("Comida"), "Comida");
        assert_eq!(sanitize(&"a".repeat(200)).len(), MAX_SEGMENT);
    }
}
