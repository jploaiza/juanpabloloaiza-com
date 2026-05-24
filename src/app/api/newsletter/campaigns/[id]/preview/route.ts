import { NextRequest, NextResponse } from "next/server";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";
import { renderCampaignHtml } from "@/lib/newsletter/renderer";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  const { data: campaign } = await auth.adminSb
    .from("newsletter_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (!campaign) return new NextResponse("Not found", { status: 404 });

  const testSub = { id: "preview", email: "preview@example.com", name: "Lector", apellido: "Ejemplo", unsubscribe_token: "preview-token" };
  const html = renderCampaignHtml(campaign.template_kind, campaign.template_data, testSub);

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
