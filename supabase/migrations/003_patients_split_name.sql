-- 003_patients_split_name.sql
-- Split patients.full_name into first_name + last_name
-- first_name: everything before the first space
-- last_name: everything after the first space (allows compound last names)

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_name  TEXT NOT NULL DEFAULT '';

-- Backfill from full_name
UPDATE patients
SET
  first_name = TRIM(SPLIT_PART(full_name, ' ', 1)),
  last_name  = TRIM(SUBSTRING(full_name FROM LENGTH(SPLIT_PART(full_name, ' ', 1)) + 2));

-- Remove default so new inserts must provide values
ALTER TABLE patients
  ALTER COLUMN first_name DROP DEFAULT,
  ALTER COLUMN last_name  DROP DEFAULT;

-- Drop the old column
ALTER TABLE patients DROP COLUMN IF EXISTS full_name;
