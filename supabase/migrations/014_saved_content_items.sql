CREATE TABLE saved_content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL CHECK (type IN ('trend', 'angle')),
  keyword text NOT NULL,
  geo text NOT NULL,
  title text NOT NULL,
  data jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'developing', 'done')),
  notes text
);

CREATE INDEX idx_saved_status_created ON saved_content_items(status, created_at DESC);

ALTER TABLE saved_content_items ENABLE ROW LEVEL SECURITY;
-- No policies = only service_role access (same pattern as trends_run_logs)
