import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const VALID_GEOS = new Set(["ES", "US", "MX", "CL", "ALL"]);
const VALID_TABS = new Set(["trends", "gsc", "ideas", "all"]);

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

  const [
    { data: topTrendsData },
    { data: risingData },
    { data: gscTopData },
    { data: gscStrikingData },
    { data: contentIdeasData },
    { data: lastRunData },
  ] = await Promise.all([
    tab === "ideas" ? Promise.resolve({ data: [] }) : topTrendsQ,
    // Always fetch rising for KPI — skip display only on gsc tab
    tab === "gsc" ? Promise.resolve({ data: [] }) : risingQ,
    // Always fetch GSC for KPI
    adminSb
      .from("gsc_queries")
      .select("query,country,clicks,impressions,ctr,position,date")
      .gte("date", thirtyDaysAgo)
      .order("clicks", { ascending: false })
      .limit(50),
    // Always fetch striking for KPI
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

  // Tab-filtered display data
  const gscTopQueries = (tab === "trends" || tab === "ideas") ? [] : (gscTopData ?? []);
  const gscStriking = (tab === "trends" || tab === "ideas") ? [] : (gscStrikingData ?? []);

  // KPI calculations — always based on full data, not tab-filtered display data
  const newIdeasCount = contentIdeas.length;
  const strikingCount = (gscStrikingData ?? []).length;
  const risingCount = (risingData ?? []).length;
  const totalClicks = (gscTopData ?? []).reduce((sum, r) => sum + (r.clicks ?? 0), 0);

  return NextResponse.json({
    topTrends,
    risingQueries,
    gscTopQueries,
    gscStriking,
    contentIdeas,
    lastRun,
    kpis: {
      newIdeas: newIdeasCount,
      striking: strikingCount,
      rising: risingCount,
      totalClicks28d: totalClicks,
    },
  });
}
