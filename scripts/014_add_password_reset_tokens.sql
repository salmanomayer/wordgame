-- Create table to store password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  CONSTRAINT token_not_expired CHECK (expires_at > now() OR used_at IS NOT NULL)
);

-- Enable RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own tokens
CREATE POLICY "Users can view their own reset tokens"
  ON password_reset_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow the system to create tokens
CREATE POLICY "System can create reset tokens"
  ON password_reset_tokens
  FOR INSERT
  WITH CHECK (true);

-- Allow the system to update tokens (mark as used)
CREATE POLICY "System can update reset tokens"
  ON password_reset_tokens
  FOR UPDATE
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_expires_at ON password_reset_tokens(expires_at);
