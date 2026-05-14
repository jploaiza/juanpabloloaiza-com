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

  const raw = (data?.value ?? {}) as Record<string, unknown>;
  const dbCreds = raw.zoom_credentials as { account_id?: string; client_id?: string; client_secret?: string } | undefined;

  const zoomReady = !!(
    (dbCreds?.account_id && dbCreds?.client_id && dbCreds?.client_secret) ||
    (process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET)
  );

  // Strip credentials from the config before returning — never expose them to the frontend
  const { zoom_credentials: _hidden, ...safeConfig } = raw;

  return NextResponse.json({
    config: safeConfig,
    zoom_ready: zoomReady,
    zoom_credentials_set: {
      account_id: !!(dbCreds?.account_id || process.env.ZOOM_ACCOUNT_ID),
      client_id: !!(dbCreds?.client_id || process.env.ZOOM_CLIENT_ID),
      client_secret: !!(dbCreds?.client_secret || process.env.ZOOM_CLIENT_SECRET),
    },
  });
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

  const { zoom_credentials: _hidden2, ...safeMerged } = merged as Record<string, unknown>;
  return NextResponse.json({ ok: true, config: safeMerged });
}
