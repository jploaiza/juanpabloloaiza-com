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

  const { slug, label, duration_min, buffer_before_min = 0, buffer_after_min = 0, color = "#C5A059", description, sort_order = 99 } = body;

  if (!slug || !label || !duration_min) {
    return NextResponse.json({ error: "slug, label y duration_min son requeridos" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("event_types")
    .insert({ slug, label, duration_min, buffer_before_min, buffer_after_min, color, description, sort_order })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  invalidateConfigCache();

  return NextResponse.json({ type: data }, { status: 201 });
}
