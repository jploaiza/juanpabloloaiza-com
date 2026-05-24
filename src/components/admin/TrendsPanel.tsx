"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import AcademyCard from "@/components/academy/AcademyCard";
import { TrendingUp, Search, Lightbulb, RefreshCw, ArrowUpRight, CheckCircle, XCircle, Plus, X, ChevronDown, ChevronUp, ExternalLink, Bookmark, FileText, Copy, Check, Download } from "lucide-react";

type Tab = "ideas" | "trends" | "gsc" | "saved";
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

interface GlobalTrend {
  keyword: string;
  interest_score: number;
  geo: string;
  rising: boolean;
}

interface TrendReport {
  keywords_principales: string[];
  keywords_lsi: string[];
  intencion_busqueda: string;
  foco_trvp: string;
  angulo_principal: string;
  angulos_secundarios: string[];
  oportunidad_seo: string;
  titulo_sugerido: string;
  meta_description: string;
  tags: string[];
  resumen_estrategico: string;
}

interface SavedItem {
  id: string;
  type: "trend" | "angle";
  keyword: string;
  geo: string;
  title: string;
  data: Record<string, unknown> | null;
  status: string;
  created_at: string;
}

interface TimelinePoint {
  date: string;
  score: number;
}

interface KeywordTimeline {
  keyword: string;
  points: TimelinePoint[];
}

interface TopByGeoItem {
  keyword: string;
  geo: string;
  interest_score: number;
  seed_keyword: string | null;
  rising: boolean;
}

interface ApiData {
  topTrends: TrendItem[];
  risingQueries: TrendItem[];
  gscTopQueries: GscRow[];
  gscStriking: GscRow[];
  contentIdeas: ContentIdea[];
  lastRun: LastRun | null;
  kpis: Kpis;
  globalTrends?: GlobalTrend[];
  interestTimeline?: KeywordTimeline[];
  topByGeo?: TopByGeoItem[];
}

type SeedCategory = "spiritual" | "clinical" | "world";

interface Seed {
  id: string;
  keyword: string;
  active: boolean;
  category: SeedCategory;
  created_at: string;
}

type SeedsGrouped = Record<SeedCategory, Seed[]>;

const GEO_OPTIONS: { value: Geo; label: string }[] = [
  { value: "ES", label: "🇪🇸 España" },
  { value: "US", label: "🇺🇸 Estados Unidos (es)" },
  { value: "MX", label: "🇲🇽 México" },
  { value: "CL", label: "🇨🇱 Chile" },
  { value: "ALL", label: "🌎 Todos LATAM" },
];

