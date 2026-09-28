//! Capture metadata (PRD §10): EXIF for images, track info for videos, and the
//! date fallback chain. Pure functions; blocking I/O only in `read_video`.

use chrono::{DateTime, Datelike, Local, NaiveDate, NaiveDateTime, NaiveTime};
use nom_exif::{EntryValue, Exif, ExifTag, MediaParser, MediaSource, TrackInfo, TrackInfoTag};
use regex::Regex;
use std::path::Path;
use std::sync::LazyLock;

/// Where the capture date came from (stored in `media.date_source`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DateSource {
    ExifOriginal,
    ExifDateTime,
    /// Container metadata (video creation date).
    FileMeta,
    Filename,
    Mtime,
}

impl DateSource {
    pub fn as_str(self) -> &'static str {
        match self {
            DateSource::ExifOriginal => "exif_original",
            DateSource::ExifDateTime => "exif_datetime",
            DateSource::FileMeta => "file_meta",
            DateSource::Filename => "filename",
            DateSource::Mtime => "mtime",
        }
    }
}

#[derive(Debug, Clone, Default, PartialEq)]
pub struct CaptureInfo {
    /// Wall-clock time at the place the photo was taken ("2025-07-12T14:32:01").
    pub local_time: Option<NaiveDateTime>,
    /// UTC offset in minutes, when the file records it.
    pub offset_minutes: Option<i32>,
    pub date_source: Option<DateSource>,
    pub camera_make: Option<String>,
    pub camera_model: Option<String>,
    pub lens: Option<String>,
    pub iso: Option<u32>,
    pub aperture: Option<f64>,
    /// Exposure time as shown to people: "1/1200" or "2".
    pub shutter: Option<String>,
    pub focal_length: Option<f64>,
    /// EXIF orientation 1–8 (1 = upright).
    pub orientation: Option<u16>,
    pub gps: Option<(f64, f64)>,
    pub duration_ms: Option<u64>,
    /// Pixel size from the container (videos; images are measured when decoded).
    pub width: Option<u32>,
    pub height: Option<u32>,
}

/// Format for `captured_at`: local wall-clock, no offset, so photos sort and display
/// by the time on the camera regardless of the computer's time zone.
pub const CAPTURE_FORMAT: &str = "%Y-%m-%dT%H:%M:%S";

pub fn format_capture(time: NaiveDateTime) -> String {
    time.format(CAPTURE_FORMAT).to_string()
}

/// Local wall-clock form of a file modification time (RFC 3339).
pub fn mtime_as_capture(modified_rfc3339: &str) -> Option<String> {
    let utc = DateTime::parse_from_rfc3339(modified_rfc3339).ok()?;
    Some(format_capture(utc.with_timezone(&Local).naive_local()))
}

/// EXIF of an image held in memory. Missing/garbled EXIF yields an empty result.
pub fn read_image_exif(bytes: &[u8]) -> CaptureInfo {
    let parsed = MediaSource::from_memory(bytes.to_vec())
        .and_then(|source| MediaParser::new().parse_exif(source));
    match parsed {
        Ok(iter) => from_exif(&iter.into()),
        Err(e) => {
            tracing::debug!("No EXIF: {e}");
            CaptureInfo::default()
        }
    }
}

