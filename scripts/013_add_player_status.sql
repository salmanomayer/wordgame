-- Add is_active status field to players table for account enable/disable functionality

ALTER TABLE players ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add index for faster queries filtering by active status
CREATE INDEX IF NOT EXISTS idx_players_is_active ON players(is_active);