function Sparkline({ points, width = 80, height = 28 }: { points: TimelinePoint[]; width?: number; height?: number }) {
  if (points.length < 2) return null;
  const scores = points.map((p) => p.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const toY = (s: number) => height - ((s - min) / range) * height;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${toY(p.score).toFixed(1)}`)
    .join(" ");
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const trending = last.score >= prev.score;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={d} fill="none" stroke={trending ? "#34d399" : "#f87171"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(points.length - 1) * step} cy={toY(last.score)} r="2.5" fill={trending ? "#34d399" : "#f87171"} />
    </svg>
  );
}

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
  const [geo, setGeo] = useState<Geo>("ALL");
  const [tab, setTab] = useState<Tab>("ideas");
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ ideas: number; seeds: number } | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [seedsGrouped, setSeedsGrouped] = useState<SeedsGrouped>({ spiritual: [], clinical: [], world: [] });
  const [seedInput, setSeedInput] = useState("");
  const [seedCategory, setSeedCategory] = useState<SeedCategory>("spiritual");
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedsMgmtLoading, setSeedsMgmtLoading] = useState<string | null>(null);
  const [seedsExpanded, setSeedsExpanded] = useState(true);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportData, setReportData] = useState<TrendReport | null>(null);
  const [reportKeyword, setReportKeyword] = useState("");
  const [reportGeo, setReportGeo] = useState("");
  const [reportError, setReportError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchData = useCallback(async (currentGeo: Geo, currentTab: Tab) => {
    if (currentTab === "saved") return;
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

  const fetchSaved = useCallback(() => {
    fetch("/api/admin/trends/saved")
      .then((r) => r.json())
      .then((j) => setSavedItems(j.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "saved") fetchSaved();
  }, [tab, fetchSaved]);

  const fetchSeeds = useCallback(() => {
    fetch("/api/admin/trends/seeds")
      .then((r) => r.json())
      .then((j) => setSeedsGrouped(j.seeds ?? { spiritual: [], clinical: [], world: [] }))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchSeeds(); }, [fetchSeeds]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshError(null);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/trends/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geo }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRefreshError(json.error ?? "Error al recalcular ideas");
      } else {
        setSyncResult({ ideas: json.ideas_inserted ?? 0, seeds: json.seeds_fetched ?? 0 });
      }
    } catch {
      setRefreshError("Error de conexión al recalcular ideas.");
    }
    await fetchData(geo, tab === "saved" ? "ideas" : tab);
    if (tab === "saved") fetchSaved();
    setRefreshing(false);
  };


  const handleAddSeed = async () => {
    const kw = seedInput.trim().toLowerCase();
    if (!kw || kw.length < 2) return;
    setSeedLoading(true);
    try {
      const res = await fetch("/api/admin/trends/seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw, category: seedCategory }),
      });
      if (res.ok) {
        setSeedInput("");
        fetchSeeds();
      }
    } catch { /* ignore */ }
    setSeedLoading(false);
  };

  const handleDeleteSeed = async (id: string, cat: SeedCategory) => {
    await fetch(`/api/admin/trends/seeds/${id}`, { method: "DELETE" }).catch(() => {});
    setSeedsGrouped((prev) => ({ ...prev, [cat]: prev[cat].filter((s) => s.id !== id) }));
  };

  const handleClearCategory = async (cat: SeedCategory | "all") => {
    setSeedsMgmtLoading(`clear-${cat}`);
    await fetch(`/api/admin/trends/seeds?action=clear&category=${cat}`, { method: "DELETE" }).catch(() => {});
    await fetchSeeds();
    setSeedsMgmtLoading(null);
  };

  const handleRestoreCategory = async (cat: SeedCategory | "all") => {
    setSeedsMgmtLoading(`restore-${cat}`);
    await fetch(`/api/admin/trends/seeds?action=restore&category=${cat}`, { method: "POST" }).catch(() => {});
    await fetchSeeds();
    setSeedsMgmtLoading(null);
  };

  const handleReject = async (idea: ContentIdea) => {
    setRejectingId(idea.id);
    setRejectError(null);
    try {
      const res = await fetch(`/api/admin/trends/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setRejectError(json.error ?? "No se pudo rechazar la idea.");
        setRejectingId(null);
        return;
      }
    } catch {
      setRejectError("Error de conexión al rechazar.");
      setRejectingId(null);
      return;
    }
    setData((prev) =>
      prev ? { ...prev, contentIdeas: prev.contentIdeas.filter((i) => i.id !== idea.id) } : prev
    );
    setRejectingId(null);
  };

  const handleSaveTrend = async (keyword: string, geoVal: string) => {
    const key = `${keyword}::${geoVal}`;
    setSavingId(key);
    await fetch("/api/admin/trends/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "trend", keyword, geo: geoVal, title: keyword }),
    }).catch(() => {});
    setSavingId(null);
  };

  const handleRemoveSaved = async (id: string) => {
    setRemovingId(id);
    await fetch(`/api/admin/trends/saved/${id}`, { method: "DELETE" }).catch(() => {});
    setSavedItems((prev) => prev.filter((i) => i.id !== id));
    setRemovingId(null);
  };

  const handleGenerateReport = async (idea: ContentIdea) => {
    setReportKeyword(idea.seed_keyword);
    setReportGeo(idea.geo || geo);
    setReportError("");
    setReportData(null);
    setReportModalOpen(true);
    setReportGenerating(true);
    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trend-report",
          input: JSON.stringify({
            keyword: idea.seed_keyword,
            geo: idea.geo || geo,
            source: idea.source,
            opportunity_score: idea.opportunity_score,
          }),
        }),
      });
      const d = await res.json();
      if (!res.ok) setReportError(d.error ?? "Error al generar informe.");
      else setReportData(d as TrendReport);
    } catch {
      setReportError("Error de conexión.");
    } finally {
      setReportGenerating(false);
    }
  };

  const downloadReportMd = (report: TrendReport, keyword: string, geoVal: string) => {
    const slug = keyword.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const md = `---
keyword: "${keyword}"
geo: "${geoVal}"
generated_at: "${new Date().toISOString().slice(0, 10)}"
titulo_sugerido: "${report.titulo_sugerido}"
meta_description: "${report.meta_description}"
tags: [${report.tags.map((t) => `"${t}"`).join(", ")}]
oportunidad_seo: "${report.oportunidad_seo}"
intencion_busqueda: "${report.intencion_busqueda}"
---

# Informe de tendencia: ${keyword}

## Resumen estratégico

${report.resumen_estrategico}

## Keywords principales

${report.keywords_principales.map((k) => `- ${k}`).join("\n")}

## Keywords LSI / semánticas

${report.keywords_lsi.map((k) => `- ${k}`).join("\n")}

## Foco TRVP

${report.foco_trvp}

## Ángulo principal

**${report.angulo_principal}**

## Ángulos alternativos

${report.angulos_secundarios.map((a, i) => `${i + 1}. ${a}`).join("\n")}

## SEO

**Título sugerido:** ${report.titulo_sugerido}

**Meta description:** ${report.meta_description}

## Tags recomendados

${report.tags.map((t) => `\`${t}\``).join(" · ")}
`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `informe-tendencia-${slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyField = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
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
          <p className="font-cinzel text-[9px] text-gray-600 mt-1 uppercase tracking-widest">
            {data?.lastRun
              ? `Última sincronización: ${formatDate(data.lastRun.run_at)}`
              : data
              ? "Sin sincronización — ejecuta una para cargar datos"
              : ""}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Recalcula las ideas desde los datos ya guardados. Los datos de Google Trends se actualizan automáticamente cada semana."
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/20 font-cinzel text-[9px] uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Recalcular ideas
        </button>
      </div>

      {/* Inline banners */}
      {refreshError && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 font-crimson text-sm text-red-300">
          {refreshError}
        </div>
      )}
      {syncResult && !refreshing && (
        <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 font-crimson text-sm text-emerald-300 flex items-center justify-between">
          <span>
            {syncResult.seeds > 0
              ? `${syncResult.seeds} semilla${syncResult.seeds > 1 ? "s" : ""} consultada${syncResult.seeds > 1 ? "s" : ""} en Google Trends · `
              : ""}
            {syncResult.ideas} ideas recalculadas.
            {syncResult.seeds === 0 && " (Sin semillas nuevas — los datos ya estaban actualizados.)"}
          </span>
          <button onClick={() => setSyncResult(null)} className="ml-4 text-emerald-500 hover:text-emerald-300 transition">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {rejectError && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 font-crimson text-sm text-red-300">
          {rejectError}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={Lightbulb} label="Ideas nuevas" value={kpis ? String(kpis.newIdeas) : "—"} sub="Ideas de contenido activas" />
        <KpiCard icon={Search} label="Striking distance" value={kpis ? String(kpis.striking) : "—"} sub="Queries pos. 8–30 GSC" />
        <KpiCard icon={TrendingUp} label="Tendencias subiendo" value={kpis ? String(kpis.rising) : "—"} sub="Rising queries 7 días" />
        <KpiCard icon={ArrowUpRight} label="Clicks 28 días" value={kpis ? String(kpis.totalClicks28d) : "—"} sub="Clicks orgánicos totales" />
      </div>

      {/* Seeds Management */}
      {(() => {
        const totalSeeds = Object.values(seedsGrouped).reduce((s, arr) => s + arr.length, 0);
        const CATS: { key: SeedCategory; label: string; icon: string }[] = [
          { key: "spiritual", label: "Espiritual", icon: "🔮" },
          { key: "clinical", label: "Clínica", icon: "🏥" },
          { key: "world", label: "Mundo actual", icon: "🌍" },
        ];
        const mgmtBtn = (label: string, loadKey: string, onClick: () => void, variant: "red" | "gold" = "gold") => (
          <button
            onClick={onClick}
            disabled={seedsMgmtLoading === loadKey}
            className={`font-cinzel text-[8px] uppercase tracking-widest px-2 py-1 border transition disabled:opacity-40 ${
              variant === "red"
                ? "text-red-400 border-red-400/20 hover:bg-red-400/10"
                : "text-[#C5A059] border-[#C5A059]/20 hover:bg-[#C5A059]/10"
            }`}
          >
            {seedsMgmtLoading === loadKey ? "…" : label}
          </button>
        );
        return (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setSeedsExpanded((v) => !v)}
                className="flex items-center gap-2 font-cinzel text-[9px] uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition"
              >
                {seedsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                Semillas de búsqueda ({totalSeeds} términos)
              </button>
              {seedsExpanded && (
                <div className="flex gap-1.5">
                  {mgmtBtn("Restaurar todo", "restore-all", () => handleRestoreCategory("all"), "gold")}
                  {mgmtBtn("Eliminar todo", "clear-all", () => handleClearCategory("all"), "red")}
                </div>
              )}
            </div>

            {seedsExpanded && (
              <div className="bg-[#0a1628] border border-white/5 p-4 space-y-5">
                {CATS.map(({ key, label, icon }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500">
                        {icon} {label} ({seedsGrouped[key].length})
                      </span>
                      <div className="flex gap-1.5">
                        {mgmtBtn("Restaurar", `restore-${key}`, () => handleRestoreCategory(key), "gold")}
                        {mgmtBtn("Eliminar", `clear-${key}`, () => handleClearCategory(key), "red")}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {seedsGrouped[key].map((s) => (
                        <div key={s.id} className="flex items-center gap-1 bg-white/[0.03] border border-white/5 px-2 py-1">
                          <span className="font-crimson text-xs text-gray-400">{s.keyword}</span>
                          <button onClick={() => handleDeleteSeed(s.id, key)} className="text-gray-600 hover:text-red-400 transition ml-1">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                      {seedsGrouped[key].length === 0 && (
                        <span className="font-crimson text-xs text-gray-600 italic">Sin términos. Usa «Restaurar» para volver a los defaults.</span>
                      )}
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t border-white/5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={seedInput}
                      onChange={(e) => setSeedInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddSeed()}
                      placeholder="Agregar término…"
                      className="flex-1 bg-[#16213e] border border-white/10 text-sm font-crimson text-white px-3 py-2 placeholder-gray-600 focus:outline-none focus:border-[#C5A059]/40"
                    />
                    <select
                      value={seedCategory}
                      onChange={(e) => setSeedCategory(e.target.value as SeedCategory)}
                      className="bg-[#16213e] border border-white/10 text-xs font-cinzel text-gray-400 px-2 py-2 outline-none focus:border-[#C5A059]/40"
                    >
                      {CATS.map(({ key, label, icon }) => (
                        <option key={key} value={key}>{icon} {label}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddSeed}
                      disabled={seedLoading || seedInput.trim().length < 2}
                      className="flex items-center gap-1.5 px-4 py-2 font-cinzel text-[9px] uppercase tracking-widest bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 hover:bg-[#C5A059]/20 transition disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" /> Agregar
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-crimson text-xs text-gray-600">
                    Los términos se usan en la sincronización semanal automática de Google Trends.
                    Al agregar un término nuevo, usa el botón <strong className="text-[#C5A059]">Recalcular ideas</strong> arriba para consultarlo en Google Trends ahora.
                  </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
          {(["ideas", "trends", "gsc", "saved"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-2 font-cinzel text-[9px] uppercase tracking-widest transition-colors border ${
                tab === t
                  ? "bg-[#C5A059]/15 text-[#C5A059] border-[#C5A059]/30"
                  : "text-gray-500 border-white/5 hover:text-[#C5A059] hover:bg-[#C5A059]/5"
              }`}
            >
              {t === "ideas" ? "Ideas" : t === "trends" ? "Tendencias" : t === "gsc" ? "GSC" : "Guardadas"}
              {t === "saved" && savedItems.length > 0 && tab !== "saved" && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 bg-[#C5A059] text-[#020617] font-cinzel text-[7px] rounded-full">
                  {savedItems.length > 9 ? "9+" : savedItems.length}
                </span>
              )}
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
            <>
            {/* Top searched terms for the selected geo */}
            {(data?.topByGeo?.length ?? 0) > 0 && (
              <AcademyCard>
                <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-1">
                  Lo más buscado {geo === "ALL" ? "— todas las regiones" : `— ${geo}`}
                </h2>
                <p className="font-crimson text-sm text-gray-600 mb-5">
                  Términos con mayor volumen de búsqueda en Google Trends relacionados a tus semillas. Crea contenido sobre ellos para captar tráfico real.
                </p>
                <div className="flex flex-wrap gap-2">
                  {data?.topByGeo?.map((t, i) => (
                    <div key={`${t.keyword}${i}`} className="flex items-center gap-0 bg-[#16213e] border border-[#C5A059]/15 hover:border-[#C5A059]/30 transition">
                      <Link
                        href={`/academy/admin/trends/term?q=${encodeURIComponent(t.keyword)}&geo=${encodeURIComponent(t.geo || geo)}`}
                        className="group flex items-center gap-1.5 px-3 py-1.5"
                        title="Ver ángulos de contenido"
                      >
                        {t.rising && <TrendingUp className="w-2.5 h-2.5 text-emerald-400 shrink-0" />}
                        <span className="font-crimson text-sm text-[#C5A059] group-hover:text-[#d4b575]">{t.keyword}</span>
                        <span className="font-cinzel text-[7px] text-gray-600 ml-1">{t.interest_score}</span>
                      </Link>
                      <button
                        onClick={() => handleGenerateReport({ id: `${t.keyword}::${t.geo}`, seed_keyword: t.keyword, geo: t.geo || geo, source: "trends", opportunity_score: t.interest_score ?? 0, status: "new", source_ref: {} })}
                        title="Informe IA"
                        className="flex items-center px-2 py-1.5 border-l border-[#C5A059]/10 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </AcademyCard>
            )}
            <AcademyCard>
              <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-2">
                Ideas de contenido
              </h2>
              <p className="font-crimson text-sm text-gray-600 mb-1">
                Ordenadas por oportunidad. Basadas en tendencias subiendo y queries con striking distance en GSC.
              </p>
              <p className="font-crimson text-xs text-gray-700 mb-6">
                <span className="text-[#C5A059]">Score</span> = volumen relativo en Google Trends (0–100) + 50 si la tendencia está subiendo. Máximo 150.
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
                          <td className="py-3 pr-4 max-w-[200px]">
                            <Link
                              href={`/academy/admin/trends/term?q=${encodeURIComponent(idea.seed_keyword)}&geo=${encodeURIComponent(idea.geo || geo)}`}
                              className="group flex items-center gap-1 font-crimson text-sm text-[#C5A059] hover:text-[#d4b575] transition truncate"
                            >
                              <span className="underline underline-offset-2 decoration-[#C5A059]/40 truncate">{idea.seed_keyword}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 opacity-50 group-hover:opacity-100 transition" />
                            </Link>
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
                                onClick={() => handleGenerateReport(idea)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 font-cinzel text-[8px] uppercase tracking-widest transition-colors"
                              >
                                <FileText className="w-3 h-3" />
                                Informe IA
                              </button>
                              <button
                                onClick={() => handleSaveTrend(idea.seed_keyword, idea.geo || geo)}
                                disabled={savingId === `${idea.seed_keyword}::${idea.geo || geo}`}
                                title="Guardar para después"
                                className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:text-[#C5A059] font-cinzel text-[8px] uppercase tracking-widest transition-colors disabled:opacity-50"
                              >
                                <Bookmark className="w-3 h-3" />
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
            </>
          )}

          {/* TRENDS TAB */}
          {tab === "trends" && (
            <div className="space-y-6">
              {(data?.globalTrends?.length ?? 0) > 0 && (
                <AcademyCard>
                  <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-2">🌐 Top 10 Global</h2>
                  <p className="font-crimson text-sm text-gray-600 mb-6">Lo más buscado en todas las geos — independiente de tus semillas. Úsalos para hablar de temas de actualidad desde la espiritualidad.</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {data?.globalTrends?.map((t, i) => (
                      <div key={`${t.keyword}${i}`} className="relative group">
                        <Link
                          href={`/academy/admin/trends/term?q=${encodeURIComponent(t.keyword)}&geo=${encodeURIComponent(t.geo)}`}
                          className="group flex flex-col gap-1 bg-[#16213e] border border-white/5 hover:border-[#C5A059]/30 p-3 transition"
                        >
                          <span className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600"># {i + 1}</span>
                          <span className="font-crimson text-sm text-[#C5A059] group-hover:text-[#d4b575] underline underline-offset-2 decoration-[#C5A059]/40 line-clamp-2">{t.keyword}</span>
                          <span className="font-cinzel text-[8px] text-gray-600">{t.interest_score} pts · {t.geo}</span>
                        </Link>
                        <button
                          onClick={() => handleSaveTrend(t.keyword, t.geo)}
                          disabled={savingId === `${t.keyword}::${t.geo}`}
                          className="absolute top-2 right-2 text-gray-600 hover:text-[#C5A059] transition opacity-0 group-hover:opacity-100"
                          title="Guardar para después"
                        >
                          <Bookmark className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </AcademyCard>
              )}
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
                          {["Keyword", "Fuente", "Score", "Rising", "Acciones"].map((h) => (
                            <th key={h} className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4 last:pr-0">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data?.topTrends.map((t, i) => (
                          <tr key={`${t.keyword}${i}`} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                            <td className="py-3 pr-4 max-w-[200px]">
                              <Link
                                href={`/academy/admin/trends/term?q=${encodeURIComponent(t.keyword)}&geo=${encodeURIComponent(t.geo || geo)}`}
                                className="group flex items-center gap-1 font-crimson text-sm text-[#C5A059] hover:text-[#d4b575] transition truncate"
                              >
                                <span className="underline underline-offset-2 decoration-[#C5A059]/40 truncate">{t.keyword}</span>
                                <ExternalLink className="w-3 h-3 shrink-0 opacity-50 group-hover:opacity-100 transition" />
                              </Link>
                            </td>
                            <td className="py-3 pr-4"><span className="font-cinzel text-[9px] text-gray-500 uppercase">{t.source.replace("_", " ")}</span></td>
                            <td className="py-3 pr-4">
                              <span className="font-cinzel text-[10px] text-[#C5A059]">{t.interest_score ?? "—"}</span>
                            </td>
                            <td className="py-3 pr-4">
                              {t.rising ? (
                                <span className="inline-flex items-center gap-1 font-cinzel text-[8px] uppercase tracking-widest text-emerald-400">
                                  <TrendingUp className="w-3 h-3" /> Rising
                                </span>
                              ) : <span className="font-cinzel text-[9px] text-gray-600">—</span>}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleGenerateReport({ id: `${t.keyword}::${t.geo}`, seed_keyword: t.keyword, geo: t.geo || geo, source: "trends", opportunity_score: t.interest_score ?? 0, status: "new", source_ref: {} })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 font-cinzel text-[8px] uppercase tracking-widest transition-colors"
                                >
                                  <FileText className="w-3 h-3" />
                                  Informe IA
                                </button>
                                <button
                                  onClick={() => handleSaveTrend(t.keyword, t.geo || geo)}
                                  disabled={savingId === `${t.keyword}::${t.geo || geo}`}
                                  title="Guardar para después"
                                  className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:text-[#C5A059] font-cinzel text-[8px] uppercase tracking-widest transition-colors disabled:opacity-50"
                                >
                                  <Bookmark className="w-3 h-3" />
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

              {(data?.interestTimeline?.length ?? 0) > 0 && (
                <AcademyCard>
                  <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-2">Interés histórico por seed</h2>
                  <p className="font-crimson text-sm text-gray-600 mb-6">Evolución semanal del interés (0–100) por keyword. Verde = subiendo, rojo = bajando.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data?.interestTimeline?.map((kw) => {
                      const last = kw.points[kw.points.length - 1];
                      const prev = kw.points[kw.points.length - 2];
                      const delta = last.score - prev.score;
                      return (
                        <div key={kw.keyword} className="flex items-center gap-3 bg-[#0a1628] border border-white/5 px-4 py-3">
                          <Sparkline points={kw.points} width={80} height={28} />
                          <div className="flex-1 min-w-0">
                            <p className="font-crimson text-sm text-gray-200 truncate">{kw.keyword}</p>
                            <p className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600 mt-0.5">
                              Score actual: <span className="text-[#C5A059]">{last.score}</span>
                              {delta !== 0 && (
                                <span className={delta > 0 ? " text-emerald-400" : " text-red-400"}>
                                  {" "}{delta > 0 ? "+" : ""}{delta}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AcademyCard>
              )}

              {(data?.risingQueries.length ?? 0) > 0 && (
                <AcademyCard>
                  <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-2">Queries relacionadas en auge</h2>
                  <p className="font-crimson text-sm text-gray-600 mb-6">Related queries con tendencia &quot;Rising&quot; en los últimos 7 días.</p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          {["Keyword", "Seed", "Score", "Acciones"].map((h) => (
                            <th key={h} className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4 last:pr-0">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data?.risingQueries.map((t, i) => (
                          <tr key={`${t.keyword}${i}`} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                            <td className="py-3 pr-4"><p className="font-crimson text-sm text-gray-200">{t.keyword}</p></td>
                            <td className="py-3 pr-4"><span className="font-cinzel text-[9px] text-gray-500">{t.seed_keyword ?? "—"}</span></td>
                            <td className="py-3 pr-4"><span className="font-cinzel text-[10px] text-[#C5A059]">{t.interest_score ?? "—"}</span></td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleGenerateReport({ id: `${t.keyword}::${t.geo}`, seed_keyword: t.keyword, geo: t.geo || geo, source: "trends", opportunity_score: t.interest_score ?? 0, status: "new", source_ref: {} })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 font-cinzel text-[8px] uppercase tracking-widest transition-colors"
                                >
                                  <FileText className="w-3 h-3" />
                                  Informe IA
                                </button>
                                <button
                                  onClick={() => handleSaveTrend(t.keyword, t.geo || geo)}
                                  disabled={savingId === `${t.keyword}::${t.geo || geo}`}
                                  title="Guardar para después"
                                  className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:text-[#C5A059] font-cinzel text-[8px] uppercase tracking-widest transition-colors disabled:opacity-50"
                                >
                                  <Bookmark className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AcademyCard>
              )}
            </div>
          )}

          {/* SAVED TAB */}
          {tab === "saved" && (
            <AcademyCard>
              <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-2">
                Guardadas para después
              </h2>
              <p className="font-crimson text-sm text-gray-600 mb-6">
                Términos y ángulos guardados. Haz clic en «Desarrollar →» cuando estés listo.
              </p>
              {savedItems.length === 0 ? (
                <div className="py-12 text-center">
                  <Bookmark className="w-6 h-6 text-gray-700 mx-auto mb-3" />
                  <p className="font-crimson text-gray-600">Sin elementos guardados. Usa el ícono 🔖 en Ideas o Tendencias.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-[#16213e] border border-white/5 px-4 py-3 hover:border-[#C5A059]/20 transition">
                      <div className="shrink-0">
                        <span className={`font-cinzel text-[8px] uppercase tracking-widest px-2 py-0.5 border ${
                          item.type === "trend"
                            ? "text-[#C5A059] border-[#C5A059]/20 bg-[#C5A059]/5"
                            : "text-violet-400 border-violet-400/20 bg-violet-400/5"
                        }`}>
                          {item.type === "trend" ? "Tendencia" : "Ángulo"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-crimson text-sm text-white truncate">{item.title}</p>
                        <p className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600 mt-0.5">{item.keyword} · {item.geo}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/academy/admin/trends/term?q=${encodeURIComponent(item.keyword)}&geo=${encodeURIComponent(item.geo)}${item.type === "angle" ? `&savedItem=${item.id}` : ""}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/20 font-cinzel text-[8px] uppercase tracking-widest transition-colors"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          Desarrollar
                        </Link>
                        <button
                          onClick={() => handleRemoveSaved(item.id)}
                          disabled={removingId === item.id}
                          className="p-1.5 text-gray-600 hover:text-red-400 transition disabled:opacity-50"
                          title="Eliminar"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AcademyCard>
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
                  <p className="font-crimson text-gray-600 text-sm py-8 text-center">Sin queries en striking distance aún. El sitio necesita más impresiones orgánicas (≥ 30) en posición 8–30 para que aparezcan datos aquí.</p>
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
                  <p className="font-crimson text-gray-600 text-sm py-8 text-center">Sin datos de clics aún. Los datos de Search Console aparecerán a medida que el sitio reciba tráfico orgánico.</p>
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

      {/* Trend Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm">
          <div className="relative bg-[#0a1628] border-l border-white/10 w-full max-w-2xl h-full overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0a1628] border-b border-white/10 px-6 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-cinzel text-[8px] uppercase tracking-widest text-violet-400 mb-0.5">Informe de tendencia</p>
                <h2 className="font-cinzel text-base text-white leading-tight">{reportKeyword}</h2>
                <p className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600 mt-0.5">{reportGeo}</p>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="shrink-0 p-2 text-gray-600 hover:text-white transition mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 px-6 py-6 space-y-6">
              {reportGenerating && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
                  <p className="font-cinzel text-[10px] uppercase tracking-widest text-gray-500">Analizando tendencia...</p>
                </div>
              )}
              {reportError && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 font-crimson text-sm text-red-300">
                  {reportError}
                </div>
              )}
              {reportData && (
                <>
                  {/* Resumen estratégico */}
                  <div className="bg-violet-500/5 border border-violet-500/20 px-5 py-4">
                    <p className="font-cinzel text-[9px] uppercase tracking-widest text-violet-400 mb-2">Resumen estratégico</p>
                    <p className="font-crimson text-sm text-gray-200 leading-relaxed">{reportData.resumen_estrategico}</p>
                  </div>

                  {/* Keywords */}
                  <div>
                    <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/80 mb-3">Keywords principales</p>
                    <div className="flex flex-wrap gap-2">
                      {reportData.keywords_principales.map((kw) => (
                        <span key={kw} className="px-3 py-1 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] font-cinzel text-[9px] uppercase tracking-widest">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-600 mb-3">Keywords LSI / semánticas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {reportData.keywords_lsi.map((kw) => (
                        <span key={kw} className="px-2.5 py-1 bg-white/[0.03] border border-white/10 text-gray-400 font-cinzel text-[8px] uppercase tracking-widest">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Intención + Oportunidad */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#16213e] border border-white/5 px-4 py-3">
                      <p className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600 mb-1.5">Intención de búsqueda</p>
                      <p className="font-crimson text-sm text-gray-200">{reportData.intencion_busqueda}</p>
                    </div>
                    <div className="bg-[#16213e] border border-white/5 px-4 py-3">
                      <p className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600 mb-1.5">Oportunidad SEO</p>
                      <p className="font-crimson text-sm text-gray-200">{reportData.oportunidad_seo}</p>
                    </div>
                  </div>

                  {/* Foco TRVP */}
                  <div className="bg-[#C5A059]/5 border border-[#C5A059]/15 px-5 py-4">
                    <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/80 mb-2">Foco TRVP</p>
                    <p className="font-crimson text-sm text-gray-200 leading-relaxed">{reportData.foco_trvp}</p>
                  </div>

                  {/* Ángulos */}
                  <div>
                    <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-3">Ángulo principal</p>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 px-4 py-3 mb-2">
                      <p className="font-crimson text-sm text-emerald-200">{reportData.angulo_principal}</p>
                    </div>
                    <p className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600 mt-3 mb-2">Ángulos alternativos</p>
                    <div className="space-y-1.5">
                      {reportData.angulos_secundarios.map((a, i) => (
                        <div key={i} className="bg-[#16213e] border border-white/5 px-4 py-2">
                          <p className="font-crimson text-sm text-gray-300">{a}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SEO Title + Meta */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500">Título SEO sugerido</p>
                        <button onClick={() => copyField(reportData.titulo_sugerido, "titulo")} className="flex items-center gap-1 text-gray-600 hover:text-[#C5A059] transition">
                          {copiedField === "titulo" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span className="font-cinzel text-[7px] uppercase tracking-widest">{copiedField === "titulo" ? "Copiado" : "Copiar"}</span>
                        </button>
                      </div>
                      <div className="bg-[#16213e] border border-white/10 px-4 py-2.5">
                        <p className="font-crimson text-sm text-white">{reportData.titulo_sugerido}</p>
                        <p className="font-cinzel text-[8px] text-gray-600 mt-1">{reportData.titulo_sugerido.length}/60 chars</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500">Meta description</p>
                        <button onClick={() => copyField(reportData.meta_description, "meta")} className="flex items-center gap-1 text-gray-600 hover:text-[#C5A059] transition">
                          {copiedField === "meta" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span className="font-cinzel text-[7px] uppercase tracking-widest">{copiedField === "meta" ? "Copiado" : "Copiar"}</span>
                        </button>
                      </div>
                      <div className="bg-[#16213e] border border-white/10 px-4 py-2.5">
                        <p className="font-crimson text-sm text-gray-200">{reportData.meta_description}</p>
                        <p className="font-cinzel text-[8px] text-gray-600 mt-1">{reportData.meta_description.length}/155 chars</p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-600 mb-2">Tags recomendados</p>
                    <div className="flex flex-wrap gap-1.5">
                      {reportData.tags.map((tag) => (
                        <span key={tag} className="px-2.5 py-1 bg-white/[0.03] border border-white/10 text-gray-400 font-cinzel text-[8px] uppercase tracking-widest">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="pt-2 border-t border-white/5 flex flex-wrap gap-3">
                    <Link
                      href={`/academy/admin/blog/nuevo?prefillTitle=${encodeURIComponent(reportData.titulo_sugerido)}&prefillSeoTitle=${encodeURIComponent(reportData.titulo_sugerido)}&prefillSeoDesc=${encodeURIComponent(reportData.meta_description)}&prefillTags=${encodeURIComponent(reportData.tags.join(","))}&from=trend&keyword=${encodeURIComponent(reportKeyword)}&geo=${encodeURIComponent(reportGeo)}`}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#C5A059] hover:bg-[#d4b06a] text-[#020617] font-cinzel text-[9px] uppercase tracking-widest transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Crear artículo
                    </Link>
                    <button
                      onClick={() => downloadReportMd(reportData, reportKeyword, reportGeo)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 font-cinzel text-[9px] uppercase tracking-widest transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar .MD
                    </button>
                    <button
                      onClick={() => setReportModalOpen(false)}
                      className="px-4 py-2.5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 font-cinzel text-[9px] uppercase tracking-widest transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
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
