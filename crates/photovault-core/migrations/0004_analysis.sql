-- Phase 4: technical analysis, labels and groups.

-- Libraries whose groups must be recomputed (set by ingest/analysis/edits).
CREATE TABLE analysis_state (
    library_id      TEXT PRIMARY KEY REFERENCES libraries(id) ON DELETE CASCADE,
    dirty           INTEGER NOT NULL DEFAULT 1,
    analyzed_at     TEXT
);
INSERT INTO analysis_state (library_id) SELECT id FROM libraries;

-- Raw metrics: flags and level are derived with the current thresholds, so changing a
-- threshold never requires re-reading the photos.
ALTER TABLE media_quality ADD COLUMN contrast REAL;
ALTER TABLE media_quality ADD COLUMN entropy REAL;
ALTER TABLE media_quality ADD COLUMN saturation REAL;
ALTER TABLE media_quality ADD COLUMN colors_90 INTEGER;
ALTER TABLE media_quality ADD COLUMN edge_density REAL;
ALTER TABLE media_quality ADD COLUMN highlights REAL;

-- Automatic labels keep their score; `active` = score reaches the current threshold.
ALTER TABLE media_labels ADD COLUMN active INTEGER NOT NULL DEFAULT 1;

CREATE INDEX idx_media_labels_label ON media_labels (label_id, active);
CREATE INDEX idx_media_quality_level ON media_quality (level);
CREATE INDEX idx_similarity_groups_library ON similarity_groups (library_id, kind);
CREATE INDEX idx_similarity_members_media ON similarity_members (media_id);
CREATE INDEX idx_sequences_library ON sequences (library_id);
CREATE INDEX idx_media_sequence ON media (sequence_id) WHERE sequence_id IS NOT NULL;

-- Search gains a `labels` column (tags and categories). FTS5 tables can't be altered:
-- recreate the index and its triggers. `rowid` = `media.rowid` (see 0003).
DROP TRIGGER media_fts_insert;
DROP TRIGGER media_fts_delete;
DROP TRIGGER media_fts_update;
DROP TRIGGER album_media_fts_insert;
DROP TRIGGER album_media_fts_delete;
DROP TRIGGER albums_fts_rename;
DROP TABLE media_fts;

CREATE VIRTUAL TABLE media_fts USING fts5(
    filename,
    path,
    place,
    albums,
    labels,
    tokenize = 'unicode61 remove_diacritics 2'
);

-- Label words searched in Portuguese as well as by value.
CREATE VIEW media_label_text AS
SELECT ml.media_id,
       group_concat(CASE
           WHEN l.dimension = 'tag' THEN l.value
           WHEN l.value = 'screenshot' THEN 'screenshot captura de tela'
           WHEN l.value = 'document' THEN 'documento'
           WHEN l.value = 'accidental' THEN 'acidental'
           ELSE l.value END, ' ') AS text
FROM media_labels ml JOIN labels l ON l.id = ml.label_id
WHERE ml.active = 1
GROUP BY ml.media_id;

INSERT INTO media_fts (rowid, filename, path, place, albums, labels)
SELECT m.rowid,
       m.filename,
       m.relative_path,
       (SELECT p.name || ' ' || COALESCE(p.admin1, '') FROM places p WHERE p.id = m.place_id),
       (SELECT group_concat(a.name, ' ') FROM album_media am JOIN albums a ON a.id = am.album_id
        WHERE am.media_id = m.id),
       (SELECT text FROM media_label_text WHERE media_id = m.id)
FROM media m;

CREATE TRIGGER media_fts_insert AFTER INSERT ON media BEGIN
    INSERT INTO media_fts (rowid, filename, path, place, albums, labels)
    VALUES (NEW.rowid, NEW.filename, NEW.relative_path,
            (SELECT p.name || ' ' || COALESCE(p.admin1, '') FROM places p WHERE p.id = NEW.place_id),
            NULL, NULL);
END;

CREATE TRIGGER media_fts_delete AFTER DELETE ON media BEGIN
    DELETE FROM media_fts WHERE rowid = OLD.rowid;
END;

CREATE TRIGGER media_fts_update AFTER UPDATE OF filename, relative_path, place_id ON media BEGIN
    UPDATE media_fts
    SET filename = NEW.filename,
        path = NEW.relative_path,
        place = (SELECT p.name || ' ' || COALESCE(p.admin1, '') FROM places p WHERE p.id = NEW.place_id)
    WHERE rowid = NEW.rowid;
END;

CREATE TRIGGER album_media_fts_insert AFTER INSERT ON album_media BEGIN
    UPDATE media_fts
    SET albums = (SELECT group_concat(a.name, ' ') FROM album_media am JOIN albums a ON a.id = am.album_id
                  WHERE am.media_id = NEW.media_id)
    WHERE rowid = (SELECT rowid FROM media WHERE id = NEW.media_id);
END;

CREATE TRIGGER album_media_fts_delete AFTER DELETE ON album_media BEGIN
    UPDATE media_fts
    SET albums = (SELECT group_concat(a.name, ' ') FROM album_media am JOIN albums a ON a.id = am.album_id
                  WHERE am.media_id = OLD.media_id)
    WHERE rowid = (SELECT rowid FROM media WHERE id = OLD.media_id);
END;

CREATE TRIGGER albums_fts_rename AFTER UPDATE OF name ON albums BEGIN
    UPDATE media_fts
    SET albums = (SELECT group_concat(a.name, ' ') FROM album_media am JOIN albums a ON a.id = am.album_id
                  WHERE am.media_id = (SELECT id FROM media WHERE rowid = media_fts.rowid))
    WHERE rowid IN (SELECT m.rowid FROM media m JOIN album_media am ON am.media_id = m.id
                    WHERE am.album_id = NEW.id);
END;

CREATE TRIGGER media_labels_fts_insert AFTER INSERT ON media_labels BEGIN
    UPDATE media_fts SET labels = (SELECT text FROM media_label_text WHERE media_id = NEW.media_id)
    WHERE rowid = (SELECT rowid FROM media WHERE id = NEW.media_id);
END;

CREATE TRIGGER media_labels_fts_delete AFTER DELETE ON media_labels BEGIN
    UPDATE media_fts SET labels = (SELECT text FROM media_label_text WHERE media_id = OLD.media_id)
    WHERE rowid = (SELECT rowid FROM media WHERE id = OLD.media_id);
END;

CREATE TRIGGER media_labels_fts_active AFTER UPDATE OF active ON media_labels BEGIN
    UPDATE media_fts SET labels = (SELECT text FROM media_label_text WHERE media_id = NEW.media_id)
    WHERE rowid = (SELECT rowid FROM media WHERE id = NEW.media_id);
END;

-- Analyse everything already ingested (catalogs from v0.4/v0.5).
INSERT INTO jobs (id, library_id, media_id, stage, status, updated_at)
SELECT lower(hex(randomblob(16))), library_id, id, 'analyze', 'queued', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM media
WHERE thumb_version > 0 AND media_type = 'image'
ON CONFLICT (media_id, stage) DO NOTHING;
