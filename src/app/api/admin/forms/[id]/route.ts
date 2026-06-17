import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { dbErr } from "@/lib/db-error";
import { parseFormSchema, formSettingsSchema, patientMappingSchema } from "@/lib/forms/schema";

// GET /api/admin/forms/[id] — un formulario completo
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: form, error } = await sb.from("forms").select("*").eq("id", id).maybeSingle();
  if (error) return dbErr("forms-get", error);
  if (!form || form.status === "deleted") return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  return NextResponse.json({ form });
}

// PUT /api/admin/forms/[id] — guarda la definición completa
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "El título no puede estar vacío." }, { status: 400 });
    update.title = title;
  }
  if (body.description !== undefined) update.description = body.description ? String(body.description) : null;
  if (body.notify_email !== undefined) update.notify_email = Boolean(body.notify_email);
  if (body.notify_whatsapp !== undefined) update.notify_whatsapp = Boolean(body.notify_whatsapp);

  // Validación zod de la definición
  try {
    if (body.schema !== undefined) update.schema = parseFormSchema(body.schema);
    if (body.settings !== undefined) update.settings = formSettingsSchema.parse(body.settings);
    if (body.patient_mapping !== undefined) update.patient_mapping = patientMappingSchema.parse(body.patient_mapping);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Definición inválida.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // is_admission es único: si se activa, desmarcar los demás primero.
  if (body.is_admission === true) {
    await sb.from("forms").update({ is_admission: false }).eq("is_admission", true).neq("id", id);
    update.is_admission = true;
  } else if (body.is_admission === false) {
    update.is_admission = false;
  }

  // Slug (opcional): validar unicidad
  if (body.slug !== undefined) {
    const slug = String(body.slug).trim();
    if (slug) {
      const { data: clash } = await sb.from("forms").select("id").eq("slug", slug).neq("id", id).maybeSingle();
      if (clash) return NextResponse.json({ error: "Ese slug ya está en uso." }, { status: 409 });
      update.slug = slug;
    }
  }

  const { data: form, error } = await sb.from("forms").update(update).eq("id", id).select("*").single();
  if (error) return dbErr("forms-update", error);
  return NextResponse.json({ form });
}

// DELETE /api/admin/forms/[id] — soft delete
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await sb
    .from("forms")
    .update({ status: "deleted", is_admission: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return dbErr("forms-delete", error);
  return NextResponse.json({ ok: true });
}
