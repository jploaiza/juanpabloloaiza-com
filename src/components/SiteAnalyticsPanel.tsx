"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Globe, FileText, TrendingUp, Eye, ExternalLink, MousePointer2, Calendar, MessageCircle, Zap } from "lucide-react";

interface SiteData {
  totalViews: number;
  uniquePaths: number;
  dailyViews: { day: string; count: number }[];
  monthlyViews: { month: string; count: number }[];
  topPages: { path: string; count: number }[];
  topReferrers: { domain: string; count: number }[];
  blogViews: { slug: string; title: string; count: number; published_at: string | null }[];
  eventCounts: Record<string, number>;
  topUtmSources: { source: string; count: number }[];
  topUtmCampaigns: { campaign: string; count: number }[];
  funnel: { visits: number; agendarClicks: number; bookings: number; whatsappClicks: number; conversionRate: number };
}

function MiniBarChart({ data, color = "#C5A059", height = 40 }: {
  data: { label: string; count: number }[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-px" style={{ height: `${height + 16}px` }}>
      {data.map((d) => (
        <div
          key={d.label}
          title={`${d.label}: ${d.count}`}
          className="flex-1 transition-all duration-300 cursor-default"
          style={{
            height: `${Math.max(1, Math.round((d.count / max) * height))}px`,
            backgroundColor: color,
            opacity: d.count === 0 ? 0.1 : 0.75,
            alignSelf: "flex-end",
          }}
        />
      ))}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color = "text-[#C5A059]" }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-[#16213e] border border-[#C5A059]/10 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-[#C5A059]/20" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-[#C5A059]/20" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-[#C5A059]/20" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-[#C5A059]/20" />
      <Icon className={`w-4 h-4 mb-2 ${color}`} />
      <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-0.5">{label}</p>
      <p className={`font-cinzel text-2xl ${color} mb-0.5`}>{value}</p>
      {sub && <p className="font-crimson text-xs text-gray-600">{sub}</p>}
    </div>
  );
}

function pageLabel(path: string): string {
  if (path === "/" || path === "") return "Inicio";
  if (path.startsWith("/blog/")) return `Blog: ${path.replace("/blog/", "")}`;
  const map: Record<string, string> = {
    "/blog": "Blog",
    "/agenda": "Agenda",
    "/formulario-de-admision": "Formulario admisión",
    "/entrevista": "Entrevista",
    "/politicas-de-servicio": "Políticas",
    "/videos": "Videos",
    "/academy": "Academy",
  };
  return map[path.replace(/\/$/, "")] ?? path;
}

export default function SiteAnalyticsPanel() {
  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics/site");
      if (!res.ok) throw new Error("Error al cargar");
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={18} className="animate-spin text-[#C5A059]/50" />
    </div>
  );

  if (error || !data) return (
    <div className="text-center py-16 text-gray-500 font-crimson">
      {error ?? "Sin datos"}
      <button onClick={load} className="block mx-auto mt-3 text-xs text-[#C5A059] underline">Reintentar</button>
    </div>
  );

  const { totalViews, uniquePaths, dailyViews, monthlyViews, topPages, topReferrers, blogViews, eventCounts, topUtmSources, topUtmCampaigns, funnel } = data;
  const maxPage = Math.max(...topPages.map((p) => p.count), 1);
  const maxRef = Math.max(...topReferrers.map((r) => r.count), 1);
  const maxBlog = Math.max(...blogViews.map((b) => b.count), 1);

  // 7-day total from dailyViews
  const views7d = dailyViews.slice(-7).reduce((s, d) => s + d.count, 0);
  const views30d = totalViews;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/70 mb-0.5">Sitio Web</p>
          <h2 className="font-cinzel text-lg text-white">Analíticas del Sitio</h2>
          <p className="font-crimson text-xs text-gray-600 mt-0.5">Últimos 30 días · sin bots ni admins</p>
        </div>
        <button onClick={load} className="p-2 border border-[#C5A059]/15 text-gray-500 hover:text-[#C5A059] hover:border-[#C5A059]/30 transition" title="Actualizar">
          <RefreshCw size={13} />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={Eye} label="Vistas (30d)" value={String(views30d)} sub="páginas cargadas" />
        <KpiCard icon={TrendingUp} label="Vistas (7d)" value={String(views7d)} sub="última semana" color="text-blue-400" />
        <KpiCard icon={Globe} label="Páginas únicas" value={String(uniquePaths)} sub="rutas distintas" color="text-emerald-400" />
        <KpiCard icon={FileText} label="Artículos blog" value={String(blogViews.length)} sub="publicados" color="text-purple-400" />
      </div>

      {/* Daily chart (last 30 days) */}
      <div className="bg-[#16213e] border border-[#C5A059]/10 p-5">
        <h3 className="font-cinzel text-xs uppercase tracking-widest text-white mb-1">Vistas diarias — últimos 30 días</h3>
        <p className="font-crimson text-xs text-gray-600 mb-4">Cada barra = un día. Pasa el cursor para ver la fecha.</p>
        <MiniBarChart
          data={dailyViews.map((d) => ({ label: d.day, count: d.count }))}
          height={56}
        />
        <div className="flex justify-between mt-1">
          <span className="font-cinzel text-[9px] text-gray-600">{dailyViews[0]?.day?.slice(5)}</span>
          <span className="font-cinzel text-[9px] text-gray-600">{dailyViews[dailyViews.length - 1]?.day?.slice(5)}</span>
        </div>
      </div>

      {/* Monthly chart */}
      <div className="bg-[#16213e] border border-[#C5A059]/10 p-5">
        <h3 className="font-cinzel text-xs uppercase tracking-widest text-white mb-4">Vistas mensuales — últimos 6 meses</h3>
        <div className="flex items-end gap-2 h-20">
          {(() => {
            const max = Math.max(...monthlyViews.map((d) => d.count), 1);
            return monthlyViews.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end" style={{ height: "52px" }}>
                  <div style={{ width: "100%", height: `${Math.max(2, Math.round((d.count / max) * 52))}px`, backgroundColor: "#C5A059", opacity: d.count === 0 ? 0.1 : 0.8 }} />
                </div>
                <span className="font-cinzel text-[9px] text-gray-600">{d.month.slice(5)}</span>
                <span className="font-cinzel text-[10px] text-gray-400">{d.count}</span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Top pages + referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top pages */}
        <div className="bg-[#16213e] border border-[#C5A059]/10 p-5">
          <h3 className="font-cinzel text-xs uppercase tracking-widest text-white mb-1">Páginas más vistas</h3>
          <p className="font-crimson text-xs text-gray-600 mb-4">Últimos 30 días</p>
          {topPages.length === 0 ? (
            <p className="font-crimson text-sm text-gray-600 text-center py-6">Sin datos aún — el tracker comienza a acumular desde ahora</p>
          ) : (
            <div className="space-y-2.5">
              {topPages.map(({ path, count }) => (
                <div key={path} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-crimson text-sm text-gray-200 truncate max-w-[70%]">{pageLabel(path)}</span>
                    <span className="font-cinzel text-[10px] text-[#C5A059] flex-shrink-0">{count}</span>
                  </div>
                  <div className="h-1 bg-[#0a1628]">
                    <div className="h-full bg-[#C5A059]/60 transition-all" style={{ width: `${Math.round((count / maxPage) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Referrers */}
        <div className="bg-[#16213e] border border-[#C5A059]/10 p-5">
          <h3 className="font-cinzel text-xs uppercase tracking-widest text-white mb-1">Fuentes de tráfico</h3>
          <p className="font-crimson text-xs text-gray-600 mb-4">Dominio de origen (referrer)</p>
          {topReferrers.length === 0 ? (
            <p className="font-crimson text-sm text-gray-600 text-center py-6">Sin referrers registrados aún</p>
          ) : (
            <div className="space-y-2.5">
              {topReferrers.map(({ domain, count }) => (
                <div key={domain} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-crimson text-sm text-gray-200 flex items-center gap-1.5 truncate max-w-[70%]">
                      <ExternalLink size={10} className="text-gray-600 flex-shrink-0" />
                      {domain}
                    </span>
                    <span className="font-cinzel text-[10px] text-blue-400 flex-shrink-0">{count}</span>
                  </div>
                  <div className="h-1 bg-[#0a1628]">
                    <div className="h-full bg-blue-400/50 transition-all" style={{ width: `${Math.round((count / maxRef) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Blog articles */}
      <div className="bg-[#16213e] border border-[#C5A059]/10 p-5">
        <h3 className="font-cinzel text-xs uppercase tracking-widest text-white mb-1">Artículos del blog</h3>
        <p className="font-crimson text-xs text-gray-600 mb-4">Vistas por artículo — últimos 30 días</p>
        {blogViews.length === 0 ? (
          <p className="font-crimson text-sm text-gray-600 text-center py-6">Sin artículos publicados</p>
        ) : (
          <div className="space-y-3">
            {blogViews.map(({ slug, title, count, published_at }) => (
              <div key={slug} className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-crimson text-sm text-gray-200 leading-snug line-clamp-1">{title}</p>
                    <p className="font-cinzel text-[9px] text-gray-600 mt-0.5">
                      {published_at ? new Date(published_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 font-cinzel text-sm font-bold ${count > 0 ? "text-purple-400" : "text-gray-600"}`}>
                    {count}
                  </span>
                </div>
                <div className="h-1 bg-[#0a1628]">
                  <div className="h-full bg-purple-500/50 transition-all" style={{ width: `${maxBlog > 0 ? Math.round((count / maxBlog) * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conversions */}
      <div className="space-y-4">
        <div>
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/70 mb-0.5">Conversiones</p>
          <h2 className="font-cinzel text-lg text-white">Eventos de Conversión</h2>
          <p className="font-crimson text-xs text-gray-600 mt-0.5">Últimos 30 días · tracking propio sin cookies</p>
        </div>

        {/* Funnel KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard icon={Eye} label="Visitas (30d)" value={String(funnel.visits)} sub="páginas vistas" />
          <KpiCard icon={MousePointer2} label="Clicks Agendar" value={String(funnel.agendarClicks)} sub="hacia /agenda" color="text-amber-400" />
          <KpiCard icon={Calendar} label="Bookings" value={String(funnel.bookings)} sub="sesiones confirmadas" color="text-emerald-400" />
          <KpiCard icon={MessageCircle} label="WhatsApp" value={String(funnel.whatsappClicks)} sub="clicks al botón" color="text-green-400" />
        </div>

        {/* Funnel visual */}
        <div className="bg-[#16213e] border border-[#C5A059]/10 p-5">
          <h3 className="font-cinzel text-xs uppercase tracking-widest text-white mb-1">Embudo de conversión</h3>
          <p className="font-crimson text-xs text-gray-600 mb-5">visit → agendar click → booking confirmado</p>
          {[
            { label: "Visitas", value: funnel.visits, color: "bg-[#C5A059]/60", pct: 100 },
            { label: "Clicks Agendar", value: funnel.agendarClicks, color: "bg-amber-400/60", pct: funnel.visits > 0 ? Math.round((funnel.agendarClicks / funnel.visits) * 100) : 0 },
            { label: "Bookings", value: funnel.bookings, color: "bg-emerald-400/60", pct: funnel.visits > 0 ? Math.round((funnel.bookings / funnel.visits) * 100) : 0 },
          ].map(({ label, value, color, pct }) => (
            <div key={label} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="font-cinzel text-[10px] uppercase tracking-widest text-gray-400">{label}</span>
                <span className="font-cinzel text-[10px] text-gray-500">{value} · {pct}%</span>
              </div>
              <div className="h-2 bg-[#0a1628]">
                <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
          <p className="font-cinzel text-[10px] text-emerald-400 mt-3">
            Tasa de conversión visit→booking: <span className="font-bold">{funnel.conversionRate}%</span>
          </p>
        </div>

        {/* UTM sources + campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#16213e] border border-[#C5A059]/10 p-5">
            <h3 className="font-cinzel text-xs uppercase tracking-widest text-white mb-1">Top UTM sources</h3>
            <p className="font-crimson text-xs text-gray-600 mb-4">?utm_source en URL de aterrizaje</p>
            {topUtmSources.length === 0 ? (
              <p className="font-crimson text-sm text-gray-600 text-center py-4">Sin datos — agrega ?utm_source=instagram a tus links</p>
            ) : (() => {
              const maxUtm = Math.max(...topUtmSources.map((u) => u.count), 1);
              return (
                <div className="space-y-2.5">
                  {topUtmSources.map(({ source, count }) => (
                    <div key={source} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-crimson text-sm text-gray-200">{source}</span>
                        <span className="font-cinzel text-[10px] text-amber-400">{count}</span>
                      </div>
                      <div className="h-1 bg-[#0a1628]">
                        <div className="h-full bg-amber-400/50" style={{ width: `${Math.round((count / maxUtm) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="bg-[#16213e] border border-[#C5A059]/10 p-5">
            <h3 className="font-cinzel text-xs uppercase tracking-widest text-white mb-1">Top campañas</h3>
            <p className="font-crimson text-xs text-gray-600 mb-4">?utm_campaign en URL de aterrizaje</p>
            {topUtmCampaigns.length === 0 ? (
              <p className="font-crimson text-sm text-gray-600 text-center py-4">Sin datos — agrega ?utm_campaign=nombre a tus links</p>
            ) : (() => {
              const maxCmp = Math.max(...topUtmCampaigns.map((c) => c.count), 1);
              return (
                <div className="space-y-2.5">
                  {topUtmCampaigns.map(({ campaign, count }) => (
                    <div key={campaign} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-crimson text-sm text-gray-200">{campaign}</span>
                        <span className="font-cinzel text-[10px] text-[#C5A059]">{count}</span>
                      </div>
                      <div className="h-1 bg-[#0a1628]">
                        <div className="h-full bg-[#C5A059]/50" style={{ width: `${Math.round((count / maxCmp) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* All events */}
        <div className="bg-[#16213e] border border-[#C5A059]/10 p-5">
          <h3 className="font-cinzel text-xs uppercase tracking-widest text-white mb-1 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#C5A059]" />
            Todos los eventos (30d)
          </h3>
          <p className="font-crimson text-xs text-gray-600 mb-4">Engagement + conversiones</p>
          {Object.keys(eventCounts).length === 0 ? (
            <p className="font-crimson text-sm text-gray-600 text-center py-4">Sin eventos registrados aún — se acumularán a medida que haya visitas</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(eventCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                <div key={name} className="border border-white/5 p-3">
                  <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">{name.replace(/_/g, " ")}</p>
                  <p className="font-cinzel text-xl text-[#C5A059]">{count}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
