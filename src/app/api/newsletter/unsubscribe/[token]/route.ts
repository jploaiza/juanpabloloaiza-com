import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://juanpabloloaiza.com";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || !UUID_RE.test(token)) {
    return NextResponse.redirect(`${SITE_URL}/newsletter/baja?error=1`);
  }

  return NextResponse.redirect(`${SITE_URL}/newsletter/baja/${token}`);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const contentType = req.headers.get("content-type") ?? "";
  let action = "total";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    // RFC 8058 one-click: body is "List-Unsubscribe=One-Click"
    action = "total";
  } else {
    const body = await req.json().catch(() => ({ action: "total" }));
    action = body.action ?? "total";
  }

  if (!token || !UUID_RE.test(token)) {
    return NextResponse.json({ error: "Token inválido." }, { status: 400 });
  }

  try {
    const supabase = await createAdminClient();

    if (action === "pause") {
      const { data: sub } = await supabase
        .from("newsletter_subscribers")
        .select("id, tags")
        .eq("unsubscribe_token", token)
        .maybeSingle();

      if (sub) {
        const tags = Array.isArray(sub.tags) ? sub.tags : [];
        if (!tags.includes("paused")) {
          await supabase
            .from("newsletter_subscribers")
            .update({ tags: [...tags, "paused"] })
            .eq("id", sub.id);
        }
      }
      return NextResponse.json({ success: true, action: "paused" });
    }

    const { data: updated } = await supabase
      .from("newsletter_subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("unsubscribe_token", token)
      .eq("status", "confirmed")
      .select("id")
      .maybeSingle();

    if (!updated) {
      return NextResponse.json({ success: true, already: true });
    }

    return NextResponse.json({ success: true, action: "unsubscribed" });
  } catch (err) {
    console.error("[newsletter/unsubscribe]", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
