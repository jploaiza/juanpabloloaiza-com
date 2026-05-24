import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers.get("svix-signature");
    if (!signature || !signature.includes(secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const body = await req.json();
  const { type, data } = body as { type: string; data: Record<string, unknown> };
  const resendId = String(data?.email_id ?? "");

  if (!resendId) return NextResponse.json({ ok: true });

  const supabase = await createAdminClient();
  const now = new Date().toISOString();

  const updates: Record<string, unknown> = {};

  switch (type) {
    case "email.delivered":
      updates.status = "delivered";
      break;
    case "email.opened":
      updates.status = "opened";
      updates.opened_at = now;
      break;
    case "email.clicked":
      updates.status = "clicked";
      updates.clicked_at = now;
      break;
    case "email.bounced":
      updates.status = "bounced";
      break;
    case "email.complained":
      updates.status = "complained";
      break;
    default:
      return NextResponse.json({ ok: true, skipped: type });
  }

  const { data: sendRow } = await supabase
    .from("newsletter_sends")
    .update(updates)
    .eq("resend_id", resendId)
    .select("subscriber_id, campaign_id")
    .maybeSingle();

  if (sendRow) {
    // Update subscriber last_engaged_at for opens and clicks
    if (type === "email.opened" || type === "email.clicked") {
      await supabase
        .from("newsletter_subscribers")
        .update({ last_engaged_at: now })
        .eq("id", sendRow.subscriber_id);
    }

    // Mark bounced/complained subscribers
    if (type === "email.bounced") {
      await supabase
        .from("newsletter_subscribers")
        .update({ status: "bounced" })
        .eq("id", sendRow.subscriber_id);
    }
    if (type === "email.complained") {
      await supabase
        .from("newsletter_subscribers")
        .update({ status: "complained" })
        .eq("id", sendRow.subscriber_id);
    }
  }

  return NextResponse.json({ ok: true });
}
