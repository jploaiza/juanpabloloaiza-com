import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { buildTrendIdeas, buildGscIdeas } from "@/lib/trends/scoring";

// POST /api/admin/trends/sync
// Recomputes content_ideas from existing trends_snapshots + gsc_queries already in DB.
// Does NOT call Google Trends or Search Console — that happens in the weekly cron.
export async function POST(req: NextRequest) {
  const ip = getIp(req.headers);
  if (!rateLimit(`trends-sync:${ip}`, 10, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adminSb = createAdminClient();
  const start = Date.now();

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0];

  const [{ data: recentTrends }, { data: strikingGsc }] = await Promise.all([
    adminSb
      .from("trends_snapshots")
      .select("id,keyword,geo,rising,interest_score")
      .gte("captured_at", sevenDaysAgo)
      .order("captured_at", { ascending: false })
      .limit(2000),
    adminSb
      .from("gsc_queries")
      .select("id,query,country,impressions,position")
      .gte("date", startDate)
      .gte("impressions", 30)
      .gte("position", 8)
      .lte("position", 30)
      .order("impressions", { ascending: false })
      .limit(100),
  ]);

  await adminSb.from("content_ideas").delete().eq("status", "new");

  const allIdeas = [
    ...buildTrendIdeas(recentTrends ?? []),
    ...buildGscIdeas(strikingGsc ?? []),
  ];
  let ideasInserted = 0;

  if (allIdeas.length > 0) {
    const { error } = await adminSb
      .from("content_ideas")
      .upsert(allIdeas, { onConflict: "seed_keyword,geo,source", ignoreDuplicates: true });
    if (error) {
      return NextResponse.json({ error: `ideas: ${error.message}` }, { status: 500 });
    }
    ideasInserted = allIdeas.length;
  }

  return NextResponse.json({
    ok: true,
    ideas_inserted: ideasInserted,
    duration_ms: Date.now() - start,
    note: "Data refresh happens via weekly cron. This endpoint only recomputes ideas from existing DB data.",
  });
}
