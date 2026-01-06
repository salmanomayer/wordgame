-- Seed demo subjects
INSERT INTO subjects (id, name, difficulty, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Animals', 'easy', 'Common animals and creatures'),
  ('22222222-2222-2222-2222-222222222222', 'Technology', 'medium', 'Tech and computing terms'),
  ('33333333-3333-3333-3333-333333333333', 'Science', 'hard', 'Scientific concepts and terms')
ON CONFLICT DO NOTHING;

-- Seed demo words
INSERT INTO words (word, hint, subject_id) VALUES
  -- Animals (Easy)
  ('CAT', 'A furry pet that meows', '11111111-1111-1111-1111-111111111111'),
  ('DOG', 'Man''s best friend', '11111111-1111-1111-1111-111111111111'),
  ('BIRD', 'Has feathers and flies', '11111111-1111-1111-1111-111111111111'),
  ('FISH', 'Lives in water', '11111111-1111-1111-1111-111111111111'),
  ('LION', 'King of the jungle', '11111111-1111-1111-1111-111111111111'),
  ('ELEPHANT', 'Has a long trunk', '11111111-1111-1111-1111-111111111111'),
  
  -- Technology (Medium)
  ('COMPUTER', 'Electronic device for processing data', '22222222-2222-2222-2222-222222222222'),
  ('INTERNET', 'Global network of networks', '22222222-2222-2222-2222-222222222222'),
  ('SOFTWARE', 'Programs and applications', '22222222-2222-2222-2222-222222222222'),
  ('DATABASE', 'Organized collection of data', '22222222-2222-2222-2222-222222222222'),
  ('ALGORITHM', 'Step-by-step procedure', '22222222-2222-2222-2222-222222222222'),
  
  -- Science (Hard)
  ('PHOTOSYNTHESIS', 'Plants convert light to energy', '33333333-3333-3333-3333-333333333333'),
  ('QUANTUM', 'Smallest discrete unit', '33333333-3333-3333-3333-333333333333'),
  ('MOLECULE', 'Group of atoms bonded together', '33333333-3333-3333-3333-333333333333'),
  ('NEUTRON', 'Subatomic particle with no charge', '33333333-3333-3333-3333-333333333333'),
  ('ENTROPY', 'Measure of disorder in a system', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;
