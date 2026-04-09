import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { calcEndDate, type PackSize } from "@/lib/patients";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return await createAdminClient();
}

// GET /api/patients — list all patients + last session map
export async function GET() {
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: patients }, { data: logs }] = await Promise.all([
    adminSb.from("patients").select("*").order("created_at", { ascending: false }),
    adminSb
      .from("patient_logs")
      .select("patient_id, created_at")
      .eq("type", "session_registered")
      .order("created_at", { ascending: false }),
  ]);

  const lastSessions: Record<string, string | null> = {};
  for (const log of logs ?? []) {
    if (!lastSessions[log.patient_id]) lastSessions[log.patient_id] = log.created_at;
  }

  return NextResponse.json({ patients: patients ?? [], lastSessions });
}

// POST /api/patients — create patient
export async function POST(req: NextRequest) {
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { full_name, email, phone, pack_size, start_date, notes, reminder_day } = body;

  if (!full_name?.trim() || !email?.trim() || !phone?.trim() || !pack_size || !start_date) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const end_date = calcEndDate(start_date, pack_size as PackSize);

  const { data, error } = await adminSb.from("patients").insert({
    full_name: full_name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    pack_size,
    start_date,
    end_date,
    notes: notes?.trim() || null,
    reminder_day: reminder_day ?? 1,
    sessions_used: 0,
    status: "active",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await adminSb.from("patient_logs").insert({
    patient_id: data.id,
    type: "status_changed",
    content: `Paciente creado con Pack ${pack_size} sesiones. Vence el ${end_date}.`,
  });

  return NextResponse.json({ patient: data }, { status: 201 });
}
