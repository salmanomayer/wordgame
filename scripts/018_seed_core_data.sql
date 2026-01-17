CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY,
  title TEXT,
  logo_url TEXT,
  footer_text TEXT,
  admin_footer_text TEXT,
  admin_footer_links JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (id, title, logo_url, footer_text, admin_footer_text, admin_footer_links, updated_at)
VALUES (
  1,
  'Word Game',
  '',
  CONCAT('© ', EXTRACT(YEAR FROM NOW())::TEXT, ' Word Game. All rights reserved.'),
  '',
  '[]'::jsonb,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO admin_permissions (role, resource, can_create, can_read, can_update, can_delete) VALUES
('super_admin', 'players', true, true, true, true),
('super_admin', 'subjects', true, true, true, true),
('super_admin', 'words', true, true, true, true),
('super_admin', 'admins', true, true, true, true),
('super_admin', 'game_sessions', true, true, true, true),
('super_admin', 'games', true, true, true, true),
('admin', 'players', false, true, true, false),
('admin', 'subjects', true, true, true, true),
('admin', 'words', true, true, true, true),
('admin', 'admins', false, true, false, false),
('admin', 'game_sessions', false, true, false, false),
('admin', 'games', true, true, true, true),
('moderator', 'players', false, true, false, false),
('moderator', 'subjects', false, true, true, false),
('moderator', 'words', true, true, true, false),
('moderator', 'admins', false, false, false, false),
('moderator', 'game_sessions', false, true, false, false),
('moderator', 'games', false, true, true, false)
ON CONFLICT (role, resource) DO NOTHING;

INSERT INTO subjects (name, description, is_active)
SELECT 'Science', 'General science vocabulary', true
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE name = 'Science');

INSERT INTO subjects (name, description, is_active)
SELECT 'Mathematics', 'Math and numbers', true
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE name = 'Mathematics');

INSERT INTO subjects (name, description, is_active)
SELECT 'English', 'Everyday English words', true
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE name = 'English');

INSERT INTO words (word, hint, subject_id, is_active)
SELECT 'ATOM', 'Smallest unit of matter', s.id
FROM subjects s
WHERE s.name = 'Science'
AND NOT EXISTS (SELECT 1 FROM words w WHERE w.word = 'ATOM' AND w.subject_id = s.id);

INSERT INTO words (word, hint, subject_id, is_active)
SELECT 'CELL', 'Basic unit of life', s.id
FROM subjects s
WHERE s.name = 'Science'
AND NOT EXISTS (SELECT 1 FROM words w WHERE w.word = 'CELL' AND w.subject_id = s.id);

INSERT INTO words (word, hint, subject_id, is_active)
SELECT 'GRAVITY', 'Force that pulls objects together', s.id
FROM subjects s
WHERE s.name = 'Science'
AND NOT EXISTS (SELECT 1 FROM words w WHERE w.word = 'GRAVITY' AND w.subject_id = s.id);

INSERT INTO words (word, hint, subject_id, is_active)
SELECT 'ANGLE', 'Formed by two rays', s.id
FROM subjects s
WHERE s.name = 'Mathematics'
AND NOT EXISTS (SELECT 1 FROM words w WHERE w.word = 'ANGLE' AND w.subject_id = s.id);

INSERT INTO words (word, hint, subject_id, is_active)
SELECT 'RATIO', 'Comparison of two quantities', s.id
FROM subjects s
WHERE s.name = 'Mathematics'
AND NOT EXISTS (SELECT 1 FROM words w WHERE w.word = 'RATIO' AND w.subject_id = s.id);

INSERT INTO words (word, hint, subject_id, is_active)
SELECT 'VECTOR', 'Quantity with magnitude and direction', s.id
FROM subjects s
WHERE s.name = 'Mathematics'
AND NOT EXISTS (SELECT 1 FROM words w WHERE w.word = 'VECTOR' AND w.subject_id = s.id);

INSERT INTO words (word, hint, subject_id, is_active)
SELECT 'NOUN', 'Person, place, or thing', s.id
FROM subjects s
WHERE s.name = 'English'
AND NOT EXISTS (SELECT 1 FROM words w WHERE w.word = 'NOUN' AND w.subject_id = s.id);

INSERT INTO words (word, hint, subject_id, is_active)
SELECT 'ADJECTIVE', 'Describes a noun', s.id
FROM subjects s
WHERE s.name = 'English'
AND NOT EXISTS (SELECT 1 FROM words w WHERE w.word = 'ADJECTIVE' AND w.subject_id = s.id);

INSERT INTO words (word, hint, subject_id, is_active)
SELECT 'VERB', 'Action word', s.id
FROM subjects s
WHERE s.name = 'English'
AND NOT EXISTS (SELECT 1 FROM words w WHERE w.word = 'VERB' AND w.subject_id = s.id);
