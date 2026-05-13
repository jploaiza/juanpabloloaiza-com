/**
 * GET /api/calendar/availability?date=YYYY-MM-DD&type=session|entrevista
 *
 * Returns available time slots for the given date.
 * Public endpoint — uses the admin's stored Google Calendar credentials.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getValidToken, getFreeBusy, type GCalTokenData, type BusySlot } from "@/lib/google-calendar";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { BOOKING_TZ, EVENT_CONFIGS, type BookingType } from "@/lib/booking-config";

// Working hours in Santiago time (hour in 24h format)
const WORK_START_H = 9;
const WORK_END_H = 19;
const SLOT_STEP_MIN = 30;

function toSantiagoMidnight(dateStr: string): Date {
  // dateStr = "YYYY-MM-DD"
  // Return midnight Santiago = that date at 00:00 Santiago
  // Santiago is UTC-4 (standard) or UTC-3 (DST); use Intl to compute offset
  const probe = new Date(`${dateStr}T12:00:00`);
  const santiagoParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TZ,
    hour: "numeric",
    hour12: false,
    timeZoneName: "shortOffset",
  }).formatToParts(probe);
  const offsetStr = santiagoParts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-4";
  const offsetMatch = offsetStr.match(/GMT([+-]\d+)/);
  const offsetH = offsetMatch ? parseInt(offsetMatch[1]) : -4;
  // midnight Santiago = YYYY-MM-DDT00:00:00 - offsetH hours in UTC
  return new Date(`${dateStr}T${String(Math.abs(offsetH)).padStart(2, "0")}:00:00Z`);
}

function generateSlots(
  dateStr: string,
  durationMin: number,
  busy: BusySlot[],
): string[] {
  const midnight = toSantiagoMidnight(dateStr);
  const slots: string[] = [];

  const totalMinutes = (WORK_END_H - WORK_START_H) * 60;
  for (let offset = WORK_START_H * 60; offset + durationMin <= WORK_START_H * 60 + totalMinutes; offset += SLOT_STEP_MIN) {
    const slotStart = new Date(midnight.getTime() + offset * 60000);
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

    const overlaps = busy.some((b) => {
      const bStart = new Date(b.start).getTime();
      const bEnd = new Date(b.end).getTime();
      return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
    });

    if (!overlaps) {
      // Format as HH:MM in Santiago time
      const label = slotStart.toLocaleTimeString("es-CL", {
        timeZone: BOOKING_TZ,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      slots.push(label);
    }
  }

  return slots;
}

export async function GET(req: NextRequest) {
  const ip = getIp(req.headers);
  if (!rateLimit(`cal-avail:${ip}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const dateStr = searchParams.get("date") ?? "";
  const type = (searchParams.get("type") ?? "session") as BookingType;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }
  if (!(type in EVENT_CONFIGS)) {
    return NextResponse.json({ error: "type must be session or entrevista" }, { status: 400 });
  }

  // Block past dates and Sundays
  const parsed = new Date(`${dateStr}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed < today) return NextResponse.json({ slots: [] });
  const dow = parsed.toLocaleDateString("en-US", { timeZone: BOOKING_TZ, weekday: "short" });
  if (dow === "Sun") return NextResponse.json({ slots: [] });

  const adminSb = createAdminClient();
  const { data: stored } = await adminSb
    .from("google_calendar_tokens")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (!stored) {
    return NextResponse.json({ error: "Calendario no disponible" }, { status: 503 });
  }

  let accessToken: string;
  try {
    const result = await getValidToken(stored as GCalTokenData);
    accessToken = result.token;
    if (result.newExpiresAt) {
      await adminSb
        .from("google_calendar_tokens")
        .update({ access_token: accessToken, expires_at: result.newExpiresAt, updated_at: new Date().toISOString() })
        .eq("user_id", stored.user_id);
    }
  } catch {
    return NextResponse.json({ error: "Calendario no disponible" }, { status: 503 });
  }

  const midnight = toSantiagoMidnight(dateStr);
  const dayEnd = new Date(midnight.getTime() + 24 * 60 * 60 * 1000);

  let busy: BusySlot[] = [];
  try {
    busy = await getFreeBusy(
      accessToken,
      stored.calendar_id ?? "primary",
      midnight.toISOString(),
      dayEnd.toISOString(),
    );
  } catch {
    return NextResponse.json({ error: "Error al consultar disponibilidad" }, { status: 502 });
  }

  const { durationMin } = EVENT_CONFIGS[type];
  const slots = generateSlots(dateStr, durationMin, busy);

  return NextResponse.json({ slots, date: dateStr, type });
}
