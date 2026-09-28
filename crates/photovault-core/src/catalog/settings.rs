//! User preferences, stored as key/value rows in `settings`.

use crate::error::{Error, Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::SqlitePool;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Light,
    Dark,
    System,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: Theme,
    /// Library shown when the app opens.
    pub active_library_id: Option<String>,
    /// Parallel file reads during analysis (2 for USB HDDs, higher for SSDs). Used from phase 2.
    pub io_concurrency: u32,
    /// CPU workers for analysis; 0 = automatic (cores - 1). Used from phase 2.
    pub cpu_concurrency: u32,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: Theme::Light,
            active_library_id: None,
            io_concurrency: 2,
            cpu_concurrency: 0,
        }
    }
}

const KEY: &str = "app";

pub async fn get(pool: &SqlitePool) -> Result<AppSettings> {
    let raw: Option<String> = sqlx::query_scalar("SELECT value FROM settings WHERE key = ?1")
        .bind(KEY)
        .fetch_optional(pool)
        .await?;
    // Unknown/old shapes fall back to defaults instead of breaking startup.
    Ok(raw
        .and_then(|json| serde_json::from_str(&json).ok())
        .unwrap_or_default())
}

pub async fn save(pool: &SqlitePool, settings: &AppSettings) -> Result<AppSettings> {
    if !(1..=32).contains(&settings.io_concurrency) || settings.cpu_concurrency > 64 {
        return Err(Error::InvalidInput(
            "Valores de concorrência fora do intervalo.".into(),
        ));
    }
    let json = serde_json::to_string(settings).map_err(|e| Error::Internal(e.to_string()))?;
    sqlx::query(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .bind(KEY)
    .bind(json)
    .execute(pool)
    .await?;
    Ok(settings.clone())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::tests::test_db;

    #[tokio::test]
    async fn defaults_then_roundtrip() {
        let (pool, dir) = test_db().await;
        assert_eq!(get(&pool).await.unwrap(), AppSettings::default());

        let custom = AppSettings {
            theme: Theme::Dark,
            active_library_id: Some("lib".into()),
            io_concurrency: 4,
            cpu_concurrency: 3,
        };
        save(&pool, &custom).await.unwrap();
        assert_eq!(get(&pool).await.unwrap(), custom);

        let invalid = AppSettings {
            io_concurrency: 0,
            ..custom
        };
        assert!(save(&pool, &invalid).await.is_err());
        let _ = std::fs::remove_dir_all(dir);
    }
}
