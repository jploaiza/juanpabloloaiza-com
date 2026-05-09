import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // 60 pageviews per minute per IP
  if (!rateLimit(getIp(req.headers), 60, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  try {
    const {
      path,
      referrer,
      sessionId,
      deviceType,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
    } = await req.json();

    if (!path || typeof path !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    if (
      path.startsWith("/admin") ||
      path.startsWith("/academy/admin") ||
      path.startsWith("/api/") ||
      path.startsWith("/_next")
    ) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const ua = req.headers.get("user-agent");

    await supabase.from("page_views").insert({
      path: path.slice(0, 300),
      referrer: referrer ? String(referrer).slice(0, 300) : null,
      session_id: sessionId ? String(sessionId).slice(0, 64) : null,
      user_agent: ua ? ua.slice(0, 500) : null,
      device_type: deviceType ?? null,
      utm_source: utm_source ? String(utm_source).slice(0, 200) : null,
      utm_medium: utm_medium ? String(utm_medium).slice(0, 200) : null,
      utm_campaign: utm_campaign ? String(utm_campaign).slice(0, 200) : null,
      utm_content: utm_content ? String(utm_content).slice(0, 200) : null,
      utm_term: utm_term ? String(utm_term).slice(0, 200) : null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
