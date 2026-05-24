import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AcademyCard from "@/components/academy/AcademyCard";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import CampaignsList from "@/components/newsletter/CampaignsList";
import { Plus, Send } from "lucide-react";

export const metadata: Metadata = { title: "Campañas — Newsletter" };
export const dynamic = "force-dynamic";

type Campaign = {
  id: string; name: string; subject: string; template_kind: string;
  status: string; scheduled_at: string | null; sent_at: string | null;
  stats_cache: Record<string, number>; created_at: string;
};

export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  const adminSb = await createAdminClient();
  const { data } = await adminSb
    .from("newsletter_campaigns")
    .select("id, name, subject, template_kind, status, scheduled_at, sent_at, stats_cache, created_at")
    .order("created_at", { ascending: false });

  const campaigns = (data ?? []) as Campaign[];
  const stats = {
    total: campaigns.length,
    sent: campaigns.filter((c) => c.status === "sent").length,
    scheduled: campaigns.filter((c) => c.status === "scheduled").length,
    draft: campaigns.filter((c) => c.status === "draft").length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Newsletter</p>
          <h1 className="font-cinzel text-2xl text-white">Campañas</h1>
        </div>
        <Link href="/academy/admin/newsletter/campaigns/nuevo"
          className="flex items-center gap-2 bg-[#C5A059] hover:bg-[#d4b06a] text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-4 py-2.5 transition">
          <Plus className="w-3.5 h-3.5" /> Nueva campaña
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: stats.total },
          { label: "Enviadas", value: stats.sent, accent: "text-emerald-400" },
          { label: "Programadas", value: stats.scheduled, accent: "text-amber-400" },
          { label: "Borradores", value: stats.draft, accent: "text-gray-400" },
        ].map(({ label, value, accent }) => (
          <div key={label} className="relative bg-[#16213e] border border-white/5 p-5 overflow-hidden">
            <ScrollworkCorners size={36} opacity={0.7} />
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
            <p className={`font-cinzel text-2xl ${accent ?? "text-white"}`}>{value}</p>
          </div>
        ))}
      </div>

      <AcademyCard>
        {campaigns.length === 0 ? (
          <div className="text-center py-16">
            <Send className="w-10 h-10 text-[#C5A059]/20 mx-auto mb-4" />
            <p className="font-cinzel text-sm text-gray-600">No hay campañas aún</p>
            <Link href="/academy/admin/newsletter/campaigns/nuevo"
              className="inline-block mt-4 bg-[#C5A059] text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-5 py-2.5">
              Crear primera campaña
            </Link>
          </div>
        ) : (
          <CampaignsList initialCampaigns={campaigns} />
        )}
      </AcademyCard>
    </div>
  );
}
