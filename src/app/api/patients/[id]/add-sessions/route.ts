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

// POST /api/patients/[id]/add-sessions
// Body: { quantity: number, notes?: string }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { quantity, notes } = body as { quantity?: number; notes?: string };

  if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
    return NextResponse.json({ error: "quantity debe ser un entero positivo" }, { status: 400 });
  }

  const { data: patient, error: fetchErr } = await adminSb
    .from("patients")
    .select("total_sessions, pack_size")
    .eq("id", id)
    .single();

  if (fetchErr || !patient) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });

  const currentTotal = patient.total_sessions || patient.pack_size;
  const newTotal = currentTotal + quantity;

  // Update total_sessions
  const { data: updated, error: updateErr } = await adminSb
    .from("patients")
    .update({ total_sessions: newTotal })
    .eq("id", id)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Insert purchase record
  await adminSb.from("patient_session_purchases").insert({
    patient_id: id,
    quantity,
    notes: notes?.trim() || null,
  });

  // Log the purchase
  const noteStr = notes?.trim() ? ` — ${notes.trim()}` : "";
  await adminSb.from("patient_logs").insert({
    patient_id: id,
    type: "note_added",
    content: `Compra de ${quantity} sesión${quantity === 1 ? "" : "es"} registrada. Total acumulado: ${newTotal} sesiones${noteStr}.`,
  });

  return NextResponse.json({ patient: updated, added: quantity, total: newTotal });
}
