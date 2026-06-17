-- ================================================================
-- Plataforma de Formularios (tipo Typeform) — Juan Pablo Loaiza
-- Reemplaza el formulario embebido de JotForm con un sistema propio:
-- constructor reutilizable + renderer público + respuestas en Supabase.
-- Ejecutar en Supabase SQL Editor.
-- ================================================================

-- ----------------------------------------------------------------
-- forms: una fila por definición de formulario.
-- El array ordenado de preguntas y la lógica de ramificación viven
-- en `schema` (jsonb), validados app-side con zod. Mismo patrón que
-- newsletter_campaigns.template_data.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forms (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,                  -- URL pública: /f/<slug>
  title           text NOT NULL,
  description     text,
  schema          jsonb NOT NULL DEFAULT '{"questions":[],"logic":[]}'::jsonb,
  settings        jsonb NOT NULL DEFAULT '{}'::jsonb,    -- label submit, mensaje gracias, redirect, tema
  patient_mapping jsonb,                                 -- null salvo forms que alimentan el CRM
  status          text NOT NULL DEFAULT 'draft'
                    CONSTRAINT forms_status_check
                    CHECK (status IN ('draft', 'published', 'deleted')),
  is_admission    boolean NOT NULL DEFAULT false,        -- el form de admisión (alimenta /formulario-de-admision)
  notify_email    boolean NOT NULL DEFAULT true,
  notify_whatsapp boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  published_at    timestamptz
);

-- Solo un formulario puede ser el de admisión a la vez.
CREATE UNIQUE INDEX IF NOT EXISTS forms_one_admission_idx
  ON forms (is_admission) WHERE is_admission = true;

CREATE INDEX IF NOT EXISTS forms_status_idx ON forms (status);

-- ----------------------------------------------------------------
-- form_submissions: una fila por envío completado.
-- Guarda snapshot del schema al enviar para que respuestas viejas
-- rendericen aunque el formulario cambie después.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS form_submissions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id              uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  form_schema_snapshot jsonb NOT NULL,
  answers              jsonb NOT NULL,                   -- { [questionId]: value }
  email                text,                             -- denormalizado para listar/deduplicar
  full_name            text,
  phone                text,
  patient_id           uuid REFERENCES patients(id) ON DELETE SET NULL,
  notify_status        jsonb NOT NULL DEFAULT '{}'::jsonb, -- {email:'sent', whatsapp:'failed:...', patient:'created'}
  ip                   text,
  user_agent           text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS form_submissions_form_id_idx
  ON form_submissions (form_id, created_at DESC);
CREATE INDEX IF NOT EXISTS form_submissions_email_idx
  ON form_submissions (email);

-- ----------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------
ALTER TABLE forms            ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- forms: lectura pública SOLO de publicados (el renderer usa el cliente anon).
CREATE POLICY "Public can read published forms"
  ON forms FOR SELECT
  USING (status = 'published');

-- forms: admin acceso total.
CREATE POLICY "Admin full access to forms"
  ON forms FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- form_submissions: solo admin. Los envíos los escribe el server con
-- service-role (createAdminClient), que ignora RLS — el cliente anon
-- NUNCA inserta directo (pasa por rate-limit + Turnstile + zod en el route).
CREATE POLICY "Admin full access to submissions"
  ON form_submissions FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
