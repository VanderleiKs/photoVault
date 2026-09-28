-- PhotoVault catalog schema v1 (PRD §6).
-- Migrations are immutable: add a new file instead of editing this one.
-- Dates are ISO-8601 UTC strings. Classification is multidimensional (labels,
-- quality, favorite, events, sequences): there is no single "classification" column.

CREATE TABLE libraries (
    id              TEXT PRIMARY KEY,
    uid             TEXT NOT NULL UNIQUE,          -- stable identity across computers
    name            TEXT NOT NULL,
    root_path       TEXT NOT NULL,                 -- absolute, as seen on this computer
    root_path_rel   TEXT,                          -- relative to the app base dir (same volume)
    source_kind     TEXT NOT NULL DEFAULT 'local_folder',
    created_at      TEXT NOT NULL,
    last_scan_at    TEXT
);

CREATE TABLE places (
    id              INTEGER PRIMARY KEY,
    name            TEXT NOT NULL,
    admin1          TEXT,
    country_code    TEXT,
    lat             REAL NOT NULL,
    lon             REAL NOT NULL
);

CREATE TABLE sequences (
    id              TEXT PRIMARY KEY,
    library_id      TEXT NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    started_at      TEXT NOT NULL,
    ended_at        TEXT NOT NULL,
    size            INTEGER NOT NULL,
    best_media_id   TEXT
);

CREATE TABLE media (
    id              TEXT PRIMARY KEY,
    library_id      TEXT NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    relative_path   TEXT NOT NULL,                 -- always '/'-separated, NFC
    filename        TEXT NOT NULL,
    extension       TEXT NOT NULL,
    media_type      TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    file_size       INTEGER NOT NULL,
    file_mtime      TEXT,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'missing', 'trashed')),

    width           INTEGER,
    height          INTEGER,
    orientation     INTEGER,
    duration_ms     INTEGER,

    captured_at       TEXT,
    captured_at_local TEXT,
    date_source       TEXT CHECK (date_source IN ('exif_original', 'exif_datetime', 'file_meta', 'filename', 'mtime')),

    gps_lat         REAL,
    gps_lon         REAL,
    place_id        INTEGER REFERENCES places(id) ON DELETE SET NULL,

    camera_make     TEXT,
    camera_model    TEXT,
    lens            TEXT,
    iso             INTEGER,
    aperture        REAL,
    shutter         TEXT,
    focal_length    REAL,

    sha256          TEXT,
    phash           TEXT,

    is_favorite     INTEGER NOT NULL DEFAULT 0,
    personal_value  TEXT NOT NULL DEFAULT 'unknown' CHECK (personal_value IN ('unknown', 'low', 'high')),
    sequence_id     TEXT REFERENCES sequences(id) ON DELETE SET NULL,

    -- Gallery order key: newest first, undated last (see catalog::media).
    sort_key        TEXT GENERATED ALWAYS AS (COALESCE(captured_at, '')) VIRTUAL,

    indexed_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    UNIQUE (library_id, relative_path)
);

CREATE INDEX idx_media_gallery ON media (library_id, status, sort_key DESC, id DESC);
CREATE INDEX idx_media_sha256 ON media (sha256) WHERE sha256 IS NOT NULL;
CREATE INDEX idx_media_favorite ON media (library_id) WHERE is_favorite = 1;

CREATE TABLE media_quality (
    media_id        TEXT PRIMARY KEY REFERENCES media(id) ON DELETE CASCADE,
    sharpness       REAL,
    brightness      REAL,
    clipped_high    REAL,
    clipped_low     REAL,
    megapixels      REAL,
    level           TEXT CHECK (level IN ('low', 'medium', 'high')),
    flags           TEXT NOT NULL DEFAULT '[]',    -- JSON array: blurry, dark, overexposed, low_res, empty
    analyzed_at     TEXT NOT NULL
);

CREATE TABLE labels (
    id              INTEGER PRIMARY KEY,
    dimension       TEXT NOT NULL CHECK (dimension IN ('category', 'scene', 'momentary', 'tag')),
    value           TEXT NOT NULL,
    UNIQUE (dimension, value)
);

CREATE TABLE media_labels (
    media_id        TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    label_id        INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    score           REAL,
    source          TEXT NOT NULL CHECK (source IN ('auto', 'manual')),
    PRIMARY KEY (media_id, label_id)
);

