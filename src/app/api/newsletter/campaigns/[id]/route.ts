import { NextRequest, NextResponse } from "next/server";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_SENDER_DOMAIN = "juanpabloloaiza.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSender(senderEmail?: unknown, senderName?: unknown): string | null {
  if (senderEmail) {
    const e = String(senderEmail);
    if (!EMAIL_RE.test(e) || !e.endsWith(`@${ALLOWED_SENDER_DOMAIN}`)) return "Email de remitente inválido.";
  }
  if (senderName && /[\r\n]/.test(String(senderName))) return "Nombre de remitente inválido.";
  return null;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });
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
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });
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

  const senderErr = validateSender(body.sender_email, body.sender_name);
  if (senderErr) return NextResponse.json({ error: senderErr }, { status: 400 });

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

  if (error) {
    console.error("[newsletter/campaigns PUT]", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });
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
  if (error) {
    console.error("[newsletter/campaigns DELETE]", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
