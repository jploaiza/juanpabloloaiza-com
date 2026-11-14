import { isValidTz } from "@/lib/tz";

/**
 * Preferencia de zona horaria del visitante.
 *
 * - Con consentimiento ("Aceptar y guardar"): cookie `jpl_tz` de 1 año. Desaparece al
 *   borrar cookies/historial, y entonces se vuelve a preguntar.
 * - Sin consentimiento ("Solo esta vez"): sessionStorage, que muere al cerrar la pestaña.
 *   No se escribe ninguna cookie.
 */

export const TZ_COOKIE = "jpl_tz";
const SESSION_KEY = "jpl_tz_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export interface TzPref {
  /** Identificador IANA, ej. "America/Mexico_City". */
  tz: string;
  /** ISO 3166-1 alfa-2 en mayúsculas, ej. "MX". */
  country: string;
  /** Ciudad principal elegida (solo para mostrar). */
  city?: string;
}

export function parseTzPref(raw: string | null | undefined): TzPref | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<TzPref>;
    if (!isValidTz(v.tz)) return null;
    if (typeof v.country !== "string" || !/^[A-Z]{2}$/.test(v.country)) return null;
    const city = typeof v.city === "string" && v.city.length > 0 ? v.city.slice(0, 60) : undefined;
    return { tz: v.tz, country: v.country, ...(city ? { city } : {}) };
  } catch {
    return null;
  }
}

function readCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${TZ_COOKIE}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(TZ_COOKIE.length + 1));
  } catch {
    return null;
  }
}

function readSession(): string | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

/** Lee la preferencia: primero la elegida en esta sesión, luego la cookie. */
export function readTzPref(): TzPref | null {
  return parseTzPref(readSession()) ?? parseTzPref(readCookie());
}

export function saveTzPref(pref: TzPref, persist: boolean): void {
  const json = JSON.stringify(pref);
  if (persist) {
    const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${TZ_COOKIE}=${encodeURIComponent(json)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* sin storage */ }
  } else {
    try { sessionStorage.setItem(SESSION_KEY, json); } catch { /* sin storage */ }
  }
}

export function clearTzPref(): void {
  document.cookie = `${TZ_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* sin storage */ }
}
