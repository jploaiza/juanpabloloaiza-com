import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return await createAdminClient();
}

// GET /api/crm-settings — returns all settings as a key→value object (admin only)
export async function GET() {
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await adminSb.from("crm_settings").select("key, value");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings: Record<string, string> = {};
  for (const row of data ?? []) settings[row.key] = row.value;
  return NextResponse.json({ settings });
}

// PATCH /api/crm-settings — upserts provided key/value pairs (admin only)
// Body: { key: string; value: string }[]
export async function PATCH(req: NextRequest) {
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body) || body.some((r) => typeof r.key !== "string" || typeof r.value !== "string")) {
    return NextResponse.json({ error: "Body must be [{key, value}]" }, { status: 400 });
  }

  const rows = body.map((r: { key: string; value: string }) => ({
    key: r.key,
    value: r.value,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await adminSb
    .from("crm_settings")
    .upsert(rows, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
