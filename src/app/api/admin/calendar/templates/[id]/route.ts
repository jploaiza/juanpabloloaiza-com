/**
 * PATCH /api/admin/calendar/templates/[id] — edit subject, body, is_active
 */
import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const patch: Record<string, unknown> = {};
  if ("subject" in body) patch.subject = body.subject;
  if ("body" in body) patch.body = body.body;
  if ("is_active" in body) patch.is_active = body.is_active;

  const { data, error } = await sb
    .from("booking_alert_templates")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ template: data });
}
