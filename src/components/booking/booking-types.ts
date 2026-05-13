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
  // Build a reference date at noon UTC to extract Santiago offset reliably
  const [h, m] = timeStr.split(":").map(Number);
  const probe = new Date(`${dateStr}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    hour: "numeric",
    hour12: false,
    timeZoneName: "shortOffset",
  }).formatToParts(probe);
  const offsetStr = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-4";
  const offsetMatch = offsetStr.match(/GMT([+-]\d+)/);
  const offsetH = offsetMatch ? parseInt(offsetMatch[1]) : -4;
  const midnightUtc = new Date(`${dateStr}T${String(-offsetH).padStart(2, "0")}:00:00Z`).getTime();
  return midnightUtc + (h * 60 + m) * 60_000;
}

/** Format a UTC-ms timestamp in a given IANA timezone, returning { date, time } */
export function formatInTz(
  utcMs: number,
  tz: string,
  use24h: boolean,
): { dateLabel: string; timeLabel: string } {
  const d = new Date(utcMs);
  const dateLabel = d.toLocaleDateString("es-CL", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeLabel = d.toLocaleTimeString("es-CL", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: !use24h,
  });
  return { dateLabel, timeLabel };
}

/** Returns "HH:MM" in user timezone from a Santiago slot */
export function slotTimeInUserTz(dateStr: string, timeStr: string, userTz: string, use24h: boolean): string {
  const utcMs = santiagoSlotToUtc(dateStr, timeStr);
  const d = new Date(utcMs);
  return d.toLocaleTimeString("es-CL", {
    timeZone: userTz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: !use24h,
  });
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
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
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

export const COUNTRY_CODES: { code: string; country: string; flag: string }[] = [
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+52", country: "México", flag: "🇲🇽" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+51", country: "Perú", flag: "🇵🇪" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+502", country: "Guatemala", flag: "🇬🇹" },
  { code: "+503", country: "El Salvador", flag: "🇸🇻" },
  { code: "+504", country: "Honduras", flag: "🇭🇳" },
  { code: "+505", country: "Nicaragua", flag: "🇳🇮" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
  { code: "+507", country: "Panamá", flag: "🇵🇦" },
  { code: "+591", country: "Bolivia", flag: "🇧🇴" },
  { code: "+595", country: "Paraguay", flag: "🇵🇾" },
  { code: "+598", country: "Uruguay", flag: "🇺🇾" },
  { code: "+1", country: "EE.UU. / Canadá", flag: "🇺🇸" },
  { code: "+34", country: "España", flag: "🇪🇸" },
  { code: "+55", country: "Brasil", flag: "🇧🇷" },
  { code: "+44", country: "Reino Unido", flag: "🇬🇧" },
  { code: "+49", country: "Alemania", flag: "🇩🇪" },
  { code: "+33", country: "Francia", flag: "🇫🇷" },
  { code: "+39", country: "Italia", flag: "🇮🇹" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
];

/** Guess a country code from the browser timezone */
export function detectCountryCode(tz: string): string {
  if (tz.startsWith("America/Bogota") || tz === "America/Bogota") return "+57";
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

// ── Common IANA timezones for selector ────────────────────────────────────────

export const TZ_OPTIONS: { label: string; value: string }[] = [
  { label: "Colombia (UTC-5)", value: "America/Bogota" },
  { label: "Chile (UTC-3/-4)", value: "America/Santiago" },
  { label: "México (UTC-6)", value: "America/Mexico_City" },
  { label: "Argentina (UTC-3)", value: "America/Argentina/Buenos_Aires" },
  { label: "Perú (UTC-5)", value: "America/Lima" },
  { label: "Venezuela (UTC-4)", value: "America/Caracas" },
  { label: "Ecuador (UTC-5)", value: "America/Guayaquil" },
  { label: "Costa Rica (UTC-6)", value: "America/Costa_Rica" },
  { label: "Panamá (UTC-5)", value: "America/Panama" },
  { label: "Bolivia (UTC-4)", value: "America/La_Paz" },
  { label: "Paraguay (UTC-4)", value: "America/Asuncion" },
  { label: "Uruguay (UTC-3)", value: "America/Montevideo" },
  { label: "Nueva York (UTC-5/-4)", value: "America/New_York" },
  { label: "Los Ángeles (UTC-8/-7)", value: "America/Los_Angeles" },
  { label: "España (UTC+1/+2)", value: "Europe/Madrid" },
  { label: "Reino Unido (UTC+0/+1)", value: "Europe/London" },
  { label: "Alemania (UTC+1/+2)", value: "Europe/Berlin" },
  { label: "Brasil (UTC-3)", value: "America/Sao_Paulo" },
  { label: "Australia (UTC+10/+11)", value: "Australia/Sydney" },
];
