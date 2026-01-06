-- Create player_logs table for tracking device, browser, IP, location
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_player_logs_player_id ON player_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_player_logs_created_at ON player_logs(created_at DESC);

-- Enable RLS
SELECT 1;
