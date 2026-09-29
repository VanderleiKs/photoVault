//! Video thumbnails without ffmpeg: the WebView plays the video hidden, draws a frame to
//! a canvas and sends it as a JPEG; the thumbnails are made as for photos. A video the
//! WebView can't play (codec) keeps `frame_error` and the icon, and is not tried again
//! until "Reprocessar".

use super::processor;
use crate::catalog::media::{self, MediaItem};
use crate::error::{Error, Result};
use crate::thumbnails;
use sqlx::SqlitePool;
use std::path::PathBuf;

/// A captured frame is at most 1024 px; anything this big is not one.
const MAX_FRAME_BYTES: usize = 8 * 1024 * 1024;
const MAX_ERROR_LEN: usize = 300;

/// Ingested videos (SHA-256 known) still without a thumbnail, oldest first.
pub async fn pending(pool: &SqlitePool, limit: u32) -> Result<Vec<String>> {
    Ok(sqlx::query_scalar(
        "SELECT id FROM media
         WHERE media_type = 'video' AND thumb_version = 0 AND frame_error IS NULL
           AND status = 'active' AND sha256 IS NOT NULL
         ORDER BY indexed_at, id LIMIT ?1",
    )
    .bind(i64::from(limit))
    .fetch_all(pool)
    .await?)
}

/// Thumbnails from the frame; the item as it is now (new `thumbVersion`).
pub async fn store(
    pool: &SqlitePool,
    thumbnails_dir: PathBuf,
    media_id: &str,
    frame: Vec<u8>,
) -> Result<MediaItem> {
    let item = media::get(pool, media_id).await?;
    if item.media_type != media::MediaType::Video {
        return Err(Error::InvalidInput("A mídia não é um vídeo.".into()));
    }
    if frame.len() > MAX_FRAME_BYTES {
        return Err(Error::InvalidInput("Quadro grande demais.".into()));
    }
    let id = media_id.to_string();
    tokio::task::spawn_blocking(move || -> Result<()> {
        let thumbs = processor::frame_thumbnails(&frame).map_err(Error::InvalidInput)?;
        for (size, webp) in thumbs {
            thumbnails::write(&thumbnails_dir, &id, size, &webp)?;
        }
        Ok(())
    })
    .await
    .map_err(|e| Error::InvalidInput(e.to_string()))??;
    sqlx::query(
        "UPDATE media SET thumb_version = thumb_version + 1, frame_error = NULL WHERE id = ?1",
    )
    .bind(media_id)
    .execute(pool)
    .await?;
    media::get(pool, media_id).await
}

/// `data:image/jpeg;base64,…` (from `canvas.toDataURL`) → bytes.
pub fn from_data_url(url: &str) -> Result<Vec<u8>> {
    use base64::Engine;
    let data = url
        .split_once(";base64,")
        .filter(|(head, _)| head.starts_with("data:image/"))
        .map(|(_, data)| data)
        .ok_or_else(|| Error::InvalidInput("Quadro inválido.".into()))?;
    if data.len() > MAX_FRAME_BYTES * 4 / 3 + 4 {
        return Err(Error::InvalidInput("Quadro grande demais.".into()));
    }
    base64::engine::general_purpose::STANDARD
        .decode(data)
        .map_err(|_| Error::InvalidInput("Quadro inválido.".into()))
}

/// The WebView could not play it: keep the icon, don't try again.
pub async fn fail(pool: &SqlitePool, media_id: &str, reason: &str) -> Result<()> {
    let reason: String = reason.chars().take(MAX_ERROR_LEN).collect();
    let reason = if reason.trim().is_empty() {
        "Formato de vídeo não suportado.".to_string()
    } else {
        reason
    };
    sqlx::query("UPDATE media SET frame_error = ?1 WHERE id = ?2 AND media_type = 'video'")
        .bind(reason)
        .bind(media_id)
        .execute(pool)
        .await?;
    Ok(())
}

/// "Reprocessar": failed captures are tried again (a codec may have been installed).
pub async fn retry_failed(pool: &SqlitePool) -> Result<u64> {
    Ok(
        sqlx::query("UPDATE media SET frame_error = NULL WHERE frame_error IS NOT NULL")
            .execute(pool)
            .await?
            .rows_affected(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::catalog::libraries;
    use crate::db::tests::test_db;
    use image::{ImageFormat, RgbImage};
    use std::io::Cursor;

    fn jpeg(w: u32, h: u32) -> Vec<u8> {
        let img = RgbImage::from_fn(w, h, |x, y| {
            image::Rgb([(x % 256) as u8, (y % 256) as u8, 90])
        });
        let mut out = Cursor::new(Vec::new());
        img.write_to(&mut out, ImageFormat::Jpeg).unwrap();
        out.into_inner()
    }

    #[tokio::test]
    async fn frames_become_thumbnails_and_failures_are_not_retried() {
        let (pool, dir) = test_db().await;
        let lib = libraries::create(&pool, "A", dir.to_str().unwrap())
            .await
            .unwrap()
            .id;
        for (id, kind, sha) in [
            ("v1", "video", Some("x")),
            ("v2", "video", Some("y")),
            ("v3", "video", None), // not ingested yet
            ("p1", "image", Some("z")),
        ] {
            sqlx::query(
                "INSERT INTO media (id, library_id, relative_path, filename, extension, media_type,
                                    file_size, sha256, indexed_at, updated_at)
                 VALUES (?1, ?2, ?1, ?1, 'mp4', ?3, 1, ?4, 'now', 'now')",
            )
            .bind(id)
            .bind(&lib)
            .bind(kind)
            .bind(sha)
            .execute(&pool)
            .await
            .unwrap();
        }
        assert_eq!(pending(&pool, 10).await.unwrap(), ["v1", "v2"]);

        let thumbs = dir.join("thumbs");
        use base64::Engine;
        let url = format!(
            "data:image/jpeg;base64,{}",
            base64::engine::general_purpose::STANDARD.encode(jpeg(1280, 720))
        );
        let item = store(&pool, thumbs.clone(), "v1", from_data_url(&url).unwrap())
            .await
            .unwrap();
        assert_eq!(item.thumb_version, 1);
        for size in thumbnails::SIZES {
            assert!(thumbnails::path(&thumbs, "v1", size).exists());
        }
        assert!(
            store(&pool, thumbs.clone(), "p1", jpeg(10, 10))
                .await
                .is_err()
        );
        assert!(
            store(&pool, thumbs.clone(), "v2", b"not an image".to_vec())
                .await
                .is_err()
        );

        assert!(from_data_url("data:text/html;base64,AAAA").is_err());
        fail(&pool, "v2", "MEDIA_ERR_SRC_NOT_SUPPORTED")
            .await
            .unwrap();
        assert!(pending(&pool, 10).await.unwrap().is_empty());
        assert_eq!(retry_failed(&pool).await.unwrap(), 1);
        assert_eq!(pending(&pool, 10).await.unwrap(), ["v2"]);
    }
}
