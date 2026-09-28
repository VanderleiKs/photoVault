//! PhotoVault core: catalog, ingestion and thumbnails.
//!
//! Has no Tauri dependency so it can be tested with `cargo test` and reused by
//! the future Android build. The `src-tauri` crate only adapts it to IPC.

pub mod analysis;
pub mod catalog;
pub mod db;
pub mod error;
pub mod ingestion;
pub mod jobs;
pub mod paths;
pub mod thumbnails;
pub mod volume;

pub use error::{Error, Result};
