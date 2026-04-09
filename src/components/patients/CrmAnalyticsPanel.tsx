"use client";

import { useEffect, useState } from "react";
import { Users, Activity, Clock, TrendingUp, AlertTriangle, ShoppingBag, RefreshCw } from "lucide-react";

interface AnalyticsData {
  byStatus: { active: number; paused: number; finished: number };
  sessions: { totalUsed: number; totalRemaining: number; totalCapacity: number };
  expiringSoon: { id: string; first_name: string; last_name: string; end_date: string; daysLeft: number }[];
  noSessionsActive: number;
  monthlyNewPatients: { month: string; count: number }[];
  monthlySessions: { month: string; count: number }[];
  monthlyPurchases: { month: string; count: number }[];
  avgSessionsUsed: number;
  avgCompletionRate: number;
  recentPurchases: { name: string; quantity: number; created_at: string }[];
  totalPatients: number;
}

function BarChart({ data, color = "#C5A059" }: { data: { label: string; count: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end justify-center" style={{ height: "60px" }}>
            <div
              className="w-full transition-all duration-500"
              style={{
                height: `${Math.max(2, Math.round((d.count / max) * 60))}px`,
                backgroundColor: color,
                opacity: d.count === 0 ? 0.15 : 0.85,
              }}
            />
          </div>
          <span className="text-[9px] font-cinzel text-gray-600 text-center leading-tight">
            {d.label.slice(5)}
          </span>
          <span className="text-[9px] font-cinzel text-gray-400 text-center">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, sub, color = "text-[#C5A059]",
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="relative bg-[#0a1628] border border-[#C5A059]/10 p-4 overflow-hidden">
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

function StatusDonut({ active, paused, finished }: { active: number; paused: number; finished: number }) {
  const total = active + paused + finished || 1;
  const ap = Math.round((active / total) * 100);
  const pp = Math.round((paused / total) * 100);
  const fp = 100 - ap - pp;

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col gap-1.5">
        {[
          { label: "Activos", count: active, pct: ap, color: "bg-emerald-500" },
          { label: "Pausados", count: paused, pct: pp, color: "bg-amber-500" },
          { label: "Finalizados", count: finished, pct: Math.max(0, fp), color: "bg-gray-600" },
        ].map(({ label, count, pct, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-[#020617] overflow-hidden">
              <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
            <span className="font-cinzel text-[9px] text-gray-500 w-16">{label}</span>
            <span className="font-cinzel text-[10px] text-gray-300">{count}</span>
            <span className="font-cinzel text-[9px] text-gray-600">({pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CrmAnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/patients/analytics");
      if (!res.ok) throw new Error("Error al cargar analytics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={18} className="animate-spin text-[#C5A059]/50" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16 text-gray-500 font-crimson">
        {error ?? "Sin datos"}
        <button onClick={load} className="block mx-auto mt-3 text-xs text-[#C5A059] underline">Reintentar</button>
      </div>
    );
  }

  const { byStatus, sessions, expiringSoon, noSessionsActive, monthlyNewPatients, monthlySessions, monthlyPurchases, avgSessionsUsed, avgCompletionRate, recentPurchases, totalPatients } = data;

  const usageRate = sessions.totalCapacity > 0
    ? Math.round((sessions.totalUsed / sessions.totalCapacity) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/70 mb-0.5">CRM</p>
          <h2 className="font-cinzel text-lg text-white">Analíticas de Pacientes</h2>
        </div>
        <button
          onClick={load}
          className="p-2 border border-[#C5A059]/15 text-gray-500 hover:text-[#C5A059] hover:border-[#C5A059]/30 transition"
          title="Actualizar"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={Users} label="Total pacientes" value={String(totalPatients)} sub="Todos los estados" />
        <KpiCard icon={Activity} label="Activos" value={String(byStatus.active)} sub={`${Math.round((byStatus.active / (totalPatients || 1)) * 100)}% del total`} color="text-emerald-400" />
        <KpiCard icon={Clock} label="Pausados" value={String(byStatus.paused)} sub="Temporalmente inactivos" color="text-amber-400" />
        <KpiCard icon={Users} label="Finalizados" value={String(byStatus.finished)} sub="Pack completado" color="text-gray-400" />
        <KpiCard icon={TrendingUp} label="Sesiones usadas" value={String(sessions.totalUsed)} sub={`${usageRate}% de capacidad`} />
        <KpiCard icon={AlertTriangle} label="Sin sesiones" value={String(noSessionsActive)} sub="Activos sin saldo" color="text-red-400" />
      </div>

      {/* Row: status breakdown + sessions bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status breakdown */}
        <div className="bg-[#0a1628] border border-[#C5A059]/10 p-5">
          <h3 className="font-cinzel text-xs uppercase tracking-widest text-white mb-4">Distribución de estado</h3>
          <StatusDonut active={byStatus.active} paused={byStatus.paused} finished={byStatus.finished} />
          <div className="mt-4 grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
            {[
              { label: "Prom. sesiones", value: String(avgSessionsUsed) },
              { label: "% completado", value: `${avgCompletionRate}%` },
              { label: "Restantes", value: String(sessions.totalRemaining) },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="font-cinzel text-base text-[#C5A059]">{value}</p>
                <p className="font-cinzel text-[9px] text-gray-600 uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions bar chart */}
        <div className="bg-[#0a1628] border border-[#C5A059]/10 p-5">
          <h3 className="font-cinzel text-xs uppercase tracking-widest text-white mb-4">Sesiones registradas / mes</h3>
          <BarChart data={monthlySessions.map((d) => ({ label: d.month, count: d.count }))} />
        </div>
      </div>

      {/* Row: new patients + purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0a1628] border border-[#C5A059]/10 p-5">
          <h3 className="font-cinzel text-xs uppercase tracking-widest text-white mb-4">Nuevos pacientes / mes</h3>
          <BarChart data={monthlyNewPatients.map((d) => ({ label: d.month, count: d.count }))} color="#60a5fa" />
        </div>
        <div className="bg-[#0a1628] border border-[#C5A059]/10 p-5">
          <h3 className="font-cinzel text-xs uppercase tracking-widest text-white mb-4">Sesiones compradas / mes</h3>
          <BarChart data={monthlyPurchases.map((d) => ({ label: d.month, count: d.count }))} color="#34d399" />
        </div>
      </div>

      {/* Row: expiring soon + recent purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expiring soon */}
        <div className="bg-[#0a1628] border border-[#C5A059]/10 p-5">
          <h3 className="font-cinzel text-xs uppercase tracking-widest text-white mb-1">Vencen pronto</h3>
          <p className="font-crimson text-xs text-gray-600 mb-4">Activos con ≤ 30 días restantes</p>
          {expiringSoon.length === 0 ? (
            <p className="font-crimson text-sm text-gray-600 py-4 text-center">Ninguno por ahora</p>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {expiringSoon.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-white/[0.03]">
                  <span className="font-crimson text-sm text-gray-200 truncate max-w-[55%]">
                    {p.first_name} {p.last_name}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-cinzel text-[9px] text-gray-600">{p.end_date}</span>
                    <span className={`font-cinzel text-[10px] font-bold px-1.5 py-0.5 border ${
                      p.daysLeft <= 7
                        ? "text-red-400 border-red-400/30 bg-red-950/40"
                        : p.daysLeft <= 14
                        ? "text-amber-400 border-amber-400/30 bg-amber-950/40"
                        : "text-blue-400 border-blue-400/30 bg-blue-950/40"
                    }`}>
                      {p.daysLeft}d
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Summary counts */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5">
            {[
              { label: "≤ 7 días", count: expiringSoon.filter((p) => p.daysLeft <= 7).length, color: "text-red-400" },
              { label: "≤ 14 días", count: expiringSoon.filter((p) => p.daysLeft <= 14).length, color: "text-amber-400" },
              { label: "≤ 30 días", count: expiringSoon.length, color: "text-blue-400" },
            ].map(({ label, count, color }) => (
              <div key={label} className="text-center">
                <p className={`font-cinzel text-lg ${color}`}>{count}</p>
                <p className="font-cinzel text-[9px] text-gray-600 uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent purchases */}
        <div className="bg-[#0a1628] border border-[#C5A059]/10 p-5">
          <h3 className="font-cinzel text-xs uppercase tracking-widest text-white mb-1">Últimas compras</h3>
          <p className="font-crimson text-xs text-gray-600 mb-4">Nuevos packs registrados recientemente</p>
          {recentPurchases.length === 0 ? (
            <p className="font-crimson text-sm text-gray-600 py-4 text-center">Sin compras recientes</p>
          ) : (
            <div className="space-y-1.5">
              {recentPurchases.map((pu, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.03]">
                  <span className="font-crimson text-sm text-gray-200 truncate max-w-[55%]">{pu.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-cinzel text-[9px] text-gray-600">
                      {new Date(pu.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                    </span>
                    <span className="flex items-center gap-1 font-cinzel text-[10px] text-emerald-400 border border-emerald-400/20 bg-emerald-950/30 px-1.5 py-0.5">
                      <ShoppingBag size={9} />
                      +{pu.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
