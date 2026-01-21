-- 1. SEED ADMIN USER
-- Default credentials: admin@test.com / Admin123!
INSERT INTO admin_users (email, password_hash, role) VALUES
  ('admin@test.com', '$2b$10$qIUoKy21uQAi2rllgX9bxecGohHiKmZW46Wwd/vOAbw4M/ROJSxP.', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- 2. SEED ADMIN PERMISSIONS
-- Super Admin
INSERT INTO admin_permissions (role, resource, can_create, can_read, can_update, can_delete) VALUES
('super_admin', 'players', true, true, true, true),
('super_admin', 'subjects', true, true, true, true),
('super_admin', 'words', true, true, true, true),
('super_admin', 'admins', true, true, true, true),
('super_admin', 'game_sessions', true, true, true, true)
ON CONFLICT (role, resource) DO NOTHING;

-- Admin
INSERT INTO admin_permissions (role, resource, can_create, can_read, can_update, can_delete) VALUES
('admin', 'players', false, true, true, false),
('admin', 'subjects', true, true, true, true),
('admin', 'words', true, true, true, true),
('admin', 'admins', false, true, false, false),
('admin', 'game_sessions', false, true, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- Moderator
INSERT INTO admin_permissions (role, resource, can_create, can_read, can_update, can_delete) VALUES
('moderator', 'players', false, true, false, false),
('moderator', 'subjects', false, true, true, false),
('moderator', 'words', true, true, true, false),
('moderator', 'admins', false, false, false, false),
('moderator', 'game_sessions', false, true, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- 3. SEED DEMO SUBJECTS
INSERT INTO subjects (id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Animals', 'Common animals and creatures'),
  ('22222222-2222-2222-2222-222222222222', 'Technology', 'Tech and computing terms'),
  ('33333333-3333-3333-3333-333333333333', 'Science', 'Scientific concepts and terms')
ON CONFLICT (id) DO NOTHING;

-- 4. SEED DEMO WORDS
INSERT INTO words (word, hint, subject_id) VALUES
  -- Animals
  ('CAT', 'A furry pet that meows', '11111111-1111-1111-1111-111111111111'),
  ('DOG', 'Man''s best friend', '11111111-1111-1111-1111-111111111111'),
  ('BIRD', 'Has feathers and flies', '11111111-1111-1111-1111-111111111111'),
  ('FISH', 'Lives in water', '11111111-1111-1111-1111-111111111111'),
  ('LION', 'King of the jungle', '11111111-1111-1111-1111-111111111111'),
  ('ELEPHANT', 'Has a long trunk', '11111111-1111-1111-1111-111111111111'),
  
  -- Technology
  ('COMPUTER', 'Electronic device for processing data', '22222222-2222-2222-2222-222222222222'),
  ('INTERNET', 'Global network of networks', '22222222-2222-2222-2222-222222222222'),
  ('SOFTWARE', 'Programs and applications', '22222222-2222-2222-2222-222222222222'),
  ('DATABASE', 'Organized collection of data', '22222222-2222-2222-2222-222222222222'),
  ('ALGORITHM', 'Step-by-step procedure', '22222222-2222-2222-2222-222222222222'),
  
  -- Science
  ('PHOTOSYNTHESIS', 'Plants convert light to energy', '33333333-3333-3333-3333-333333333333'),
  ('QUANTUM', 'Smallest discrete unit', '33333333-3333-3333-3333-333333333333'),
  ('MOLECULE', 'Group of atoms bonded together', '33333333-3333-3333-3333-333333333333'),
  ('NEUTRON', 'Subatomic particle with no charge', '33333333-3333-3333-3333-333333333333'),
  ('ENTROPY', 'Measure of disorder in a system', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- 5. SEED SITE SETTINGS
INSERT INTO site_settings (id, title, landing_header_title, landing_header_subtitle, landing_description) VALUES
(
  1, 
  'Word Puzzle Game', 
  'Level Up Your Brain One Word at a Time', 
  'Challenge yourself with engaging word puzzles across multiple difficulty levels. Improve vocabulary, boost memory, and have fun while learning.',
  'Challenge yourself with engaging word puzzles across multiple difficulty levels. Improve vocabulary, boost memory, and have fun while learning.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  landing_header_title = EXCLUDED.landing_header_title,
  landing_header_subtitle = EXCLUDED.landing_header_subtitle,
  landing_description = EXCLUDED.landing_description;
