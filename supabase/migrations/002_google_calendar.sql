-- ================================================================
-- Google Calendar tokens — Juan Pablo Loaiza CRM
-- Ejecutar en Supabase SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token  text NOT NULL,
  refresh_token text,
  expires_at    timestamptz NOT NULL,
  calendar_id   text NOT NULL DEFAULT 'primary',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Solo el propio usuario puede leer/escribir sus tokens
CREATE POLICY "Users manage own calendar tokens"
  ON google_calendar_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
