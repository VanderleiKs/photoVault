-- Phase 8: reorganizing files on disk by a rule ("{ano}/{mes} - {mes_nome}"). A batch is
-- the plan the user confirmed; each item is one file (with its sidecars) to move. Items
-- are done one by one, each logged in `operations_log` first, so a batch can be paused,
-- resumed after the disk comes back, and undone (in reverse order).
CREATE TABLE arrange_batches (
    id          TEXT PRIMARY KEY,
    library_id  TEXT NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    rule_json   TEXT NOT NULL,
    status      TEXT NOT NULL CHECK (status IN ('planned', 'running', 'paused', 'done',
                                                'undoing', 'undo_paused', 'undone', 'discarded')),
    -- Why it stopped (disk disconnected…), for the UI.
    message     TEXT,
    created_at  TEXT NOT NULL,
    started_at  TEXT,
    finished_at TEXT
);
CREATE INDEX idx_arrange_batches_library ON arrange_batches (library_id, created_at);

-- `sidecars_json` = [[from, to], …] of files that go with it (.xmp, .aae, .json).
CREATE TABLE arrange_items (
    batch_id      TEXT NOT NULL REFERENCES arrange_batches(id) ON DELETE CASCADE,
    seq           INTEGER NOT NULL,
    media_id      TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    from_path     TEXT NOT NULL,
    to_path       TEXT NOT NULL,
    sidecars_json TEXT NOT NULL DEFAULT '[]',
    status        TEXT NOT NULL CHECK (status IN ('pending', 'done', 'failed', 'skipped', 'undone')),
    error         TEXT,
    PRIMARY KEY (batch_id, seq)
);
CREATE INDEX idx_arrange_items_status ON arrange_items (batch_id, status, seq);
