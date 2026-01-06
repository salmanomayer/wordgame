-- Add index on display_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_players_display_name ON players(display_name);

CREATE OR REPLACE FUNCTION set_default_player_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_name IS NULL THEN
    NEW.display_name := SPLIT_PART(NEW.email, '@', 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_player_name_on_insert ON players;
CREATE TRIGGER set_player_name_on_insert
  BEFORE INSERT ON players
  FOR EACH ROW
  EXECUTE FUNCTION set_default_player_name();
