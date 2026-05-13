import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchDailyTrends, fetchRelatedQueries, fetchInterestOverTime, type TrendGeo } from "@/lib/trends/google-trends";
import { fetchTopQueries } from "@/lib/trends/search-console";
import { getActiveSeeds } from "@/lib/trends/get-seeds";
import { buildTrendIdeas, buildGscIdeas } from "@/lib/trends/scoring";

// Runs once a week via cron-job.org — fetches ALL data from external APIs.
// 300s max covers: 4 geos × daily + N seeds × 4 geos × related + top seeds × interest_over_time.
export const maxDuration = 300;

const GEOS: TrendGeo[] = ["ES", "US", "MX", "CL"];

const GSC_COUNTRIES = ["esp", "usa", "mex", "chl"];

const GEO_TO_COUNTRY: Record<TrendGeo, string> = {
  ES: "esp",
  US: "usa",
  MX: "mex",
  CL: "chl",
};

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error("[sync-trends] CRON_SECRET env var is not set");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  const secret = Buffer.from(req.headers.get("x-cron-secret") ?? "");
  const expected = Buffer.from(process.env.CRON_SECRET);
  if (
    secret.length === 0 ||
    secret.length !== expected.length ||
    !timingSafeEqual(secret, expected)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  const adminSb = createAdminClient();
  const errors: string[] = [];
  let trendsInserted = 0;
  let gscInserted = 0;
  let ideasInserted = 0;

  const SEED_KEYWORDS = await getActiveSeeds();

  // ── 1. Daily trends per geo ────────────────────────────────────────────────
  for (const geo of GEOS) {
    const daily = await fetchDailyTrends(geo);
    if (daily.length > 0) {
      const { error } = await adminSb.from("trends_snapshots").upsert(
        daily.map((t) => ({
          geo: t.geo,
          keyword: t.keyword,
          source: t.source,
          seed_keyword: "",
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

  // ── 2. Related queries per seed × geo ─────────────────────────────────────
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

  // ── 3. GSC queries per country ────────────────────────────────────────────
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

  // ── 4. Interest over time — top 20 seeds × all geos → trends_interest_timeline ──
  const todayDate = endDate; // reuse endDate (today's date string)
  const topSeeds = SEED_KEYWORDS.slice(0, 20);
  let timelineInserted = 0;

  for (const geo of GEOS) {
    for (const seed of topSeeds) {
      const score = await fetchInterestOverTime(seed, geo);
      if (score !== null) {
        const { error } = await adminSb
          .from("trends_interest_timeline")
          .upsert(
            { keyword: seed, geo, interest_score: score, recorded_date: todayDate },
            { onConflict: "keyword,geo,recorded_date", ignoreDuplicates: true }
          );
        if (error) errors.push(`interest_timeline ${geo}/${seed}: ${error.message}`);
        else timelineInserted++;
      }
    }
  }

  // ── 5. Recompute content ideas ─────────────────────────────────────────────
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

  await adminSb.from("content_ideas").delete().eq("status", "new");

  const allIdeas = [
    ...buildTrendIdeas(recentTrends ?? []),
    ...buildGscIdeas(strikingGsc ?? []),
  ];

  if (allIdeas.length > 0) {
    const { error } = await adminSb
      .from("content_ideas")
      .upsert(allIdeas, { onConflict: "seed_keyword,geo,source", ignoreDuplicates: true });
    if (error) errors.push(`ideas: ${error.message}`);
    else ideasInserted = allIdeas.length;
  }

  // ── 6. Log run ─────────────────────────────────────────────────────────────
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
    timeline_inserted: timelineInserted,
    duration_ms: Date.now() - start,
    errors: errors.length > 0 ? errors : undefined,
  });
}
