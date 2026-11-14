/**
 * Utilidades de zona horaria isomórficas (cliente + servidor), sin dependencias.
 * Todo se calcula con Intl, así que respeta el horario de verano de cada zona.
 */

/** Zona en la que se publican los horarios de agenda. */
export const CHILE_TZ = "America/Santiago";

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(tz: string): Intl.DateTimeFormat {
  let f = dtfCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    dtfCache.set(tz, f);
  }
  return f;
}

/** true si `tz` es un identificador IANA que el runtime reconoce. */
export function isValidTz(tz: unknown): tz is string {
  if (typeof tz !== "string" || tz.length === 0 || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Desfase de `tz` respecto a UTC (minutos, positivo al este) en el instante `utcMs`. */
export function tzOffsetMinutes(utcMs: number, tz: string): number {
  const parts = partsFormatter(tz).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000);
}

/** Convierte una fecha/hora de pared ("2026-11-16", "10:00") en `tz` a milisegundos UTC. */
export function zonedTimeToUtc(dateStr: string, timeStr: string, tz: string): number {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  const off1 = tzOffsetMinutes(naive, tz);
  let utc = naive - off1 * 60000;
  const off2 = tzOffsetMinutes(utc, tz);
  if (off2 !== off1) utc = naive - off2 * 60000; // cruce de horario de verano
  return utc;
}

/** "GMT-6", "GMT+5:30", "GMT". */
export function formatOffset(minutes: number): string {
  if (minutes === 0) return "GMT";
  const sign = minutes > 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

export function tzOffsetLabel(tz: string, atMs: number = Date.now()): string {
  return formatOffset(tzOffsetMinutes(atMs, tz));
}

/** Nombres de ciudad en español para los casos en que el nombre IANA/tzdb está en inglés. */
const CITY_ES: Record<string, string> = {
  "Mexico City": "Ciudad de México",
  "Panama City": "Ciudad de Panamá",
  "Guatemala City": "Ciudad de Guatemala",
  Panama: "Ciudad de Panamá",
  Guatemala: "Ciudad de Guatemala",
  Havana: "La Habana",
  Easter: "Isla de Pascua",
  Galapagos: "Galápagos",
  "New York City": "Nueva York",
  New_York: "Nueva York",
  "New York": "Nueva York",
  "Los Angeles": "Los Ángeles",
  Rome: "Roma",
  Milan: "Milán",
  Naples: "Nápoles",
  Lisbon: "Lisboa",
  London: "Londres",
  Paris: "París",
  Munich: "Múnich",
  Brussels: "Bruselas",
  Vienna: "Viena",
  Prague: "Praga",
  Geneva: "Ginebra",
  Zurich: "Zúrich",
  Athens: "Atenas",
  Copenhagen: "Copenhague",
  Warsaw: "Varsovia",
  Moscow: "Moscú",
  Cairo: "El Cairo",
  Tokyo: "Tokio",
  Beijing: "Pekín",
  Seoul: "Seúl",
  "Sao Paulo": "São Paulo",
  Bogota: "Bogotá",
  Asuncion: "Asunción",
  Cancun: "Cancún",
  Merida: "Mérida",
  Mazatlan: "Mazatlán",
  Cordoba: "Córdoba",
};

/** Traduce al español el nombre de una ciudad si hay equivalencia conocida. */
export function cityNameEs(city: string): string {
  return CITY_ES[city] ?? city;
}

/** "America/Argentina/Buenos_Aires" -> "Buenos Aires" ; "America/Mexico_City" -> "Ciudad de México" */
export function cityFromTz(tz: string): string {
  return cityNameEs((tz.split("/").pop() ?? tz).replace(/_/g, " "));
}

/** "YYYY-MM-DD" del instante `utcMs` visto desde `tz`. */
export function ymdInTz(utcMs: number, tz: string): string {
  const parts = partsFormatter(tz).formatToParts(new Date(utcMs));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** "HH:MM" en 24 h, o "h:mm a. m." en 12 h. */
export function formatTimeInTz(utcMs: number, tz: string, use24h = true): string {
  if (use24h) {
    const parts = partsFormatter(tz).formatToParts(new Date(utcMs));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
    return `${String(Number(get("hour")) % 24).padStart(2, "0")}:${get("minute")}`;
  }
  return new Date(utcMs).toLocaleTimeString("es-CL", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true });
}

/** "lunes 16 de noviembre de 2026" */
export function formatDateLongInTz(utcMs: number, tz: string): string {
  return new Date(utcMs).toLocaleDateString("es-CL", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "lunes 16 de noviembre" (sin año) */
export function formatDateShortInTz(utcMs: number, tz: string): string {
  return new Date(utcMs).toLocaleDateString("es-CL", { timeZone: tz, weekday: "long", day: "numeric", month: "long" });
}

/** Fecha de hoy ("YYYY-MM-DD") en la zona de la agenda (Chile). */
export function todayInChile(): string {
  return ymdInTz(Date.now(), CHILE_TZ);
}
