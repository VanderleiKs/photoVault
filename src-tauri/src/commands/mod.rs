//! IPC commands: the only public API of the backend. Keep them thin; logic lives in
//! `photovault-core`.

pub mod albums;
pub mod events;
pub mod jobs;
pub mod libraries;
pub mod media;
pub mod organize;
pub mod review;
pub mod scan;
pub mod system;

use crate::state::AppState;
use std::sync::Arc;
use tauri::State;

pub type AppStateRef<'a> = State<'a, Arc<AppState>>;