fn from_exif(exif: &Exif) -> CaptureInfo {
    let text = |tag| {
        exif.get(tag)
            .and_then(EntryValue::as_str)
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(str::to_string)
    };
    let rational = |tag| exif.get(tag).and_then(rational_value);

    let (local_time, offset_minutes, date_source) = [
        (ExifTag::DateTimeOriginal, DateSource::ExifOriginal),
        (ExifTag::CreateDate, DateSource::ExifOriginal),
        (ExifTag::ModifyDate, DateSource::ExifDateTime),
    ]
    .into_iter()
    .find_map(|(tag, source)| {
        let value = exif.get(tag)?.as_datetime()?;
        let offset = value.aware().map(|d| d.offset().local_minus_utc() / 60);
        let local = value.into_naive();
        plausible(local).then_some((Some(local), offset, Some(source)))
    })
    .unwrap_or((None, None, None));

    CaptureInfo {
        local_time,
        offset_minutes,
        date_source,
        camera_make: text(ExifTag::Make),
        camera_model: text(ExifTag::Model),
        lens: text(ExifTag::LensModel),
        iso: exif
            .get(ExifTag::ISOSpeedRatings)
            .and_then(|v| v.try_as_integer())
            .and_then(|n| u32::try_from(n).ok())
            .filter(|&n| n > 0),
        aperture: rational(ExifTag::FNumber).filter(|&f| f > 0.0),
        shutter: rational(ExifTag::ExposureTime).and_then(format_shutter),
        focal_length: rational(ExifTag::FocalLength).filter(|&f| f > 0.0),
        orientation: exif
            .get(ExifTag::Orientation)
            .and_then(|v| v.try_as_integer())
            .and_then(|n| u16::try_from(n).ok())
            .filter(|n| (1..=8).contains(n)),
        gps: exif.gps_info().and_then(|g| {
            let lat = g.latitude_ref.sign() * dms(&g.latitude)?;
            let lon = g.longitude_ref.sign() * dms(&g.longitude)?;
            valid_coordinates(lat, lon).then_some((lat, lon))
        }),
        ..Default::default()
    }
}

/// Track metadata of a video file (reads only the container headers).
pub fn read_video(path: &Path) -> CaptureInfo {
    let parsed = MediaSource::open(path).and_then(|source| MediaParser::new().parse_track(source));
    match parsed {
        Ok(track) => from_track(&track),
        Err(e) => {
            tracing::debug!("No track metadata for {}: {e}", path.display());
            CaptureInfo::default()
        }
    }
}

fn from_track(track: &TrackInfo) -> CaptureInfo {
    let text = |tag| {
        track
            .get(tag)
            .and_then(EntryValue::as_str)
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(str::to_string)
    };
    let number = |tag| track.get(tag).and_then(|v| v.try_as_integer());

    let created = track
        .get(TrackInfoTag::CreateDate)
        .and_then(EntryValue::as_datetime);
    // Container dates are UTC; show them in the computer's zone.
    let local_time = created
        .map(|d| match d.aware() {
            Some(aware) => aware.with_timezone(&Local).naive_local(),
            None => d.into_naive(),
        })
        .filter(|&t| plausible(t));

    CaptureInfo {
        local_time,
        date_source: local_time.map(|_| DateSource::FileMeta),
        camera_make: text(TrackInfoTag::Make),
        camera_model: text(TrackInfoTag::Model),
        duration_ms: number(TrackInfoTag::DurationMs).and_then(|n| u64::try_from(n).ok()),
        width: number(TrackInfoTag::Width).and_then(|n| u32::try_from(n).ok()),
        height: number(TrackInfoTag::Height).and_then(|n| u32::try_from(n).ok()),
        gps: track.gps_info().and_then(|g| {
            let lat = g.latitude_ref.sign() * dms(&g.latitude)?;
            let lon = g.longitude_ref.sign() * dms(&g.longitude)?;
            valid_coordinates(lat, lon).then_some((lat, lon))
        }),
        ..Default::default()
    }
}

/// Fill the capture date with the fallback chain:
/// EXIF original → EXIF DateTime → container → filename → file mtime.
pub fn resolve_capture_date(info: &mut CaptureInfo, filename: &str, mtime_rfc3339: Option<&str>) {
    if info.local_time.is_some() {
        return;
    }
    if let Some(time) = date_from_filename(filename) {
        info.local_time = Some(time);
        info.date_source = Some(DateSource::Filename);
        return;
    }
    let mtime = mtime_rfc3339
        .and_then(|m| DateTime::parse_from_rfc3339(m).ok())
        .map(|d| d.with_timezone(&Local).naive_local());
    if let Some(time) = mtime {
        info.local_time = Some(time);
        info.date_source = Some(DateSource::Mtime);
    }
}

