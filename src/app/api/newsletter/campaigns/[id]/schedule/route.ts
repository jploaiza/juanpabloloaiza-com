import { NextRequest, NextResponse } from "next/server";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  const { scheduled_at, send_now } = await req.json();

  const { data: campaign } = await auth.adminSb
    .from("newsletter_campaigns")
    .select("status, subject")
    .eq("id", id)
    .single();

  if (!campaign) return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  if (!["draft", "scheduled"].includes(campaign.status)) {
    return NextResponse.json({ error: "Solo campañas en borrador o programadas pueden cambiarse." }, { status: 409 });
  }
  if (!campaign.subject?.trim()) {
    return NextResponse.json({ error: "La campaña necesita un asunto antes de programarse." }, { status: 400 });
  }

  if (send_now) {
    // Schedule for immediate dispatch (set to 1 minute from now so cron picks it up)
    const nowPlus1 = new Date(Date.now() + 60_000).toISOString();
    await auth.adminSb.from("newsletter_campaigns").update({ status: "scheduled", scheduled_at: nowPlus1, updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ ok: true, scheduled_at: nowPlus1, send_now: true });
  }

  if (!scheduled_at) return NextResponse.json({ error: "Fecha de envío requerida." }, { status: 400 });

  const dt = new Date(scheduled_at);
  if (isNaN(dt.getTime()) || dt <= new Date()) {
    return NextResponse.json({ error: "La fecha debe ser en el futuro." }, { status: 400 });
  }

  await auth.adminSb.from("newsletter_campaigns").update({ status: "scheduled", scheduled_at: dt.toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
  return NextResponse.json({ ok: true, scheduled_at: dt.toISOString() });
}
