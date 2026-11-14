/**
 * Catálogo de países y zonas horarias para el selector. Se carga bajo demanda
 * (import dinámico) para no sumar ~160 KB al bundle de las páginas de agenda.
 */

import { cityNameEs } from "@/lib/tz";

export interface ZoneOption {
  /** Identificador IANA canónico. */
  tz: string;
  /** Ciudades principales de la zona (para mostrar). */
  cities: string[];
  /** Todos los identificadores equivalentes (alias), incluido `tz`. */
  group: string[];
  /** Desfase estándar (minutos), solo para ordenar. */
  rawOffset: number;
}

export interface CountryOption {
  code: string; // ISO 3166-1 alfa-2, mayúsculas
  name: string; // en español
  zones: ZoneOption[];
}

export interface TzData {
  countries: CountryOption[];
  byCode: Map<string, CountryOption>;
  /** País al que pertenece un identificador IANA (incluye alias), o null. */
  countryOfTz: (tz: string) => string | null;
  /** Zona del país que contiene el identificador IANA dado, o null. */
  zoneOfTz: (country: string, tz: string) => ZoneOption | null;
}

let cache: Promise<TzData> | null = null;

export function normalizeSearch(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function loadTzData(): Promise<TzData> {
  cache ??= import("@vvo/tzdb").then(({ getTimeZones }) => {
    const names = new Intl.DisplayNames(["es"], { type: "region" });
    const byCode = new Map<string, CountryOption>();
    const tzToCountry = new Map<string, string>();

    for (const z of getTimeZones()) {
      let country = byCode.get(z.countryCode);
      if (!country) {
        let name = z.countryName;
        try { name = names.of(z.countryCode) ?? z.countryName; } catch { /* usa el nombre en inglés */ }
        country = { code: z.countryCode, name, zones: [] };
        byCode.set(z.countryCode, country);
      }
      const group = Array.from(new Set([z.name, ...z.group]));
      country.zones.push({ tz: z.name, cities: z.mainCities.map(cityNameEs), group, rawOffset: z.rawOffsetInMinutes });
      for (const g of group) if (!tzToCountry.has(g)) tzToCountry.set(g, z.countryCode);
    }

    const countries = Array.from(byCode.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));
    for (const c of countries) {
      // De oeste a este; a igual desfase, por ciudad principal.
      c.zones.sort(
        (a, b) => a.rawOffset - b.rawOffset || (a.cities[0] ?? a.tz).localeCompare(b.cities[0] ?? b.tz, "es"),
      );
    }

    return {
      countries,
      byCode,
      countryOfTz: (tz) => tzToCountry.get(tz) ?? null,
      zoneOfTz: (country, tz) => byCode.get(country)?.zones.find((z) => z.group.includes(tz)) ?? null,
    } satisfies TzData;
  });
  return cache;
}
