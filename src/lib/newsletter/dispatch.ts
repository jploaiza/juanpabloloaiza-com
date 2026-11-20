import type { SupabaseClient } from "@supabase/supabase-js";
import type { Resend } from "resend";
import { renderCampaignHtml, personalize } from "@/lib/newsletter/renderer";
import { BRANDS, belongsToBrandAudience, brandFromSenderEmail } from "@/lib/newsletter/brands";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.juanpabloloaiza.com";
const BATCH_SIZE = 100;

export interface DispatchResult {
  dispatched: string[];
  errors: string[];
}

/**
 * Envía las campañas programadas cuya hora ya llegó. Lo usa el cron diario y la
 * ruta "enviar ahora" (con `campaignId`, solo esa campaña).
 *
 * La marca de cada campaña sale del dominio de su remitente. Las marcas con lista
 * propia (portal) solo envían a quienes están en esa lista, y la marca principal
 * no envía a quienes se suscribieron solo a través de otra marca.
 */
export async function dispatchScheduledCampaigns(
  supabase: SupabaseClient,
  resend: Resend,
  opts: { campaignId?: string; limit?: number } = {},
): Promise<DispatchResult> {
  const dispatched: string[] = [];
  const errors: string[] = [];

  let q = supabase
    .from("newsletter_campaigns")
    .select("id, subject, preheader, sender_name, sender_email, segment, template_kind, template_data")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString());
  if (opts.campaignId) q = q.eq("id", opts.campaignId);
  const { data: campaigns } = await q.limit(opts.limit ?? 3);

  for (const campaign of campaigns ?? []) {
    try {
      // Mark as sending to prevent double-dispatch
      await supabase.from("newsletter_campaigns").update({ status: "sending" }).eq("id", campaign.id);

      const brand = brandFromSenderEmail(campaign.sender_email) ?? BRANDS.jpl;

      // Build subscriber query from segment
      const segment = campaign.segment as { status?: string; tags?: string[]; subscriber_ids?: string[] };
      let query = supabase
        .from("newsletter_subscribers")
        .select("id, email, name, apellido, unsubscribe_token, source");

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

      // Las marcas con lista propia (portal) solo envían a quienes están en esa lista
      if (brand.listTag) query = query.contains("tags", [brand.listTag]);

      const { data: allSubscribers } = await query;
      const subscribers = (allSubscribers ?? []).filter((s) => belongsToBrandAudience(s, brand));
      if (!subscribers.length) {
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
          html: renderCampaignHtml(campaign.template_kind, campaign.template_data, sub, brand),
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

  return { dispatched, errors };
}
