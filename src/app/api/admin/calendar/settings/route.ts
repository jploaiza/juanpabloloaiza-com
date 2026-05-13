/**
 * GET  /api/admin/calendar/settings — returns calendar_config
 * POST /api/admin/calendar/settings — deep-merges calendar_config
 */
import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { invalidateConfigCache } from "@/lib/booking-config";

export async function GET() {
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await sb.from("crm_settings").select("value").eq("key", "calendar_config").single();

  const zoomReady = !!(
    process.env.ZOOM_ACCOUNT_ID &&
    process.env.ZOOM_CLIENT_ID &&
    process.env.ZOOM_CLIENT_SECRET
  );

  return NextResponse.json({ config: data?.value ?? {}, zoom_ready: zoomReady });
}

export async function POST(req: NextRequest) {
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let patch: Record<string, unknown>;
  try { patch = await req.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const { data: current } = await sb.from("crm_settings").select("value").eq("key", "calendar_config").single();
  const merged = { ...(current?.value ?? {}), ...patch };

  await sb.from("crm_settings").upsert({ key: "calendar_config", value: merged }, { onConflict: "key" });
  invalidateConfigCache();

  return NextResponse.json({ ok: true, config: merged });
}
