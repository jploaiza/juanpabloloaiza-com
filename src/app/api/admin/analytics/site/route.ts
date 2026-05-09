import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return await createAdminClient();
}

function last30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function last6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

// GET /api/admin/analytics/site
export async function GET() {
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const sixMonthsAgo = new Date(Date.now() - 180 * 86400000).toISOString();

  const [
    { data: views30d },
    { data: viewsAll },
    { data: blogPosts },
    { data: eventsData },
  ] = await Promise.all([
    adminSb.from("page_views").select("path, referrer, created_at, utm_source, utm_medium, utm_campaign").gte("created_at", thirtyDaysAgo),
    adminSb.from("page_views").select("path, created_at").gte("created_at", sixMonthsAgo),
    adminSb.from("blog_posts").select("id, slug, title, published_at").eq("status", "published").order("published_at", { ascending: false }),
    adminSb.from("events").select("event_name, utm_source, utm_medium, utm_campaign, created_at").gte("created_at", thirtyDaysAgo),
  ]);

  const SKIP_PREFIXES = ["/admin", "/api", "/academy/admin", "/_next"];
  const isPublic = (path: string) => !SKIP_PREFIXES.some((p) => path.startsWith(p));

  const allViews30 = (views30d ?? []).filter((v) => isPublic(v.path));
  const allViewsAll = (viewsAll ?? []).filter((v) => isPublic(v.path));

  // Total views
  const totalViews = allViews30.length;

  // Top pages (last 30 days)
  const pageCounts: Record<string, number> = {};
  for (const v of allViews30) {
    pageCounts[v.path] = (pageCounts[v.path] ?? 0) + 1;
  }
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  // Top referrers (last 30 days)
  const refCounts: Record<string, number> = {};
  for (const v of allViews30) {
    if (!v.referrer) continue;
    try {
      const domain = new URL(v.referrer).hostname.replace("www.", "");
      refCounts[domain] = (refCounts[domain] ?? 0) + 1;
    } catch {
      // malformed referrer
    }
  }
  const topReferrers = Object.entries(refCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([domain, count]) => ({ domain, count }));

  // Daily views (last 30 days)
  const days = last30Days();
  const dailyMap: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
  for (const v of allViews30) {
    const day = (v.created_at ?? "").slice(0, 10);
    if (day in dailyMap) dailyMap[day]++;
  }
  const dailyViews = days.map((d) => ({ day: d, count: dailyMap[d] }));

  // Monthly views (last 6 months)
  const months = last6Months();
  const monthlyMap: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]));
  for (const v of allViewsAll) {
    const mo = (v.created_at ?? "").slice(0, 7);
    if (mo in monthlyMap) monthlyMap[mo]++;
  }
  const monthlyViews = months.map((m) => ({ month: m, count: monthlyMap[m] }));

  // Blog article views (last 30 days)
  const blogViews: { slug: string; title: string; count: number; published_at: string | null }[] = (blogPosts ?? []).map((post) => {
    const paths = [`/blog/${post.slug}`, `/blog/${post.slug}/`];
    const count = allViews30.filter((v) => paths.includes(v.path)).length;
    return { slug: post.slug, title: post.title, count, published_at: post.published_at };
  }).sort((a, b) => b.count - a.count);

  // Unique paths count
  const uniquePaths = new Set(allViews30.map((v) => v.path)).size;

  // Event counts (last 30 days)
  const events30 = eventsData ?? [];
  const eventCounts: Record<string, number> = {};
  for (const e of events30) {
    eventCounts[e.event_name] = (eventCounts[e.event_name] ?? 0) + 1;
  }

  // UTM attribution from page_views
  const utmSourceCounts: Record<string, number> = {};
  const utmCampaignCounts: Record<string, number> = {};
  for (const v of allViews30) {
    if (v.utm_source) utmSourceCounts[v.utm_source] = (utmSourceCounts[v.utm_source] ?? 0) + 1;
    if (v.utm_campaign) utmCampaignCounts[v.utm_campaign] = (utmCampaignCounts[v.utm_campaign] ?? 0) + 1;
  }
  const topUtmSources = Object.entries(utmSourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([source, count]) => ({ source, count }));
  const topUtmCampaigns = Object.entries(utmCampaignCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([campaign, count]) => ({ campaign, count }));

  const agendarClicks = eventCounts["agendar_click"] ?? 0;
  const bookings = eventCounts["booking_confirmed"] ?? 0;
  const whatsappClicks = eventCounts["whatsapp_click"] ?? 0;
  const funnel = {
    visits: totalViews,
    agendarClicks,
    bookings,
    whatsappClicks,
    conversionRate: totalViews > 0 ? Math.round((bookings / totalViews) * 10000) / 100 : 0,
  };

  return NextResponse.json({
    totalViews,
    uniquePaths,
    dailyViews,
    monthlyViews,
    topPages,
    topReferrers,
    blogViews,
    eventCounts,
    topUtmSources,
    topUtmCampaigns,
    funnel,
  });
}
