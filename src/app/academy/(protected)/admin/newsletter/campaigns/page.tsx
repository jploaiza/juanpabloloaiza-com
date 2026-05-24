import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AcademyCard from "@/components/academy/AcademyCard";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import { Plus, Send, Clock, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";

export const metadata: Metadata = { title: "Campañas — Newsletter" };
export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft:     { label: "Borrador",   cls: "bg-white/5 text-gray-500 border-white/10" },
    scheduled: { label: "Programada", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    sending:   { label: "Enviando",   cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    sent:      { label: "Enviada",    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    canceled:  { label: "Cancelada",  cls: "bg-red-500/10 text-red-400 border-red-500/20" },
    failed:    { label: "Fallida",    cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  };
  const s = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function StatIcon({ status }: { status: string }) {
  if (status === "sent") return <CheckCircle className="w-3 h-3 text-emerald-400" />;
  if (status === "scheduled") return <Clock className="w-3 h-3 text-amber-400" />;
  if (status === "sending") return <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />;
  if (status === "canceled" || status === "failed") return <XCircle className="w-3 h-3 text-red-400" />;
  return <FileText className="w-3 h-3 text-gray-600" />;
}

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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["", "Nombre", "Asunto", "Template", "Estado", "Fecha", "Enviados / Opens"].map((h) => (
                    <th key={h} className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4 last:pr-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition group">
                    <td className="py-3 pr-3 w-6">
                      <StatIcon status={c.status} />
                    </td>
                    <td className="py-3 pr-4 min-w-[140px]">
                      <Link href={`/academy/admin/newsletter/campaigns/${c.id}`}
                        className="font-crimson text-sm text-gray-200 hover:text-[#C5A059] transition">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 max-w-[200px]">
                      <span className="font-crimson text-sm text-gray-400 truncate block">{c.subject || "—"}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-600">{c.template_kind}</span>
                    </td>
                    <td className="py-3 pr-4"><StatusBadge status={c.status} /></td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span className="font-crimson text-xs text-gray-500">
                        {c.status === "sent" && c.sent_at
                          ? new Date(c.sent_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
                          : c.scheduled_at
                          ? new Date(c.scheduled_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
                          : new Date(c.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      {c.status === "sent" ? (
                        <span className="font-crimson text-xs text-gray-400">
                          {c.stats_cache?.sent ?? 0} / {c.stats_cache?.opened ?? 0}
                        </span>
                      ) : <span className="text-gray-700">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AcademyCard>
    </div>
  );
}
