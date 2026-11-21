import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";
import { dispatchScheduledCampaigns } from "@/lib/newsletter/dispatch";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    // Envío inmediato: se marca como programada para ahora y se despacha en el acto.
    // Si el despacho falla o se corta, el cron diario la recoge (sigue "scheduled").
    const now = new Date().toISOString();
    await auth.adminSb.from("newsletter_campaigns").update({ status: "scheduled", scheduled_at: now, updated_at: now }).eq("id", id);
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { dispatched, errors } = await dispatchScheduledCampaigns(auth.adminSb, resend, { campaignId: id, limit: 1 });
      return NextResponse.json({ ok: true, scheduled_at: now, send_now: true, dispatched: dispatched.length > 0, errors });
    } catch (e) {
      console.error("[newsletter/schedule] envío inmediato", e);
      return NextResponse.json({ ok: true, scheduled_at: now, send_now: true, dispatched: false, queued: true });
    }
  }

  if (!scheduled_at) return NextResponse.json({ error: "Fecha de envío requerida." }, { status: 400 });

  const dt = new Date(scheduled_at);
  if (isNaN(dt.getTime()) || dt <= new Date()) {
    return NextResponse.json({ error: "La fecha debe ser en el futuro." }, { status: 400 });
  }

  await auth.adminSb.from("newsletter_campaigns").update({ status: "scheduled", scheduled_at: dt.toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
  return NextResponse.json({ ok: true, scheduled_at: dt.toISOString() });
}
