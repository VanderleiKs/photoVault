//! `pv://` custom protocol serving media to the WebView.
//!
//! - `pv://localhost/thumb/<media-id>` → 256px WebP thumbnail
//! - `pv://localhost/preview/<media-id>` → 1024px WebP (viewer fallback for HEIC/TIFF)
//! - `pv://localhost/media/<media-id>` → original file (images and videos, with `Range`)
//! - `pv://localhost/face/<face-id>` → 160px JPEG of a face, cut from the preview
//! - `pv://localhost/edit-thumb/<media-id>` / `edit-preview/<media-id>` → edited
//!   thumbnails (256 / 1024 WebP, "Melhorar fotos")
//! - `pv://localhost/edit/<media-id>?e=<edge>&before=1&s=<style>&i=<intensity>` → live
//!   preview (JPEG): the editor's draft, else the saved edit; with `s`/`i`, that
//!   automatic improvement instead (before/after grid). Never cached.
//!
//! Files are resolved **only by catalog id**; paths coming from the frontend are
//! never trusted. On Windows/Android the WebView uses `http://pv.localhost/...`,
//! which is what `convertFileSrc(path, 'pv')` produces on the frontend.

use crate::state::AppState;
use photovault_core::catalog::{media, settings};
use photovault_core::edit::{self, session::PreviewRequest};
use photovault_core::thumbnails;
use std::io::SeekFrom;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tauri::http::{HeaderValue, Request, Response, StatusCode, header};
use tauri::{AppHandle, Manager};
use tokio::io::{AsyncReadExt, AsyncSeekExt};

pub const SCHEME: &str = "pv";

/// Largest slice returned for one ranged request (the player asks for more).
const MAX_CHUNK: u64 = 4 * 1024 * 1024;

pub async fn handle(app: &AppHandle, request: &Request<Vec<u8>>) -> Response<Vec<u8>> {
    let state = app.state::<Arc<AppState>>();
    let decoded = percent_decode(request.uri().path());
    // The query arrives encoded in the path: `?v=` only busts the WebView cache; the
    // live preview reads its parameters.
    let (path, query) = decoded.split_once('?').unwrap_or((&decoded, ""));
    let range = request
        .headers()
        .get(header::RANGE)
        .and_then(|v| v.to_str().ok());

    let result = match path.trim_start_matches('/').split_once('/') {
        Some(("thumb", id)) => serve_thumbnail(&state, id, thumbnails::GRID_SIZE).await,
        Some(("preview", id)) => serve_thumbnail(&state, id, thumbnails::PREVIEW_SIZE).await,
        Some(("media", id)) => serve_media(&state, id, range).await,
        Some(("face", id)) => serve_face(&state, id).await,
        Some(("edit-thumb", id)) => serve_edit_thumbnail(&state, id, thumbnails::GRID_SIZE).await,
        Some(("edit-preview", id)) => {
            serve_edit_thumbnail(&state, id, thumbnails::PREVIEW_SIZE).await
        }
        Some(("edit", id)) => serve_edit_preview(&state, id, query).await,
        _ => Err(StatusCode::NOT_FOUND),
    };

    result.unwrap_or_else(|status| {
        Response::builder()
            .status(status)
            .body(Vec::new())
            .unwrap_or_default()
    })
}

type Served = Result<Response<Vec<u8>>, StatusCode>;

async fn serve_thumbnail(state: &AppState, id: &str, size: u32) -> Served {
    let id = parse_id(id)?;
    let path = thumbnails::path(&state.paths.thumbnails_dir, &id, size);
    let bytes = tokio::fs::read(&path).await.map_err(io_status)?;
    ok(bytes, "image/webp")
}

async fn serve_edit_thumbnail(state: &AppState, id: &str, size: u32) -> Served {
    let id = parse_id(id)?;
    let path = thumbnails::edit_path(&state.paths.thumbnails_dir, &id, size);
    let bytes = tokio::fs::read(&path).await.map_err(io_status)?;
    ok(bytes, "image/webp")
}

