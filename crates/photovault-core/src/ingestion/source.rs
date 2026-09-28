//! Abstraction over where media comes from (PRD §5.4): local folder today,
//! Android MediaStore / network later.

use crate::catalog::MediaType;
use crate::error::Result;
use std::path::PathBuf;

/// A file found by a source, before it is indexed.
#[derive(Debug, Clone)]
pub struct SourceEntry {
    /// Stable id inside the source: '/'-separated relative path for folders,
    /// content URI for Android.
    pub relative_path: String,
    pub filename: String,
    pub extension: String,
    pub media_type: MediaType,
    pub size: u64,
    /// RFC 3339 modification time, when known.
    pub modified: Option<String>,
    /// Direct filesystem path, when the source is a local folder.
    pub local_path: Option<PathBuf>,
}

pub trait MediaSource: Send + Sync {
    /// Short identifier stored in `libraries.source_kind`.
    fn kind(&self) -> &'static str;

    /// Enumerate supported media. Blocking: iterate from a blocking thread.
    /// Unreadable entries are logged and skipped, never fatal.
    fn entries(&self) -> Box<dyn Iterator<Item = SourceEntry> + Send + '_>;

    /// Open an entry for reading (hashing, decoding).
    fn open(&self, entry: &SourceEntry) -> Result<Box<dyn std::io::Read + Send>>;
}
