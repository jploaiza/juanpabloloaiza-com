-- ── Events RLS fix (ALTA-2) ───────────────────────────────────────────────────
-- Prevent anon clients from claiming any user_id when inserting events.
-- This was applied via MCP; this file versions it for reproducibility.

DROP POLICY IF EXISTS "Public insert events" ON events;
DROP POLICY IF EXISTS "Anon insert events" ON events;
DROP POLICY IF EXISTS "Authenticated insert events" ON events;
DROP POLICY IF EXISTS "Service role reads events" ON events;

CREATE POLICY "Anon insert events" ON events
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Authenticated insert events" ON events
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Service role reads events" ON events
  FOR SELECT TO service_role
  USING (true);

-- ── Certificates RLS fix (BAJA-1) ────────────────────────────────────────────
-- Restrict SELECT so students can only read their own certificate.

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Certificates select own" ON certificates;
DROP POLICY IF EXISTS "Certificates service role all" ON certificates;

CREATE POLICY "Certificates select own" ON certificates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Certificates service role all" ON certificates
  FOR ALL TO service_role
  USING (true);