async fn serve_edit_preview(state: &AppState, id: &str, query: &str) -> Served {
    let id = parse_id(id)?;
    let param = |key: &str| {
        query
            .split('&')
            .filter_map(|kv| kv.split_once('='))
            .find(|(k, _)| *k == key)
            .map(|(_, v)| v)
    };
    let mut req = PreviewRequest {
        edge: param("e").and_then(|e| e.parse().ok()).unwrap_or(1024),
        before: param("before") == Some("1"),
        recipe: None,
    };
    if let Some(intensity) = param("i").and_then(|i| i.parse::<f32>().ok()) {
        // Trying an automatic improvement: the photo's own fine tuning stays.
        let mut recipe = edit::store::get(&state.pool, &id)
            .await
            .ok()
            .flatten()
            .map(|e| e.recipe)
            .unwrap_or_default();
        recipe.auto = edit::AutoOptions {
            enabled: true,
            style: param("s")
                .and_then(|s| serde_json::from_value(serde_json::Value::String(s.into())).ok())
                .unwrap_or_default(),
            intensity: intensity.clamp(0.0, 1.0),
        };
        req.recipe = Some(recipe);
    }
    let threads = settings::get(&state.pool)
        .await
        .map(|s| photovault_core::cpu::workers(s.cpu_concurrency))
        .unwrap_or(2);
    let bytes = state
        .edit
        .preview(&state.pool, &id, req, threads)
        .await
        .map_err(|e| match e {
            photovault_core::Error::MediaNotFound => StatusCode::NOT_FOUND,
            other => {
                tracing::warn!("Edit preview of {id} failed: {other}");
                StatusCode::UNPROCESSABLE_ENTITY
            }
        })?;
    let mut response = ok(bytes, "image/jpeg")?;
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    Ok(response)
}

