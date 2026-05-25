import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { renderCampaignHtml, personalize } from "@/lib/newsletter/renderer";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://juanpabloloaiza.com";
const BATCH_SIZE = 100;

export async function GET(req: NextRequest) {
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET ?? ""}`);
  const provided = Buffer.from(req.headers.get("authorization") ?? "");
  if (expected.length === 0 || expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = await createAdminClient();
  const dispatched: string[] = [];
  const errors: string[] = [];

  try {
    // ── 1. Find campaigns ready to send ──────────────────────────────────────
    const { data: campaigns } = await supabase
      .from("newsletter_campaigns")
      .select("id, subject, preheader, sender_name, sender_email, segment, template_kind, template_data")
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString())
      .limit(3);

    for (const campaign of campaigns ?? []) {
      try {
        // Mark as sending to prevent double-dispatch
        await supabase
          .from("newsletter_campaigns")
          .update({ status: "sending" })
          .eq("id", campaign.id);

        // Build subscriber query from segment
        const segment = campaign.segment as { status?: string; tags?: string[]; subscriber_ids?: string[] };
        let query = supabase
          .from("newsletter_subscribers")
          .select("id, email, name, apellido, unsubscribe_token");

        if (segment?.subscriber_ids?.length) {
          // Targeted resend: specific subscribers only
          query = query.in("id", segment.subscriber_ids)
            .neq("status", "unsubscribed")
            .neq("status", "bounced")
            .neq("status", "deleted")
            .neq("status", "complained");
        } else {
          query = query.eq("status", segment?.status ?? "confirmed");
          if (segment?.tags?.length) {
            query = query.overlaps("tags", segment.tags);
          }
        }

        const { data: subscribers } = await query;
        if (!subscribers?.length) {
          await supabase.from("newsletter_campaigns").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", campaign.id);
          continue;
        }

        let sentCount = 0;
        const sendLogs: Array<{ campaign_id: string; subscriber_id: string; resend_id?: string; status: string; error?: string }> = [];

        // Send in batches of 100
        for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
          const batch = subscribers.slice(i, i + BATCH_SIZE);

          const messages = batch.map((sub) => ({
            from: `${campaign.sender_name} <${campaign.sender_email}>`,
            to: sub.email,
            subject: personalize(campaign.subject, sub),
            html: renderCampaignHtml(campaign.template_kind, campaign.template_data, sub),
            headers: {
              "List-Unsubscribe": `<${SITE_URL}/api/newsletter/unsubscribe/${sub.unsubscribe_token}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          }));

          const { data: batchResult, error: batchError } = await resend.batch.send(messages);

          if (batchError) {
            errors.push(`campaign ${campaign.id} batch ${i}: ${batchError.message}`);
            batch.forEach((sub) => sendLogs.push({ campaign_id: campaign.id, subscriber_id: sub.id, status: "failed", error: batchError.message }));
          } else {
            batchResult?.data?.forEach((result, idx) => {
              sendLogs.push({ campaign_id: campaign.id, subscriber_id: batch[idx].id, resend_id: result.id, status: "sent" });
              sentCount++;
            });
          }
        }

        // Write send logs
        if (sendLogs.length) {
          await supabase.from("newsletter_sends").insert(sendLogs);
        }

        // Update campaign stats and mark sent
        await supabase
          .from("newsletter_campaigns")
          .update({
            status: sentCount > 0 ? "sent" : "failed",
            sent_at: new Date().toISOString(),
            stats_cache: {
              recipients: subscribers.length,
              sent: sentCount,
              delivered: 0,
              opened: 0,
              clicked: 0,
              bounced: 0,
              complained: 0,
            },
          })
          .eq("id", campaign.id);

        dispatched.push(campaign.id);
      } catch (campaignErr) {
        console.error(`[newsletter-dispatch] campaign ${campaign.id}`, campaignErr);
        errors.push(`campaign ${campaign.id}: ${String(campaignErr)}`);
        await supabase.from("newsletter_campaigns").update({ status: "failed" }).eq("id", campaign.id);
      }
    }

    // ── 2. Process queued welcome emails ──────────────────────────────────────
    // (handled by confirm endpoint directly for now — future: drain queue here)

    return NextResponse.json({ ok: true, dispatched, errors });
  } catch (err) {
    console.error("[newsletter-dispatch]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
