-- Add role column to admin_users if not exists
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator'));

-- Update existing admin user to super_admin
UPDATE admin_users SET role = 'super_admin' WHERE email = 'admin@test.com';

-- Create permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  resource TEXT NOT NULL, -- 'players', 'subjects', 'words', 'admins', 'game_sessions'
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT true,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, resource)
);

-- Insert default permissions for super_admin
INSERT INTO admin_permissions (role, resource, can_create, can_read, can_update, can_delete) VALUES
('super_admin', 'players', true, true, true, true),
('super_admin', 'subjects', true, true, true, true),
('super_admin', 'words', true, true, true, true),
('super_admin', 'admins', true, true, true, true),
('super_admin', 'game_sessions', true, true, true, true)
ON CONFLICT (role, resource) DO NOTHING;

-- Insert default permissions for admin
INSERT INTO admin_permissions (role, resource, can_create, can_read, can_update, can_delete) VALUES
('admin', 'players', false, true, true, false),
('admin', 'subjects', true, true, true, true),
('admin', 'words', true, true, true, true),
('admin', 'admins', false, true, false, false),
('admin', 'game_sessions', false, true, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- Insert default permissions for moderator
INSERT INTO admin_permissions (role, resource, can_create, can_read, can_update, can_delete) VALUES
('moderator', 'players', false, true, false, false),
('moderator', 'subjects', false, true, true, false),
('moderator', 'words', true, true, true, false),
('moderator', 'admins', false, false, false, false),
('moderator', 'game_sessions', false, true, false, false)
ON CONFLICT (role, resource) DO NOTHING;
