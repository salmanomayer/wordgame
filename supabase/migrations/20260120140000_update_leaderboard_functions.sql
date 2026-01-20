-- Update get_weekly_leaderboard to separate random play and challenges
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(limit_count integer DEFAULT 10, is_challenge boolean DEFAULT false)
 RETURNS TABLE(player_id uuid, display_name text, phone_number text, total_score integer, games_played integer, rank integer)
 LANGUAGE plpgsql
AS $function$
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
  LEFT JOIN games g ON gs.game_id = g.id
  WHERE (
    CASE 
      WHEN is_challenge THEN g.id IS NOT NULL  -- Challenge mode: must have a valid game_id
      ELSE g.id IS NULL                        -- Random play: game_id is null (or check your specific random play logic)
    END
  )
  GROUP BY p.id, p.display_name, p.phone_number
  ORDER BY total_score DESC
  LIMIT limit_count;
END;
$function$;

-- Update get_monthly_leaderboard to separate random play and challenges
CREATE OR REPLACE FUNCTION public.get_monthly_leaderboard(limit_count integer DEFAULT 10, is_challenge boolean DEFAULT false)
 RETURNS TABLE(player_id uuid, display_name text, phone_number text, total_score integer, games_played integer, rank integer)
 LANGUAGE plpgsql
AS $function$
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
  LEFT JOIN games g ON gs.game_id = g.id
  WHERE (
    CASE 
      WHEN is_challenge THEN g.id IS NOT NULL
      ELSE g.id IS NULL
    END
  )
  GROUP BY p.id, p.display_name, p.phone_number
  ORDER BY total_score DESC
  LIMIT limit_count;
END;
$function$;