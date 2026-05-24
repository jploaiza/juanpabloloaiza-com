import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AcademyCard from "@/components/academy/AcademyCard";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import { BarChart2, TrendingUp, Users, MousePointer } from "lucide-react";

export const metadata: Metadata = { title: "Envíos — Newsletter" };
export const dynamic = "force-dynamic";

function RateBar({ value, benchmark, label }: { value: number; benchmark: number; label: string }) {
  const pct = Math.min(100, Math.round(value * 100));
  const benchPct = Math.min(100, Math.round(benchmark * 100));
  const color = pct >= benchPct ? "bg-emerald-500" : pct >= benchPct * 0.7 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500">{label}</span>
        <span className={`font-cinzel text-sm font-bold ${pct >= benchPct ? "text-emerald-400" : pct >= benchPct * 0.7 ? "text-amber-400" : "text-red-400"}`}>
          {pct}%
        </span>
      </div>
      <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`absolute left-0 top-0 h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
        <div className="absolute top-0 h-full w-px bg-[#C5A059]/40" style={{ left: `${benchPct}%` }} />
      </div>
      <p className="font-crimson text-xs text-gray-600 mt-0.5">Benchmark: {benchPct}%</p>
    </div>
  );
}

type SentCampaign = {
  id: string; name: string; subject: string; sent_at: string;
  stats_cache: {
    recipients?: number; sent?: number; delivered?: number;
    opened?: number; clicked?: number; bounced?: number; complained?: number;
  };
};

export default async function EnviosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  const adminSb = await createAdminClient();
  const { data } = await adminSb
    .from("newsletter_campaigns")
    .select("id, name, subject, sent_at, stats_cache")
    .eq("status", "sent")
    .order("sent_at", { ascending: false });

  const campaigns = (data ?? []) as SentCampaign[];

  // Aggregated totals
  const totals = campaigns.reduce(
    (acc, c) => ({
      sent: acc.sent + (c.stats_cache?.sent ?? 0),
      opened: acc.opened + (c.stats_cache?.opened ?? 0),
      clicked: acc.clicked + (c.stats_cache?.clicked ?? 0),
    }),
    { sent: 0, opened: 0, clicked: 0 }
  );

  const avgOpenRate = totals.sent > 0 ? totals.opened / totals.sent : 0;
  const avgClickRate = totals.sent > 0 ? totals.clicked / totals.sent : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      <div className="mb-8">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Newsletter</p>
        <h1 className="font-cinzel text-2xl text-white">Envíos y resultados</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total enviados", value: totals.sent.toLocaleString("es-ES"), icon: Users },
          { label: "Total abiertos", value: totals.opened.toLocaleString("es-ES"), icon: TrendingUp },
          { label: "Tasa apertura media", value: `${Math.round(avgOpenRate * 100)}%`, icon: BarChart2 },
          { label: "Tasa click media", value: `${Math.round(avgClickRate * 100)}%`, icon: MousePointer },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="relative bg-[#16213e] border border-white/5 p-5 overflow-hidden">
            <ScrollworkCorners size={36} opacity={0.7} />
            <div className="flex items-start justify-between mb-2">
              <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500">{label}</p>
              <Icon className="w-3.5 h-3.5 text-[#C5A059]/40" />
            </div>
            <p className="font-cinzel text-2xl text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Benchmarks vs industry */}
      {campaigns.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4 mb-8">
          <div className="bg-[#16213e] border border-white/5 p-5">
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-4">Rendimiento vs benchmark</p>
            <div className="space-y-5">
              <RateBar value={avgOpenRate} benchmark={0.22} label="Tasa de apertura" />
              <RateBar value={avgClickRate} benchmark={0.035} label="Tasa de clicks" />
            </div>
            <p className="font-crimson text-xs text-gray-600 mt-4 leading-relaxed">
              Benchmarks del sector salud/bienestar (promedio industria). La línea dorada indica el umbral.
            </p>
          </div>
          <div className="bg-[#16213e] border border-white/5 p-5">
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-4">Recomendaciones</p>
            <ul className="space-y-3">
              {avgOpenRate < 0.15 && (
                <li className="flex gap-2 font-crimson text-sm text-gray-300">
                  <span className="text-amber-400 flex-shrink-0">→</span>
                  Prueba asuntos con preguntas directas o que incluyan el nombre del suscriptor con <code className="text-[#C5A059] text-xs">{"{{primer_nombre}}"}</code>
                </li>
              )}
              {avgOpenRate >= 0.15 && avgOpenRate < 0.22 && (
                <li className="flex gap-2 font-crimson text-sm text-gray-300">
                  <span className="text-amber-400 flex-shrink-0">→</span>
                  Buen open rate. Prueba enviar los martes o jueves entre 10:00-14:00 para subir aún más.
                </li>
              )}
              {avgOpenRate >= 0.22 && (
                <li className="flex gap-2 font-crimson text-sm text-gray-300">
                  <span className="text-emerald-400 flex-shrink-0">✓</span>
                  Excelente apertura. Tu audiencia está muy comprometida con el contenido.
                </li>
              )}
              {avgClickRate < 0.02 && (
                <li className="flex gap-2 font-crimson text-sm text-gray-300">
                  <span className="text-amber-400 flex-shrink-0">→</span>
                  Añade CTAs más visibles. Un solo botón claro funciona mejor que varios links.
                </li>
              )}
              {avgClickRate >= 0.02 && avgClickRate < 0.05 && (
                <li className="flex gap-2 font-crimson text-sm text-gray-300">
                  <span className="text-amber-400 flex-shrink-0">→</span>
                  Click rate saludable. Considera reenviar a los que no abrieron para aumentar el alcance.
                </li>
              )}
              {avgClickRate >= 0.05 && (
                <li className="flex gap-2 font-crimson text-sm text-gray-300">
                  <span className="text-emerald-400 flex-shrink-0">✓</span>
                  Click rate excepcional. El contenido conecta y convierte.
                </li>
              )}
              <li className="flex gap-2 font-crimson text-sm text-gray-300">
                <span className="text-[#C5A059] flex-shrink-0">→</span>
                Usa <code className="text-[#C5A059] text-xs">{"{{nombre}}"}</code> en el intro para personalizar y aumentar la tasa de lectura.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Campaign list */}
      <AcademyCard>
        {campaigns.length === 0 ? (
          <div className="text-center py-16">
            <BarChart2 className="w-10 h-10 text-[#C5A059]/20 mx-auto mb-4" />
            <p className="font-cinzel text-sm text-gray-600">No hay campañas enviadas aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Campaña", "Asunto", "Fecha envío", "Enviados", "Abiertos", "Open rate", "Clicks", "Click rate", ""].map((h) => (
                    <th key={h} className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4 last:pr-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const sent = c.stats_cache?.sent ?? 0;
                  const opened = c.stats_cache?.opened ?? 0;
                  const clicked = c.stats_cache?.clicked ?? 0;
                  const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
                  const clickRate = sent > 0 ? Math.round((clicked / sent) * 100) : 0;
                  return (
                    <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition group">
                      <td className="py-3 pr-4 min-w-[140px]">
                        <span className="font-crimson text-sm text-gray-200">{c.name}</span>
                      </td>
                      <td className="py-3 pr-4 max-w-[180px]">
                        <span className="font-crimson text-sm text-gray-400 truncate block">{c.subject || "—"}</span>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <span className="font-crimson text-xs text-gray-500">
                          {new Date(c.sent_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-crimson text-sm text-gray-300">{sent.toLocaleString("es-ES")}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-crimson text-sm text-gray-300">{opened.toLocaleString("es-ES")}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`font-cinzel text-sm font-bold ${openRate >= 22 ? "text-emerald-400" : openRate >= 15 ? "text-amber-400" : "text-red-400"}`}>
                          {openRate}%
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-crimson text-sm text-gray-300">{clicked.toLocaleString("es-ES")}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`font-cinzel text-sm font-bold ${clickRate >= 5 ? "text-emerald-400" : clickRate >= 2 ? "text-amber-400" : "text-red-400"}`}>
                          {clickRate}%
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/academy/admin/newsletter/envios/${c.id}`}
                          className="font-cinzel text-[9px] uppercase tracking-widest px-3 py-1.5 border border-[#C5A059]/20 text-[#C5A059]/60 hover:text-[#C5A059] hover:border-[#C5A059]/50 transition">
                          Detalle →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AcademyCard>
    </div>
  );
}
