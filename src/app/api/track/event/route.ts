import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp } from "@/lib/rate-limit";

const ALLOWED_EVENTS = new Set([
  "whatsapp_click",
  "agendar_click",
  "booking_confirmed",
  "enrollment_started",
  "lesson_completed",
  "course_completed",
  "scroll_50",
  "scroll_75",
  "scroll_100",
  "time_30s",
  "time_60s",
  "time_180s",
]);

export async function POST(req: NextRequest) {
  // 30 events per minute per IP
  if (!rateLimit(getIp(req.headers), 30, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { name, path, sessionId, props, utm } = body;

    if (!name || typeof name !== "string" || !ALLOWED_EVENTS.has(name)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const rawProps = props ?? {};
    if (JSON.stringify(rawProps).length > 2048) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const BLOCKED_KEYS = new Set(["user_id", "email", "password", "token", "secret", "api_key"]);
    const propsJson = typeof rawProps === "object" && rawProps !== null
      ? Object.fromEntries(Object.entries(rawProps as Record<string, unknown>).filter(([k]) => !BLOCKED_KEYS.has(k)))
      : {};

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.from("events").insert({
      event_name: name,
      path: path ? String(path).slice(0, 300) : null,
      session_id: sessionId ? String(sessionId).slice(0, 64) : null,
      props: propsJson,
      utm_source: utm?.utm_source ?? null,
      utm_medium: utm?.utm_medium ?? null,
      utm_campaign: utm?.utm_campaign ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