CREATE TABLE similarity_groups (
    id              TEXT PRIMARY KEY,
    library_id      TEXT NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    kind            TEXT NOT NULL CHECK (kind IN ('exact_duplicate', 'visual_duplicate', 'similar')),
    best_media_id   TEXT REFERENCES media(id) ON DELETE SET NULL
);

CREATE TABLE similarity_members (
    group_id        TEXT NOT NULL REFERENCES similarity_groups(id) ON DELETE CASCADE,
    media_id        TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    distance        INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (group_id, media_id)
);

-- One row per (media, reason). Suggestions only: nothing is ever deleted automatically.
CREATE TABLE review_candidates (
    id              TEXT PRIMARY KEY,
    media_id        TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    reason          TEXT NOT NULL CHECK (reason IN (
                        'EXACT_DUPLICATE', 'VISUAL_DUPLICATE', 'SIMILAR_SEQUENCE', 'BLURRY', 'DARK',
                        'OVEREXPOSED', 'LOW_RESOLUTION', 'SCREENSHOT', 'MOMENTARY', 'ACCIDENTAL',
                        'LOW_INFORMATION')),
    score           REAL NOT NULL DEFAULT 0,
    group_id        TEXT REFERENCES similarity_groups(id) ON DELETE SET NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'kept', 'ignored', 'trashed')),
    created_at      TEXT NOT NULL,
    decided_at      TEXT,
    UNIQUE (media_id, reason)
);

CREATE INDEX idx_review_pending ON review_candidates (reason) WHERE status = 'pending';

CREATE TABLE events (
    id              TEXT PRIMARY KEY,
    library_id      TEXT NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    kind            TEXT NOT NULL CHECK (kind IN ('trip', 'event')),
    title           TEXT NOT NULL,
    started_at      TEXT NOT NULL,
    ended_at        TEXT NOT NULL,
    place_summary   TEXT,
    status          TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'accepted', 'ignored', 'edited'))
);

CREATE TABLE event_media (
    event_id        TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    media_id        TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, media_id)
);

CREATE TABLE albums (
    id              TEXT PRIMARY KEY,
    library_id      TEXT NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    kind            TEXT NOT NULL CHECK (kind IN ('manual', 'smart')),
    rule_json       TEXT,
    cover_media_id  TEXT REFERENCES media(id) ON DELETE SET NULL,
    created_at      TEXT NOT NULL
);

CREATE TABLE album_media (
    album_id        TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    media_id        TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    position        INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (album_id, media_id)
);

CREATE TABLE trash_items (
    id                      TEXT PRIMARY KEY,
    media_id                TEXT REFERENCES media(id) ON DELETE SET NULL,
    library_id              TEXT NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    original_relative_path  TEXT NOT NULL,
    trash_relative_path     TEXT NOT NULL,
    deleted_at              TEXT NOT NULL,
    restored_at             TEXT,
    purged_at               TEXT
);

-- Every physical filesystem operation (trash, restore, move, rename) is logged here.
CREATE TABLE operations_log (
    id              TEXT PRIMARY KEY,
    kind            TEXT NOT NULL,
    payload_json    TEXT NOT NULL,
    status          TEXT NOT NULL CHECK (status IN ('pending', 'done', 'failed', 'rolled_back')),
    created_at      TEXT NOT NULL,
    finished_at     TEXT
);

-- Analysis pipeline state (phase 2): one row per (media, stage).
CREATE TABLE jobs (
    id              TEXT PRIMARY KEY,
    library_id      TEXT NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    media_id        TEXT REFERENCES media(id) ON DELETE CASCADE,
    stage           TEXT NOT NULL,
    status          TEXT NOT NULL CHECK (status IN ('queued', 'running', 'done', 'failed', 'skipped')),
    attempts        INTEGER NOT NULL DEFAULT 0,
    error           TEXT,
    updated_at      TEXT NOT NULL,
    UNIQUE (media_id, stage)
);

CREATE INDEX idx_jobs_queue ON jobs (library_id, status, stage);

CREATE TABLE settings (
    key             TEXT PRIMARY KEY,
    value           TEXT NOT NULL
);
