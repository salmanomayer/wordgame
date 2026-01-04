-- Add level system to subjects and words
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE words ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Create index for faster level queries
CREATE INDEX IF NOT EXISTS idx_subjects_difficulty_level ON subjects(difficulty, level);
CREATE INDEX IF NOT EXISTS idx_words_subject_level ON words(subject_id, level);

-- Update existing data with default levels
UPDATE subjects SET level = 1 WHERE level IS NULL;
UPDATE words SET level = 1 WHERE level IS NULL;

-- Create function to auto-generate levels based on word count
CREATE OR REPLACE FUNCTION auto_assign_word_levels()
RETURNS void AS $$
DECLARE
  subject_record RECORD;
  word_record RECORD;
  word_count INTEGER;
  level_counter INTEGER;
BEGIN
  -- For each subject, assign levels to words (5 words per level)
  FOR subject_record IN SELECT id FROM subjects LOOP
    level_counter := 1;
    word_count := 0;
    
    FOR word_record IN 
      SELECT id FROM words 
      WHERE subject_id = subject_record.id 
      ORDER BY created_at
    LOOP
      UPDATE words SET level = level_counter WHERE id = word_record.id;
      word_count := word_count + 1;
      
      -- Move to next level after 5 words
      IF word_count >= 5 THEN
        level_counter := level_counter + 1;
        word_count := 0;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the auto-assignment
SELECT auto_assign_word_levels();

-- Add comment
COMMENT ON COLUMN words.level IS 'Level within subject (5 words per level)';
COMMENT ON COLUMN subjects.level IS 'Base level for subject category';
