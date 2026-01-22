-- Drop existing functions to allow changing return type
DROP FUNCTION IF EXISTS get_weekly_leaderboard(integer, boolean);
DROP FUNCTION IF EXISTS get_monthly_leaderboard(integer, boolean);

-- Recreate get_weekly_leaderboard with time support
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

-- Recreate get_monthly_leaderboard with time support
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
