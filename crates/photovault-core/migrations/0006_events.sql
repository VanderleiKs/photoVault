-- Phase 6: trips and events (PRD §17). The tables exist since 0001; they gain the
-- bookkeeping of the suggestions.

-- When it was suggested / decided, and how far from home (trips).
ALTER TABLE events ADD COLUMN created_at TEXT;
ALTER TABLE events ADD COLUMN decided_at TEXT;
ALTER TABLE events ADD COLUMN distance_km REAL;

CREATE INDEX idx_events_library ON events (library_id, status, started_at);
CREATE INDEX idx_event_media_media ON event_media (media_id);

-- Detect events in every library on the next global pass.
INSERT INTO analysis_state (library_id, dirty) SELECT id, 1 FROM libraries WHERE true
ON CONFLICT (library_id) DO UPDATE SET dirty = 1;
