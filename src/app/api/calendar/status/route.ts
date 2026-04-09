/**
 * GET /api/calendar/status
 *
 * Retorna si el admin tiene Google Calendar conectado.
 * Response: { connected: boolean, calendar_id?: string, expires_at?: string }
 */

import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adminSb = await createAdminClient();
  const { data: token } = await adminSb
    .from("google_calendar_tokens")
    .select("calendar_id, expires_at")
    .eq("user_id", user.id)
    .single();

  if (!token) return NextResponse.json({ connected: false });

  return NextResponse.json({
    connected: true,
    calendar_id: token.calendar_id,
    expires_at: token.expires_at,
  });
}
