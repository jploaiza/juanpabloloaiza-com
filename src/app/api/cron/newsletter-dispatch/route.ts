import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { dispatchScheduledCampaigns } from "@/lib/newsletter/dispatch";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET}`);
  const provided = Buffer.from(req.headers.get("authorization") ?? "");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = await createAdminClient();

  try {
    // Campañas programadas cuya hora ya llegó (la lógica vive en lib/newsletter/dispatch.ts)
    const { dispatched, errors } = await dispatchScheduledCampaigns(supabase, resend);

    // Queued welcome emails: handled by the confirm endpoint directly for now.
    return NextResponse.json({ ok: true, dispatched, errors });
  } catch (err) {
    console.error("[newsletter-dispatch]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
