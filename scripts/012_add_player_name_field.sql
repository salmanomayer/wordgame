-- Ensure players table has a name field for display
-- The display_name field should already exist from the initial schema
-- This script ensures it's properly configured

-- Add index on display_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_players_display_name ON players(display_name);

-- Update RLS policy to allow players to update their display name
DROP POLICY IF EXISTS "Players can update their own profile" ON players;
CREATE POLICY "Players can update their own profile"
  ON players FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to set player name from email if not set
CREATE OR REPLACE FUNCTION set_default_player_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If display_name is not set, use the part before @ from email
  IF NEW.display_name IS NULL THEN
    NEW.display_name := (
      SELECT SPLIT_PART(email, '@', 1)
      FROM auth.users
      WHERE id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set display name on player creation
DROP TRIGGER IF EXISTS set_player_name_on_insert ON players;
CREATE TRIGGER set_player_name_on_insert
  BEFORE INSERT ON players
  FOR EACH ROW
  EXECUTE FUNCTION set_default_player_name();
