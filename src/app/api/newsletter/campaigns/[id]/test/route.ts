import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";
import { renderCampaignHtml } from "@/lib/newsletter/renderer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  const { test_email } = await req.json();
  if (!test_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(test_email)) {
    return NextResponse.json({ error: "Email de prueba inválido." }, { status: 400 });
  }

  const { data: campaign } = await auth.adminSb
    .from("newsletter_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (!campaign) return NextResponse.json({ error: "No encontrada." }, { status: 404 });

  const testSub = { id: "test", email: test_email, name: "Preview", apellido: "Test", unsubscribe_token: "test-token" };
  const html = renderCampaignHtml(campaign.template_kind, campaign.template_data, testSub);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: `${campaign.sender_name} <${campaign.sender_email}>`,
    to: test_email,
    subject: `[TEST] ${campaign.subject || campaign.name}`,
    html,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
