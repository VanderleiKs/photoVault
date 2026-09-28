-- Catalogs created on Windows stored relative paths with '\'.
-- Paths are now always stored with '/', on every OS.
UPDATE photos SET relative_path = REPLACE(relative_path, '\', '/')
WHERE instr(relative_path, '\') > 0;
