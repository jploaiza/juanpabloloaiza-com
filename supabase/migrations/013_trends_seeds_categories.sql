-- Migration 013: Add category column to trends_seeds and populate clinical/world seeds

-- Add category column (default 'spiritual' for existing rows)
ALTER TABLE trends_seeds ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'spiritual';

-- All existing rows are spiritual/holistic
UPDATE trends_seeds SET category = 'spiritual';

-- Clinical psychology seeds
INSERT INTO trends_seeds (keyword, active, category) VALUES
  ('depresión', true, 'clinical'),
  ('ansiedad', true, 'clinical'),
  ('TDAH', true, 'clinical'),
  ('trastorno de ansiedad', true, 'clinical'),
  ('terapia cognitiva conductual', true, 'clinical'),
  ('psicología clínica', true, 'clinical'),
  ('salud mental', true, 'clinical'),
  ('burnout', true, 'clinical'),
  ('estrés crónico', true, 'clinical'),
  ('trauma psicológico', true, 'clinical'),
  ('apego ansioso', true, 'clinical'),
  ('terapia de pareja', true, 'clinical'),
  ('autoestima baja', true, 'clinical'),
  ('duelo', true, 'clinical'),
  ('fobia social', true, 'clinical'),
  ('crisis de pánico', true, 'clinical'),
  ('insomnio', true, 'clinical'),
  ('trastorno bipolar', true, 'clinical'),
  ('EMDR terapia', true, 'clinical'),
  ('psiquiatría', true, 'clinical'),
  ('TOC trastorno obsesivo', true, 'clinical'),
  ('antidepresivos y terapia', true, 'clinical'),
  ('terapia psicológica online', true, 'clinical'),
  ('mindfulness terapéutico', true, 'clinical')
ON CONFLICT (keyword) DO UPDATE SET category = EXCLUDED.category;

-- World/current events seeds
INSERT INTO trends_seeds (keyword, active, category) VALUES
  ('soledad moderna', true, 'world'),
  ('crisis existencial', true, 'world'),
  ('redes sociales y ansiedad', true, 'world'),
  ('inteligencia artificial y bienestar', true, 'world'),
  ('propósito de vida', true, 'world'),
  ('crisis de identidad', true, 'world'),
  ('ansiedad climática', true, 'world'),
  ('pandemia salud mental', true, 'world'),
  ('trabajo remoto y bienestar', true, 'world'),
  ('desconexión digital', true, 'world'),
  ('crisis económica y salud mental', true, 'world'),
  ('migración y duelo', true, 'world'),
  ('masculinidad y emociones', true, 'world'),
  ('feminismo y salud mental', true, 'world'),
  ('espiritualidad sin religión', true, 'world')
ON CONFLICT (keyword) DO UPDATE SET category = EXCLUDED.category;
