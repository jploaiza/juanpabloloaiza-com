import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AcademyCard from "@/components/academy/AcademyCard";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import { Mail, Users, Send, CheckCircle, Clock, LayoutTemplate, Zap, Plus, ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Newsletter — Admin" };
export const dynamic = "force-dynamic";

export default async function NewsletterDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  const adminSb = await createAdminClient();
  const thirtyDaysAgo = new Date(new Date().getTime() - 30 * 86400000).toISOString();

  const [subsResult, campaignsResult, automationsResult] = await Promise.all([
    adminSb.from("newsletter_subscribers").select("id, status, created_at", { count: "exact" }),
    adminSb.from("newsletter_campaigns").select("id, status, stats_cache"),
    adminSb.from("newsletter_automations").select("kind, enabled"),
  ]);

  const subs = subsResult.data ?? [];
  const campaigns = campaignsResult.data ?? [];
  const automations = automationsResult.data ?? [];

  const totalSubs = subsResult.count ?? 0;
  const confirmedSubs = subs.filter((s) => s.status === "confirmed").length;
  const recentSubs = subs.filter((s) => s.created_at > thirtyDaysAgo).length;
  const sentCampaigns = campaigns.filter((c) => c.status === "sent").length;
  const scheduledCampaigns = campaigns.filter((c) => c.status === "scheduled").length;
  const totalSent = campaigns.reduce((acc, c) => acc + ((c.stats_cache as Record<string, number>)?.sent ?? 0), 0);
  const welcomeEnabled = automations.find((a) => a.kind === "welcome")?.enabled ?? false;
  const reengagementEnabled = automations.find((a) => a.kind === "reengagement")?.enabled ?? false;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Administración</p>
          <h1 className="font-cinzel text-2xl text-white">Newsletter</h1>
        </div>
        <Link href="/academy/admin/newsletter/campaigns/nuevo"
          className="flex items-center gap-2 bg-[#C5A059] hover:bg-[#d4b06a] text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-4 py-2.5 transition">
          <Plus className="w-3.5 h-3.5" /> Nueva campaña
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Confirmados", value: confirmedSubs, sub: `+${recentSubs} últimos 30d`, icon: Users, accent: "text-white" },
          { label: "Campañas enviadas", value: sentCampaigns, sub: `${totalSent} emails totales`, icon: Send, accent: "text-emerald-400" },
          { label: "Programadas", value: scheduledCampaigns, icon: Clock, accent: "text-amber-400" },
          { label: "Total suscriptores", value: totalSubs, icon: Mail, accent: "text-gray-300" },
        ].map(({ label, value, sub, icon: Icon, accent }) => (
          <div key={label} className="relative bg-[#16213e] border border-white/5 p-5 overflow-hidden">
            <ScrollworkCorners size={36} opacity={0.7} />
            <Icon className="w-4 h-4 text-[#C5A059] mb-3" />
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
            <p className={`font-cinzel text-2xl ${accent}`}>{value}</p>
            {sub && <p className="font-crimson text-xs text-gray-600 mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Quick access */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {[
          { href: "/academy/admin/newsletter/campaigns", icon: Send, label: "Campañas", desc: `${campaigns.length} campañas · ${scheduledCampaigns} programadas` },
          { href: "/academy/admin/newsletter/subscribers", icon: Users, label: "Suscriptores", desc: `${confirmedSubs} confirmados · ${recentSubs} nuevos este mes` },
          { href: "/academy/admin/newsletter/templates", icon: LayoutTemplate, label: "Plantillas", desc: "4 plantillas disponibles: editorial, anuncio, bienvenida, re-engagement" },
          { href: "/academy/admin/newsletter/automations", icon: Zap, label: "Automatizaciones", desc: `Bienvenida ${welcomeEnabled ? "✓" : "—"} · Re-engagement ${reengagementEnabled ? "✓" : "—"}` },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}
            className="group flex items-center gap-4 bg-[#16213e] border border-white/5 hover:border-[#C5A059]/30 p-5 transition">
            <Icon className="w-5 h-5 text-[#C5A059] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-cinzel text-[10px] uppercase tracking-widest text-white mb-1">{label}</p>
              <p className="font-crimson text-sm text-gray-500 truncate">{desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-[#C5A059] transition" />
          </Link>
        ))}
      </div>

      {/* Automation status */}
      <AcademyCard>
        <h2 className="font-cinzel text-xs uppercase tracking-widest text-white mb-4">Estado de automatizaciones</h2>
        <div className="space-y-3">
          {[
            { label: "Bienvenida automática", enabled: welcomeEnabled, desc: "Email al confirmar suscripción" },
            { label: "Re-engagement inactivos", enabled: reengagementEnabled, desc: "Cron diario para suscriptores sin actividad 60+ días" },
          ].map(({ label, enabled, desc }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <div>
                <p className="font-cinzel text-[10px] uppercase tracking-widest text-gray-300">{label}</p>
                <p className="font-crimson text-xs text-gray-600 mt-0.5">{desc}</p>
              </div>
              <span className={`flex items-center gap-1.5 font-cinzel text-[8px] uppercase tracking-widest ${enabled ? "text-emerald-400" : "text-gray-600"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-emerald-400" : "bg-gray-600"}`} />
                {enabled ? "Activa" : "Inactiva"}
              </span>
            </div>
          ))}
        </div>
      </AcademyCard>
    </div>
  );
}
