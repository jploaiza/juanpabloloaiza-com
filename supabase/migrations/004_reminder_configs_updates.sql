-- ================================================================
-- Reminder configs: add minute-level scheduling and specific patient IDs
-- ================================================================

-- Minute-level cron scheduling (0–59), default 0 = on the hour
ALTER TABLE reminder_configs
  ADD COLUMN IF NOT EXISTS minute_chile int NOT NULL DEFAULT 0
    CHECK (minute_chile BETWEEN 0 AND 59);

-- Specific patient IDs for targeted automated sends (used when patient_filter = 'specific')
ALTER TABLE reminder_configs
  ADD COLUMN IF NOT EXISTS patient_ids uuid[] DEFAULT NULL;
