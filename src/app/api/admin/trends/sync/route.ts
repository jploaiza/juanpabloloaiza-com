import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { fetchDailyTrends, fetchRelatedQueries, type TrendGeo } from "@/lib/trends/google-trends";
import { fetchTopQueries } from "@/lib/trends/search-console";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { getActiveSeeds } from "@/lib/trends/get-seeds";

export const maxDuration = 60;

const GEOS: TrendGeo[] = ["ES", "US", "MX", "CL"];

const GSC_COUNTRIES = ["esp", "usa", "mex", "chl"];

const GEO_TO_COUNTRY: Record<TrendGeo, string> = {
  ES: "esp",
  US: "usa",
  MX: "mex",
  CL: "chl",
};

// POST /api/admin/trends/sync — admin-authenticated manual trigger
export async function POST(req: NextRequest) {
  const ip = getIp(req.headers);
  if (!rateLimit(`trends-sync:${ip}`, 3, 5 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const start = Date.now();
  const adminSb = createAdminClient();
  const errors: string[] = [];
  let trendsInserted = 0;
  let gscInserted = 0;
  let ideasInserted = 0;

  const SEED_KEYWORDS = await getActiveSeeds();

  // ── Daily trends per geo ────────────────────────────────────────────────────
  for (const geo of GEOS) {
    const daily = await fetchDailyTrends(geo);
    if (daily.length > 0) {
      const { error } = await adminSb.from("trends_snapshots").upsert(
        daily.map((t) => ({
          geo: t.geo,
          keyword: t.keyword,
          source: t.source,
          seed_keyword: "",  // use '' not null so UNIQUE constraint deduplicates correctly
          interest_score: t.interest_score,
          rising: t.rising,
          raw: t.raw,
        })),
        { onConflict: "captured_at,geo,keyword,source,seed_keyword", ignoreDuplicates: true }
      );
      if (error) errors.push(`daily_trends ${geo}: ${error.message}`);
      else trendsInserted += daily.length;
    }
  }

  // ── Related queries per seed × geo ─────────────────────────────────────────
  for (const geo of GEOS) {
    for (const seed of SEED_KEYWORDS) {
      const related = await fetchRelatedQueries(seed, geo);
      if (related.length > 0) {
        const { error } = await adminSb.from("trends_snapshots").upsert(
          related.map((t) => ({
            geo: t.geo,
            keyword: t.keyword,
            source: t.source,
            seed_keyword: t.seed_keyword ?? seed,
            interest_score: t.interest_score,
            rising: t.rising,
            raw: t.raw,
          })),
          { onConflict: "captured_at,geo,keyword,source,seed_keyword", ignoreDuplicates: true }
        );
        if (error) errors.push(`related ${geo}/${seed}: ${error.message}`);
        else trendsInserted += related.length;
      }
    }
  }

  // ── GSC queries per country ────────────────────────────────────────────────
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0];

  for (const country of GSC_COUNTRIES) {
    const rows = await fetchTopQueries({ startDate, endDate, country });
    if (rows.length > 0) {
      const { error } = await adminSb.from("gsc_queries").upsert(
        rows.map((r) => ({
          date: endDate,
          query: r.query,
          country: r.country || country,
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
          position: r.position,
        })),
        { onConflict: "date,query,country", ignoreDuplicates: true }
      );
      if (error) errors.push(`gsc ${country}: ${error.message}`);
      else gscInserted += rows.length;
    }
  }

  // ── Recompute content ideas ─────────────────────────────────────────────────
  await adminSb.from("content_ideas").delete().eq("status", "new");

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
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

  const trendIdeas: Record<string, { keyword: string; geo: string; score: number; ref_id: string }> = {};
  for (const t of recentTrends ?? []) {
    const k = `${t.keyword}::${t.geo}::trends`;
    const score = (t.rising ? 50 : 0) + (t.interest_score ?? 0);
    if (!trendIdeas[k] || score > trendIdeas[k].score) {
      trendIdeas[k] = { keyword: t.keyword, geo: t.geo, score, ref_id: t.id };
    }
  }

  const ideasToInsert = Object.entries(trendIdeas)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 20)
    .map(([, v]) => ({
      seed_keyword: v.keyword,
      geo: v.geo,
      source: "trends",
      source_ref: { trends_snapshot_id: v.ref_id },
      opportunity_score: v.score,
      status: "new",
    }));

  const gscIdeas = (strikingGsc ?? [])
    .flatMap((r) => {
      const geoEntry = Object.entries(GEO_TO_COUNTRY).find(([, c]) => c === r.country);
      if (!geoEntry) return [];
      const score = r.impressions / 10 + (32 - r.position) * 5;
      return [{
        seed_keyword: r.query,
        geo: geoEntry[0],
        source: "gsc",
        source_ref: { gsc_query_id: r.id, position: r.position, impressions: r.impressions },
        opportunity_score: score,
        status: "new",
      }];
    })
    .slice(0, 20);

  const allIdeas = [...ideasToInsert, ...gscIdeas];
  if (allIdeas.length > 0) {
    const { error } = await adminSb
      .from("content_ideas")
      .upsert(allIdeas, { onConflict: "seed_keyword,geo,source", ignoreDuplicates: false });
    if (error) errors.push(`ideas: ${error.message}`);
    else ideasInserted = allIdeas.length;
  }

  await adminSb.from("trends_run_logs").insert({
    duration_ms: Date.now() - start,
    trends_inserted: trendsInserted,
    gsc_inserted: gscInserted,
    ideas_inserted: ideasInserted,
    errors: errors.length > 0 ? errors : null,
  });

  return NextResponse.json({
    ok: true,
    trends_inserted: trendsInserted,
    gsc_inserted: gscInserted,
    ideas_inserted: ideasInserted,
    duration_ms: Date.now() - start,
    ...(errors.length > 0 && { errors }),
  });
}
