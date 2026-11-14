-- ================================================================
-- Zona horaria del paciente en las reservas
-- Ejecutar en Supabase SQL Editor (aditiva y segura: IF NOT EXISTS).
--
-- Guarda el identificador IANA (ej. 'America/Mexico_City') que el paciente tenía
-- elegido al reservar. Los correos, WhatsApp y recordatorios lo usan para mostrar
-- la hora del paciente primero y, entre paréntesis, la hora de Chile cuando difiere.
--
-- El código funciona aunque esta columna aún no exista: las reservas nuevas se crean
-- igual y los mensajes de confirmación usan la zona enviada en la reserva. Solo los
-- recordatorios posteriores necesitan la columna para usar la zona del paciente.
-- ================================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS user_tz text;

COMMENT ON COLUMN bookings.user_tz IS
  'Zona horaria IANA del paciente al reservar. La hora de la cita (date/time_slot) siempre está en America/Santiago.';
