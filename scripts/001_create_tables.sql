-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create players table (references Supabase auth.users)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT UNIQUE,
  display_name TEXT,
  total_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create words table
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  hint TEXT,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  score INTEGER DEFAULT 0,
  words_completed INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 5,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_demo BOOLEAN DEFAULT FALSE
);

-- Create game answers table to track individual word attempts
CREATE TABLE IF NOT EXISTS game_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id),
  is_correct BOOLEAN NOT NULL,
  time_taken INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_words_subject ON words(subject_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_player ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_game_answers_session ON game_answers(game_session_id);
CREATE INDEX IF NOT EXISTS idx_subjects_difficulty ON subjects(difficulty);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players
CREATE POLICY "Players can view their own profile"
  ON players FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Players can insert their own profile"
  ON players FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Players can update their own profile"
  ON players FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for game sessions
CREATE POLICY "Players can view their own game sessions"
  ON game_sessions FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "Players can create their own game sessions"
  ON game_sessions FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can update their own game sessions"
  ON game_sessions FOR UPDATE
  USING (auth.uid() = player_id);

-- RLS Policies for game answers
CREATE POLICY "Players can view their own game answers"
  ON game_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = game_answers.game_session_id
      AND game_sessions.player_id = auth.uid()
    )
  );

CREATE POLICY "Players can insert their own game answers"
  ON game_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = game_answers.game_session_id
      AND game_sessions.player_id = auth.uid()
    )
  );

-- Public read access for subjects and words (no RLS needed as they're admin-managed content)
-- Note: Admin operations will use service role key
