-- Add role column to admin_users table
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator'));

-- Update existing admin user to super_admin
UPDATE admin_users SET role = 'super_admin' WHERE email = 'admin@test.com';

-- Add index for role queries
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
