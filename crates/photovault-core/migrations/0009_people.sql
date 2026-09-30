-- Phase 7b: people. Faces found by the local AI in each photo's 1024 px preview, grouped
-- into people. Groups are recomputed (`people::rebuild`); the user's decisions are not:
-- a name, a face put in a person (`confirmed`), a face taken out (`face_rejections`).

-- `name` NULL = suggested group ("Pessoa sem nome"). `hidden` = the user doesn't want to
-- see it (its faces stay confirmed to it, so new photos of that person stay out too).
CREATE TABLE people (
    id            TEXT PRIMARY KEY,
    name          TEXT,
    hidden        INTEGER NOT NULL DEFAULT 0,
    cover_face_id TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);

-- Box as fractions of the preview; `size` = short side in preview pixels; `frontal` 1 =
-- facing the camera. `vector` = f32 scale (LE) + 128 int8 (SFace).
CREATE TABLE faces (
    id         TEXT PRIMARY KEY,
    media_id   TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    x          REAL NOT NULL,
    y          REAL NOT NULL,
    w          REAL NOT NULL,
    h          REAL NOT NULL,
    score      REAL NOT NULL,
    frontal    REAL NOT NULL,
    size       INTEGER NOT NULL,
    vector     BLOB NOT NULL,
    person_id  TEXT REFERENCES people(id) ON DELETE SET NULL,
    confirmed  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_faces_media ON faces(media_id);
CREATE INDEX idx_faces_person ON faces(person_id, media_id);

-- "This isn't Ana": never put this face in this person again.
CREATE TABLE face_rejections (
    face_id   TEXT NOT NULL REFERENCES faces(id) ON DELETE CASCADE,
    person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    PRIMARY KEY (face_id, person_id)
);

-- Photos already searched for faces (with this model and this preview), found or not.
CREATE TABLE face_scans (
    media_id      TEXT PRIMARY KEY REFERENCES media(id) ON DELETE CASCADE,
    model         TEXT NOT NULL,
    thumb_version INTEGER NOT NULL,
    faces         INTEGER NOT NULL,
    error         TEXT,
    created_at    TEXT NOT NULL
);

-- Set when faces or decisions change; the queue regroups when it's idle.
CREATE TABLE people_state (
    id    INTEGER PRIMARY KEY CHECK (id = 1),
    dirty INTEGER NOT NULL
);
INSERT INTO people_state (id, dirty) VALUES (1, 0);
