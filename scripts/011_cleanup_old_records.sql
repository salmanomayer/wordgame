-- Script to automatically delete game records older than 3 months
-- This keeps the database clean and focused on recent player activity

-- Create a function to clean up old game records
CREATE OR REPLACE FUNCTION cleanup_old_game_records()
RETURNS void AS $$
BEGIN
  -- Delete game answers for sessions older than 3 months
  DELETE FROM game_answers
  WHERE game_session_id IN (
    SELECT id FROM game_sessions
    WHERE completed_at < NOW() - INTERVAL '3 months'
  );

  -- Delete game sessions older than 3 months
  DELETE FROM game_sessions
  WHERE completed_at < NOW() - INTERVAL '3 months';

  RAISE NOTICE 'Cleaned up game records older than 3 months';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job using pg_cron extension (if available)
-- Note: pg_cron needs to be enabled on your Supabase project
-- Run this cleanup daily at 2 AM
-- SELECT cron.schedule('cleanup-old-games', '0 2 * * *', 'SELECT cleanup_old_game_records()');

-- Alternative: Create a trigger to run cleanup periodically
-- This will run on any INSERT to game_sessions (less ideal but doesn't require pg_cron)
CREATE OR REPLACE FUNCTION trigger_cleanup_old_records()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run cleanup randomly (1% chance on each insert)
  IF RANDOM() < 0.01 THEN
    PERFORM cleanup_old_game_records();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS auto_cleanup_old_records ON game_sessions;
CREATE TRIGGER auto_cleanup_old_records
  AFTER INSERT ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_old_records();

-- Manual cleanup command (can be run anytime)
-- SELECT cleanup_old_game_records();
