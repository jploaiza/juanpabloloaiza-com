/**
 * GET  /api/admin/calendar/event-types — list all (incl. inactive)
 * POST /api/admin/calendar/event-types — create new event type
 */
import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { invalidateConfigCache } from "@/lib/booking-config";

export async function GET() {
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await sb
    .from("event_types")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ types: data });
}

export async function POST(req: NextRequest) {
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const {
    slug, label, duration_min,
    buffer_before_min = 0, buffer_after_min = 0,
    color = "#C5A059", description, sort_order = 99,
    booking_questions = [], requires_confirmation = false,
    redirect_url, max_active_per_email = 0,
    allow_cancellation = true, allow_reschedule = true, cancellation_cutoff_hours = 0,
  } = body;

  if (!slug || !label || !duration_min) {
    return NextResponse.json({ error: "slug, label y duration_min son requeridos" }, { status: 400 });
  }

  // Validate slug: only lowercase alphanumeric and hyphens, 2-50 chars
  if (typeof slug !== "string" || !/^[a-z0-9-]{2,50}$/.test(slug)) {
    return NextResponse.json({ error: "slug inválido: solo letras minúsculas, números y guiones (2-50 chars)" }, { status: 400 });
  }
  // Validate duration_min: must be a positive integer (5-480 min)
  const durationMinNum = Number(duration_min);
  if (!Number.isInteger(durationMinNum) || durationMinNum < 5 || durationMinNum > 480) {
    return NextResponse.json({ error: "duration_min debe ser un entero entre 5 y 480" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("event_types")
    .insert({
      slug, label, duration_min,
      buffer_before_min, buffer_after_min,
      color, description, sort_order,
      booking_questions, requires_confirmation,
      redirect_url, max_active_per_email,
      allow_cancellation, allow_reschedule, cancellation_cutoff_hours,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  invalidateConfigCache();

  return NextResponse.json({ type: data }, { status: 201 });
}
