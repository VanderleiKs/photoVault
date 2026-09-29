//! Downloads the AI models as the app does (pinned URLs, SHA-256 checked).
//!     cargo run --release -p photovault-core --example ai_download -- <models-dir>
fn main() {
    let dir = std::path::PathBuf::from(std::env::args().nth(1).expect("models dir"));
    let (tx, rx) = std::sync::mpsc::channel();
    photovault_core::ai::download::start(dir.clone(), move |r| tx.send(r).unwrap()).unwrap();
    let t = std::time::Instant::now();
    loop {
        if let Ok(result) = rx.recv_timeout(std::time::Duration::from_secs(5)) {
            println!(
                "done in {:?}: {result:?}; installed = {}",
                t.elapsed(),
                photovault_core::ai::installed(&dir)
            );
            break;
        }
        let s = photovault_core::ai::download::state();
        println!(
            "{:.0} / {:.0} MB",
            s.done_bytes as f64 / 1e6,
            s.total_bytes as f64 / 1e6
        );
    }
}
