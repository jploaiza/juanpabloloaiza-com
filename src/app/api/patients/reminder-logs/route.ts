import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// GET /api/patients/reminder-logs — recent reminder_sent logs with patient name
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adminSb = await createAdminClient();

  const { data: logs, error } = await adminSb
    .from("patient_logs")
    .select("id, patient_id, content, created_at, patients(full_name)")
    .eq("type", "reminder_sent")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatted = (logs ?? []).map((l: any) => ({
    id: l.id,
    patient_id: l.patient_id,
    content: l.content,
    created_at: l.created_at,
    patient_name: Array.isArray(l.patients) ? l.patients[0]?.full_name ?? null : l.patients?.full_name ?? null,
  }));

  return NextResponse.json({ logs: formatted });
}
