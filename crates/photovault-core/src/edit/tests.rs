use std::io::Cursor;

use image::{ImageFormat, Rgb, RgbImage};

use super::auto::{self, cast_angle};
use super::color::{luminance, srgb_to_linear};
use super::decode::{Linear, decode};
use super::pipeline::{render, render_display};
use super::*;

fn png(img: image::DynamicImage) -> Vec<u8> {
    let mut out = Vec::new();
    img.write_to(&mut Cursor::new(&mut out), ImageFormat::Png)
        .unwrap();
    out
}

/// Colourful 8-bit test image with every level present.
fn sample_rgb8() -> RgbImage {
    RgbImage::from_fn(256, 96, |x, y| {
        Rgb([x as u8, (y * 2 + x / 3) as u8, (255 - x + y) as u8])
    })
}

/// Random-ish colours whose average is neutral (the grey-world assumption), linear.
fn neutral_scene(w: u32, h: u32) -> Linear {
    let mut seed = 12345u32;
    let mut next = || {
        seed = seed.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
        (seed >> 8) as f32 / (1u32 << 24) as f32
    };
    let mut data = Vec::with_capacity((w * h * 3) as usize);
    // 8×8 blocks of one colour each, mid-tone exposure.
    let blocks: Vec<[f32; 3]> = (0..((w / 8 + 1) * (h / 8 + 1)))
        .map(|_| {
            let base = 0.05 + 0.3 * next();
            [
                base * (0.4 + next()),
                base * (0.4 + next()),
                base * (0.4 + next()),
            ]
        })
        .collect();
    for y in 0..h {
        for x in 0..w {
            data.extend_from_slice(&blocks[((y / 8) * (w / 8 + 1) + x / 8) as usize]);
        }
    }
    Linear {
        width: w,
        height: h,
        data,
    }
}

fn scaled(img: &Linear, k: [f32; 3]) -> Linear {
    let mut out = img.clone();
    for px in out.data.as_chunks_mut::<3>().0.iter_mut() {
        for c in 0..3 {
            px[c] *= k[c];
        }
    }
    out
}

#[test]
fn neutral_recipe_reproduces_the_original_exactly() {
    let original = sample_rgb8();
    let img = decode(&png(original.clone().into())).unwrap();
    let r = resolve(&EditRecipe::neutral(), None);
    assert!(r.is_identity());
    let out = render(&img, &r, None, 3).unwrap();
    assert_eq!((out.width, out.height), original.dimensions());
    assert_eq!(out.rgb, original.into_raw());
}

#[test]
fn transparency_is_composited_over_white() {
    let img = image::RgbaImage::from_pixel(4, 4, image::Rgba([0, 0, 0, 0]));
    let lin = decode(&png(img.into())).unwrap();
    assert!(lin.data.iter().all(|v| (v - 1.0).abs() < 1e-6));
}

#[test]
fn exposure_plus_one_doubles_linear_light() {
    let grey = Linear {
        width: 2,
        height: 2,
        data: vec![0.1; 12],
    };
    let mut recipe = EditRecipe::neutral();
    recipe.adjust.exposure = 1.0;
    let (_, _, display) = render_display(&grey, &resolve(&recipe, None), None, 1).unwrap();
    assert!(
        (srgb_to_linear(display[0]) - 0.2).abs() < 1e-3,
        "{}",
        display[0]
    );
}

#[test]
fn sixteen_bit_gradient_survives_an_edit_without_banding() {
    // A dark 16-bit ramp spanning ~12 levels of 8 bits, pushed +2 EV: 8-bit processing
    // would leave steps of ~4 levels; the float pipeline keeps it smooth.
    let img = image::ImageBuffer::<Rgb<u16>, _>::from_fn(1024, 4, |x, _| {
        let v = (x * 12 * 257 / 1023) as u16 + 2000;
        Rgb([v, v, v])
    });
    let lin = decode(&png(image::DynamicImage::ImageRgb16(img))).unwrap();
    let mut recipe = EditRecipe::neutral();
    recipe.adjust.exposure = 2.0;
    let (w, _, display) = render_display(&lin, &resolve(&recipe, None), None, 2).unwrap();
    let row: Vec<f32> = (0..w as usize).map(|x| display[x * 3] * 255.0).collect();
    let max_step = row
        .windows(2)
        .map(|p| (p[1] - p[0]).abs())
        .fold(0.0, f32::max);
    assert!(max_step < 0.2, "largest step {max_step} levels");
}

