import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import ResendButton from "./ResendButton";
import { ArrowLeft, Users, TrendingUp, MousePointer, UserMinus, AlertCircle } from "lucide-react";

export const metadata: Metadata = { title: "Detalle de envío — Newsletter" };
export const dynamic = "force-dynamic";

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ className?: string }>; accent?: string;
}) {
  return (
    <div className="relative bg-[#16213e] border border-white/5 p-5 overflow-hidden">
      <ScrollworkCorners size={36} opacity={0.7} />
      <div className="flex items-start justify-between mb-2">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500">{label}</p>
        <Icon className="w-3.5 h-3.5 text-[#C5A059]/40" />
      </div>
      <p className={`font-cinzel text-2xl ${accent ?? "text-white"}`}>{value}</p>
      {sub && <p className="font-crimson text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

function RateBar({ label, value, benchmark, description }: { label: string; value: number; benchmark: number; description: string }) {
  const pct = Math.min(100, Math.round(value * 100));
  const benchPct = Math.min(100, Math.round(benchmark * 100));
  const color = pct >= benchPct ? "bg-emerald-500" : pct >= benchPct * 0.7 ? "bg-amber-500" : "bg-red-500/70";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400">{label}</span>
        <span className={`font-cinzel text-lg ${pct >= benchPct ? "text-emerald-400" : pct >= benchPct * 0.7 ? "text-amber-400" : "text-red-400"}`}>
          {pct}%
        </span>
      </div>
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`absolute left-0 top-0 h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-[#C5A059]/50" style={{ left: `${benchPct}%` }} title={`Benchmark: ${benchPct}%`} />
      </div>
      <div className="flex justify-between">
        <p className="font-crimson text-xs text-gray-600">{description}</p>
        <p className="font-crimson text-xs text-gray-600">Benchmark: {benchPct}%</p>
      </div>
    </div>
  );
}

function Tip({ type, children }: { type: "good" | "warn" | "info"; children: React.ReactNode }) {
  const styles = {
    good: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
    warn: "border-amber-500/20 bg-amber-500/5 text-amber-400",
    info: "border-[#C5A059]/20 bg-[#C5A059]/5 text-[#C5A059]",
  };
  return (
    <div className={`flex gap-3 p-3 border rounded-sm ${styles[type]}`}>
      <span className="flex-shrink-0 mt-0.5">
        {type === "good" ? "✓" : type === "warn" ? "→" : "•"}
      </span>
      <p className="font-crimson text-sm leading-relaxed">{children}</p>
    </div>
  );
}

export default async function EnvioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  const adminSb = await createAdminClient();

  const { data: campaign } = await adminSb
    .from("newsletter_campaigns")
    .select("id, name, subject, preheader, sent_at, stats_cache, template_kind")
    .eq("id", id)
    .single();

  if (!campaign) notFound();

  // Get detailed counts from newsletter_sends
  const [{ count: totalSent }, { count: opened }, { count: clicked }, { count: bounced }, { count: unsubscribed }] = await Promise.all([
    adminSb.from("newsletter_sends").select("*", { count: "exact", head: true }).eq("campaign_id", id),
    adminSb.from("newsletter_sends").select("*", { count: "exact", head: true }).eq("campaign_id", id).not("opened_at", "is", null),
    adminSb.from("newsletter_sends").select("*", { count: "exact", head: true }).eq("campaign_id", id).not("clicked_at", "is", null),
    adminSb.from("newsletter_sends").select("*", { count: "exact", head: true }).eq("campaign_id", id).eq("status", "bounced"),
    adminSb.from("newsletter_sends").select("*", { count: "exact", head: true }).eq("campaign_id", id).eq("status", "complained"),
  ]);

  // Fall back to stats_cache if newsletter_sends is empty (e.g. before webhook data)
  const cache = campaign.stats_cache ?? {};
  const sentN = (totalSent ?? 0) > 0 ? (totalSent ?? 0) : (cache.sent ?? 0);
  const openedN = (opened ?? 0) > 0 ? (opened ?? 0) : (cache.opened ?? 0);
  const clickedN = (clicked ?? 0) > 0 ? (clicked ?? 0) : (cache.clicked ?? 0);
  const bouncedN = bounced ?? cache.bounced ?? 0;
  const nonOpenersN = sentN - openedN;

  const openRate = sentN > 0 ? openedN / sentN : 0;
  const clickRate = sentN > 0 ? clickedN / sentN : 0;
  const clickToOpenRate = openedN > 0 ? clickedN / openedN : 0;
  const bounceRate = sentN > 0 ? bouncedN / sentN : 0;

  const tips: Array<{ type: "good" | "warn" | "info"; text: string }> = [];

  if (openRate >= 0.3) tips.push({ type: "good", text: "Open rate excepcional (+30%). Tu asunto y horario de envío funcionan perfectamente." });
  else if (openRate >= 0.22) tips.push({ type: "good", text: "Open rate por encima del benchmark (22%). Sigue con este estilo de asunto." });
  else if (openRate >= 0.15) tips.push({ type: "warn", text: "Open rate por debajo del benchmark. Prueba asuntos más personales o con urgencia. Usa {{primer_nombre}} para personalizar." });
  else if (sentN > 0) tips.push({ type: "warn", text: "Open rate bajo. Considera limpiar la lista de suscriptores inactivos y probar asuntos tipo pregunta." });

  if (clickRate >= 0.05) tips.push({ type: "good", text: "Click rate excelente. El contenido y los CTAs generan acción real." });
  else if (clickRate >= 0.02) tips.push({ type: "info", text: "Click rate saludable. Prueba un único CTA más prominente en la siguiente campaña." });
  else if (sentN > 0) tips.push({ type: "warn", text: "Click rate bajo. Revisa que el botón CTA sea visible y el texto sea accionable (ej. 'Leer mi historia' vs 'Leer más')." });

  if (nonOpenersN > 10) tips.push({ type: "info", text: `Hay ${nonOpenersN} suscriptores que no abrieron este email. Puedes reenviar con un asunto diferente.` });

  if (bounceRate > 0.05) tips.push({ type: "warn", text: `Tasa de rebote del ${Math.round(bounceRate * 100)}%. Limpia los emails rebotados de la lista para proteger tu reputación como remitente.` });

  tips.push({ type: "info", text: "El mejor horario para emails de bienestar/salud: martes o jueves entre 10:00 y 14:00, zona horaria del suscriptor." });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/academy/admin/newsletter/envios"
            className="flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition mb-3">
            <ArrowLeft className="w-3 h-3" /> Volver a envíos
          </Link>
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Resultados</p>
          <h1 className="font-cinzel text-xl text-white mb-1">{campaign.name}</h1>
          <p className="font-crimson text-sm text-gray-500">
            Enviada el {campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "—"}
          </p>
        </div>
        {nonOpenersN > 0 && (
          <ResendButton campaignId={id} nonOpenersCount={nonOpenersN} />
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Enviados" value={sentN.toLocaleString("es-ES")} icon={Users} />
        <StatCard label="Abiertos" value={openedN.toLocaleString("es-ES")} icon={TrendingUp} accent="text-emerald-400" />
        <StatCard label="Clicks" value={clickedN.toLocaleString("es-ES")} icon={MousePointer} accent="text-blue-400" />
        <StatCard label="No abrieron" value={nonOpenersN.toLocaleString("es-ES")} icon={UserMinus} accent="text-gray-400"
          sub={nonOpenersN > 0 ? "Candidatos a reenvío" : "¡Todos abrieron!"} />
      </div>

      {/* Rate bars */}
      <div className="bg-[#16213e] border border-white/5 p-6 mb-6 space-y-6">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-2">Tasas de rendimiento</p>
        <RateBar label="Open rate" value={openRate} benchmark={0.22} description="% de destinatarios que abrieron el email" />
        <RateBar label="Click rate" value={clickRate} benchmark={0.035} description="% de destinatarios que hicieron click" />
        <RateBar label="Click-to-open rate" value={clickToOpenRate} benchmark={0.15} description="% de lectores que hicieron click tras abrir" />
        {bouncedN > 0 && (
          <div className="flex gap-2 pt-2 border-t border-white/5">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="font-crimson text-sm text-amber-300">
              {bouncedN} email{bouncedN > 1 ? "s" : ""} rebotado{bouncedN > 1 ? "s" : ""} ({Math.round(bounceRate * 100)}%). Los rebotados se marcan automáticamente en la lista.
            </p>
          </div>
        )}
      </div>

      {/* Actionable tips */}
      <div className="bg-[#16213e] border border-white/5 p-6">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-4">Acciones y mejoras</p>
        <div className="space-y-3">
          {tips.map((tip, i) => (
            <Tip key={i} type={tip.type}>{tip.text}</Tip>
          ))}
        </div>
      </div>
    </div>
  );
}
