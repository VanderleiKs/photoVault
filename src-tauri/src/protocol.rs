//! `pv://` custom protocol serving images to the WebView.
//!
//! - `pv://localhost/thumb/<photo-id>` → 256px WebP thumbnail
//! - `pv://localhost/media/<photo-id>` → original image
//!
//! Files are resolved **only by catalog id**; paths coming from the frontend are
//! never trusted. On Windows/Android the WebView uses `http://pv.localhost/...`,
//! which is what `convertFileSrc(path, 'pv')` produces on the frontend.

use crate::app::AppState;
use crate::catalog;
use crate::thumbnails;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tauri::http::{Request, Response, StatusCode, header};
use tauri::{AppHandle, Manager};

pub const SCHEME: &str = "pv";

pub async fn handle(app: &AppHandle, request: &Request<Vec<u8>>) -> Response<Vec<u8>> {
    let state = app.state::<Arc<AppState>>();
    let path = percent_decode(request.uri().path());

    let result = match path.trim_start_matches('/').split_once('/') {
        Some(("thumb", id)) => serve_thumbnail(&state, id).await,
        Some(("media", id)) => serve_media(&state, id).await,
        _ => Err(StatusCode::NOT_FOUND),
    };

    match result {
        Ok((bytes, mime)) => Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, mime)
            .header(header::CACHE_CONTROL, "max-age=300")
            .body(bytes),
        Err(status) => Response::builder().status(status).body(Vec::new()),
    }
    .unwrap_or_else(|_| Response::new(Vec::new()))
}

type Served = Result<(Vec<u8>, &'static str), StatusCode>;

async fn serve_thumbnail(state: &AppState, id: &str) -> Served {
    let id = parse_id(id)?;
    let path = thumbnails::thumbnail_path(&state.paths.thumbnails_dir, &id);
    read(&path).await.map(|bytes| (bytes, "image/webp"))
}

async fn serve_media(state: &AppState, id: &str) -> Served {
    let id = parse_id(id)?;
    let (root, relative, media_type) = catalog::get_photo_location(&state.pool, &id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    // Videos need Range support (plan, phase 1); only images for now.
    if media_type != "image" {
        return Err(StatusCode::UNSUPPORTED_MEDIA_TYPE);
    }

    let path = resolve_inside(Path::new(&root), &relative).ok_or(StatusCode::FORBIDDEN)?;
    let mime = image_mime(&path);
    read(&path).await.map(|bytes| (bytes, mime))
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

async fn read(path: &Path) -> Result<Vec<u8>, StatusCode> {
    tokio::fs::read(path).await.map_err(|e| match e.kind() {
        std::io::ErrorKind::NotFound => StatusCode::NOT_FOUND,
        _ => StatusCode::INTERNAL_SERVER_ERROR,
    })
}

fn image_mime(path: &Path) -> &'static str {
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
}