#[test]
fn hue_preserving_clip_keeps_bright_colours_from_shifting() {
    // A bright orange pushed past the top (luminance still under white) keeps
    // red > green > blue instead of turning yellow.
    let img = Linear {
        width: 1,
        height: 1,
        data: vec![0.9, 0.5, 0.1],
    };
    let mut recipe = EditRecipe::neutral();
    recipe.adjust.exposure = 0.7;
    let (_, _, d) = render_display(&img, &resolve(&recipe, None), None, 1).unwrap();
    assert!(d[0] >= d[1] && d[1] > d[2], "{d:?}");
}

#[test]
fn auto_white_balance_removes_most_of_a_colour_cast() {
    let scene = neutral_scene(320, 240);
    let cast = [1.35, 1.0, 0.7];
    let tinted = scaled(&scene, cast);
    let a = auto::analyze(&tinted).unwrap();
    let residual = [
        cast[0] * a.gains[0],
        cast[1] * a.gains[1],
        cast[2] * a.gains[2],
    ];
    let before = cast_angle(cast);
    let after = cast_angle(residual);
    assert!(after < before * 0.35, "cast {before:.1}° → {after:.1}°");
    // A neutral scene is left (almost) alone.
    let n = auto::analyze(&scene).unwrap();
    assert!(cast_angle(n.gains) < 2.0, "{:?}", n.gains);
}

#[test]
fn auto_exposure_follows_an_exposure_shift() {
    let scene = neutral_scene(320, 240);
    let base = auto::analyze(&scene).unwrap().ev;
    for shift in [-1.5f32, -0.5, 0.5] {
        let k = shift.exp2();
        let ev = auto::analyze(&scaled(&scene, [k; 3])).unwrap().ev;
        assert!(
            (ev - (base - shift)).abs() < 0.1,
            "shift {shift}: {base} → {ev}"
        );
    }
}

#[test]
fn intensity_scales_the_automatic_correction() {
    let a = AutoValues {
        gains: [1.2, 1.0, 0.8],
        ev: 1.0,
        ..AutoValues::identity()
    };
    let mut recipe = EditRecipe::default();
    recipe.auto.intensity = 0.5;
    let half = resolve(&recipe, Some(&a));
    assert!((half.ev - 0.5).abs() < 1e-6);
    recipe.auto.intensity = 0.0;
    assert!(resolve(&recipe, Some(&a)).is_identity());
    recipe.auto.enabled = false;
    recipe.auto.intensity = 1.0;
    assert!(resolve(&recipe, Some(&a)).is_identity());
}

#[test]
fn local_tone_lifts_shadows_and_recovers_highlights() {
    let mut data = Vec::new();
    for x in 0..64 {
        let v = if x < 32 { 0.01 } else { 0.9 };
        for _ in 0..64 {
            data.extend_from_slice(&[v, v, v]);
        }
    }
    // Top half dark, bottom half bright.
    let img = Linear {
        width: 64,
        height: 64,
        data,
    };
    let base = render_display(&img, &Resolved::identity(), None, 1)
        .unwrap()
        .2;
    let mut recipe = EditRecipe::neutral();
    recipe.adjust.shadows = 100.0;
    recipe.adjust.highlights = -100.0;
    let out = render_display(&img, &resolve(&recipe, None), None, 1)
        .unwrap()
        .2;
    let dark = 3 * 64 * 5; // a pixel in the dark half
    let bright = 3 * 64 * 60;
    assert!(
        out[dark] > base[dark],
        "shadows {} → {}",
        base[dark],
        out[dark]
    );
    assert!(
        out[bright] < base[bright],
        "highlights {} → {}",
        base[bright],
        out[bright]
    );
}

