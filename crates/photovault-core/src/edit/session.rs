//! Live preview: decoded photos kept in memory (reduced, linear) so a slider move only
//! renders. The recipe being edited (the *draft*) lives here too; the editor saves it
//! to the catalog as it goes.

use std::path::Path;
use std::sync::{Arc, Mutex};

use sqlx::SqlitePool;

use super::encode::{JpegOptions, jpeg};
use super::{AutoValues, EditRecipe, Linear, Resolved, auto, decode, pipeline, resolve, store};
use crate::catalog::media;
use crate::error::{Error, Result};

/// Largest preview edge served.
pub const MAX_EDGE: u32 = 1600;
/// Memory kept for decoded photos (all sessions together).
const BUDGET_BYTES: usize = 256 * 1024 * 1024;

struct Entry {
    media_id: String,
    /// Long edge the photo was decoded to.
    edge: u32,
    /// The photo is no bigger than that: any edge can be served.
    complete: bool,
    sizes: Vec<(u32, Arc<Linear>)>,
    auto: AutoValues,
    draft: Option<EditRecipe>,
    version: u32,
}

impl Entry {
    fn bytes(&self) -> usize {
        self.sizes.iter().map(|(_, l)| l.data.len() * 4).sum()
    }
}

/// Most recently used last.
#[derive(Default)]
pub struct Sessions {
    entries: Mutex<Vec<Entry>>,
}

/// What [`Sessions::preview`] renders.
#[derive(Debug, Clone, Default)]
pub struct PreviewRequest {
    pub edge: u32,
    /// The original (identity render).
    pub before: bool,
    /// A recipe to try (the before/after grid); `None` = the draft, else the saved
    /// edit, else the default automatic one.
    pub recipe: Option<EditRecipe>,
}

impl Sessions {
    pub fn new() -> Self {
        Self::default()
    }

    fn lock(&self) -> std::sync::MutexGuard<'_, Vec<Entry>> {
        self.entries.lock().unwrap_or_else(|e| e.into_inner())
    }

    /// Photo at `edge` (derived once from the decoded one), with its automatic values
    /// and draft. `None` = not decoded big enough yet.
    fn sized(
        &self,
        media_id: &str,
        edge: u32,
    ) -> Option<(Arc<Linear>, AutoValues, Option<EditRecipe>)> {
        let mut entries = self.lock();
        let pos = entries.iter().position(|e| e.media_id == media_id)?;
        let mut entry = entries.remove(pos);
        if edge > entry.edge && !entry.complete {
            entries.push(entry);
            return None;
        }
        let found = entry
            .sizes
            .iter()
            .find(|(e, _)| *e == edge)
            .map(|(_, l)| Arc::clone(l));
        let img = match found {
            Some(img) => img,
            None => {
                let source = Arc::clone(&entry.sizes[0].1);
                let img = Arc::new(source.fit(edge).ok()?);
                entry.sizes.push((edge, Arc::clone(&img)));
                img
            }
        };
        let result = (img, entry.auto.clone(), entry.draft.clone());
        entries.push(entry);
        evict(&mut entries);
        Some(result)
    }

    fn insert(&self, media_id: &str, edge: u32, source: Linear, auto: AutoValues) {
        let mut entries = self.lock();
        let (draft, version) = match entries.iter().position(|e| e.media_id == media_id) {
            Some(pos) => {
                let old = entries.remove(pos);
                (old.draft, old.version)
            }
            None => (None, 0),
        };
        entries.push(Entry {
            media_id: media_id.to_string(),
            edge,
            complete: source.long_edge() < edge,
            sizes: vec![(edge, Arc::new(source))],
            auto,
            draft,
            version,
        });
        evict(&mut entries);
    }

    /// The editor's current recipe; returns its version (for `?v=` in the preview URL).
    pub fn set_draft(&self, media_id: &str, recipe: EditRecipe) -> u32 {
        let mut entries = self.lock();
        match entries.iter_mut().find(|e| e.media_id == media_id) {
            Some(entry) => {
                entry.draft = Some(recipe);
                entry.version += 1;
                entry.version
            }
            // Not opened yet: the next preview opens it and uses the saved recipe.
            None => 0,
        }
    }

    /// Drops the draft (the editor closed); the decoded photo stays for a while.
    pub fn close(&self, media_id: &str) {
        if let Some(entry) = self.lock().iter_mut().find(|e| e.media_id == media_id) {
            entry.draft = None;
        }
    }

    /// Opens the photo if needed and returns its automatic values (shown by the editor).
    pub async fn open(&self, pool: &SqlitePool, media_id: &str, edge: u32) -> Result<AutoValues> {
        if let Some((_, auto, _)) = self.sized(media_id, edge) {
            return Ok(auto);
        }
        let (root, relative, _) = media::location(pool, media_id).await?;
        let path = Path::new(&root).join(&relative);
        let cached = store::auto_values(pool, media_id).await?;
        let source_edge = if edge > 1024 { MAX_EDGE } else { 1024 };
        let (source, auto) =
            tokio::task::spawn_blocking(move || -> std::result::Result<_, String> {
                let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
                let source = decode::decode_fit(&bytes, Some(source_edge))?;
                let auto = match cached {
                    Some(a) => a,
                    None => auto::analyze(&source)?,
                };
                Ok((source, auto))
            })
            .await?
            .map_err(|e| Error::InvalidInput(format!("Não foi possível abrir a foto: {e}")))?;
        self.insert(media_id, source_edge, source, auto.clone());
        Ok(auto)
    }

    /// JPEG of the photo at `req.edge` with the requested recipe.
    pub async fn preview(
        &self,
        pool: &SqlitePool,
        media_id: &str,
        req: PreviewRequest,
        threads: usize,
    ) -> Result<Vec<u8>> {
        let edge = req.edge.clamp(64, MAX_EDGE);
        let mut found = self.sized(media_id, edge);
        if found.is_none() {
            self.open(pool, media_id, edge).await?;
            found = self.sized(media_id, edge);
        }
        let (img, auto, draft) = found.ok_or(Error::MediaNotFound)?;
        let resolved = if req.before {
            Resolved::identity()
        } else {
            let recipe = match (req.recipe, draft) {
                (Some(r), _) | (None, Some(r)) => r,
                (None, None) => store::get(pool, media_id)
                    .await?
                    .map(|e| e.recipe)
                    .unwrap_or_default(),
            };
            resolve(&recipe, Some(&auto))
        };
        tokio::task::spawn_blocking(move || {
            let out = pipeline::render(&img, &resolved, None, threads)?;
            jpeg(&out, &JpegOptions::preview())
        })
        .await?
        .map_err(Error::Internal)
    }
}

/// Least recently used out until under the budget (the newest always stays).
fn evict(entries: &mut Vec<Entry>) {
    while entries.len() > 1 && entries.iter().map(Entry::bytes).sum::<usize>() > BUDGET_BYTES {
        entries.remove(0);
    }
}
