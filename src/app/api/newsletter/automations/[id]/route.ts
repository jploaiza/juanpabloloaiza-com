import { NextRequest, NextResponse } from "next/server";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
  }

  const { error } = await auth.adminSb
    .from("newsletter_automations")
    .update({ enabled: body.enabled })
    .eq("id", id);

  if (error) {
    console.error("[newsletter/automations PUT]", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
