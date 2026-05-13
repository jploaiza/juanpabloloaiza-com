-- trends_interest_timeline
-- Weekly snapshots of interestOverTime score per keyword × geo.
-- Populated by the cron job at /api/cron/sync-trends.

CREATE TABLE IF NOT EXISTS trends_interest_timeline (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword       text        NOT NULL,
  geo           text        NOT NULL,
  interest_score integer    NOT NULL CHECK (interest_score >= 0 AND interest_score <= 100),
  recorded_date date        NOT NULL DEFAULT CURRENT_DATE,
  created_at    timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT trends_interest_timeline_unique UNIQUE (keyword, geo, recorded_date)
);

CREATE INDEX IF NOT EXISTS trends_interest_timeline_lookup_idx
  ON trends_interest_timeline (keyword, geo, recorded_date DESC);

-- RLS: only service_role can write; anon has no access
ALTER TABLE trends_interest_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON trends_interest_timeline
  FOR ALL TO service_role USING (true) WITH CHECK (true);
