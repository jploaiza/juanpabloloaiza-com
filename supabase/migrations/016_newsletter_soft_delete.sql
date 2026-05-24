-- Add 'deleted' status to newsletter_subscribers for GDPR-compliant soft-delete
-- Required by application code that uses status='deleted' instead of hard DELETE

ALTER TABLE newsletter_subscribers
  DROP CONSTRAINT IF EXISTS newsletter_subscribers_status_check,
  ADD CONSTRAINT newsletter_subscribers_status_check
    CHECK (status IN ('pending','confirmed','unsubscribed','bounced','complained','deleted'));