async fn serve_face(state: &AppState, id: &str) -> Served {
    let id = parse_id(id)?;
    let (media_id, bx) = photovault_core::people::face_location(&state.pool, &id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;
    let dir = state.paths.thumbnails_dir.clone();
    let bytes =
        tokio::task::spawn_blocking(move || photovault_core::people::crop(&dir, &media_id, bx))
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
            .map_err(|_| StatusCode::NOT_FOUND)?;
    ok(bytes, "image/jpeg")
}

async fn serve_media(state: &AppState, id: &str, range: Option<&str>) -> Served {
    let id = parse_id(id)?;
    let (root, relative, _) = media::location(&state.pool, &id)
        .await
        .map_err(|e| match e {
            photovault_core::Error::MediaNotFound => StatusCode::NOT_FOUND,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        })?;
    let path = resolve_inside(Path::new(&root), &relative).ok_or(StatusCode::NOT_FOUND)?;
    let mime = mime_for(&path);
    let is_video = mime.starts_with("video/");

    // Videos are always streamed in ranges, even if the first request has none.
    match (range, is_video) {
        (None, false) => ok(tokio::fs::read(&path).await.map_err(io_status)?, mime),
        (range, _) => serve_range(&path, range.unwrap_or("bytes=0-"), mime).await,
    }
}

async fn serve_range(path: &Path, range: &str, mime: &str) -> Served {
    let mut file = tokio::fs::File::open(path).await.map_err(io_status)?;
    let size = file.metadata().await.map_err(io_status)?.len();
    let (start, end) = parse_range(range, size).ok_or(StatusCode::RANGE_NOT_SATISFIABLE)?;
    let end = end.min(start + MAX_CHUNK - 1);

    let mut buf = vec![0; (end - start + 1) as usize];
    file.seek(SeekFrom::Start(start)).await.map_err(io_status)?;
    file.read_exact(&mut buf).await.map_err(io_status)?;

    Response::builder()
        .status(StatusCode::PARTIAL_CONTENT)
        .header(header::CONTENT_TYPE, mime)
        .header(header::ACCEPT_RANGES, "bytes")
        .header(header::CONTENT_RANGE, format!("bytes {start}-{end}/{size}"))
        .header(header::CONTENT_LENGTH, buf.len())
        // The WebView draws video frames to a canvas (thumbnails): without this the
        // canvas is "tainted" by another origin and can't be read.
        .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .body(buf)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

fn ok(bytes: Vec<u8>, mime: &str) -> Served {
    let mut response = Response::new(bytes);
    let headers = response.headers_mut();
    headers.insert(
        header::CONTENT_TYPE,
        HeaderValue::from_str(mime).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
    );
    headers.insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("max-age=300"),
    );
    headers.insert(
        header::ACCESS_CONTROL_ALLOW_ORIGIN,
        HeaderValue::from_static("*"),
    );
    Ok(response)
}

fn io_status(e: std::io::Error) -> StatusCode {
    match e.kind() {
        std::io::ErrorKind::NotFound => StatusCode::NOT_FOUND,
        _ => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

/// Parse a single `bytes=start-end` / `bytes=start-` / `bytes=-suffix` range.
fn parse_range(header: &str, size: u64) -> Option<(u64, u64)> {
    if size == 0 {
        return None;
    }
    let spec = header.strip_prefix("bytes=")?.split(',').next()?.trim();
    let (start, end) = spec.split_once('-')?;
    let (start, end) = match (start.trim(), end.trim()) {
        ("", suffix) => {
            let n: u64 = suffix.parse().ok()?;
            (size.saturating_sub(n), size - 1)
        }
        (s, "") => (s.parse().ok()?, size - 1),
        (s, e) => (s.parse().ok()?, e.parse::<u64>().ok()?.min(size - 1)),
    };
    (start <= end && start < size).then_some((start, end))
}

/// Only canonical UUIDs are accepted as ids.
fn parse_id(id: &str) -> Result<String, StatusCode> {
    uuid::Uuid::parse_str(id)
        .map(|u| u.to_string())
        .map_err(|_| StatusCode::BAD_REQUEST)
}

/// Join `relative` to `root`, refusing anything that escapes the root.
fn resolve_inside(root: &Path, relative: &str) -> Option<PathBuf> {
    let root = root.canonicalize().ok()?;
    let full = root.join(relative).canonicalize().ok()?;
    full.starts_with(&root).then_some(full)
}

fn mime_for(path: &Path) -> &'static str {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .map(str::to_ascii_lowercase);
    match ext.as_deref() {
        Some("jpg" | "jpeg") => "image/jpeg",
        Some("png") => "image/png",
        Some("webp") => "image/webp",
        Some("gif") => "image/gif",
        Some("bmp") => "image/bmp",
        Some("tif" | "tiff") => "image/tiff",
        Some("heic" | "heif") => "image/heic",
        Some("mp4" | "m4v") => "video/mp4",
        Some("mov") => "video/quicktime",
        Some("webm") => "video/webm",
        Some("mkv") => "video/x-matroska",
        Some("avi") => "video/x-msvideo",
        Some("3gp") => "video/3gpp",
        _ => "application/octet-stream",
    }
}

/// Minimal percent-decoding (`convertFileSrc` encodes `/` as `%2F`).
fn percent_decode(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            let hex = std::str::from_utf8(&bytes[i + 1..i + 3]).ok();
            if let Some(byte) = hex.and_then(|h| u8::from_str_radix(h, 16).ok()) {
                out.push(byte);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_encoded_slash() {
        assert_eq!(percent_decode("/thumb%2Fabc"), "/thumb/abc");
        assert_eq!(percent_decode("/thumb/abc"), "/thumb/abc");
        assert_eq!(percent_decode("/bad%2"), "/bad%2");
    }

    #[test]
    fn rejects_non_uuid_ids() {
        assert!(parse_id("../../etc/passwd").is_err());
        assert!(parse_id("6f1c1f3e-2b7a-4c55-9d0e-3a2b1c4d5e6f").is_ok());
    }

    #[tokio::test]
    async fn serves_partial_content() {
        let path = std::env::temp_dir().join(format!("pv-range-{}.mp4", uuid::Uuid::new_v4()));
        std::fs::write(&path, b"0123456789").unwrap();

        let response = serve_range(&path, "bytes=2-5", "video/mp4").await.unwrap();
        assert_eq!(response.status(), StatusCode::PARTIAL_CONTENT);
        assert_eq!(response.headers()[header::CONTENT_RANGE], "bytes 2-5/10");
        assert_eq!(response.headers()[header::ACCEPT_RANGES], "bytes");
        assert_eq!(response.body(), b"2345");

        let open_ended = serve_range(&path, "bytes=7-", "video/mp4").await.unwrap();
        assert_eq!(open_ended.body(), b"789");

        assert_eq!(
            serve_range(&path, "bytes=50-", "video/mp4")
                .await
                .unwrap_err(),
            StatusCode::RANGE_NOT_SATISFIABLE
        );
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn parses_ranges() {
        assert_eq!(parse_range("bytes=0-", 100), Some((0, 99)));
        assert_eq!(parse_range("bytes=10-19", 100), Some((10, 19)));
        assert_eq!(parse_range("bytes=90-500", 100), Some((90, 99)));
        assert_eq!(parse_range("bytes=-10", 100), Some((90, 99)));
        assert_eq!(parse_range("bytes=100-", 100), None);
        assert_eq!(parse_range("items=0-1", 100), None);
        assert_eq!(parse_range("bytes=0-", 0), None);
    }
}
