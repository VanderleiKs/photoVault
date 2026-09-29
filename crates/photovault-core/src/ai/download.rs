//! Downloading the model files: the app's only network access, and only when the user
//! asks (Settings → IA local). Each file goes to `<name>.part`, is checked against the
//! pinned SHA-256 and size, and only then renamed; files already right are kept.

use super::{MANIFEST, ModelFile, model_dir};
use crate::error::{Error, Result};
use serde::Serialize;
use sha2::{Digest, Sha256};
use specta::Type;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Default, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DownloadState {
    pub running: bool,
    #[specta(type = specta_typescript::Number)]
    pub done_bytes: u64,
    #[specta(type = specta_typescript::Number)]
    pub total_bytes: u64,
    /// Last failure (network, checksum), for the settings page.
    pub error: Option<String>,
}

struct Shared {
    state: DownloadState,
    cancel: Arc<AtomicBool>,
}

static SHARED: Mutex<Option<Shared>> = Mutex::new(None);

pub fn state() -> DownloadState {
    SHARED
        .lock()
        .ok()
        .and_then(|s| s.as_ref().map(|s| s.state.clone()))
        .unwrap_or_default()
}

fn update(f: impl FnOnce(&mut DownloadState)) {
    if let Ok(mut s) = SHARED.lock()
        && let Some(s) = s.as_mut()
    {
        f(&mut s.state);
    }
}

pub fn cancel() {
    if let Ok(s) = SHARED.lock()
        && let Some(s) = s.as_ref()
    {
        s.cancel.store(true, Ordering::Release);
    }
}

/// Starts in a thread; `on_done` runs at the end (success, failure or cancel).
pub fn start(models_dir: PathBuf, on_done: impl FnOnce(Result<()>) + Send + 'static) -> Result<()> {
    let cancel = Arc::new(AtomicBool::new(false));
    {
        let mut shared = SHARED
            .lock()
            .map_err(|_| Error::Ai("estado travado".into()))?;
        if shared.as_ref().is_some_and(|s| s.state.running) {
            return Err(Error::InvalidInput(
                "O download já está em andamento.".into(),
            ));
        }
        *shared = Some(Shared {
            state: DownloadState {
                running: true,
                total_bytes: super::total_size(),
                ..Default::default()
            },
            cancel: Arc::clone(&cancel),
        });
    }
    std::thread::Builder::new()
        .name("pv-model-download".into())
        .spawn(move || {
            let result = run(&model_dir(&models_dir), &cancel);
            update(|s| {
                s.running = false;
                s.error = result.as_ref().err().map(|e| e.to_string());
            });
            on_done(result);
        })?;
    Ok(())
}

fn run(dir: &Path, cancel: &AtomicBool) -> Result<()> {
    std::fs::create_dir_all(dir)?;
    let mut before = 0;
    for file in &MANIFEST {
        let dest = dir.join(file.name);
        if !already_there(&dest, file)? {
            fetch(file, &dest, cancel, before)?;
        }
        before += file.size;
        update(|s| s.done_bytes = before);
    }
    Ok(())
}

fn already_there(dest: &Path, file: &ModelFile) -> Result<bool> {
    if !std::fs::metadata(dest).is_ok_and(|m| m.len() == file.size) {
        return Ok(false);
    }
    let mut hasher = Sha256::new();
    std::io::copy(&mut std::fs::File::open(dest)?, &mut hasher)?;
    Ok(hex(&hasher.finalize()) == file.sha256)
}

fn fetch(file: &ModelFile, dest: &Path, cancel: &AtomicBool, before: u64) -> Result<()> {
    let part = dest.with_extension("part");
    let net = |e: ureq::Error| Error::Ai(format!("não foi possível baixar {}: {e}", file.name));
    let mut response = ureq::get(file.url).call().map_err(net)?;
    let mut reader = response.body_mut().as_reader();
    let mut out = std::io::BufWriter::new(std::fs::File::create(&part)?);
    let mut hasher = Sha256::new();
    let mut buf = vec![0u8; 256 * 1024];
    let mut got: u64 = 0;
    loop {
        if cancel.load(Ordering::Acquire) {
            drop(out);
            let _ = std::fs::remove_file(&part);
            return Err(Error::Ai("download cancelado.".into()));
        }
        let n = reader.read(&mut buf)?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
        out.write_all(&buf[..n])?;
        got += n as u64;
        if got > file.size {
            break;
        }
        update(|s| s.done_bytes = before + got);
    }
    out.flush()?;
    drop(out);
    if got != file.size || hex(&hasher.finalize()) != file.sha256 {
        let _ = std::fs::remove_file(&part);
        return Err(Error::Ai(format!(
            "o arquivo {} veio diferente do esperado (verificação SHA-256).",
            file.name
        )));
    }
    std::fs::rename(&part, dest)?;
    Ok(())
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}