#[test]
fn preview_and_full_size_render_alike() {
    let scene = neutral_scene(1200, 800);
    let a = auto::analyze(&scene).unwrap();
    let mut recipe = EditRecipe::default();
    recipe.adjust.shadows = 40.0;
    let r = resolve(&recipe, Some(&a));
    let small = render_display(&scene, &r, Some(300), 2).unwrap();
    let full = render_display(&scene, &r, None, 2).unwrap();
    let full_down = Linear {
        width: full.0,
        height: full.1,
        data: full.2,
    }
    .fit(300)
    .unwrap();
    let mean = |v: &[f32]| v.iter().sum::<f32>() / v.len() as f32;
    assert!((mean(&small.2) - mean(&full_down.data)).abs() < 0.01);
}

#[test]
fn crop_takes_the_requested_region() {
    let img = Linear {
        width: 100,
        height: 50,
        data: (0..100 * 50).flat_map(|i| [i as f32, 0.0, 0.0]).collect(),
    };
    let c = img.crop([0.5, 0.2, 0.25, 0.5]);
    assert_eq!((c.width, c.height), (25, 25));
    assert_eq!(c.data[0], (10 * 100 + 50) as f32);
}

#[test]
fn recipes_from_newer_versions_are_read_only() {
    let json = format!(
        r#"{{"version": {}, "adjust": {{"exposure": 1}}}}"#,
        RECIPE_VERSION + 1
    );
    assert!(EditRecipe::from_json(&json).is_err());
    let old = EditRecipe::from_json(r#"{"adjust": {"exposure": 0.5}, "unknown": 1}"#).unwrap();
    assert_eq!(old.adjust.exposure, 0.5);
    assert!(old.auto.enabled);
    let back: EditRecipe = serde_json::from_str(&serde_json::to_string(&old).unwrap()).unwrap();
    assert_eq!(back, old);
}

#[test]
fn luminance_weights_sum_to_one() {
    assert!((luminance([1.0, 1.0, 1.0]) - 1.0).abs() < 1e-6);
}

#[test]
fn jpeg_carries_the_srgb_profile_and_decodes_back() {
    let img = decode(&png(sample_rgb8().into())).unwrap();
    let out = render(&img, &Resolved::identity(), None, 1).unwrap();
    let icc = super::color::srgb_icc();
    let bytes = super::encode::jpeg(
        &out,
        &super::encode::JpegOptions {
            icc: Some(&icc),
            ..super::encode::JpegOptions::preview()
        },
    )
    .unwrap();
    let mut decoder = image::ImageReader::new(Cursor::new(&bytes))
        .with_guessed_format()
        .unwrap()
        .into_decoder()
        .unwrap();
    use image::ImageDecoder;
    assert!(
        decoder
            .icc_profile()
            .unwrap()
            .is_some_and(|p| !p.is_empty())
    );
    let back = image::DynamicImage::from_decoder(decoder)
        .unwrap()
        .to_rgb8();
    let diff = back
        .as_raw()
        .iter()
        .zip(&out.rgb)
        .map(|(a, b)| (*a as i32 - *b as i32).abs())
        .sum::<i32>() as f32
        / out.rgb.len() as f32;
    assert!(diff < 2.0, "mean difference {diff}");
}

#[test]
fn fast_log2_is_close_enough_for_the_tone_masks() {
    for v in [1e-5f32, 0.001, 0.0123, 0.18, 0.5, 0.9, 1.0, 3.7] {
        assert!(
            (super::pipeline::fast_log2(v) - v.log2()).abs() < 0.01,
            "{v}"
        );
    }
}

#[test]
fn reduced_decoding_matches_the_full_one() {
    let big = image::RgbImage::from_fn(800, 400, |x, y| {
        Rgb([(x / 4) as u8, (y / 2) as u8, ((x + y) / 5) as u8])
    });
    let bytes = png(big.into());
    let small = super::decode::decode_fit(&bytes, Some(200)).unwrap();
    assert_eq!((small.width, small.height), (200, 100));
    let full = decode(&bytes).unwrap().fit(200).unwrap();
    let mean = |v: &[f32]| v.iter().sum::<f32>() / v.len() as f32;
    assert!((mean(&small.data) - mean(&full.data)).abs() < 0.01);
    // 16 bits keep 16 bits.
    let deep = image::ImageBuffer::<Rgb<u16>, _>::from_fn(400, 10, |x, _| Rgb([x as u16 * 100; 3]));
    let lin =
        super::decode::decode_fit(&png(image::DynamicImage::ImageRgb16(deep)), Some(100)).unwrap();
    assert_eq!(lin.width, 100);
}
