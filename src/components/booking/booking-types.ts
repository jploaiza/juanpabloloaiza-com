import {
  CHILE_TZ, formatDateLongInTz, formatDateShortInTz, formatTimeInTz, todayInChile, ymdInTz, zonedTimeToUtc,
} from "@/lib/tz";

export type BookingStep = "calendar" | "form" | "confirm";

export interface DaySlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (America/Santiago)
  available: boolean;
}

export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  notes: string;
}

export interface ConfirmationData {
  bookingCode: string;
  name: string;
  email: string;
  type: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM Santiago
  durationMin: number;
  eventLink: string;
  userTz: string;
  zoomJoinUrl?: string;
}

// ── Timezone helpers ──────────────────────────────────────────────────────────

export function getBrowserTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/Santiago";
  }
}

/** Convert an America/Santiago HH:MM slot on a given YYYY-MM-DD to UTC ms */
export function santiagoSlotToUtc(dateStr: string, timeStr: string): number {
  return zonedTimeToUtc(dateStr, timeStr, CHILE_TZ);
}

/** Returns "HH:MM" in user timezone from a Santiago slot */
export function slotTimeInUserTz(dateStr: string, timeStr: string, userTz: string, use24h: boolean): string {
  return formatTimeInTz(santiagoSlotToUtc(dateStr, timeStr), userTz, use24h);
}

export interface SlotDescription {
  utc: number;
  /** Fecha larga en la zona del paciente. */
  dateLabel: string;
  /** Fecha corta en la zona del paciente. */
  dateShort: string;
  /** Hora en la zona del paciente. */
  timeLabel: string;
  /** Días de diferencia entre la fecha del paciente y la de Chile (-1, 0, +1…). */
  dayShift: number;
  /** "12:00 hora de Chile" si la hora o el día difieren de Chile; null si coinciden. */
  chileNote: string | null;
}

/** Describe un horario de agenda (hora de Chile) tal como lo ve el paciente. */
export function describeSlot(dateStr: string, timeStr: string, userTz: string, use24h: boolean): SlotDescription {
  const utc = santiagoSlotToUtc(dateStr, timeStr);
  const userDay = ymdInTz(utc, userTz);
  const timeLabel = formatTimeInTz(utc, userTz, use24h);
  const chileTime = formatTimeInTz(utc, CHILE_TZ, use24h);
  const sameAsChile = userDay === dateStr && timeLabel === chileTime;
  const dayShift = Math.round((Date.parse(`${userDay}T00:00:00Z`) - Date.parse(`${dateStr}T00:00:00Z`)) / 86_400_000);
  return {
    utc,
    dateLabel: formatDateLongInTz(utc, userTz),
    dateShort: formatDateShortInTz(utc, userTz),
    timeLabel,
    dayShift,
    chileNote: sameAsChile
      ? null
      : `${chileTime}${userDay !== dateStr ? ` del ${formatDateShortInTz(utc, CHILE_TZ).replace(",", "")}` : ""} hora de Chile`,
  };
}

// ── Calendar helpers ──────────────────────────────────────────────────────────

export interface CalendarDay {
  dateStr: string; // YYYY-MM-DD, empty string for padding cells
  dayNum: number;
  isToday: boolean;
  isPast: boolean;
  hasSlots?: boolean;
}

export function getMonthDays(year: number, month: number): CalendarDay[] {
  // Los días del calendario son fechas de Chile, así que "hoy" también lo es
  // (toISOString() daba la fecha UTC, que de noche en América ya es "mañana").
  const todayStr = todayInChile();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Start week on Monday (ISO)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const days: CalendarDay[] = [];
  // Padding cells
  for (let i = 0; i < startOffset; i++) {
    days.push({ dateStr: "", dayNum: 0, isToday: false, isPast: true });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({
      dateStr,
      dayNum: d,
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
    });
  }
  return days;
}

// ── Country codes (most common first) ────────────────────────────────────────

export const COUNTRY_CODES: { code: string; country: string; iso: string; flag: string }[] = [
  { code: "+57", country: "Colombia", iso: "CO", flag: "🇨🇴" },
  { code: "+56", country: "Chile", iso: "CL", flag: "🇨🇱" },
  { code: "+52", country: "México", iso: "MX", flag: "🇲🇽" },
  { code: "+54", country: "Argentina", iso: "AR", flag: "🇦🇷" },
  { code: "+51", country: "Perú", iso: "PE", flag: "🇵🇪" },
  { code: "+58", country: "Venezuela", iso: "VE", flag: "🇻🇪" },
  { code: "+593", country: "Ecuador", iso: "EC", flag: "🇪🇨" },
  { code: "+502", country: "Guatemala", iso: "GT", flag: "🇬🇹" },
  { code: "+503", country: "El Salvador", iso: "SV", flag: "🇸🇻" },
  { code: "+504", country: "Honduras", iso: "HN", flag: "🇭🇳" },
  { code: "+505", country: "Nicaragua", iso: "NI", flag: "🇳🇮" },
  { code: "+506", country: "Costa Rica", iso: "CR", flag: "🇨🇷" },
  { code: "+507", country: "Panamá", iso: "PA", flag: "🇵🇦" },
  { code: "+591", country: "Bolivia", iso: "BO", flag: "🇧🇴" },
  { code: "+595", country: "Paraguay", iso: "PY", flag: "🇵🇾" },
  { code: "+598", country: "Uruguay", iso: "UY", flag: "🇺🇾" },
  { code: "+1", country: "EE.UU. / Canadá", iso: "US", flag: "🇺🇸" },
  { code: "+34", country: "España", iso: "ES", flag: "🇪🇸" },
  { code: "+55", country: "Brasil", iso: "BR", flag: "🇧🇷" },
  { code: "+44", country: "Reino Unido", iso: "GB", flag: "🇬🇧" },
  { code: "+49", country: "Alemania", iso: "DE", flag: "🇩🇪" },
  { code: "+33", country: "Francia", iso: "FR", flag: "🇫🇷" },
  { code: "+39", country: "Italia", iso: "IT", flag: "🇮🇹" },
  { code: "+61", country: "Australia", iso: "AU", flag: "🇦🇺" },
];

/** Código telefónico a partir del país elegido (ISO) o, si no hay, de la zona horaria. */
export function detectCountryCode(tz: string, iso?: string): string {
  if (iso) {
    const byIso = COUNTRY_CODES.find((c) => c.iso === iso);
    if (byIso) return byIso.code;
    if (iso === "CA" || iso === "PR" || iso === "DO") return "+1";
  }
  if (tz.startsWith("America/Bogota")) return "+57";
  if (tz.startsWith("America/Santiago")) return "+56";
  if (tz.startsWith("America/Mexico")) return "+52";
  if (tz.startsWith("America/Argentina")) return "+54";
  if (tz === "America/Lima") return "+51";
  if (tz === "America/Caracas") return "+58";
  if (tz === "America/Guayaquil") return "+593";
  if (tz === "America/Costa_Rica") return "+506";
  if (tz === "America/Panama") return "+507";
  if (tz === "America/New_York" || tz === "America/Chicago" || tz === "America/Denver" || tz === "America/Los_Angeles") return "+1";
  if (tz.startsWith("Europe/Madrid")) return "+34";
  if (tz.startsWith("Europe/London")) return "+44";
  return "+57";
}
