import { NextRequest, NextResponse } from "next/server";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.adminSb
    .from("newsletter_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  return NextResponse.json({ campaign: data });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();

  // Only allow editing draft/scheduled campaigns
  const { data: current } = await auth.adminSb
    .from("newsletter_campaigns")
    .select("status")
    .eq("id", id)
    .single();

  if (!current) return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  if (current.status === "sending" || current.status === "sent") {
    return NextResponse.json({ error: "No se puede editar una campaña que ya se envió." }, { status: 409 });
  }

  const allowed = ["name", "subject", "preheader", "template_kind", "template_data", "sender_name", "sender_email", "segment"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await auth.adminSb
    .from("newsletter_campaigns")
    .update(updates)
    .eq("id", id)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  const { data: current } = await auth.adminSb
    .from("newsletter_campaigns")
    .select("status")
    .eq("id", id)
    .single();

  if (!current) return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  if (current.status === "sending") {
    return NextResponse.json({ error: "No se puede eliminar una campaña en envío." }, { status: 409 });
  }

  const { error } = await auth.adminSb.from("newsletter_campaigns").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
