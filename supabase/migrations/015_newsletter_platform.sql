-- Newsletter Platform Migration
-- Extends newsletter_subscribers + adds campaigns, sends, templates, imports, automations

-- ── 1. Extend newsletter_subscribers ─────────────────────────────────────────

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CONSTRAINT newsletter_subscribers_status_check
    CHECK (status IN ('pending','confirmed','unsubscribed','bounced','complained')),
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirm_token uuid DEFAULT gen_random_uuid() NOT NULL,
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid DEFAULT gen_random_uuid() NOT NULL,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_engaged_at timestamptz;

-- Migrate existing rows: treat as confirmed (pre-opt-in)
UPDATE newsletter_subscribers
SET status = 'confirmed', confirmed_at = created_at
WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_confirm_token_idx
  ON newsletter_subscribers(confirm_token);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_unsubscribe_token_idx
  ON newsletter_subscribers(unsubscribe_token);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_idx
  ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_tags_idx
  ON newsletter_subscribers USING gin(tags);

-- ── 2. newsletter_campaigns ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  preheader text DEFAULT '',
  template_kind text NOT NULL DEFAULT 'editorial'
    CONSTRAINT newsletter_campaigns_template_kind_check
    CHECK (template_kind IN ('editorial','announcement','welcome','reengagement')),
  template_data jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft'
    CONSTRAINT newsletter_campaigns_status_check
    CHECK (status IN ('draft','scheduled','sending','sent','canceled','failed')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  sender_name text DEFAULT 'Juan Pablo Loaiza',
  sender_email text DEFAULT 'newsletter@juanpabloloaiza.com',
  segment jsonb NOT NULL DEFAULT '{"status":"confirmed","tags":[]}',
  stats_cache jsonb NOT NULL DEFAULT '{"recipients":0,"sent":0,"delivered":0,"opened":0,"clicked":0,"bounced":0,"complained":0}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS newsletter_campaigns_status_idx
  ON newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS newsletter_campaigns_scheduled_at_idx
  ON newsletter_campaigns(scheduled_at)
  WHERE status = 'scheduled';

-- ── 3. newsletter_sends ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS newsletter_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  resend_id text,
  status text NOT NULL DEFAULT 'queued'
    CONSTRAINT newsletter_sends_status_check
    CHECK (status IN ('queued','sent','delivered','opened','clicked','bounced','complained','failed')),
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS newsletter_sends_campaign_status_idx
  ON newsletter_sends(campaign_id, status);
CREATE INDEX IF NOT EXISTS newsletter_sends_subscriber_opened_idx
  ON newsletter_sends(subscriber_id, opened_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS newsletter_sends_resend_id_idx
  ON newsletter_sends(resend_id)
  WHERE resend_id IS NOT NULL;

-- ── 4. newsletter_templates ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS newsletter_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL
    CONSTRAINT newsletter_templates_kind_check
    CHECK (kind IN ('editorial','announcement','welcome','reengagement')),
  name text NOT NULL,
  description text DEFAULT '',
  version int NOT NULL DEFAULT 1,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO newsletter_templates (kind, name, description, is_default) VALUES
  ('editorial',    'Newsletter Editorial', 'Artículo principal + 2 secundarios con imagen y extracto', true),
  ('announcement', 'Anuncio / Lanzamiento', 'CTA único destacado para eventos, cursos o lanzamientos', true),
  ('welcome',      'Bienvenida', 'Email automático para nuevos suscriptores confirmados', true),
  ('reengagement', 'Re-engagement', 'Reactiva suscriptores que no han abierto en 60+ días', true)
ON CONFLICT DO NOTHING;

-- ── 5. newsletter_imports ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS newsletter_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  total_rows int NOT NULL DEFAULT 0,
  inserted int NOT NULL DEFAULT 0,
  skipped_duplicates int NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 6. newsletter_automations ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS newsletter_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL UNIQUE
    CONSTRAINT newsletter_automations_kind_check
    CHECK (kind IN ('welcome','reengagement')),
  name text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'
);

INSERT INTO newsletter_automations (kind, name, enabled, config) VALUES
  ('welcome',      'Bienvenida automática',    true,  '{"delay_minutes": 0}'),
  ('reengagement', 'Re-engagement inactivos',  false, '{"inactive_days": 60, "auto_unsubscribe_days": 90}')
ON CONFLICT (kind) DO NOTHING;

-- ── 7. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE newsletter_campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_sends      ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_imports    ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_automations ENABLE ROW LEVEL SECURITY;

-- Service role (used by createAdminClient) bypasses RLS — API routes use admin client
-- Public: allow confirm + unsubscribe via token (no auth, done in API with admin client)
-- No anon direct access to campaign/sends tables
