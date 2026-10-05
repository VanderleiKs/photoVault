-- Phase 9a: "Melhorar fotos" (PRD §29, ADR 009). An edit is a recipe; the original file
-- never changes. Edited thumbnails live apart (`thumbnails/edit/…`): the analysis ones
-- (pHash, CLIP, faces) never change because of an edit.
CREATE TABLE media_edits (
    media_id       TEXT PRIMARY KEY REFERENCES media(id) ON DELETE CASCADE,
    recipe_json    TEXT NOT NULL,
    recipe_version INTEGER NOT NULL,
    -- Bumps on every change of the recipe.
    revision       INTEGER NOT NULL,
    -- Automatic values computed from the original: {"sha256", "values"} (recomputed
    -- when the file or `AUTO_VERSION` changes; the fine tuning is kept).
    auto_json      TEXT,
    -- Revision whose edited thumbnails exist (0 = none yet).
    thumb_revision INTEGER NOT NULL DEFAULT 0,
    -- Rendering the thumbnails failed for `revision` (not retried until it changes).
    thumb_error    TEXT,
    updated_at     TEXT NOT NULL
);
CREATE INDEX idx_media_edits_pending ON media_edits (updated_at)
    WHERE thumb_revision < revision AND thumb_error IS NULL;

-- One "Aplicar" on a scope (undone as a whole).
CREATE TABLE edit_batches (
    id          TEXT PRIMARY KEY,
    library_id  TEXT NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    recipe_json TEXT NOT NULL,
    count       INTEGER NOT NULL,
    status      TEXT NOT NULL CHECK (status IN ('applied', 'undone')),
    created_at  TEXT NOT NULL
);
CREATE INDEX idx_edit_batches_library ON edit_batches (library_id, created_at);

-- The recipe *before* each change (NULL = the photo had no edit), for undo. Pruned to
-- the latest entries per photo.
CREATE TABLE media_edit_history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    media_id      TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    batch_id      TEXT REFERENCES edit_batches(id) ON DELETE SET NULL,
    previous_json TEXT,
    source        TEXT NOT NULL CHECK (source IN ('apply', 'adjust', 'reset')),
    created_at    TEXT NOT NULL
);
CREATE INDEX idx_edit_history_media ON media_edit_history (media_id, id);
CREATE INDEX idx_edit_history_batch ON media_edit_history (batch_id);