static FILENAME_DATE: LazyLock<Regex> = LazyLock::new(|| {
    // YYYYMMDD or YYYY-MM-DD, optionally followed by HHMMSS / HH.MM.SS / HH-MM-SS.
    Regex::new(
        r"(?x)
        (?:^|[^0-9])
        (?P<y>(?:19|20)\d{2}) [-_.]? (?P<m>\d{2}) [-_.]? (?P<d>\d{2})
        (?: [-_\x20T]? (?P<H>\d{2}) [-_.:]? (?P<M>\d{2}) [-_.:]? (?P<S>\d{2}) \d{0,3} )?
        (?:[^0-9]|$)",
    )
    .expect("valid regex")
});

/// Dates embedded by phones and apps: `IMG_20250712_143201`, `PXL_20250712_143201123`,
/// `IMG-20250712-WA0001` (date only), `Screenshot_2025-07-12-14-32-01`, `2025-07-12 14.32.01`.
pub fn date_from_filename(filename: &str) -> Option<NaiveDateTime> {
    let caps = FILENAME_DATE.captures(filename)?;
    let num = |name| caps.name(name).and_then(|m| m.as_str().parse::<u32>().ok());
    let date = NaiveDate::from_ymd_opt(num("y")? as i32, num("m")?, num("d")?)?;
    let time = match (num("H"), num("M"), num("S")) {
        (Some(h), Some(m), Some(s)) => NaiveTime::from_hms_opt(h, m, s).unwrap_or(NaiveTime::MIN),
        _ => NaiveTime::MIN,
    };
    let datetime = date.and_time(time);
    plausible(datetime).then_some(datetime)
}

/// Rejects obviously wrong dates (unset camera clocks default to 1970/2000-01-01).
fn plausible(time: NaiveDateTime) -> bool {
    (1990..=2100).contains(&time.year())
        && time.date() <= Local::now().date_naive() + chrono::Days::new(2)
}

fn rational_value(value: &EntryValue) -> Option<f64> {
    value
        .as_urational()
        .and_then(|r| r.to_f64())
        .or_else(|| value.as_irational().and_then(|r| r.to_f64()))
        .or_else(|| value.as_f64())
        .or_else(|| value.try_as_integer().map(|n| n as f64))
        .filter(|f| f.is_finite())
}

fn dms(value: &nom_exif::LatLng) -> Option<f64> {
    let d = value.degrees.to_f64()?;
    let m = value.minutes.to_f64()?;
    let s = value.seconds.to_f64()?;
    Some(d + m / 60.0 + s / 3600.0)
}

fn valid_coordinates(lat: f64, lon: f64) -> bool {
    (-90.0..=90.0).contains(&lat) && (-180.0..=180.0).contains(&lon) && (lat != 0.0 || lon != 0.0)
}

