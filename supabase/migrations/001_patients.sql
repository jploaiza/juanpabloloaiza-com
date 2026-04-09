-- ================================================================
-- CRM de Pacientes — Juan Pablo Loaiza
-- Ejecutar en Supabase SQL Editor
-- ================================================================

-- Enum: estado del paciente
CREATE TYPE patient_status AS ENUM ('active', 'paused', 'finished');

-- Enum: tipo de log
CREATE TYPE patient_log_type AS ENUM ('reminder_sent', 'session_registered', 'note_added', 'status_changed');

-- ----------------------------------------------------------------
-- Tabla principal: patients
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text NOT NULL,
  email         text NOT NULL,
  phone         text NOT NULL,           -- formato: +56912345678
  pack_size     int  NOT NULL CHECK (pack_size IN (3, 5, 8)),
  sessions_used int  NOT NULL DEFAULT 0,
  start_date    date NOT NULL,
  end_date      date NOT NULL,           -- calculado al crear/editar
  status        patient_status NOT NULL DEFAULT 'active',
  notes         text,
  reminder_day  int  NOT NULL DEFAULT 1  -- 0=dom, 1=lun … 6=sáb
                     CHECK (reminder_day BETWEEN 0 AND 6),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- Tabla de logs: patient_logs
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type        patient_log_type NOT NULL,
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patient_logs_patient_id_idx ON patient_logs(patient_id);
CREATE INDEX IF NOT EXISTS patient_logs_created_at_idx ON patient_logs(created_at DESC);

-- ----------------------------------------------------------------
-- RLS — solo admin accede
-- ----------------------------------------------------------------
ALTER TABLE patients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_logs ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total a patients
CREATE POLICY "Admin full access to patients"
  ON patients
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Admin: acceso total a patient_logs
CREATE POLICY "Admin full access to patient_logs"
  ON patient_logs
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );
