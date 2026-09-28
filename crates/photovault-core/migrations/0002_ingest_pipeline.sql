-- Phase 2: background ingest pipeline.

-- Bumped every time thumbnails are (re)written; the UI appends it to thumbnail
-- URLs so the WebView cache never shows a stale image. 0 = not generated yet.
ALTER TABLE media ADD COLUMN thumb_version INTEGER NOT NULL DEFAULT 0;

-- Relinking moved files looks up missing media by content hash.
CREATE INDEX idx_media_library_sha256 ON media (library_id, sha256) WHERE sha256 IS NOT NULL;

-- Places are shared by every photo taken there.
CREATE UNIQUE INDEX idx_places_identity ON places (name, admin1, country_code);

-- Catalogs from v0.3 were indexed without EXIF/hashes: queue them all once.
INSERT INTO jobs (id, library_id, media_id, stage, status, updated_at)
SELECT lower(hex(randomblob(16))), library_id, id, 'ingest', 'queued', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM media
WHERE true
ON CONFLICT (media_id, stage) DO NOTHING;
