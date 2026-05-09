-- Migration 010: Google Trends + Search Console content intelligence

-- 1. Snapshots diarios de Google Trends
CREATE TABLE IF NOT EXISTS trends_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_at date NOT NULL DEFAULT CURRENT_DATE,
  geo text NOT NULL,
  keyword text NOT NULL,
  source text NOT NULL,           -- 'daily_trend' | 'related_query' | 'interest_over_time'
  seed_keyword text NOT NULL DEFAULT '',  -- '' for daily_trends; seed keyword for related/interest
  interest_score int,             -- 0-100 from Trends
  rising boolean DEFAULT false,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(captured_at, geo, keyword, source, seed_keyword)
);

CREATE INDEX IF NOT EXISTS idx_trends_captured ON trends_snapshots(captured_at DESC, geo);
CREATE INDEX IF NOT EXISTS idx_trends_keyword ON trends_snapshots(keyword);

-- 2. Top queries from Google Search Console
CREATE TABLE IF NOT EXISTS gsc_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  query text NOT NULL,
  country text NOT NULL,          -- ISO-3 lowercase: 'esp'|'usa'|'mex'|'chl'|'all'
  clicks int NOT NULL DEFAULT 0,
  impressions int NOT NULL DEFAULT 0,
  ctr numeric(5,4) NOT NULL DEFAULT 0,
  position numeric(6,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(date, query, country)
);

CREATE INDEX IF NOT EXISTS idx_gsc_date_clicks ON gsc_queries(date DESC, clicks DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_striking ON gsc_queries(impressions DESC) WHERE position BETWEEN 8 AND 30;

-- 3. Content ideas linking trends/GSC to blog posts
CREATE TABLE IF NOT EXISTS content_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  seed_keyword text NOT NULL,
  geo text,
  source text NOT NULL,           -- 'trends' | 'gsc' | 'manual'
  source_ref jsonb,               -- {trends_snapshot_id} or {gsc_query_id, position, impressions}
  opportunity_score numeric(8,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new',  -- 'new'|'drafting'|'published'|'rejected'
  notes text,
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE SET NULL,
  UNIQUE(seed_keyword, geo, source)
);

CREATE INDEX IF NOT EXISTS idx_ideas_status_score ON content_ideas(status, opportunity_score DESC);

-- 4. Cron run logs for debugging
CREATE TABLE IF NOT EXISTS trends_run_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL DEFAULT now(),
  duration_ms int,
  trends_inserted int DEFAULT 0,
  gsc_inserted int DEFAULT 0,
  ideas_inserted int DEFAULT 0,
  errors jsonb
);

-- RLS: only service_role reads/writes (not exposed to client)
ALTER TABLE trends_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE trends_run_logs ENABLE ROW LEVEL SECURITY;
