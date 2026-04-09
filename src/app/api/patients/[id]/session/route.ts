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

// POST /api/patients/[id]/session — register a session
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: patient, error: fetchErr } = await adminSb
    .from("patients")
    .select("sessions_used, pack_size, status")
    .eq("id", id)
    .single();

  if (fetchErr || !patient) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
  if (patient.status !== "active") return NextResponse.json({ error: "El paciente no está activo" }, { status: 400 });
  if (patient.sessions_used >= patient.pack_size) return NextResponse.json({ error: "No hay sesiones disponibles" }, { status: 400 });

  const newUsed = patient.sessions_used + 1;
  const isLast = newUsed >= patient.pack_size;

  const updates: Record<string, unknown> = { sessions_used: newUsed };
  if (isLast) updates.status = "finished";

  const { data: updated, error: updateErr } = await adminSb
    .from("patients")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  const content = isLast
    ? `Sesión ${newUsed}/${patient.pack_size} registrada. Pack completado — estado cambiado a Finalizado.`
    : `Sesión ${newUsed}/${patient.pack_size} registrada.`;

  await adminSb.from("patient_logs").insert({
    patient_id: id,
    type: "session_registered",
    content,
  });

  if (isLast) {
    await adminSb.from("patient_logs").insert({
      patient_id: id,
      type: "status_changed",
      content: "Pack completado. Estado cambiado a Finalizado.",
    });
  }

  return NextResponse.json({ patient: updated, completed: isLast });
}
