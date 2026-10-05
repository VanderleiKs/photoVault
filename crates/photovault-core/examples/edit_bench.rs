//! Timing of the editor (PRD §29 targets): opening a photo (decode + proxy + automatic
//! analysis), live preview renders at 1024/1600 (render + JPEG) and a full delivery.
//!
//!     cargo run --release -p photovault-core --example edit_bench -- <pasta|foto> [threads]
use std::path::PathBuf;
use std::time::Instant;

use photovault_core::edit::encode::{JpegOptions, jpeg};
use photovault_core::edit::{EditRecipe, auto, color, decode, pipeline, resolve};

fn ms(t: Instant) -> f64 {
    t.elapsed().as_secs_f64() * 1000.0
}

fn main() {
    let mut args = std::env::args().skip(1);
    let target = PathBuf::from(
        args.next()
            .expect("usage: edit_bench <folder|photo> [threads]"),
    );
    let threads = args
        .next()
        .and_then(|t| t.parse().ok())
        .unwrap_or_else(|| photovault_core::cpu::workers(0));
    let files: Vec<PathBuf> = if target.is_dir() {
        let mut v: Vec<PathBuf> = std::fs::read_dir(&target)
            .unwrap()
            .filter_map(|e| e.ok().map(|e| e.path()))
            .filter(|p| {
                p.extension().and_then(|e| e.to_str()).is_some_and(|e| {
                    matches!(
                        e.to_ascii_lowercase().as_str(),
                        "jpg" | "jpeg" | "png" | "tif" | "tiff" | "webp"
                    )
                })
            })
            .collect();
        v.sort();
        v.truncate(10);
        v
    } else {
        vec![target]
    };
    println!("{threads} threads, {} fotos\n", files.len());
    println!(
        "{:<36} {:>6} {:>8} {:>7} {:>7} {:>9} {:>9} {:>9}",
        "foto", "MP", "abrir", "proxy", "auto", "1024 ms", "1600 ms", "entrega"
    );
    let mut preview = Vec::new();
    for path in files {
        let bytes = std::fs::read(&path).unwrap();
        let t = Instant::now();
        let Ok(full) = decode::decode(&bytes) else {
            println!("{}: não decodificou", path.display());
            continue;
        };
        let t_decode = ms(t);
        let t = Instant::now();
        let proxy = full.fit(2048).unwrap();
        let t_proxy = ms(t);
        let t = Instant::now();
        let auto = auto::analyze(&proxy).unwrap();
        let t_auto = ms(t);
        let recipe = EditRecipe::default();
        let r = resolve(&recipe, Some(&auto));

        let render_at = |edge: u32| {
            // Best of 5 (the slider case: the proxy at this size is already in memory).
            let sized = proxy.fit(edge).unwrap();
            (0..5)
                .map(|_| {
                    let t = Instant::now();
                    let out = pipeline::render(&sized, &r, None, threads).unwrap();
                    jpeg(&out, &JpegOptions::preview()).unwrap();
                    ms(t)
                })
                .fold(f64::MAX, f64::min)
        };
        let p1024 = render_at(1024);
        let p1600 = render_at(1600);
        preview.push(p1600);

        let t = Instant::now();
        let out = pipeline::render(&full, &r, None, threads).unwrap();
        let icc = color::srgb_icc();
        jpeg(
            &out,
            &JpegOptions {
                quality: 92,
                progressive: true,
                icc: Some(&icc),
                exif: None,
            },
        )
        .unwrap();
        let t_full = ms(t);
        let name = path.file_name().unwrap().to_string_lossy();
        let name: String = name.chars().take(35).collect();
        println!(
            "{name:<36} {:>6.1} {t_decode:>8.0} {t_proxy:>7.0} {t_auto:>7.0} {p1024:>9.1} {p1600:>9.1} {t_full:>9.0}",
            (full.width as f64 * full.height as f64) / 1e6
        );
        println!(
            "    auto: ev {:+.2}, ganhos [{:.3} {:.3} {:.3}], preto {:.4}, branco {:.3}, sombras {:+.2}, realces {:+.2}",
            auto.ev,
            auto.gains[0],
            auto.gains[1],
            auto.gains[2],
            auto.black,
            auto.white,
            auto.shadows,
            auto.highlights
        );
    }
    if !preview.is_empty() {
        preview.sort_by(f64::total_cmp);
        println!(
            "\nprévia 1600 (render + JPEG): mediana {:.1} ms (meta: render ≤ 45 ms, total < 80 ms)",
            preview[preview.len() / 2]
        );
    }
}
