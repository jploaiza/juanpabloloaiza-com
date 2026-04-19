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

// POST /api/patients/[id]/session/undo — undo last session registered today
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get the most recent session_registered log for this patient
  const { data: log, error: logErr } = await adminSb
    .from("patient_logs")
    .select("id, created_at, content")
    .eq("patient_id", id)
    .eq("type", "session_registered")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (logErr || !log) {
    return NextResponse.json({ error: "No hay sesión registrada para deshacer" }, { status: 404 });
  }

  // Only allow undoing sessions registered today
  const logDate = new Date(log.created_at);
  const now = new Date();
  const sameDay =
    logDate.getUTCFullYear() === now.getUTCFullYear() &&
    logDate.getUTCMonth() === now.getUTCMonth() &&
    logDate.getUTCDate() === now.getUTCDate();

  if (!sameDay) {
    return NextResponse.json(
      { error: "Solo se puede deshacer una sesión registrada hoy" },
      { status: 400 },
    );
  }

  // Get current patient data
  const { data: patient, error: fetchErr } = await adminSb
    .from("patients")
    .select("sessions_used, total_sessions, pack_size")
    .eq("id", id)
    .single();

  if (fetchErr || !patient) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
  }

  const newUsed = Math.max(0, patient.sessions_used - 1);
  const total = patient.total_sessions || patient.pack_size;

  // Decrement sessions_used
  const { data: updated, error: updateErr } = await adminSb
    .from("patients")
    .update({ sessions_used: newUsed })
    .eq("id", id)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Delete the log entry
  await adminSb.from("patient_logs").delete().eq("id", log.id);

  // Insert audit note
  await adminSb.from("patient_logs").insert({
    patient_id: id,
    type: "note_added",
    content: `Sesión deshecha (era sesión ${patient.sessions_used}/${total}). Quedan ${total - newUsed} sesiones.`,
  });

  return NextResponse.json({ patient: updated });
}
