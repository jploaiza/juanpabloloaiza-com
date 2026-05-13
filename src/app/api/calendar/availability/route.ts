/**
 * GET /api/calendar/availability?date=YYYY-MM-DD&type=<slug>
 *
 * Returns available time slots for the given date.
 * Public endpoint — uses the admin's stored Google Calendar credentials.
 * Working hours, slot step, lead time, and blackouts are read from DB config.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getValidToken, getFreeBusy, type GCalTokenData, type BusySlot } from "@/lib/google-calendar";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { BOOKING_TZ, getCalendarConfig, getEventTypes } from "@/lib/booking-config";

// Maps JS getDay() → config key
const DOW_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function toSantiagoMidnight(dateStr: string): Date {
  const probe = new Date(`${dateStr}T12:00:00`);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TZ,
    hour: "numeric",
    hour12: false,
    timeZoneName: "shortOffset",
  }).formatToParts(probe);
  const offsetStr = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-4";
  const offsetMatch = offsetStr.match(/GMT([+-]\d+)/);
  const offsetH = offsetMatch ? parseInt(offsetMatch[1]) : -4;
  return new Date(`${dateStr}T${String(Math.abs(offsetH)).padStart(2, "0")}:00:00Z`);
}

function generateSlots(
  dateStr: string,
  durationMin: number,
  slotStepMin: number,
  workStart: number,
  workEnd: number,
  busy: BusySlot[],
): string[] {
  const midnight = toSantiagoMidnight(dateStr);
  const slots: string[] = [];
  const totalMinutes = (workEnd - workStart) * 60;
  for (let offset = workStart * 60; offset + durationMin <= workStart * 60 + totalMinutes; offset += slotStepMin) {
    const slotStart = new Date(midnight.getTime() + offset * 60000);
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);
    const overlaps = busy.some((b) => {
      const bStart = new Date(b.start).getTime();
      const bEnd = new Date(b.end).getTime();
      return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
    });
    if (!overlaps) {
      slots.push(slotStart.toLocaleTimeString("es-CL", {
        timeZone: BOOKING_TZ,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }));
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
  const typeSlug = searchParams.get("type") ?? "session";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  const [config, eventTypes] = await Promise.all([getCalendarConfig(), getEventTypes(true)]);
  const eventType = eventTypes.find((e) => e.slug === typeSlug);
  if (!eventType) {
    return NextResponse.json({ error: "Tipo de evento inválido" }, { status: 400 });
  }

  // Check if date is past
  const todayStr = new Date().toISOString().slice(0, 10);
  if (dateStr < todayStr) return NextResponse.json({ slots: [] });

  // Check lead time: reject dates that are too soon
  const slotMidnight = toSantiagoMidnight(dateStr).getTime();
  if (slotMidnight < Date.now() + config.lead_time_min * 60_000) {
    // Partial day — slots will still be filtered by slotStart time below, return normally
  }

  // Check day of week from working_hours
  const parsed = new Date(`${dateStr}T12:00:00`);
  const dowIndex = parsed.getDay(); // 0=Sun..6=Sat
  const dowKey = DOW_KEYS[dowIndex];
  const hours = config.working_hours[dowKey];
  if (!hours) return NextResponse.json({ slots: [] });
  const [workStart, workEnd] = hours;

  // Check blackouts
  const adminSb = createAdminClient();
  const { data: blackouts } = await adminSb
    .from("calendar_blackouts")
    .select("date_start, date_end")
    .lte("date_start", dateStr)
    .or(`date_end.is.null,date_end.gte.${dateStr}`);

  if (blackouts?.some((b) => {
    if (dateStr < b.date_start) return false;
    if (b.date_end === null) return dateStr === b.date_start;
    return dateStr <= b.date_end;
  })) {
    return NextResponse.json({ slots: [] });
  }

  // Get calendar credentials
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

  const durationMin = eventType.duration_min + eventType.buffer_after_min;
  let slots = generateSlots(dateStr, durationMin, config.slot_step_min, workStart, workEnd, busy);

  // Filter out slots within lead_time from now
  const nowMs = Date.now();
  const leadMs = config.lead_time_min * 60_000;
  slots = slots.filter((slot) => {
    const [h, m] = slot.split(":").map(Number);
    const slotMs = toSantiagoMidnight(dateStr).getTime() + (h * 60 + m) * 60_000;
    return slotMs > nowMs + leadMs;
  });

  return NextResponse.json({ slots, date: dateStr, type: typeSlug });
}
