"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, CheckCircle, Clock, FileText, XCircle, Loader2, BarChart2 } from "lucide-react";

type Campaign = {
  id: string; name: string; subject: string; template_kind: string;
  status: string; scheduled_at: string | null; sent_at: string | null;
  stats_cache: Record<string, number>; created_at: string;
};

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

export default function CampaignsList({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === campaigns.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(campaigns.map((c) => c.id)));
    }
  };

  async function deleteCampaign(id: string) {
    setDeleting(true);
    const res = await fetch(`/api/newsletter/campaigns/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
      setConfirmDelete(null);
    } else {
      const { error } = await res.json().catch(() => ({ error: "Error al eliminar" }));
      alert(error ?? "Error al eliminar");
    }
  }

  async function deleteSelected() {
    setDeleting(true);
    const ids = [...selected];
    await Promise.all(ids.map((id) => fetch(`/api/newsletter/campaigns/${id}`, { method: "DELETE" })));
    setCampaigns((prev) => prev.filter((c) => !selected.has(c.id)));
    setSelected(new Set());
    setBulkConfirm(false);
    setDeleting(false);
    router.refresh();
  }

  if (campaigns.length === 0) return null;

  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-[#0a1628] border border-[#C5A059]/20 px-4 py-2.5 mb-3">
          <span className="font-crimson text-sm text-[#C5A059]">
            {selected.size} seleccionada{selected.size > 1 ? "s" : ""}
          </span>
          {bulkConfirm ? (
            <div className="flex items-center gap-3">
              <span className="font-crimson text-sm text-red-400">¿Eliminar {selected.size} campaña{selected.size > 1 ? "s" : ""}?</span>
              <button onClick={deleteSelected} disabled={deleting}
                className="font-cinzel text-[9px] uppercase tracking-widest px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition disabled:opacity-50">
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirmar"}
              </button>
              <button onClick={() => setBulkConfirm(false)}
                className="font-cinzel text-[9px] uppercase tracking-widest px-3 py-1.5 border border-white/10 text-gray-500 hover:text-white transition">
                Cancelar
              </button>
            </div>
          ) : (
            <button onClick={() => setBulkConfirm(true)}
              className="flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-widest px-3 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">
              <Trash2 className="w-3 h-3" /> Eliminar seleccionadas
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="pb-3 pr-3 w-8">
                <input type="checkbox"
                  checked={selected.size === campaigns.length && campaigns.length > 0}
                  onChange={toggleAll}
                  className="accent-[#C5A059] w-3.5 h-3.5 cursor-pointer" />
              </th>
              <th className="pb-3 pr-3 w-6" />
              {["Nombre", "Asunto", "Template", "Estado", "Fecha", "Enviados / Opens", ""].map((h) => (
                <th key={h} className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4 last:pr-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition group ${selected.has(c.id) ? "bg-[#C5A059]/5" : ""}`}>
                <td className="py-3 pr-3">
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)}
                    className="accent-[#C5A059] w-3.5 h-3.5 cursor-pointer" />
                </td>
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
                <td className="py-3 pr-4 whitespace-nowrap">
                  {c.status === "sent" ? (
                    <div className="flex items-center gap-2">
                      <span className="font-crimson text-xs text-gray-400">
                        {c.stats_cache?.sent ?? 0} / {c.stats_cache?.opened ?? 0}
                      </span>
                      <Link href={`/academy/admin/newsletter/envios/${c.id}`}
                        className="opacity-0 group-hover:opacity-100 p-1 border border-[#C5A059]/20 text-[#C5A059]/60 hover:text-[#C5A059] hover:border-[#C5A059]/50 transition"
                        title="Ver resultados">
                        <BarChart2 className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : <span className="text-gray-700">—</span>}
                </td>
                <td className="py-3 text-right">
                  {confirmDelete === c.id ? (
                    <div className="flex items-center gap-2 justify-end">
                      <span className="font-crimson text-xs text-red-400">¿Eliminar?</span>
                      <button onClick={() => deleteCampaign(c.id)} disabled={deleting}
                        className="font-cinzel text-[8px] uppercase tracking-widest px-2 py-1 bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition disabled:opacity-50">
                        {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sí"}
                      </button>
                      <button onClick={() => setConfirmDelete(null)}
                        className="font-cinzel text-[8px] uppercase tracking-widest px-2 py-1 border border-white/10 text-gray-500 hover:text-white transition">
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(c.id)}
                      disabled={c.status === "sending"}
                      className="opacity-0 group-hover:opacity-100 p-1.5 border border-red-500/20 text-red-400/50 hover:text-red-400 hover:border-red-500/40 transition disabled:cursor-not-allowed disabled:opacity-20"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
