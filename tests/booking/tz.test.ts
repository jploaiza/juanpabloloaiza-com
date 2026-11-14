import { describe, it, expect } from "vitest";
import {
  zonedTimeToUtc,
  tzOffsetMinutes,
  formatOffset,
  formatTimeInTz,
  ymdInTz,
  isValidTz,
  cityFromTz,
  CHILE_TZ,
} from "@/lib/tz";
import { buildBookingTimeVars } from "@/lib/booking-time";

// Valores esperados calculados de forma independiente con zoneinfo (Python).
const iso = (ms: number) => new Date(ms).toISOString();

describe("zonedTimeToUtc", () => {
  it("Chile en horario de verano (UTC-3)", () => {
    expect(iso(zonedTimeToUtc("2026-11-16", "10:00", CHILE_TZ))).toBe("2026-11-16T13:00:00.000Z");
  });
  it("Chile en horario de invierno (UTC-4)", () => {
    expect(iso(zonedTimeToUtc("2026-07-15", "10:00", CHILE_TZ))).toBe("2026-07-15T14:00:00.000Z");
  });
  it("respeta los cruces de horario de verano de Chile", () => {
    expect(iso(zonedTimeToUtc("2026-09-07", "09:00", CHILE_TZ))).toBe("2026-09-07T12:00:00.000Z");
    expect(iso(zonedTimeToUtc("2026-04-06", "09:00", CHILE_TZ))).toBe("2026-04-06T13:00:00.000Z");
  });
  it("zonas con desfase no entero y hemisferio este", () => {
    expect(iso(zonedTimeToUtc("2026-11-16", "10:00", "Asia/Kolkata"))).toBe("2026-11-16T04:30:00.000Z");
    expect(iso(zonedTimeToUtc("2026-11-16", "20:00", "Australia/Sydney"))).toBe("2026-11-16T09:00:00.000Z");
    expect(iso(zonedTimeToUtc("2026-03-30", "09:00", "Europe/Madrid"))).toBe("2026-03-30T07:00:00.000Z");
  });
});

describe("helpers", () => {
  const utc = Date.UTC(2026, 10, 16, 13, 0);
  it("offsets y formato", () => {
    expect(tzOffsetMinutes(utc, "America/Mexico_City")).toBe(-360);
    expect(tzOffsetMinutes(utc, "Asia/Kolkata")).toBe(330);
    expect(formatOffset(-360)).toBe("GMT-6");
    expect(formatOffset(330)).toBe("GMT+5:30");
    expect(formatOffset(0)).toBe("GMT");
  });
  it("hora y día en otra zona", () => {
    expect(formatTimeInTz(utc, "America/Mexico_City")).toBe("07:00");
    expect(ymdInTz(utc, "Australia/Sydney")).toBe("2026-11-17");
    expect(formatTimeInTz(utc, "Australia/Sydney")).toBe("00:00");
  });
  it("validación de zonas", () => {
    expect(isValidTz("America/Bogota")).toBe(true);
    expect(isValidTz("Mars/Olympus")).toBe(false);
    expect(isValidTz("")).toBe(false);
    expect(isValidTz(undefined)).toBe(false);
    expect(cityFromTz("America/Argentina/Buenos_Aires")).toBe("Buenos Aires");
    expect(cityFromTz("America/Mexico_City")).toBe("Ciudad de México");
  });
});

describe("buildBookingTimeVars", () => {
  it("sin zona o zona de Chile: solo hora de Chile, sin paréntesis", () => {
    expect(buildBookingTimeVars("2026-11-16", "10:00").time).toBe("10:00");
    expect(buildBookingTimeVars("2026-11-16", "10:00", null).time).toBe("10:00");
    expect(buildBookingTimeVars("2026-11-16", "10:00", CHILE_TZ).time).toBe("10:00");
  });
  it("zona inválida: se ignora", () => {
    expect(buildBookingTimeVars("2026-11-16", "10:00", "Mars/Olympus").time).toBe("10:00");
  });
  it("misma hora que Chile (Buenos Aires UTC-3 en verano): sin paréntesis", () => {
    expect(buildBookingTimeVars("2026-11-16", "10:00", "America/Argentina/Buenos_Aires").time).toBe("10:00");
  });
  it("México: hora del paciente primero y Chile entre paréntesis", () => {
    const v = buildBookingTimeVars("2026-11-16", "10:00", "America/Mexico_City");
    expect(v.time).toBe("07:00 (10:00 hora de Chile)");
    expect(v.time_patient).toBe("07:00");
    expect(v.time_chile).toBe("10:00");
    expect(v.timezone).toBe("Ciudad de México (GMT-6)");
    expect(v.date_long).toContain("16 de noviembre");
  });
  it("cuando cambia el día se aclara la fecha de Chile", () => {
    const v = buildBookingTimeVars("2026-11-16", "20:00", "Australia/Sydney");
    expect(v.time).toBe("10:00 (20:00 del lunes 16 de noviembre, hora de Chile)");
    expect(v.date_long).toContain("17 de noviembre");
    expect(v.date_chile).toContain("16 de noviembre");
  });
});
