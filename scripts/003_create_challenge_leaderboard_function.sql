-- Function to get all-time leaderboard (primarily for challenge mode)
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
