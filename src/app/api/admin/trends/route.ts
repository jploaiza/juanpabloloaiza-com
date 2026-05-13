import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const VALID_GEOS = new Set(["ES", "US", "MX", "CL", "ALL"]);
const VALID_TABS = new Set(["trends", "gsc", "ideas", "all"]);

interface GlobalTrend {
  keyword: string;
  interest_score: number;
  geo: string;
  rising: boolean;
}

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return createAdminClient();
}

// GET /api/admin/trends?geo=ES&tab=all
export async function GET(req: NextRequest) {
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const rawGeo = searchParams.get("geo") ?? "ES";
  const rawTab = searchParams.get("tab") ?? "all";
  const geo = VALID_GEOS.has(rawGeo) ? rawGeo : "ES";
  const tab = VALID_TABS.has(rawTab) ? rawTab : "all";

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  // Build geo-aware trend queries (geo="ALL" skips the geo filter)
  let topTrendsQ = adminSb
    .from("trends_snapshots")
    .select("keyword,interest_score,rising,captured_at,source,geo")
    .gte("captured_at", sevenDaysAgo)
    .order("captured_at", { ascending: false })
    .limit(100);
  if (geo !== "ALL") topTrendsQ = topTrendsQ.eq("geo", geo);

  let risingQ = adminSb
    .from("trends_snapshots")
    .select("keyword,geo,seed_keyword,interest_score,captured_at")
    .eq("rising", true)
    .eq("source", "related_query")
    .gte("captured_at", sevenDaysAgo)
    .order("interest_score", { ascending: false })
    .limit(20);
  if (geo !== "ALL") risingQ = risingQ.eq("geo", geo);

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];

  const [
    { data: topTrendsData },
    { data: risingData },
    { data: gscTopData },
    { data: gscStrikingData },
    { data: contentIdeasData },
    { data: lastRunData },
    { data: globalTrendsRaw },
    { data: timelineRaw },
  ] = await Promise.all([
    tab === "ideas" ? Promise.resolve({ data: [] }) : topTrendsQ,
    tab === "gsc" ? Promise.resolve({ data: [] }) : risingQ,
    adminSb
      .from("gsc_queries")
      .select("query,country,clicks,impressions,ctr,position,date")
      .gte("date", thirtyDaysAgo)
      .order("clicks", { ascending: false })
      .limit(50),
    adminSb
      .from("gsc_queries")
      .select("query,country,clicks,impressions,ctr,position,date")
      .gte("date", thirtyDaysAgo)
      .gte("impressions", 30)
      .gte("position", 8)
      .lte("position", 30)
      .order("impressions", { ascending: false })
      .limit(30),
    adminSb
      .from("content_ideas")
      .select("*")
      .eq("status", "new")
      .order("opportunity_score", { ascending: false })
      .limit(30),
    adminSb
      .from("trends_run_logs")
      .select("run_at,duration_ms,trends_inserted,gsc_inserted,ideas_inserted,errors")
      .order("run_at", { ascending: false })
      .limit(1),
    adminSb
      .from("trends_snapshots")
      .select("keyword,interest_score,geo,rising,captured_at")
      .eq("source", "daily_trend")
      .gte("captured_at", sevenDaysAgo)
      .order("interest_score", { ascending: false })
      .limit(200),
    // Interest timeline: last 12 weeks for seeds, filtered by geo
    (() => {
      let q = adminSb
        .from("trends_interest_timeline")
        .select("keyword,geo,interest_score,recorded_date")
        .gte("recorded_date", ninetyDaysAgo)
        .order("recorded_date", { ascending: true });
      if (geo !== "ALL") q = q.eq("geo", geo);
      return q.limit(500);
    })(),
  ]);

  // Deduplicate top trends by keyword, pick max score
  const trendMap: Record<string, { keyword: string; geo: string; interest_score: number; rising: boolean; captured_at: string; source: string }> = {};
  for (const t of topTrendsData ?? []) {
    const k = `${t.keyword}::${t.geo}`;
    if (!trendMap[k] || (t.interest_score ?? 0) > (trendMap[k].interest_score ?? 0)) {
      trendMap[k] = t as typeof trendMap[string];
    }
  }
  const topTrends = Object.values(trendMap)
    .sort((a, b) => (b.interest_score ?? 0) - (a.interest_score ?? 0))
    .slice(0, 20);

  const risingQueries = (risingData ?? []).slice(0, 20);
  const contentIdeas = contentIdeasData ?? [];
  const lastRun = lastRunData?.[0] ?? null;

  // Deduplicate global trends by keyword (pick highest interest_score across all geos), top 10
  const globalMap: Record<string, GlobalTrend> = {};
  for (const t of globalTrendsRaw ?? []) {
    const existing = globalMap[t.keyword];
    if (!existing || (t.interest_score ?? 0) > (existing.interest_score ?? 0)) {
      globalMap[t.keyword] = {
        keyword: t.keyword,
        interest_score: t.interest_score ?? 0,
        geo: t.geo ?? "",
        rising: t.rising ?? false,
      };
    }
  }
  const globalTrends: GlobalTrend[] = Object.values(globalMap)
    .sort((a, b) => b.interest_score - a.interest_score)
    .slice(0, 10);

  // Tab-filtered display data
  const gscTopQueries = (tab === "trends" || tab === "ideas") ? [] : (gscTopData ?? []);
  const gscStriking = (tab === "trends" || tab === "ideas") ? [] : (gscStrikingData ?? []);

  // KPI calculations — always based on full data, not tab-filtered display data
  const newIdeasCount = contentIdeas.length;
  const strikingCount = (gscStrikingData ?? []).length;
  const risingCount = (risingData ?? []).length;
  const totalClicks = (gscTopData ?? []).reduce((sum, r) => sum + (r.clicks ?? 0), 0);

  // Group timeline by keyword → sorted date points
  type TimelinePoint = { date: string; score: number };
  const timelineMap: Record<string, TimelinePoint[]> = {};
  for (const row of timelineRaw ?? []) {
    if (!timelineMap[row.keyword]) timelineMap[row.keyword] = [];
    timelineMap[row.keyword].push({ date: row.recorded_date, score: row.interest_score });
  }
  // Keep only keywords with ≥2 points (enough to draw a line)
  const interestTimeline = Object.entries(timelineMap)
    .filter(([, pts]) => pts.length >= 2)
    .map(([keyword, points]) => ({ keyword, points }));

  return NextResponse.json({
    topTrends,
    risingQueries,
    gscTopQueries,
    gscStriking,
    contentIdeas,
    lastRun,
    globalTrends,
    interestTimeline,
    kpis: {
      newIdeas: newIdeasCount,
      striking: strikingCount,
      rising: risingCount,
      totalClicks28d: totalClicks,
    },
  });
}
