//! Compare perceptual hashes on real photos: resized/recompressed copies vs different photos.
//!     cargo run --release -p photovault-core --example hash_eval -- <folder>
use image::{DynamicImage, codecs::jpeg::JpegEncoder};
use image_hasher::{HashAlg, HasherConfig};

fn hash(img: &DynamicImage, alg: HashAlg, dct: bool) -> Vec<u8> {
    let mut c = HasherConfig::new().hash_alg(alg).hash_size(8, 8);
    if dct {
        c = c.preproc_dct();
    }
    c.to_hasher().hash_image(img).as_bytes().to_vec()
}

fn dist(a: &[u8], b: &[u8]) -> u32 {
    a.iter().zip(b).map(|(x, y)| (x ^ y).count_ones()).sum()
}

fn main() {
    let dir = std::env::args().nth(1).unwrap();
    let mut photos: Vec<DynamicImage> = walkdir::WalkDir::new(dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path()
                .extension()
                .is_some_and(|x| x.eq_ignore_ascii_case("jpg"))
        })
        .filter(|e| e.metadata().map(|m| m.len() > 200_000).unwrap_or(false))
        .take(40)
        .filter_map(|e| image::open(e.path()).ok())
        .map(|i| i.thumbnail(1024, 1024))
        .collect();
    photos.dedup_by(|a, b| a.as_bytes() == b.as_bytes());
    println!("{} photos", photos.len());
    for (label, alg, dct) in [
        ("gradient", HashAlg::Gradient, false),
        ("dct-median", HashAlg::Median, true),
        ("double-gradient", HashAlg::DoubleGradient, false),
    ] {
        let mut copies = Vec::new();
        for p in &photos {
            let small = p.resize(400, 400, image::imageops::FilterType::Triangle);
            let mut jpg = Vec::new();
            small
                .write_with_encoder(JpegEncoder::new_with_quality(&mut jpg, 55))
                .unwrap();
            let recompressed = image::load_from_memory(&jpg).unwrap();
            copies.push(dist(&hash(p, alg, dct), &hash(&recompressed, alg, dct)));
        }
        let mut different = Vec::new();
        for i in 0..photos.len() {
            for j in i + 1..photos.len() {
                different.push(dist(
                    &hash(&photos[i], alg, dct),
                    &hash(&photos[j], alg, dct),
                ));
            }
        }
        copies.sort();
        different.sort();
        let fp4 = different.iter().filter(|&&d| d <= 4).count();
        let fp12 = different.iter().filter(|&&d| d <= 12).count();
        println!(
            "{label:16} copies: max {} p90 {} | different: min {} p5 {} | pairs ≤4: {fp4}/{} ≤12: {fp12}",
            copies.last().unwrap(),
            copies[copies.len() * 9 / 10],
            different[0],
            different[different.len() / 20],
            different.len()
        );
    }
}
