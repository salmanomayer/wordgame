-- Add is_active status field to players table for account enable/disable functionality

ALTER TABLE players ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add index for faster queries filtering by active status
CREATE INDEX IF NOT EXISTS idx_players_is_active ON players(is_active);

-- Update RLS policy to prevent disabled players from accessing their data
DROP POLICY IF EXISTS "Players can view their own profile" ON players;
CREATE POLICY "Players can view their own profile" ON players
  FOR SELECT
  USING (auth.uid() = id AND is_active = true);

DROP POLICY IF EXISTS "Players can update their own profile" ON players;
CREATE POLICY "Players can update their own profile" ON players
  FOR UPDATE
  USING (auth.uid() = id AND is_active = true);

-- Create a function to check if player is active
CREATE OR REPLACE FUNCTION is_player_active(player_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM players 
    WHERE id = player_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
