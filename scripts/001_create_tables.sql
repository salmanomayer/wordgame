-- Create extension for UUID generation and hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ADMIN USERS & PERMISSIONS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  resource TEXT NOT NULL, -- 'players', 'subjects', 'words', 'admins', 'game_sessions'
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT true,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, resource)
);

-- 2. SITE SETTINGS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY,
  title TEXT,
  logo_url TEXT,
  footer_text TEXT,
  admin_footer_text TEXT,
  admin_footer_links JSONB DEFAULT '[]'::jsonb,
  landing_header_title TEXT,
  landing_header_subtitle TEXT,
  landing_description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PLAYERS & AUTHENTICATION
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT,
  email TEXT UNIQUE,           -- Nullable to support phone/ID only
  phone_number TEXT UNIQUE,    -- Nullable
  employee_id TEXT UNIQUE,     -- Nullable, added for employee login
  password_hash TEXT NOT NULL,
  total_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_admin_id UUID REFERENCES admin_users(id),
  creation_source TEXT DEFAULT 'signup'
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  CONSTRAINT token_not_expired CHECK (expires_at > now() OR used_at IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS player_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  browser TEXT,
  device TEXT,
  os TEXT,
  country TEXT,
  city TEXT,
  region TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  action TEXT NOT NULL DEFAULT 'login',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. GAME CONTENT (SUBJECTS & WORDS)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_random_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  hint TEXT,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Optional fields for complex puzzles
  missing_position INTEGER,
  correct_letter TEXT,
  wrong_options TEXT[]
);

-- 5. GAME CONFIGURATION (GAMES & STAGES)
-- -----------------------------------------------------------------------------

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

CREATE TABLE IF NOT EXISTS game_subjects (
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, subject_id)
);

CREATE TABLE IF NOT EXISTS game_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  word_count INTEGER NOT NULL DEFAULT 5,
  difficulty VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_stage_subjects (
  stage_id UUID NOT NULL REFERENCES game_stages(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (stage_id, subject_id)
);

-- 6. GAMEPLAY (SESSIONS & ANSWERS)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES game_stages(id) ON DELETE SET NULL,
  subject_id UUID NOT NULL REFERENCES subjects(id),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  score INTEGER DEFAULT 0,
  words_completed INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 5,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_demo BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS game_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id),
  is_correct BOOLEAN NOT NULL,
  time_taken INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_words_subject ON words(subject_id);
