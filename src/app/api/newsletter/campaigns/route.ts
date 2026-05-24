import { NextRequest, NextResponse } from "next/server";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";

export const dynamic = "force-dynamic";

const ALLOWED_SENDER_DOMAIN = "juanpabloloaiza.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSender(senderEmail?: string, senderName?: string): string | null {
  if (senderEmail) {
    if (!EMAIL_RE.test(senderEmail) || !senderEmail.endsWith(`@${ALLOWED_SENDER_DOMAIN}`)) {
      return "Email de remitente inválido.";
    }
  }
  if (senderName && /[\r\n]/.test(senderName)) {
    return "Nombre de remitente inválido.";
  }
  return null;
}

export async function GET() {
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;
  const { adminSb } = auth;

  const { data, error } = await adminSb
    .from("newsletter_campaigns")
    .select("id, name, subject, template_kind, status, scheduled_at, sent_at, stats_cache, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[newsletter/campaigns GET]", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;
  const { adminSb, userId } = auth;

  const body = await req.json();
  const { name, subject, preheader, template_kind, template_data, sender_name, sender_email, segment } = body;

  if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });

  const senderErr = validateSender(sender_email, sender_name);
  if (senderErr) return NextResponse.json({ error: senderErr }, { status: 400 });

  const { data, error } = await adminSb
    .from("newsletter_campaigns")
    .insert({
      name: name.trim(),
      subject: subject?.trim() ?? "",
      preheader: preheader?.trim() ?? "",
      template_kind: template_kind ?? "editorial",
      template_data: template_data ?? {},
      sender_name: sender_name ?? "Juan Pablo Loaiza",
      sender_email: sender_email ?? "newsletter@juanpabloloaiza.com",
      segment: segment ?? { status: "confirmed", tags: [] },
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[newsletter/campaigns POST]", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
