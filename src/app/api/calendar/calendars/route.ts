/**
 * GET /api/calendar/calendars
 * Lista todos los calendarios de la cuenta conectada.
 *
 * PATCH /api/calendar/calendars
 * Actualiza el calendar_id seleccionado.
 * Body: { calendar_id: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { type GCalTokenData, getValidToken } from "@/lib/google-calendar";

interface GCalCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
}

async function listCalendars(accessToken: string): Promise<GCalCalendar[]> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    },
  );
  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Google Calendar respondió con HTML (HTTP ${res.status}) — token posiblemente revocado`);
  }
  if (!res.ok) throw new Error((data.error as { message?: string })?.message ?? `HTTP ${res.status}`);
  return (data.items as GCalCalendar[]) ?? [];
}

// ── Auth helper ──────────────────────────────────────────────────

async function getAdminAndToken(req?: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 } as const;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden", status: 403 } as const;

  const adminSb = await createAdminClient();
  const { data: stored } = await adminSb
    .from("google_calendar_tokens")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!stored) return { error: "Google Calendar no conectado", status: 404 } as const;

  return { user, adminSb, stored: stored as GCalTokenData & { user_id: string } } as const;
}

// ── GET ──────────────────────────────────────────────────────────

export async function GET() {
  try {
  const auth = await getAdminAndToken();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { adminSb, stored } = auth;

  let accessToken: string;
  try {
    const result = await getValidToken(stored);
    accessToken = result.token;
    if (result.newExpiresAt) {
      await adminSb
        .from("google_calendar_tokens")
        .update({ access_token: accessToken, expires_at: result.newExpiresAt, updated_at: new Date().toISOString() })
        .eq("user_id", stored.user_id);
    }
  } catch (err) {
    return NextResponse.json({ error: `Token inválido: ${err instanceof Error ? err.message : "unknown"}` }, { status: 401 });
  }

  try {
    const calendars = await listCalendars(accessToken);
    return NextResponse.json({
      calendars: calendars.map((c) => ({
        id: c.id,
        summary: c.summary,
        primary: c.primary ?? false,
        backgroundColor: c.backgroundColor,
      })),
      selected: stored.calendar_id ?? "primary",
    });
  } catch (err) {
    return NextResponse.json({ error: `${err instanceof Error ? err.message : "unknown"}` }, { status: 502 });
  }
  } catch (err) {
    // Top-level safety net — ensures this route always returns JSON
    return NextResponse.json(
      { error: `Error inesperado: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}

// ── PATCH ────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
  const auth = await getAdminAndToken(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { adminSb, stored } = auth;
  const body = await req.json().catch(() => ({}));
  const { calendar_id } = body as { calendar_id?: string };

  if (!calendar_id) return NextResponse.json({ error: "calendar_id requerido" }, { status: 400 });

  const { error } = await adminSb
    .from("google_calendar_tokens")
    .update({ calendar_id, updated_at: new Date().toISOString() })
    .eq("user_id", stored.user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: true, calendar_id });
  } catch (err) {
    return NextResponse.json(
      { error: `Error inesperado: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
