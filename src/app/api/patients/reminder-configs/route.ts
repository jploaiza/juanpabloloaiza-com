import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { dbErr } from "@/lib/db-error";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { adminSb: null, status: 401 as const };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { adminSb: null, status: 403 as const };
  return { adminSb: await createAdminClient(), status: 200 as const };
}

export async function GET() {
  const { adminSb, status } = await requireAdmin();
  if (!adminSb) return NextResponse.json({ error: "Forbidden" }, { status });

  const { data, error } = await adminSb
    .from("reminder_configs")
    .select("*")
    .order("day_of_week")
    .order("hour_chile");

  if (error) return dbErr("patients:reminder-configs", error);
  return NextResponse.json({ configs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { adminSb, status } = await requireAdmin();
  if (!adminSb) return NextResponse.json({ error: "Forbidden" }, { status });

  const raw = await req.json().catch(() => ({}));
  const { label, day_of_week, hour_chile, patient_filter, channels,
          send_mode, delay_min, delay_max, is_active, whatsapp_template,
          patient_ids, filter_values, patient_filter_config } = raw;

  const { data, error } = await adminSb
    .from("reminder_configs")
    .insert({ label, day_of_week, hour_chile, patient_filter, channels,
               send_mode, delay_min, delay_max, is_active, whatsapp_template,
               patient_ids, filter_values, patient_filter_config })
    .select()
    .single();

  if (error) {
    console.error("[reminder-configs:post]", error.code);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  return NextResponse.json({ config: data }, { status: 201 });
}
