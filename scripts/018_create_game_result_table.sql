
-- Create game results table to track individual game results
CREATE TABLE IF NOT EXISTS game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id),
  is_correct BOOLEAN NOT NULL,
  time_taken INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
