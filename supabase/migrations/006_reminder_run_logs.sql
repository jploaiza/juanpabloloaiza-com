-- Cron execution log — one row per send-reminders invocation
CREATE TABLE IF NOT EXISTS reminder_run_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at          timestamptz NOT NULL DEFAULT now(),
  chile_day       int NOT NULL,
  chile_hour      int NOT NULL,
  chile_minute    int NOT NULL,
  configs_matched int NOT NULL DEFAULT 0,
  results         jsonb,
  top_error       text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reminder_run_logs_run_at_idx ON reminder_run_logs(run_at DESC);

ALTER TABLE reminder_run_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to reminder_run_logs"
  ON reminder_run_logs
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
