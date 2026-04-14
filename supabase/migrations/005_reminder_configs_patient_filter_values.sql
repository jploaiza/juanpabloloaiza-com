-- Expand patient_filter CHECK constraint to include calendar-aware and specific filters
ALTER TABLE reminder_configs
  DROP CONSTRAINT reminder_configs_patient_filter_check;

ALTER TABLE reminder_configs
  ADD CONSTRAINT reminder_configs_patient_filter_check
    CHECK (patient_filter = ANY (ARRAY[
      'active'::text,
      'paused'::text,
      'finished'::text,
      'all'::text,
      'without_appointment'::text,
      'with_appointment'::text,
      'without_appointment_next_week'::text,
      'with_appointment_next_week'::text,
      'specific'::text
    ]));
