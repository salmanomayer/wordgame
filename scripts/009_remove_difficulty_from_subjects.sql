-- Remove difficulty from subjects as it's now a playing mode, not a subject property
ALTER TABLE subjects DROP COLUMN IF EXISTS difficulty;

-- Update subjects to be simple categories
UPDATE subjects SET description = 'Subject category for word puzzles' WHERE description IS NULL;

-- Ensure game_sessions still tracks difficulty as a mode selection
-- (no changes needed for game_sessions as difficulty remains a player choice)
