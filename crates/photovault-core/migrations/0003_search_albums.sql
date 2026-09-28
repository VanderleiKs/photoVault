-- Phase 3: full-text search and albums.
--
-- `media_fts.rowid` = `media.rowid`. Never VACUUM the catalog without rebuilding this
-- index afterwards (`catalog::search::rebuild`): VACUUM may renumber rowids of tables
-- without an INTEGER PRIMARY KEY.

CREATE VIRTUAL TABLE media_fts USING fts5(
    filename,
    path,
    place,
    albums,
    tokenize = 'unicode61 remove_diacritics 2'
);

INSERT INTO media_fts (rowid, filename, path, place, albums)
SELECT m.rowid,
       m.filename,
       m.relative_path,
       (SELECT p.name || ' ' || COALESCE(p.admin1, '') FROM places p WHERE p.id = m.place_id),
       (SELECT group_concat(a.name, ' ') FROM album_media am JOIN albums a ON a.id = am.album_id
        WHERE am.media_id = m.id)
FROM media m;

CREATE TRIGGER media_fts_insert AFTER INSERT ON media BEGIN
    INSERT INTO media_fts (rowid, filename, path, place, albums)
    VALUES (NEW.rowid, NEW.filename, NEW.relative_path,
            (SELECT p.name || ' ' || COALESCE(p.admin1, '') FROM places p WHERE p.id = NEW.place_id),
            NULL);
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

-- Also fires for rows removed by ON DELETE CASCADE (album or media deleted).
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

CREATE INDEX idx_album_media_media ON album_media (media_id);
CREATE INDEX idx_albums_library ON albums (library_id);
CREATE INDEX idx_media_place ON media (library_id, place_id) WHERE place_id IS NOT NULL;

-- Gallery sorts and filters (catalog::query). Expression indexes must match the
-- expressions in `MediaSort::spec` exactly.
CREATE INDEX idx_media_oldest ON media (library_id, status, COALESCE(captured_at, '~'), id);
CREATE INDEX idx_media_name ON media (library_id, status, lower(filename), id);
CREATE INDEX idx_media_size ON media (library_id, status, file_size, id);
-- Counts by type without reading the table.
CREATE INDEX idx_media_type ON media (library_id, status, media_type);
-- Favorites in gallery order (replaces the phase-1 index without the sort key).
DROP INDEX idx_media_favorite;
CREATE INDEX idx_media_favorite ON media (library_id, status, sort_key, id) WHERE is_favorite = 1;