CREATE INDEX IF NOT EXISTS idx_games_is_active ON games(is_active);
CREATE INDEX IF NOT EXISTS idx_game_stages_game_id ON game_stages(game_id);
CREATE INDEX IF NOT EXISTS idx_game_subjects_game_id ON game_subjects(game_id);
CREATE INDEX IF NOT EXISTS idx_game_stage_subjects_stage_id ON game_stage_subjects(stage_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_player ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game ON game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_game ON game_sessions(player_id, game_id);
CREATE INDEX IF NOT EXISTS idx_game_answers_session ON game_answers(game_session_id);
CREATE INDEX IF NOT EXISTS idx_player_logs_player_id ON player_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_players_employee_id ON players(employee_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_resource ON admin_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_players_created_by ON players(created_by_admin_id);

-- 8. LEADERBOARD FUNCTIONS
-- -----------------------------------------------------------------------------

-- Drop existing functions to allow changing return type
DROP FUNCTION IF EXISTS get_weekly_leaderboard(integer, boolean);
DROP FUNCTION IF EXISTS get_monthly_leaderboard(integer, boolean);
DROP FUNCTION IF EXISTS get_challenge_leaderboard(integer);

-- Weekly Leaderboard
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(limit_count integer DEFAULT 10, is_challenge boolean DEFAULT false)
RETURNS TABLE(
  player_id uuid, 
  display_name text, 
  phone_number text, 
  total_score integer, 
  total_time_seconds integer,
  games_played integer, 
  rank integer
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    p.phone_number,
    COALESCE(SUM(gs.score), 0)::INTEGER as total_score,
    COALESCE(SUM(EXTRACT(EPOCH FROM (gs.completed_at - gs.started_at))), 0)::INTEGER as total_time_seconds,
    COUNT(gs.id)::INTEGER as games_played,
    ROW_NUMBER() OVER (
        ORDER BY 
            COALESCE(SUM(gs.score), 0) DESC, 
            COALESCE(SUM(EXTRACT(EPOCH FROM (gs.completed_at - gs.started_at))), 0) ASC
    )::INTEGER as rank
  FROM players p
  LEFT JOIN game_sessions gs ON p.id = gs.player_id
    AND gs.completed_at >= NOW() - INTERVAL '7 days'
    AND gs.completed_at IS NOT NULL
  LEFT JOIN games g ON gs.game_id = g.id
  WHERE (
    CASE
      WHEN is_challenge THEN g.id IS NOT NULL
      ELSE g.id IS NULL
    END
  )
  GROUP BY p.id, p.display_name, p.phone_number
  ORDER BY total_score DESC, total_time_seconds ASC
  LIMIT limit_count;
END;
$function$;

-- Monthly Leaderboard
CREATE OR REPLACE FUNCTION get_monthly_leaderboard(limit_count integer DEFAULT 10, is_challenge boolean DEFAULT false)
RETURNS TABLE(
  player_id uuid, 
  display_name text, 
  phone_number text, 
  total_score integer, 
  total_time_seconds integer,
  games_played integer, 
  rank integer
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    p.phone_number,
    COALESCE(SUM(gs.score), 0)::INTEGER as total_score,
    COALESCE(SUM(EXTRACT(EPOCH FROM (gs.completed_at - gs.started_at))), 0)::INTEGER as total_time_seconds,
    COUNT(gs.id)::INTEGER as games_played,
    ROW_NUMBER() OVER (
        ORDER BY 
            COALESCE(SUM(gs.score), 0) DESC, 
            COALESCE(SUM(EXTRACT(EPOCH FROM (gs.completed_at - gs.started_at))), 0) ASC
    )::INTEGER as rank
  FROM players p
  LEFT JOIN game_sessions gs ON p.id = gs.player_id
    AND gs.completed_at >= NOW() - INTERVAL '30 days'
    AND gs.completed_at IS NOT NULL
  LEFT JOIN games g ON gs.game_id = g.id
  WHERE (
    CASE
      WHEN is_challenge THEN g.id IS NOT NULL
      ELSE g.id IS NULL
    END
  )
  GROUP BY p.id, p.display_name, p.phone_number
  ORDER BY total_score DESC, total_time_seconds ASC
  LIMIT limit_count;
END;
$function$;

-- Challenge Leaderboard (All-time)
CREATE OR REPLACE FUNCTION get_challenge_leaderboard(limit_count integer DEFAULT 1000)
RETURNS TABLE(
  player_id uuid, 
  display_name text, 
  phone_number text, 
  total_score integer, 
  total_time_seconds integer,
  games_played integer, 
  rank integer
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    p.phone_number,
    COALESCE(SUM(gs.score), 0)::INTEGER as total_score,
    COALESCE(SUM(EXTRACT(EPOCH FROM (gs.completed_at - gs.started_at))), 0)::INTEGER as total_time_seconds,
    COUNT(gs.id)::INTEGER as games_played,
    ROW_NUMBER() OVER (
        ORDER BY 
            COALESCE(SUM(gs.score), 0) DESC, 
            COALESCE(SUM(EXTRACT(EPOCH FROM (gs.completed_at - gs.started_at))), 0) ASC
    )::INTEGER as rank
  FROM players p
  JOIN game_sessions gs ON p.id = gs.player_id
    AND gs.completed_at IS NOT NULL
  JOIN games g ON gs.game_id = g.id  -- Only include games that have a linked game definition (Challenges)
  GROUP BY p.id, p.display_name, p.phone_number
  ORDER BY total_score DESC, total_time_seconds ASC
  LIMIT limit_count;
END;
$function$;

-- 9. TRIGGERS
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_default_player_name()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.display_name IS NULL THEN
    NEW.display_name := SPLIT_PART(NEW.email, '@', 1);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_player_name_on_insert ON players;
CREATE TRIGGER set_player_name_on_insert
  BEFORE INSERT ON players
  FOR EACH ROW
  EXECUTE FUNCTION set_default_player_name();
