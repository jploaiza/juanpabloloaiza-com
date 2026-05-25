"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Download, Upload, Search, Loader2, UserX, Tag } from "lucide-react";
import AcademyCard from "@/components/academy/AcademyCard";
import ImportCSV from "./ImportCSV";

interface Subscriber {
  id: string; name: string; apellido: string; email: string;
  status: string; tags: string[]; source: string;
  confirmed_at: string | null; created_at: string; last_engaged_at: string | null;
}

interface NLList {
  slug: string;
  label: string;
  preset: boolean;
  count: number;
}

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "confirmed", label: "Confirmados" },
  { value: "pending", label: "Pendientes" },
  { value: "unsubscribed", label: "Bajas" },
  { value: "bounced", label: "Rebotados" },
];

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-400", pending: "bg-amber-400",
    unsubscribed: "bg-gray-600", bounced: "bg-red-400", complained: "bg-red-600",
  };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${map[status] ?? "bg-gray-600"}`} />;
}

export default function SubscribersList() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("lista") ?? "";
  });
  const [lists, setLists] = useState<NLList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addToListSlug, setAddToListSlug] = useState("");
  const [addToListLoading, setAddToListLoading] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    void fetch("/api/newsletter/lists").then((r) => r.json()).then((d: { lists?: NLList[] }) => setLists(d.lists ?? []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (status) params.set("status", status);
    if (search.trim()) params.set("q", search.trim());
    if (listFilter) params.set("tag", `lista:${listFilter}`);
    const res = await fetch(`/api/newsletter/subscribers?${params}`);
    const data = await res.json();
    setSubscribers(data.subscribers ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, status, search, listFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  function toggleSelect(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function bulkDelete() {
    if (!selected.size || !confirm(`¿Eliminar ${selected.size} suscriptores?`)) return;
    await Promise.all([...selected].map((id) => fetch(`/api/newsletter/subscribers/${id}`, { method: "DELETE" })));
    setSelected(new Set());
    load();
  }

  async function bulkAddToList(action: "add" | "remove") {
    if (!selected.size || !addToListSlug) return;
    setAddToListLoading(true);
    await fetch(`/api/newsletter/lists/${addToListSlug}/subscribers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriber_ids: [...selected], action }),
    });
    setAddToListLoading(false);
    setSelected(new Set());
    load();
  }

  function exportCSV() {
    const url = `/api/newsletter/subscribers/export?status=${status || "all"}`;
    window.location.href = url;
  }

  const pages = Math.ceil(total / 50);

  return (
    <>
      {showImport && <ImportCSV onClose={() => { setShowImport(false); load(); }} />}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => { setStatus(f.value); setPage(1); }}
              className={`font-cinzel text-[9px] uppercase tracking-widest px-3 py-1.5 border transition ${
                status === f.value ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/8" : "border-white/10 text-gray-500 hover:border-[#C5A059]/30"
              }`}>{f.label}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10 font-cinzel text-[9px] uppercase tracking-widest px-3 py-2 transition">
            <Upload className="w-3 h-3" /> Importar CSV
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 border border-white/10 text-gray-400 hover:text-[#C5A059] font-cinzel text-[9px] uppercase tracking-widest px-3 py-2 transition">
            <Download className="w-3 h-3" /> Exportar
          </button>
        </div>
      </div>

      {lists.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          <button onClick={() => { setListFilter(""); setPage(1); }}
            className={`font-cinzel text-[8px] uppercase tracking-widest px-2.5 py-1 border transition ${
              !listFilter ? "border-[#C5A059]/60 text-[#C5A059] bg-[#C5A059]/8" : "border-white/10 text-gray-600 hover:border-[#C5A059]/30 hover:text-gray-400"
            }`}>
            Todas las listas
          </button>
          {lists.map((l) => (
            <button key={l.slug} onClick={() => { setListFilter(l.slug); setPage(1); }}
              className={`font-cinzel text-[8px] uppercase tracking-widest px-2.5 py-1 border transition ${
                listFilter === l.slug ? "border-[#C5A059]/60 text-[#C5A059] bg-[#C5A059]/8" : "border-white/10 text-gray-600 hover:border-[#C5A059]/30 hover:text-gray-400"
              }`}>
              {l.label} ({l.count})
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-[#0a1628] border border-white/10 px-3 py-2">
          <Search className="w-3.5 h-3.5 text-gray-600" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre o email..."
            className="flex-1 bg-transparent text-gray-300 font-crimson text-sm focus:outline-none placeholder-gray-600" />
        </div>
        {selected.size > 0 && lists.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-gray-500" />
            <select value={addToListSlug} onChange={(e) => setAddToListSlug(e.target.value)}
              className="bg-[#0a1628] border border-white/10 text-gray-400 font-cinzel text-[8px] uppercase tracking-widest px-2 py-1.5 focus:outline-none focus:border-[#C5A059]/40">
              <option value="">Asignar lista...</option>
              {lists.map((l) => <option key={l.slug} value={l.slug}>{l.label}</option>)}
            </select>
            {addToListSlug && (
              <>
                <button onClick={() => bulkAddToList("add")} disabled={addToListLoading}
                  className="border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10 font-cinzel text-[8px] uppercase tracking-widest px-2 py-1.5 transition disabled:opacity-50">
                  {addToListLoading ? "..." : `+ ${selected.size}`}
                </button>
                <button onClick={() => bulkAddToList("remove")} disabled={addToListLoading}
                  className="border border-white/10 text-gray-500 hover:text-[#C5A059] font-cinzel text-[8px] uppercase tracking-widest px-2 py-1.5 transition disabled:opacity-50">
                  Quitar
                </button>
              </>
            )}
          </div>
        )}
        {selected.size > 0 && (
          <button onClick={bulkDelete}
            className="flex items-center gap-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-cinzel text-[9px] uppercase tracking-widest px-3 py-2 transition">
            <UserX className="w-3 h-3" /> Eliminar ({selected.size})
          </button>
        )}
      </div>

      <AcademyCard>
        <div className="flex items-center justify-between mb-4">
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500">
            {total} suscriptores
          </p>
          <div className="flex items-center gap-4 text-xs font-crimson text-gray-600">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Confirmado</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Pendiente</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-600 inline-block" /> Baja</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="w-5 h-5 text-[#C5A059] animate-spin" />
            <span className="font-crimson text-sm text-gray-500">Cargando...</span>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-[#C5A059]/20 mx-auto mb-4" />
            <p className="font-cinzel text-sm text-gray-600">No hay suscriptores{search || status ? " con esos filtros" : " aún"}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="pb-3 pr-3 w-6">
                      <input type="checkbox" checked={selected.size === subscribers.length && subscribers.length > 0}
                        onChange={(e) => setSelected(e.target.checked ? new Set(subscribers.map((s) => s.id)) : new Set())}
                        className="accent-[#C5A059]" />
                    </th>
                    {["", "Nombre", "Email", "Estado", "Tags", "Fuente", "Fecha"].map((h) => (
                      <th key={h} className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4 last:pr-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s) => (
                    <tr key={s.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                      <td className="py-3 pr-3 w-6">
                        <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} className="accent-[#C5A059]" />
                      </td>
                      <td className="py-3 pr-3 w-4"><StatusDot status={s.status} /></td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <span className="font-crimson text-sm text-gray-200">{s.name} {s.apellido}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <a href={`mailto:${s.email}`} className="font-crimson text-sm text-[#C5A059]/70 hover:text-[#C5A059] transition">{s.email}</a>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-cinzel text-[8px] uppercase tracking-widest text-gray-500">{s.status}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {(s.tags ?? []).map((t) => (
                            <span key={t} className="inline-block px-1.5 py-0.5 bg-[#C5A059]/10 text-[#C5A059] font-cinzel text-[8px] uppercase tracking-widest">{t}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600">{s.source ?? "web"}</span>
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <span className="font-crimson text-xs text-gray-500">
                          {new Date(s.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="font-cinzel text-[9px] uppercase tracking-widest px-3 py-1.5 border border-white/10 text-gray-500 hover:text-[#C5A059] disabled:opacity-30 transition">
                  ← Anterior
                </button>
                <span className="font-crimson text-xs text-gray-500">{page} / {pages}</span>
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                  className="font-cinzel text-[9px] uppercase tracking-widest px-3 py-1.5 border border-white/10 text-gray-500 hover:text-[#C5A059] disabled:opacity-30 transition">
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </AcademyCard>
    </>
  );
}
