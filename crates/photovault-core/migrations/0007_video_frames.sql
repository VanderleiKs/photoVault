-- Phase 6.1: video thumbnails from a frame captured by the WebView (no ffmpeg).
-- Why the last capture failed (codec the WebView can't play); NULL = not tried or done.
ALTER TABLE media ADD COLUMN frame_error TEXT;

-- Videos still waiting for a frame.
CREATE INDEX idx_media_frame_pending ON media (id)
    WHERE media_type = 'video' AND thumb_version = 0 AND frame_error IS NULL;
