export const BOOKING_TZ = "America/Santiago";

export const EVENT_CONFIGS = {
  session: { durationMin: 90, label: "Sesión TRVP" },
  entrevista: { durationMin: 45, label: "Entrevista de Admisión" },
} as const;

export type BookingType = keyof typeof EVENT_CONFIGS;
