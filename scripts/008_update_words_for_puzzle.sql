-- Add missing_position column to words table to indicate which letter is missing
ALTER TABLE words ADD COLUMN IF NOT EXISTS missing_position INTEGER DEFAULT 1;
ALTER TABLE words ADD COLUMN IF NOT EXISTS correct_letter TEXT;
ALTER TABLE words ADD COLUMN IF NOT EXISTS wrong_options TEXT[]; -- Array of 3 wrong letter options

-- Update existing words with some sample data
-- This would be done via the admin panel, but here's an example
COMMENT ON COLUMN words.missing_position IS 'Position of the missing letter in the word (1-indexed)';
COMMENT ON COLUMN words.correct_letter IS 'The correct letter that fills the blank';
COMMENT ON COLUMN words.wrong_options IS 'Array of 3 incorrect letter options';
