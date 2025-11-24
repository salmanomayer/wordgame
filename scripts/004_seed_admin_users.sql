-- Seed default admin user
-- Default credentials: admin@test.com / Admin123!
-- Password hash for 'Admin123!' using bcrypt with cost 10
INSERT INTO admin_users (email, password_hash) VALUES
  ('admin@test.com', '$2a$10$YQ98PEg4h.1hFv7Sm3jcFOGFj5bqCXGJ4N3QH5N5AQ9QVHJ6pxE9O')
ON CONFLICT (email) DO NOTHING;

-- Note: In production, change this password immediately after first login
-- You can create new admin users via the API route: POST /api/admin/create
