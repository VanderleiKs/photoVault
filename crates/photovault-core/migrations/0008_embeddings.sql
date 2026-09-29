-- Phase 7a: CLIP embedding of each photo (local AI, optional). `vector` = f32 scale (LE)
-- followed by 512 int8; NULL with `error` when the preview couldn't be read.
-- `thumb_version` = the preview it came from: a new preview (edited file, video frame)
-- puts the photo back in line.
CREATE TABLE media_embeddings (
    media_id    TEXT PRIMARY KEY REFERENCES media(id) ON DELETE CASCADE,
    model       TEXT NOT NULL,
    thumb_version INTEGER NOT NULL,
    vector      BLOB,
    error       TEXT,
    created_at  TEXT NOT NULL
);
