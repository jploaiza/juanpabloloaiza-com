import {
  CHILE_TZ,
  cityFromTz,
  formatDateLongInTz,
  formatDateShortInTz,
  formatTimeInTz,
  isValidTz,
  tzOffsetLabel,
  ymdInTz,
  zonedTimeToUtc,
} from "@/lib/tz";

/**
 * Variables de plantilla (correo / WhatsApp / recordatorios) para la hora de una cita.
 *
 * Los horarios de agenda se guardan en hora de Chile (`date` + `time`). Si la zona del
 * paciente da una hora distinta, la hora principal es la del paciente y entre paréntesis
 * va la de Chile: "10:00 (12:00 hora de Chile)". Si coinciden, queda solo la hora de Chile.
 *
 * Las claves `date_long` y `time` ya existen en las plantillas guardadas, por eso las
 * plantillas actuales adoptan el nuevo formato sin editarse.
 */
export function buildBookingTimeVars(date: string, time: string, userTz?: string | null): Record<string, string> {
  const utc = zonedTimeToUtc(date, time, CHILE_TZ);
  const chileDateLong = formatDateLongInTz(utc, CHILE_TZ);

  const sameAsChile: Record<string, string> = {
    date_long: chileDateLong,
    time,
    time_chile: time,
    date_chile: chileDateLong,
    time_patient: time,
    timezone: "Chile (America/Santiago)",
    user_tz: "Chile (America/Santiago)",
  };

  if (!isValidTz(userTz) || userTz === CHILE_TZ) return sameAsChile;

  const userTime = formatTimeInTz(utc, userTz, true);
  const userDay = ymdInTz(utc, userTz);
  if (userTime === time && userDay === date) return sameAsChile; // misma hora y día que en Chile

  const chilePart =
    userDay === date
      ? `${time} hora de Chile`
      : `${time} del ${formatDateShortInTz(utc, CHILE_TZ).replace(",", "")}, hora de Chile`; // ICU a veces agrega coma tras el día

  const tzLabel = `${cityFromTz(userTz)} (${tzOffsetLabel(userTz, utc)})`;
  return {
    date_long: formatDateLongInTz(utc, userTz),
    time: `${userTime} (${chilePart})`,
    time_chile: time,
    date_chile: chileDateLong,
    time_patient: userTime,
    timezone: tzLabel,
    user_tz: tzLabel,
  };
}
