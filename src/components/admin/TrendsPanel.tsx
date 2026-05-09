"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import AcademyCard from "@/components/academy/AcademyCard";
import { TrendingUp, Search, Lightbulb, RefreshCw, ArrowUpRight, CheckCircle, XCircle } from "lucide-react";

type Tab = "ideas" | "trends" | "gsc";
type Geo = "ES" | "US" | "MX" | "CL" | "ALL";

interface ContentIdea {
  id: string;
  seed_keyword: string;
  geo: string;
  source: "trends" | "gsc" | "manual";
  opportunity_score: number;
  status: string;
  source_ref: Record<string, unknown>;
}

interface TrendItem {
  keyword: string;
  geo: string;
  interest_score: number | null;
  rising: boolean;
  source: string;
  seed_keyword?: string | null;
  captured_at?: string;
}

interface GscRow {
  query: string;
  country: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface Kpis {
  newIdeas: number;
  striking: number;
  rising: number;
  totalClicks28d: number;
}

interface LastRun {
  run_at: string;
  duration_ms: number;
  trends_inserted: number;
  gsc_inserted: number;
  ideas_inserted: number;
  errors: string[] | null;
}

interface ApiData {
  topTrends: TrendItem[];
  risingQueries: TrendItem[];
  gscTopQueries: GscRow[];
  gscStriking: GscRow[];
  contentIdeas: ContentIdea[];
  lastRun: LastRun | null;
  kpis: Kpis;
}

const GEO_OPTIONS: { value: Geo; label: string }[] = [
  { value: "ES", label: "🇪🇸 España" },
  { value: "US", label: "🇺🇸 Estados Unidos (es)" },
  { value: "MX", label: "🇲🇽 México" },
  { value: "CL", label: "🇨🇱 Chile" },
  { value: "ALL", label: "🌎 Todos LATAM" },
];

function KpiCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub: string }) {
  return (
    <div className="relative bg-[#16213e] border border-white/5 p-5 overflow-hidden">
      <ScrollworkCorners size={36} opacity={0.7} />
      <Icon className="w-4 h-4 text-[#C5A059] mb-3" />
      <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className="font-cinzel text-2xl text-white mb-1">{value}</p>
      <p className="font-crimson text-xs text-gray-600">{sub}</p>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  if (source === "trends") return (
    <span className="inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
      Trends
    </span>
  );
  if (source === "gsc") return (
    <span className="inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      GSC
    </span>
  );
  return (
    <span className="inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest bg-white/5 text-gray-400 border border-white/10">
      Manual
    </span>
  );
}

export default function TrendsPanel() {
  const router = useRouter();
  const [geo, setGeo] = useState<Geo>("ES");
  const [tab, setTab] = useState<Tab>("ideas");
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const fetchData = useCallback(async (currentGeo: Geo, currentTab: Tab) => {
    try {
      const res = await fetch(`/api/admin/trends?geo=${currentGeo}&tab=${currentTab}`);
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData(geo, tab).finally(() => setLoading(false));
  }, [geo, tab, fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/cron/sync-trends", { method: "GET", headers: { "x-cron-secret": "" } });
    } catch {
      // trigger will fail without secret — just refetch display data
    }
    await fetchData(geo, tab);
    setRefreshing(false);
  };

  const handleCreateArticle = async (idea: ContentIdea) => {
    await fetch(`/api/admin/trends/ideas/${idea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "drafting" }),
    }).catch(() => {});
    const params = new URLSearchParams({
      from: "trend",
      keyword: idea.seed_keyword,
      geo: idea.geo,
      idea: idea.id,
    });
    router.push(`/academy/admin/blog/nuevo?${params}`);
  };

  const handleReject = async (idea: ContentIdea) => {
    setRejectingId(idea.id);
    await fetch(`/api/admin/trends/ideas/${idea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    }).catch(() => {});
    setData((prev) =>
      prev ? { ...prev, contentIdeas: prev.contentIdeas.filter((i) => i.id !== idea.id) } : prev
    );
    setRejectingId(null);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const kpis = data?.kpis;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">
            Inteligencia de contenido
          </p>
          <h1 className="font-cinzel text-2xl text-white pt-8">Tendencias</h1>
          {data?.lastRun && (
            <p className="font-cinzel text-[9px] text-gray-600 mt-1 uppercase tracking-widest">
              Última sincronización: {formatDate(data.lastRun.run_at)}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/20 font-cinzel text-[9px] uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refrescar
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={Lightbulb} label="Ideas nuevas" value={kpis ? String(kpis.newIdeas) : "—"} sub="Ideas de contenido activas" />
        <KpiCard icon={Search} label="Striking distance" value={kpis ? String(kpis.striking) : "—"} sub="Queries pos. 8–30 GSC" />
        <KpiCard icon={TrendingUp} label="Tendencias subiendo" value={kpis ? String(kpis.rising) : "—"} sub="Rising queries 7 días" />
        <KpiCard icon={ArrowUpRight} label="Clicks 28 días" value={kpis ? String(kpis.totalClicks28d) : "—"} sub="Clicks orgánicos totales" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={geo}
          onChange={(e) => setGeo(e.target.value as Geo)}
          className="bg-[#16213e] border border-[#C5A059]/15 text-white text-xs font-cinzel px-3 py-2 outline-none focus:border-[#C5A059]/40 transition"
        >
          {GEO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          {(["ideas", "trends", "gsc"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 font-cinzel text-[9px] uppercase tracking-widest transition-colors border ${
                tab === t
                  ? "bg-[#C5A059]/15 text-[#C5A059] border-[#C5A059]/30"
                  : "text-gray-500 border-white/5 hover:text-[#C5A059] hover:bg-[#C5A059]/5"
              }`}
            >
              {t === "ideas" ? "Ideas" : t === "trends" ? "Tendencias" : "GSC"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-5 h-5 text-[#C5A059] animate-spin" />
        </div>
      ) : (
        <>
          {/* IDEAS TAB */}
          {tab === "ideas" && (
            <AcademyCard>
              <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-2">
                Ideas de contenido
              </h2>
              <p className="font-crimson text-sm text-gray-600 mb-6">
                Ordenadas por oportunidad. Basadas en tendencias subiendo y queries con striking distance en GSC.
              </p>
              {data?.contentIdeas.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-crimson text-gray-600">No hay ideas nuevas. Ejecuta una sincronización para cargar datos.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {["Keyword", "Geo", "Fuente", "Score", "Acciones"].map((h) => (
                          <th key={h} className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4 last:pr-0">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data?.contentIdeas.map((idea) => (
                        <tr key={idea.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                          <td className="py-3 pr-4">
                            <p className="font-crimson text-sm text-gray-200">{idea.seed_keyword}</p>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="font-cinzel text-[9px] text-gray-500 uppercase">{idea.geo}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <SourceBadge source={idea.source} />
                          </td>
                          <td className="py-3 pr-4">
                            <span className="font-cinzel text-[10px] text-[#C5A059]">
                              {Math.round(idea.opportunity_score)}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCreateArticle(idea)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C5A059] hover:bg-[#d4b06a] text-[#020617] font-cinzel text-[8px] uppercase tracking-widest transition-colors"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Crear artículo
                              </button>
                              <button
                                onClick={() => handleReject(idea)}
                                disabled={rejectingId === idea.id}
                                className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:text-red-400 font-cinzel text-[8px] uppercase tracking-widest transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AcademyCard>
          )}

          {/* TRENDS TAB */}
          {tab === "trends" && (
            <div className="space-y-6">
              <AcademyCard>
                <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-2">
                  Top tendencias — {geo}
                </h2>
                <p className="font-crimson text-sm text-gray-600 mb-6">Últimos 7 días.</p>
                {data?.topTrends.length === 0 ? (
                  <p className="font-crimson text-gray-600 text-sm py-8 text-center">Sin datos. Ejecuta una sincronización.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          {["Keyword", "Fuente", "Score", "Rising"].map((h) => (
                            <th key={h} className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data?.topTrends.map((t, i) => (
                          <tr key={`${t.keyword}${i}`} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                            <td className="py-3 pr-4"><p className="font-crimson text-sm text-gray-200">{t.keyword}</p></td>
                            <td className="py-3 pr-4"><span className="font-cinzel text-[9px] text-gray-500 uppercase">{t.source.replace("_", " ")}</span></td>
                            <td className="py-3 pr-4">
                              <span className="font-cinzel text-[10px] text-[#C5A059]">{t.interest_score ?? "—"}</span>
                            </td>
                            <td className="py-3">
                              {t.rising ? (
                                <span className="inline-flex items-center gap-1 font-cinzel text-[8px] uppercase tracking-widest text-emerald-400">
                                  <TrendingUp className="w-3 h-3" /> Rising
                                </span>
                              ) : <span className="font-cinzel text-[9px] text-gray-600">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </AcademyCard>

              {(data?.risingQueries.length ?? 0) > 0 && (
                <AcademyCard>
                  <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-2">Queries relacionadas en auge</h2>
                  <p className="font-crimson text-sm text-gray-600 mb-6">Related queries con tendencia "Rising" en los últimos 7 días.</p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          {["Keyword", "Seed", "Score"].map((h) => (
                            <th key={h} className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data?.risingQueries.map((t, i) => (
                          <tr key={`${t.keyword}${i}`} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                            <td className="py-3 pr-4"><p className="font-crimson text-sm text-gray-200">{t.keyword}</p></td>
                            <td className="py-3 pr-4"><span className="font-cinzel text-[9px] text-gray-500">{t.seed_keyword ?? "—"}</span></td>
                            <td className="py-3"><span className="font-cinzel text-[10px] text-[#C5A059]">{t.interest_score ?? "—"}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AcademyCard>
              )}
            </div>
          )}

          {/* GSC TAB */}
          {tab === "gsc" && (
            <div className="space-y-6">
              <AcademyCard>
                <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-2">
                  Striking distance
                </h2>
                <p className="font-crimson text-sm text-gray-600 mb-6">
                  Queries con posición 8–30 e impresiones ≥ 30. Mayor oportunidad de mejora con contenido enfocado.
                </p>
                {data?.gscStriking.length === 0 ? (
                  <p className="font-crimson text-gray-600 text-sm py-8 text-center">Sin datos de GSC. Configura el Service Account para activar Search Console.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          {["Query", "País", "Impresiones", "Posición", "Clics", "CTR"].map((h) => (
                            <th key={h} className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data?.gscStriking.map((r, i) => (
                          <tr key={`${r.query}${i}`} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                            <td className="py-3 pr-4 max-w-[220px]"><p className="font-crimson text-sm text-gray-200 truncate">{r.query}</p></td>
                            <td className="py-3 pr-4"><span className="font-cinzel text-[9px] text-gray-500 uppercase">{r.country}</span></td>
                            <td className="py-3 pr-4"><span className="font-cinzel text-[10px] text-white">{r.impressions}</span></td>
                            <td className="py-3 pr-4">
                              <span className="font-cinzel text-[10px] text-amber-400">{r.position.toFixed(1)}</span>
                            </td>
                            <td className="py-3 pr-4"><span className="font-cinzel text-[10px] text-[#C5A059]">{r.clicks}</span></td>
                            <td className="py-3"><span className="font-cinzel text-[9px] text-gray-500">{(r.ctr * 100).toFixed(1)}%</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </AcademyCard>

              <AcademyCard>
                <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-2">
                  Top queries por clics
                </h2>
                <p className="font-crimson text-sm text-gray-600 mb-6">Últimos 30 días.</p>
                {data?.gscTopQueries.length === 0 ? (
                  <p className="font-crimson text-gray-600 text-sm py-8 text-center">Sin datos de GSC.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          {["Query", "País", "Clics", "Impresiones", "Posición"].map((h) => (
                            <th key={h} className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data?.gscTopQueries.slice(0, 25).map((r, i) => (
                          <tr key={`${r.query}${i}`} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                            <td className="py-3 pr-4 max-w-[220px]"><p className="font-crimson text-sm text-gray-200 truncate">{r.query}</p></td>
                            <td className="py-3 pr-4"><span className="font-cinzel text-[9px] text-gray-500 uppercase">{r.country}</span></td>
                            <td className="py-3 pr-4"><span className="font-cinzel text-[10px] text-[#C5A059]">{r.clicks}</span></td>
                            <td className="py-3 pr-4"><span className="font-cinzel text-[10px] text-white">{r.impressions}</span></td>
                            <td className="py-3"><span className="font-cinzel text-[10px] text-gray-400">{r.position.toFixed(1)}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </AcademyCard>
            </div>
          )}
        </>
      )}

      {/* Last run errors */}
      {data?.lastRun?.errors && data.lastRun.errors.length > 0 && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20">
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-red-400 mb-2">Errores en última sincronización</p>
          <ul className="space-y-1">
            {data.lastRun.errors.map((e, i) => (
              <li key={i} className="font-crimson text-xs text-red-300">{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
