import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { dbErr } from "@/lib/db-error";
import type { FormSchema } from "@/lib/forms/types";

// POST /api/admin/forms/[id]/publish — { publish: boolean }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const publish = Boolean(body.publish);

  if (publish) {
    const { data: form } = await sb.from("forms").select("schema").eq("id", id).maybeSingle();
    const schema = form?.schema as FormSchema | undefined;
    if (!schema || schema.questions.length === 0) {
      return NextResponse.json({ error: "Agrega al menos una pregunta antes de publicar." }, { status: 400 });
    }
  }

  const { data: updated, error } = await sb
    .from("forms")
    .update({
      status: publish ? "published" : "draft",
      published_at: publish ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, status, published_at")
    .single();

  if (error) return dbErr("forms-publish", error);
  return NextResponse.json({ form: updated });
}
