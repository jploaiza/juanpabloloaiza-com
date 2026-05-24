import { NextRequest, NextResponse } from "next/server";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  const { data: campaign } = await auth.adminSb
    .from("newsletter_campaigns")
    .select("status")
    .eq("id", id)
    .single();

  if (!campaign) return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  if (campaign.status !== "scheduled") {
    return NextResponse.json({ error: "Solo campañas programadas pueden cancelarse." }, { status: 409 });
  }

  await auth.adminSb.from("newsletter_campaigns").update({ status: "canceled", updated_at: new Date().toISOString() }).eq("id", id);
  return NextResponse.json({ ok: true });
}
