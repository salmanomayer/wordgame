-- Add word_count column to games table for games without stages
ALTER TABLE games ADD COLUMN IF NOT EXISTS word_count INTEGER NOT NULL DEFAULT 5;
