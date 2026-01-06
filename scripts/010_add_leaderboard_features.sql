-- Add weekly and monthly ranking views for leaderboards

-- Create function to get weekly leaderboard
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  player_id UUID,
  display_name TEXT,
  phone_number TEXT,
  total_score INTEGER,
  games_played INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.phone_number,
    COALESCE(SUM(gs.score), 0)::INTEGER as total_score,
    COUNT(gs.id)::INTEGER as games_played,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(gs.score), 0) DESC)::INTEGER as rank
  FROM players p
  LEFT JOIN game_sessions gs ON p.id = gs.player_id 
    AND gs.completed_at >= NOW() - INTERVAL '7 days'
    AND gs.completed_at IS NOT NULL
  GROUP BY p.id, p.display_name, p.phone_number
  ORDER BY total_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get monthly leaderboard
CREATE OR REPLACE FUNCTION get_monthly_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  player_id UUID,
  display_name TEXT,
  phone_number TEXT,
  total_score INTEGER,
  games_played INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.phone_number,
    COALESCE(SUM(gs.score), 0)::INTEGER as total_score,
    COUNT(gs.id)::INTEGER as games_played,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(gs.score), 0) DESC)::INTEGER as rank
  FROM players p
  LEFT JOIN game_sessions gs ON p.id = gs.player_id 
    AND gs.completed_at >= NOW() - INTERVAL '30 days'
    AND gs.completed_at IS NOT NULL
  GROUP BY p.id, p.display_name, p.phone_number
  ORDER BY total_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get subject-wise player stats
CREATE OR REPLACE FUNCTION get_player_subject_stats(p_player_id UUID)
RETURNS TABLE (
  subject_id UUID,
  subject_name TEXT,
  games_played INTEGER,
  total_score INTEGER,
  avg_score NUMERIC,
  best_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    COUNT(gs.id)::INTEGER as games_played,
    COALESCE(SUM(gs.score), 0)::INTEGER as total_score,
    ROUND(AVG(gs.score), 2) as avg_score,
    COALESCE(MAX(gs.score), 0)::INTEGER as best_score
  FROM subjects s
  LEFT JOIN game_sessions gs ON s.id = gs.subject_id 
    AND gs.player_id = p_player_id
    AND gs.completed_at IS NOT NULL
  GROUP BY s.id, s.name
  ORDER BY total_score DESC;
END;
$$ LANGUAGE plpgsql;
