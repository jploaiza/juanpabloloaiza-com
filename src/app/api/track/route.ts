import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Public endpoint — no auth required, uses anon key
// Rate-limiting is handled by RLS (insert allowed for everyone)
export async function POST(req: NextRequest) {
  try {
    const { path, referrer } = await req.json();
    if (!path || typeof path !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Skip admin, api, and internal paths
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

    await supabase.from("page_views").insert({
      path: path.slice(0, 300),
      referrer: referrer ? String(referrer).slice(0, 300) : null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
