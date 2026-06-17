import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { dbErr } from "@/lib/db-error";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// GET /api/admin/forms — lista de formularios (con conteo de respuestas)
export async function GET() {
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: forms, error } = await sb
    .from("forms")
    .select("id, slug, title, status, is_admission, updated_at, created_at")
    .neq("status", "deleted")
    .order("updated_at", { ascending: false });

  if (error) return dbErr("forms-list", error);

  // Conteo de respuestas por formulario (una consulta agregada simple).
  const ids = (forms ?? []).map((f) => f.id);
  const counts: Record<string, number> = {};
  if (ids.length) {
    const { data: subs } = await sb
      .from("form_submissions")
      .select("form_id")
      .in("form_id", ids);
    for (const s of subs ?? []) counts[s.form_id] = (counts[s.form_id] ?? 0) + 1;
  }

  return NextResponse.json({
    forms: (forms ?? []).map((f) => ({ ...f, submissions: counts[f.id] ?? 0 })),
  });
}

// POST /api/admin/forms — crea un formulario nuevo (título + slug)
export async function POST(req: NextRequest) {
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "El título es requerido." }, { status: 400 });

  const finalSlug = (String(body.slug ?? "").trim() || slugify(title)) || `form-${Date.now()}`;

  const { data: existing } = await sb.from("forms").select("id").eq("slug", finalSlug).maybeSingle();
  if (existing) return NextResponse.json({ error: "Ya existe un formulario con ese slug." }, { status: 409 });

  const now = new Date().toISOString();
  const { data: form, error } = await sb
    .from("forms")
    .insert({
      title,
      slug: finalSlug,
      schema: { questions: [], logic: [] },
      settings: {},
      status: "draft",
      created_at: now,
      updated_at: now,
    })
    .select("id, slug")
    .single();

  if (error) return dbErr("forms-create", error);
  return NextResponse.json({ form }, { status: 201 });
}
