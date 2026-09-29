-- Phase 5: colour-aware duplicates, review suggestions, examples and the trash.

-- Per-cell chroma (the pHash only sees luminance) and the features used to find photos
-- like the user's examples. Both come from the 1024 px preview.
ALTER TABLE media_quality ADD COLUMN color_layout BLOB;
ALTER TABLE media_quality ADD COLUMN descriptor BLOB;
-- Lines of text (documents need them; people/objects on white don't have them).
ALTER TABLE media_quality ADD COLUMN text_lines INTEGER;

-- Re-analyse what was analysed before (reads only the local previews).
UPDATE jobs SET status = 'queued', attempts = 0, error = NULL,
                updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE stage = 'analyze' AND status IN ('done', 'failed');

-- Suggestions were never written before this version: recreate the table with the
-- EXAMPLE reason, the library (for counters) and `group_id` as a plain reference, since
-- groups and bursts are rebuilt with new ids on every pass.
DROP INDEX idx_review_pending;
DROP TABLE review_candidates;
CREATE TABLE review_candidates (
    id              TEXT PRIMARY KEY,
    library_id      TEXT NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    media_id        TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    reason          TEXT NOT NULL CHECK (reason IN (
                        'EXACT_DUPLICATE', 'VISUAL_DUPLICATE', 'SIMILAR_SEQUENCE', 'BLURRY', 'DARK',
                        'OVEREXPOSED', 'LOW_RESOLUTION', 'SCREENSHOT', 'MOMENTARY', 'ACCIDENTAL',
                        'LOW_INFORMATION', 'EXAMPLE')),
    -- 0–1: how sure the heuristic is.
    score           REAL NOT NULL DEFAULT 0,
    -- Similarity group, burst or example that produced it.
    group_id        TEXT,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'kept', 'ignored', 'trashed')),
    created_at      TEXT NOT NULL,
    decided_at      TEXT,
    UNIQUE (media_id, reason)
);
CREATE INDEX idx_review_library ON review_candidates (library_id, status, reason);
CREATE INDEX idx_review_decided ON review_candidates (library_id, decided_at) WHERE decided_at IS NOT NULL;

-- Priority of an item's pending suggestions (0–1000), NULL = nothing to review. Kept on
-- `media` so the Review screen sorts with an index like every other gallery.
ALTER TABLE media ADD COLUMN review_priority INTEGER;
-- Same expression as `MediaSort::Priority`.
CREATE INDEX idx_media_review ON media (library_id, status, COALESCE(review_priority, -1), id);

-- Photos the user gave as examples of what to remove (or never suggest). Global and
-- self-contained: the example survives its photo being trashed or coming from outside
-- the libraries.
CREATE TABLE review_examples (
    id              TEXT PRIMARY KEY,
    intent          TEXT NOT NULL CHECK (intent IN ('remove', 'keep')),
    media_id        TEXT REFERENCES media(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    descriptor      BLOB NOT NULL,
    -- Small WebP as a data: URL (shown in Settings without the pv:// protocol).
    thumbnail       TEXT NOT NULL,
    created_at      TEXT NOT NULL
);

CREATE INDEX idx_trash_library ON trash_items (library_id, deleted_at)
    WHERE restored_at IS NULL AND purged_at IS NULL;
CREATE INDEX idx_trash_media ON trash_items (media_id);
CREATE INDEX idx_operations_created ON operations_log (created_at);
