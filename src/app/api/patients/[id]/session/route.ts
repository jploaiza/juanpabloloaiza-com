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

// POST /api/patients/[id]/session — register one session
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: patient, error: fetchErr } = await adminSb
    .from("patients")
    .select("sessions_used, total_sessions, pack_size, status")
    .eq("id", id)
    .single();

  if (fetchErr || !patient) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
  if (patient.status !== "active") return NextResponse.json({ error: "El paciente no está activo" }, { status: 400 });

  const newUsed = patient.sessions_used + 1;
  const total = patient.total_sessions || patient.pack_size;

  const { data: updated, error: updateErr } = await adminSb
    .from("patients")
    .update({ sessions_used: newUsed })
    .eq("id", id)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  const remaining = Math.max(0, total - newUsed);
  const content = remaining === 0
    ? `Sesión ${newUsed}/${total} registrada. Pack completado — quedan 0 sesiones.`
    : `Sesión ${newUsed}/${total} registrada. Quedan ${remaining} sesión${remaining === 1 ? "" : "es"}.`;

  await adminSb.from("patient_logs").insert({
    patient_id: id,
    type: "session_registered",
    content,
  });

  return NextResponse.json({ patient: updated });
}
