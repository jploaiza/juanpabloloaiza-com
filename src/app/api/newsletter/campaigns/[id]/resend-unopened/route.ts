import { NextRequest, NextResponse } from "next/server";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  // Get original campaign
  const { data: original } = await auth.adminSb
    .from("newsletter_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (!original) return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  if (original.status !== "sent") return NextResponse.json({ error: "Solo se puede reenviar campañas ya enviadas." }, { status: 409 });

  // Get subscriber IDs who received the campaign but never opened it
  const { data: nonOpeners } = await auth.adminSb
    .from("newsletter_sends")
    .select("subscriber_id")
    .eq("campaign_id", id)
    .eq("status", "sent")
    .is("opened_at", null);

  const subscriberIds = (nonOpeners ?? []).map((r) => r.subscriber_id).filter(Boolean);

  if (subscriberIds.length === 0) {
    return NextResponse.json({ error: "No hay destinatarios que no hayan abierto el email." }, { status: 400 });
  }

  // Create duplicate campaign targeting only non-openers
  const { data: newCampaign, error } = await auth.adminSb
    .from("newsletter_campaigns")
    .insert({
      name: `${original.name} — Reenvío no lectores`,
      subject: original.subject,
      preheader: original.preheader,
      template_kind: original.template_kind,
      template_data: original.template_data,
      sender_name: original.sender_name,
      sender_email: original.sender_email,
      segment: { subscriber_ids: subscriberIds },
      status: "draft",
      created_by: auth.userId,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[resend-unopened]", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }

  return NextResponse.json({ id: newCampaign.id, count: subscriberIds.length });
}
