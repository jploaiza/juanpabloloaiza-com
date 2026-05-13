/**
 * GET  /api/admin/calendar/blackouts — list all blackouts
 * POST /api/admin/calendar/blackouts — create blackout (single date or range)
 */
import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";

export async function GET() {
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await sb
    .from("calendar_blackouts")
    .select("*")
    .order("date_start", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ blackouts: data });
}

export async function POST(req: NextRequest) {
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { date_start?: string; date_end?: string; reason?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const { date_start, date_end, reason } = body;
  if (!date_start || !/^\d{4}-\d{2}-\d{2}$/.test(date_start)) {
    return NextResponse.json({ error: "date_start requerida (YYYY-MM-DD)" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("calendar_blackouts")
    .insert({ date_start, date_end: date_end ?? null, reason: reason ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ blackout: data }, { status: 201 });
}
