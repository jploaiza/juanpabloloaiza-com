-- Migration 011: Fix content_ideas.geo NOT NULL constraint

-- geo was nullable, which allows NULL != NULL bypass of the UNIQUE(seed_keyword, geo, source) constraint
-- Backfill empty-string for any existing NULLs before adding NOT NULL
UPDATE content_ideas SET geo = '' WHERE geo IS NULL;
ALTER TABLE content_ideas ALTER COLUMN geo SET NOT NULL;
ALTER TABLE content_ideas ALTER COLUMN geo SET DEFAULT '';
