-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  correct_marks INTEGER NOT NULL DEFAULT 10,
  time_per_word INTEGER NOT NULL DEFAULT 30, -- in seconds
  difficulty VARCHAR(20) DEFAULT 'medium',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game_subjects table (for games without stages)
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game_stage_subjects table
CREATE TABLE IF NOT EXISTS game_stage_subjects (
  stage_id UUID NOT NULL REFERENCES game_stages(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (stage_id, subject_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_games_is_active ON games(is_active);
CREATE INDEX IF NOT EXISTS idx_game_stages_game_id ON game_stages(game_id);
CREATE INDEX IF NOT EXISTS idx_game_subjects_game_id ON game_subjects(game_id);
CREATE INDEX IF NOT EXISTS idx_game_stage_subjects_stage_id ON game_stage_subjects(stage_id);

-- Add permissions for games
INSERT INTO admin_permissions (role, resource, can_create, can_read, can_update, can_delete) VALUES
('super_admin', 'games', true, true, true, true),
('admin', 'games', true, true, true, true),
('moderator', 'games', false, true, true, false)
ON CONFLICT (role, resource) DO NOTHING;
