/**
 * GET /api/admin/calendar/templates — list all alert templates
 */
import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";

export async function GET() {
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await sb
    .from("booking_alert_templates")
    .select("*")
    .order("event_type_slug", { ascending: true })
    .order("trigger", { ascending: true })
    .order("channel", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data });
}
