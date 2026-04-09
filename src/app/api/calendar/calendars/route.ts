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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Error al obtener calendarios");
  return data.items ?? [];
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
}

// ── PATCH ────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
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
}
