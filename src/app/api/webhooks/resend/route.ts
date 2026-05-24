import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function verifySvixSignature(rawBody: string, req: NextRequest, secret: string): boolean {
  const msgId = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signature = req.headers.get("svix-signature");

  if (!msgId || !timestamp || !signature) return false;

  // Reject stale webhooks (> 5 minutes)
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(Math.floor(Date.now() / 1000) - ts) > 300) return false;

  // Decode secret (strip "whsec_" prefix if present)
  const rawSecret = secret.startsWith("whsec_")
    ? Buffer.from(secret.slice(6), "base64")
    : Buffer.from(secret, "base64");

  const signedContent = `${msgId}.${timestamp}.${rawBody}`;
  const expectedSig = createHmac("sha256", rawSecret).update(signedContent).digest("base64");

  // svix-signature may contain multiple space-separated "v1,{base64}" entries
  for (const sig of signature.split(" ")) {
    const sigValue = sig.replace(/^v\d+,/, "");
    try {
      const expectedBuf = Buffer.from(expectedSig, "base64");
      const providedBuf = Buffer.from(sigValue, "base64");
      if (expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf)) {
        return true;
      }
    } catch { continue; }
  }
  return false;
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhooks/resend] RESEND_WEBHOOK_SECRET not set — rejecting");
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }

  const rawBody = await req.text();

  if (!verifySvixSignature(rawBody, req, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: { type: string; data: Record<string, unknown> };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = body;
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
    if (type === "email.opened" || type === "email.clicked") {
      await supabase
        .from("newsletter_subscribers")
        .update({ last_engaged_at: now })
        .eq("id", sendRow.subscriber_id);
    }
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
