import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { buildTrendIdeas, buildGscIdeas } from "@/lib/trends/scoring";
import { getActiveSeeds } from "@/lib/trends/get-seeds";
import { fetchRelatedQueries, type TrendGeo } from "@/lib/trends/google-trends";

// POST /api/admin/trends/sync
// 1. Fetches Google Trends for seeds that have no recent data (newly added seeds).
// 2. Recomputes content_ideas from all recent snapshots in DB.
export const maxDuration = 90;

const VALID_GEOS = new Set(["ES", "US", "MX", "CL"]);

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

  const body = await req.json().catch(() => ({}));
  const rawGeo = typeof body.geo === "string" ? body.geo.toUpperCase() : "ALL";
  // For new seeds: use the selected geo, or ES+MX as representative defaults when ALL
  const geoToFetch: TrendGeo[] = VALID_GEOS.has(rawGeo)
    ? [rawGeo as TrendGeo]
    : ["ES", "MX"];

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  // Detect seeds that have no recent snapshots (new seeds added since last cron)
  const [seeds, { data: recentSeedRows }] = await Promise.all([
    getActiveSeeds(),
    adminSb
      .from("trends_snapshots")
      .select("seed_keyword")
      .gte("captured_at", sevenDaysAgo)
      .eq("source", "related_query"),
  ]);

  const recentSeedSet = new Set(
    (recentSeedRows ?? []).map((r) => (r.seed_keyword as string | null) ?? "")
  );
  // Limit to 4 new seeds per call to stay within 90s timeout
  const newSeeds = seeds.filter((s) => !recentSeedSet.has(s)).slice(0, 4);

  let seedsFetched = 0;
  let newSnapshotsCount = 0;

  for (const seed of newSeeds) {
    for (const geo of geoToFetch) {
      const related = await fetchRelatedQueries(seed, geo);
      if (related.length === 0) continue;
      const { error } = await adminSb.from("trends_snapshots").upsert(
        related.map((t) => ({
          geo: t.geo,
          keyword: t.keyword,
          source: t.source,
          seed_keyword: t.seed_keyword ?? seed,
          interest_score: t.interest_score,
          rising: t.rising,
          raw: t.raw,
          captured_at: today,
        })),
        { onConflict: "captured_at,geo,keyword,source,seed_keyword", ignoreDuplicates: true }
      );
      if (!error) {
        newSnapshotsCount += related.length;
        seedsFetched++;
      }
    }
  }

  // Rebuild content_ideas from all recent data (existing + freshly fetched)
  const [{ data: recentTrends }, { data: strikingGsc }] = await Promise.all([
    adminSb
      .from("trends_snapshots")
      .select("id,keyword,geo,rising,interest_score,seed_keyword")
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
    seeds_fetched: seedsFetched,
    new_snapshots: newSnapshotsCount,
    ideas_inserted: ideasInserted,
    duration_ms: Date.now() - start,
  });
}
