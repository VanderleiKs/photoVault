-- Phase 8.1: "Não é um rosto" (a doll, a pattern): the detection stays (so a new preview
-- doesn't bring it back) but is never shown nor grouped.
ALTER TABLE faces ADD COLUMN ignored INTEGER NOT NULL DEFAULT 0;
