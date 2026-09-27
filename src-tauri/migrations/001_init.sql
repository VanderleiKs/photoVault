-- PhotoVault initial migration

CREATE TABLE IF NOT EXISTS libraries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    root_path TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_scan_at TEXT
);

CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    library_id TEXT NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    relative_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video')),
    file_size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    captured_at TEXT,
    sha256 TEXT,
    perceptual_hash TEXT,
    quality_score REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(library_id, relative_path)
);

CREATE INDEX IF NOT EXISTS idx_photos_library_id ON photos(library_id);
CREATE INDEX IF NOT EXISTS idx_photos_captured_at ON photos(captured_at);
CREATE INDEX IF NOT EXISTS idx_photos_media_type ON photos(media_type);
CREATE INDEX IF NOT EXISTS idx_photos_sha256 ON photos(sha256);
