import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { dbErr } from "@/lib/db-error";
import { formatAnswer } from "@/lib/forms/format";
import { buildCsv } from "@/lib/forms/csv";
import type { FormSchema, Question, Answers } from "@/lib/forms/types";

interface SubRow {
  id: string;
  form_schema_snapshot: FormSchema;
  answers: Answers;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  notify_status: Record<string, string>;
  patient_id: string | null;
  created_at: string;
}

// GET /api/admin/forms/[id]/submissions[?format=csv]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: form } = await sb.from("forms").select("id, title, slug, schema").eq("id", id).maybeSingle();
  if (!form) return NextResponse.json({ error: "No encontrado." }, { status: 404 });

  const { data: subs, error } = await sb
    .from("form_submissions")
    .select("id, form_schema_snapshot, answers, email, full_name, phone, notify_status, patient_id, created_at")
    .eq("form_id", id)
    .order("created_at", { ascending: false });
  if (error) return dbErr("forms-submissions", error);

  const submissions = (subs ?? []) as SubRow[];

  if (req.nextUrl.searchParams.get("format") !== "csv") {
    return NextResponse.json({ submissions });
  }

  // CSV: columnas = metadatos + preguntas del schema vigente (sin statement).
  const schema = form.schema as FormSchema;
  const cols = schema.questions.filter((q) => q.type !== "statement");
  const header = ["Fecha", "Nombre", "Email", "Teléfono", ...cols.map((c) => c.title)];

  const rows: string[][] = [header];
  for (const s of submissions) {
    // Resuelve cada respuesta con la pregunta del snapshot (para labels correctas).
    const snapById = new Map<string, Question>((s.form_schema_snapshot?.questions ?? []).map((q) => [q.id, q]));
    rows.push([
      new Date(s.created_at).toLocaleString("es-CL"),
      s.full_name ?? "",
      s.email ?? "",
      s.phone ?? "",
      ...cols.map((c) => {
        const q = snapById.get(c.id) ?? c;
        return formatAnswer(q, s.answers[c.id] ?? null);
      }),
    ]);
  }

  const csv = buildCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${form.slug}-respuestas.csv"`,
    },
  });
}
