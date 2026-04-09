import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { calcEndDate, type PackSize, type PatientStatus } from "@/lib/patients";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return await createAdminClient();
}

type Params = Promise<{ id: string }>;

// GET /api/patients/[id]
export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: patient, error } = await adminSb.from("patients").select("*").eq("id", id).maybeSingle();
  if (error || !patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ patient });
}

// PATCH /api/patients/[id] — update fields OR change status via action
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Status actions
  if (body.action) {
    // Extend deadline action
    if (body.action === "extend_deadline") {
      const days = Number(body.days);
      if (!days || days < 1 || !Number.isInteger(days)) {
        return NextResponse.json({ error: "days debe ser un entero positivo" }, { status: 400 });
      }
      const { data: current } = await adminSb.from("patients").select("end_date").eq("id", id).single();
      if (!current) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });

      const base = new Date((current.end_date ?? new Date().toISOString().split("T")[0]) + "T12:00:00");
      base.setDate(base.getDate() + days);
      const newEndDate = base.toISOString().split("T")[0];

      const { data, error } = await adminSb.from("patients").update({ end_date: newEndDate }).eq("id", id).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const formatted = base.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
      await adminSb.from("patient_logs").insert({
        patient_id: id,
        type: "note_added",
        content: `Plazo extendido ${days} día${days === 1 ? "" : "s"}. Nueva fecha de vencimiento: ${formatted}.`,
      });

      return NextResponse.json({ patient: data });
    }

    const STATUS_MAP: Record<string, PatientStatus> = {
      pause: "paused",
      activate: "active",
      finish: "finished",
    };
    const newStatus = STATUS_MAP[body.action];
    if (!newStatus) return NextResponse.json({ error: "Acción inválida" }, { status: 400 });

    const { data, error } = await adminSb.from("patients").update({ status: newStatus }).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const labels: Record<PatientStatus, string> = { active: "Reactivado", paused: "Pausado", finished: "Finalizado" };
    await adminSb.from("patient_logs").insert({
      patient_id: id,
      type: "status_changed",
      content: `${labels[newStatus]}.`,
    });

    return NextResponse.json({ patient: data });
  }

  // Field update
  const { first_name, last_name, email, phone, pack_size, start_date, notes, reminder_day } = body;
  const updates: Record<string, unknown> = {};

  if (first_name !== undefined) updates.first_name = first_name.trim();
  if (last_name !== undefined) updates.last_name = last_name.trim();
  if (email !== undefined) updates.email = email.trim();
  if (phone !== undefined) updates.phone = phone.trim();
  if (pack_size !== undefined) updates.pack_size = pack_size;
  if (start_date !== undefined) updates.start_date = start_date;
  if (notes !== undefined) updates.notes = notes?.trim() || null;
  if (reminder_day !== undefined) updates.reminder_day = reminder_day;

  // Recalculate end_date if pack or start changed
  if (pack_size !== undefined || start_date !== undefined) {
    const { data: current } = await adminSb.from("patients").select("pack_size, start_date").eq("id", id).single();
    const ps = (pack_size ?? current?.pack_size) as PackSize;
    const sd = start_date ?? current?.start_date;
    updates.end_date = calcEndDate(sd, ps);
  }

  const { data, error } = await adminSb.from("patients").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await adminSb.from("patient_logs").insert({
    patient_id: id,
    type: "note_added",
    content: "Datos del paciente actualizados.",
  });

  return NextResponse.json({ patient: data });
}
