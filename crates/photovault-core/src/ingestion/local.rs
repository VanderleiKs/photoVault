use super::source::{MediaSource, SourceEntry};
use crate::catalog::MediaType;
use crate::error::{Error, Result};
use std::path::{Component, Path, PathBuf};
use walkdir::WalkDir;

const IMAGE_EXTENSIONS: &[&str] = &[
    "jpg", "jpeg", "png", "webp", "heic", "heif", "tif", "tiff", "gif", "bmp",
];
const VIDEO_EXTENSIONS: &[&str] = &["mp4", "mov", "m4v", "mkv", "avi", "webm", "3gp"];

/// Directories never indexed besides hidden ones (`.photovault-trash`, `.Trash-1000`,
/// `.thumbnails`…): OS and NAS system folders.
const IGNORED_DIRS: &[&str] = &[
    "$RECYCLE.BIN",
    "System Volume Information",
    "@eaDir",
    "#recycle",
];

/// Smaller files are icons, stubs or broken copies, not photos (PRD §8.2).
pub const MIN_FILE_SIZE: u64 = 1024;

/// A folder on a local or external drive.
pub struct LocalFolderSource {
    root: PathBuf,
}

impl LocalFolderSource {
    pub fn new(root: impl Into<PathBuf>) -> Result<Self> {
        let root = root.into();
        if !root.is_dir() {
            return Err(Error::PathNotAccessible(root.display().to_string()));
        }
        Ok(Self { root })
    }

    pub fn root(&self) -> &Path {
        &self.root
    }
}

impl MediaSource for LocalFolderSource {
    fn kind(&self) -> &'static str {
        "local_folder"
    }

    fn entries(&self) -> Box<dyn Iterator<Item = SourceEntry> + Send + '_> {
        let walker = WalkDir::new(&self.root)
            .follow_links(false)
            .into_iter()
            .filter_entry(|e| {
                e.depth() == 0 || !(e.file_type().is_dir() && is_ignored_dir(e.file_name()))
            });

        Box::new(walker.filter_map(move |entry| {
            let entry = entry
                .inspect_err(|e| tracing::warn!("Skipping unreadable entry: {e}"))
                .ok()?;
            if !entry.file_type().is_file() {
                return None;
            }
            let path = entry.path();
            // macOS AppleDouble files ("._IMG_1234.jpg") only hold resource forks.
            if entry.file_name().to_string_lossy().starts_with("._") {
                return None;
            }
            let (extension, media_type) = classify(path)?;
            let relative_path = normalize_relative_path(&self.root, path)?;
            let metadata = entry
                .metadata()
                .inspect_err(|e| tracing::warn!("Skipping {}: {e}", path.display()))
                .ok()?;
            if metadata.len() < MIN_FILE_SIZE {
                return None;
            }
            let modified = metadata
                .modified()
                .ok()
                .map(|t| chrono::DateTime::<chrono::Utc>::from(t).to_rfc3339());

            Some(SourceEntry {
                relative_path,
                filename: entry.file_name().to_string_lossy().into_owned(),
                extension,
                media_type,
                size: metadata.len(),
                modified,
                local_path: Some(path.to_path_buf()),
            })
        }))
    }

    fn open(&self, entry: &SourceEntry) -> Result<Box<dyn std::io::Read + Send>> {
        let path = self.root.join(&entry.relative_path);
        Ok(Box::new(std::fs::File::open(path)?))
    }
}

fn is_ignored_dir(name: &std::ffi::OsStr) -> bool {
    name.to_string_lossy().starts_with('.')
        || IGNORED_DIRS.iter().any(|d| name.eq_ignore_ascii_case(d))
}

fn classify(path: &Path) -> Option<(String, MediaType)> {
    let ext = path.extension()?.to_str()?.to_ascii_lowercase();
    let media_type = if IMAGE_EXTENSIONS.contains(&ext.as_str()) {
        MediaType::Image
    } else if VIDEO_EXTENSIONS.contains(&ext.as_str()) {
        MediaType::Video
    } else {
        return None;
    };
    Some((ext, media_type))
}

/// Path relative to `root` with `/` separators on every OS, so a catalog
/// created on Windows still matches when the drive is opened on Linux.
pub fn normalize_relative_path(root: &Path, path: &Path) -> Option<String> {
    let relative = path.strip_prefix(root).ok()?;
    let parts: Vec<String> = relative
        .components()
        .map(|c| match c {
            Component::Normal(part) => Some(part.to_string_lossy().into_owned()),
            _ => None,
        })
        .collect::<Option<_>>()?;
    Some(parts.join("/"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn relative_path_uses_forward_slashes() {
        let root = Path::new("fotos");
        let path = root.join("backup").join("2024").join("IMG_1234.jpg");
        assert_eq!(
            normalize_relative_path(root, &path).as_deref(),
            Some("backup/2024/IMG_1234.jpg")
        );
        assert_eq!(
            normalize_relative_path(Path::new("a"), Path::new("b/c.jpg")),
            None
        );
    }

    #[test]
    fn classification_is_case_insensitive() {
        assert_eq!(
            classify(Path::new("x/IMG.JPG")).unwrap().1,
            MediaType::Image
        );
        assert_eq!(
            classify(Path::new("x/clip.MOV")).unwrap().1,
            MediaType::Video
        );
        assert!(classify(Path::new("x/notes.txt")).is_none());
    }
}
