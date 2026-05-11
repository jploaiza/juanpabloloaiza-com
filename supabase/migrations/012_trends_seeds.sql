-- Migration 012: Seeds de búsqueda de tendencias gestionables por el admin

CREATE TABLE trends_seeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(keyword)
);
CREATE INDEX idx_trends_seeds_active ON trends_seeds(active) WHERE active = true;
ALTER TABLE trends_seeds ENABLE ROW LEVEL SECURITY;

-- Pre-populate with expanded keyword set for TRVP practice
INSERT INTO trends_seeds (keyword) VALUES
  -- Core practice (original 8)
  ('hipnosis'),
  ('terapia regresiva'),
  ('vidas pasadas'),
  ('liberación de entidades'),
  ('terapia espiritual'),
  ('regresión a vidas pasadas'),
  ('hipnosis clínica'),
  ('sanación espiritual'),
  -- Expanded: mental health & emotions
  ('ansiedad y estrés'),
  ('depresión espiritual'),
  ('trauma emocional'),
  ('bloqueos energéticos'),
  ('duelo y pérdida'),
  ('miedos profundos'),
  ('ataques de pánico'),
  ('autoestima'),
  -- Expanded: spirituality & consciousness
  ('despertar espiritual'),
  ('consciencia expandida'),
  ('karma y dharma'),
  ('registros akáshicos'),
  ('reencarnación'),
  ('alma gemela'),
  ('misión de vida'),
  ('propósito de vida'),
  -- Expanded: holistic & body-mind
  ('bienestar integral'),
  ('salud holística'),
  ('cuerpo y mente'),
  ('somatización emocional'),
  ('energía vital'),
  ('chakras'),
  ('meditación profunda'),
  ('mindfulness espiritual'),
  -- Expanded: relationships & patterns
  ('relaciones tóxicas'),
  ('codependencia emocional'),
  ('límites emocionales'),
  ('patrones familiares'),
  ('heridas de infancia'),
  ('sanación del niño interior'),
  -- Expanded: transformation
  ('transformación personal'),
  ('crecimiento personal'),
  ('medicina alternativa'),
  ('terapias complementarias');
