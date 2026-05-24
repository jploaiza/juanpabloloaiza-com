import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.juanpabloloaiza.com";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 10) {
    return NextResponse.redirect(`${SITE_URL}/newsletter/baja?error=1`);
  }

  // Redirect to the baja page so user can choose (less/total)
  return NextResponse.redirect(`${SITE_URL}/newsletter/baja/${token}`);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { action } = await req.json().catch(() => ({ action: "total" }));

  if (!token || token.length < 10) {
    return NextResponse.json({ error: "Token inválido." }, { status: 400 });
  }

  try {
    const supabase = await createAdminClient();

    if (action === "pause") {
      // Add a "paused" tag instead of full unsubscribe
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

    // Full unsubscribe
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
