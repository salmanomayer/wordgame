-- Create admin users table
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone_number TEXT UNIQUE,
  display_name TEXT,
  total_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
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

-- Create games table (moved here to resolve foreign key dependency in game_sessions)
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  correct_marks INTEGER NOT NULL DEFAULT 10,
  time_per_word INTEGER NOT NULL DEFAULT 30, -- in seconds
  difficulty VARCHAR(20) DEFAULT 'medium',
  is_active BOOLEAN DEFAULT TRUE,
  attempts_limit INTEGER,
  word_count INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game_subjects table
CREATE TABLE IF NOT EXISTS game_subjects (
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, subject_id)
);

-- Create game_stages table
CREATE TABLE IF NOT EXISTS game_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  word_count INTEGER NOT NULL DEFAULT 5,
  difficulty VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game_stage_subjects table
CREATE TABLE IF NOT EXISTS game_stage_subjects (
  stage_id UUID NOT NULL REFERENCES game_stages(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (stage_id, subject_id)
);

-- Create words table
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  hint TEXT,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Puzzle-specific optional fields
  missing_position INTEGER,
  correct_letter TEXT,
  wrong_options TEXT[]
);

-- Create game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_games_is_active ON games(is_active);
CREATE INDEX IF NOT EXISTS idx_game_stages_game_id ON game_stages(game_id);
CREATE INDEX IF NOT EXISTS idx_game_subjects_game_id ON game_subjects(game_id);
CREATE INDEX IF NOT EXISTS idx_game_stage_subjects_stage_id ON game_stage_subjects(stage_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_player ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game ON game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_game ON game_sessions(player_id, game_id);
CREATE INDEX IF NOT EXISTS idx_game_answers_session ON game_answers(game_session_id);
CREATE INDEX IF NOT EXISTS idx_subjects_difficulty ON subjects(difficulty);
