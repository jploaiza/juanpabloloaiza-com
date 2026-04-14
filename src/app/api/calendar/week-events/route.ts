/**
 * GET /api/calendar/week-events
 *
 * Obtiene las citas de esta semana desde Google Calendar y
 * cruza con los pacientes del CRM por email y teléfono.
 *
 * Response: {
 *   statuses: PatientCalendarStatus[],
 *   events_count: number,
 *   week_start: string,
 *   week_end: string,
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  type GCalTokenData,
  getValidToken,
  getWeekEvents,
  matchPatientsWithEvents,
} from "@/lib/google-calendar";
import { type Patient } from "@/lib/patients";

export async function GET(req: NextRequest) {
  const weekOffset = Number(req.nextUrl.searchParams.get("week_offset") ?? 0);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adminSb = await createAdminClient();

  // Get stored tokens
  const { data: stored } = await adminSb
    .from("google_calendar_tokens")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!stored) {
    return NextResponse.json({ error: "Google Calendar no conectado" }, { status: 404 });
  }

  // Get valid access token (refresh if needed)
  let accessToken: string;
  try {
    const result = await getValidToken(stored as GCalTokenData);
    accessToken = result.token;
    // Persist refreshed token
    if (result.newExpiresAt) {
      await adminSb
        .from("google_calendar_tokens")
        .update({ access_token: accessToken, expires_at: result.newExpiresAt, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Token inválido: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 401 },
    );
  }

  // Fetch this week's events
  let events;
  try {
    events = await getWeekEvents(accessToken, stored.calendar_id ?? "primary", weekOffset);
  } catch (err) {
    return NextResponse.json(
      { error: `Error al obtener eventos: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 502 },
    );
  }

  // Get all patients from CRM
  const { data: patients } = await adminSb
    .from("patients")
    .select("id, email, phone, first_name, last_name");

  const statuses = matchPatientsWithEvents(
    (patients ?? []) as Pick<Patient, "id" | "email" | "phone" | "first_name" | "last_name">[],
    events,
  );

  // Calculate week bounds for display
  const nowChile = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const dow = nowChile.getUTCDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(nowChile);
  mon.setUTCDate(nowChile.getUTCDate() + daysToMon + weekOffset * 7);
  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);

  return NextResponse.json({
    statuses,
    events_count: events.length,
    week_start: mon.toISOString().split("T")[0],
    week_end: sun.toISOString().split("T")[0],
  });
}
