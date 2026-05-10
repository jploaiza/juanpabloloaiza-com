import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchDailyTrends, fetchRelatedQueries, type TrendGeo } from "@/lib/trends/google-trends";
import { fetchTopQueries, getStrikingDistanceQueries } from "@/lib/trends/search-console";

const GEOS: TrendGeo[] = ["ES", "US", "MX", "CL"];

const SEED_KEYWORDS = [
  "hipnosis",
  "terapia regresiva",
  "vidas pasadas",
  "liberación de entidades",
  "terapia espiritual",
  "regresión a vidas pasadas",
  "hipnosis clínica",
  "sanación espiritual",
];

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
  const adminSb = await createAdminClient();
  const errors: string[] = [];
  let trendsInserted = 0;
  let gscInserted = 0;
  let ideasInserted = 0;

  // ── 1. Fetch daily trends per geo ──────────────────────────────────────────
  for (const geo of GEOS) {
    const daily = await fetchDailyTrends(geo);
    if (daily.length > 0) {
      const { error } = await adminSb.from("trends_snapshots").upsert(
        daily.map((t) => ({
          geo: t.geo,
          keyword: t.keyword,
          source: t.source,
          seed_keyword: "",  // '' not null so UNIQUE constraint deduplicates correctly
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

  // ── 2. Fetch related queries per seed × geo ────────────────────────────────
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

  // ── 3. Fetch GSC queries per country ──────────────────────────────────────
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0];

  for (const country of GSC_COUNTRIES) {
    let rows: Awaited<ReturnType<typeof fetchTopQueries>> = [];
    try {
      rows = await fetchTopQueries({ startDate, endDate, country });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`gsc fetch ${country}: ${msg}`);
      continue;
    }
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

  // ── 4. Recompute content ideas (replace 'new' ones) ───────────────────────
  await adminSb.from("content_ideas").delete().eq("status", "new");

  // Fetch recent trends for scoring
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

  // Deduplicate and score trend ideas
  const trendIdeas: Record<string, { keyword: string; geo: string; score: number; ref_id: string; rising: boolean }> = {};
  for (const t of recentTrends ?? []) {
    const k = `${t.keyword}::${t.geo}::trends`;
    const score = (t.rising ? 50 : 0) + (t.interest_score ?? 0);
    if (!trendIdeas[k] || score > trendIdeas[k].score) {
      trendIdeas[k] = { keyword: t.keyword, geo: t.geo, score, ref_id: t.id, rising: t.rising };
    }
  }

  // Build ideas list from trends
  const ideasToInsert = Object.entries(trendIdeas)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 20)
    .map(([, v]) => ({
      seed_keyword: v.keyword,
      geo: v.geo,
      source: "trends",
      source_ref: { trends_snapshot_id: v.ref_id, rising: v.rising },
      opportunity_score: v.score,
      status: "new",
    }));

  // Add striking distance GSC ideas (skip rows with unmapped country codes)
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

  // ── 5. Log run ─────────────────────────────────────────────────────────────
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
    errors: errors.length > 0 ? errors : undefined,
  });
}