/// 0.000833 → "1/1200"; 2.0 → "2"; 0.4 → "0,4".
fn format_shutter(seconds: f64) -> Option<String> {
    if seconds <= 0.0 {
        return None;
    }
    if seconds < 0.5 {
        let denominator = (1.0 / seconds).round() as u64;
        Some(format!("1/{denominator}"))
    } else if (seconds - seconds.round()).abs() < 0.05 {
        Some(format!("{}", seconds.round() as u64))
    } else {
        Some(format!("{seconds:.1}").replace('.', ","))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture(name: &str) -> Vec<u8> {
        std::fs::read(
            Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("tests/fixtures")
                .join(name),
        )
        .unwrap()
    }

    fn at(s: &str) -> NaiveDateTime {
        NaiveDateTime::parse_from_str(s, CAPTURE_FORMAT).unwrap()
    }

    #[test]
    fn reads_full_exif() {
        let info = read_image_exif(&fixture("exif_full.jpg"));
        assert_eq!(info.local_time, Some(at("2025-07-12T14:32:01")));
        assert_eq!(info.offset_minutes, Some(-180));
        assert_eq!(info.date_source, Some(DateSource::ExifOriginal));
        assert_eq!(info.camera_make.as_deref(), Some("Apple"));
        assert_eq!(info.camera_model.as_deref(), Some("iPhone 15 Pro"));
        assert!(
            info.lens
                .as_deref()
                .unwrap()
                .starts_with("iPhone 15 Pro back")
        );
        assert_eq!(info.iso, Some(32));
        assert_eq!(info.aperture, Some(1.8));
        assert_eq!(info.shutter.as_deref(), Some("1/1200"));
        assert_eq!(info.focal_length, Some(24.0));
        assert_eq!(info.orientation, Some(6));
        let (lat, lon) = info.gps.unwrap();
        assert!((lat + 29.3789).abs() < 1e-3, "lat {lat}");
        assert!((lon + 50.8739).abs() < 1e-3, "lon {lon}");
    }

    #[test]
    fn falls_back_to_exif_datetime() {
        let info = read_image_exif(&fixture("exif_datetime_only.jpg"));
        assert_eq!(info.local_time, Some(at("2019-01-02T03:04:05")));
        assert_eq!(info.date_source, Some(DateSource::ExifDateTime));
    }

    #[test]
    fn fallback_chain_filename_then_mtime() {
        let mut info = read_image_exif(&fixture("IMG_20240315_101112.jpg"));
        assert_eq!(info, CaptureInfo::default());
        resolve_capture_date(
            &mut info,
            "IMG_20240315_101112.jpg",
            Some("2026-01-01T00:00:00Z"),
        );
        assert_eq!(info.local_time, Some(at("2024-03-15T10:11:12")));
        assert_eq!(info.date_source, Some(DateSource::Filename));

        let mut info = CaptureInfo::default();
        resolve_capture_date(&mut info, "foto.jpg", Some("2026-01-01T12:00:00Z"));
        assert_eq!(info.date_source, Some(DateSource::Mtime));
        assert!(info.local_time.is_some());

        // An existing EXIF date always wins.
        let mut info = read_image_exif(&fixture("exif_full.jpg"));
        resolve_capture_date(&mut info, "IMG_20240315_101112.jpg", None);
        assert_eq!(info.date_source, Some(DateSource::ExifOriginal));
    }

    #[test]
    fn dates_in_filenames() {
        let cases = [
            ("IMG_20250712_143201.jpg", Some("2025-07-12T14:32:01")),
            ("PXL_20250712_143201123.jpg", Some("2025-07-12T14:32:01")),
            ("VID_20250712_143201.mp4", Some("2025-07-12T14:32:01")),
            ("IMG-20231224-WA0007.jpg", Some("2023-12-24T00:00:00")),
            (
                "Screenshot_2025-07-12-14-32-01.png",
                Some("2025-07-12T14:32:01"),
            ),
            ("2025-07-12 14.32.01.jpg", Some("2025-07-12T14:32:01")),
            (
                "Captura de tela 2025-07-12 143201.png",
                Some("2025-07-12T14:32:01"),
            ),
            ("DSC_1234.JPG", None),
            ("IMG_20251340_000000.jpg", None), // invalid month
            ("foto_18990101.jpg", None),       // implausible year
            ("123456789012345.jpg", None),
        ];
        for (name, expected) in cases {
            assert_eq!(date_from_filename(name), expected.map(at), "{name}");
        }
    }

    #[test]
    fn shutter_formatting() {
        assert_eq!(format_shutter(1.0 / 1200.0).as_deref(), Some("1/1200"));
        assert_eq!(format_shutter(1.0 / 60.0).as_deref(), Some("1/60"));
        assert_eq!(format_shutter(2.0).as_deref(), Some("2"));
        assert_eq!(format_shutter(0.8).as_deref(), Some("0,8"));
        assert_eq!(format_shutter(0.0), None);
    }

    #[test]
    fn garbage_is_not_fatal() {
        assert_eq!(read_image_exif(b"not an image"), CaptureInfo::default());
    }

    /// Real-world files, when present on this machine (not committed).
    #[test]
    #[ignore = "needs PV_SAMPLE_VIDEO / PV_SAMPLE_HEIC"]
    fn local_samples() {
        if let Some(video) = std::env::var_os("PV_SAMPLE_VIDEO") {
            let info = read_video(Path::new(&video));
            println!("video: {info:?}");
            assert!(info.duration_ms.is_some() && info.width.is_some());
        }
        if let Some(heic) = std::env::var_os("PV_SAMPLE_HEIC") {
            let info = read_image_exif(&std::fs::read(heic).unwrap());
            println!("heic: {info:?}");
            assert!(info.local_time.is_some());
        }
    }
}
