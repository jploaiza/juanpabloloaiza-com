"use client";

import { useEffect, useState } from "react";
import { Loader2, Copy, Check, Filter } from "lucide-react";

interface Booking {
  id: string;
  booking_code: string;
  type: string;
  date: string;
  time_slot: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  status: string;
  zoom_join_url: string | null;
  google_event_link: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  rescheduled: "Reprogramada",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "text-green-400 border-green-500/30 bg-green-500/10",
  cancelled: "text-red-400 border-red-500/30 bg-red-500/10",
  rescheduled: "text-amber-400 border-amber-500/30 bg-amber-500/10",
};

export default function BookingsPanel() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function load(p = page) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    if (fromFilter) params.set("from", fromFilter);
    if (toFilter) params.set("to", toFilter);
    const res = await fetch(`/api/admin/calendar/bookings?${params}`);
    const d = await res.json();
    setBookings(d.bookings ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }

  useEffect(() => { load(1); setPage(1); }, [statusFilter, fromFilter, toFilter]);
  useEffect(() => { load(page); }, [page]);

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <h2 className="font-cinzel text-white text-sm uppercase tracking-widest">Reservas</h2>
        <span className="font-crimson text-gray-500 text-sm ml-auto">{total} total</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-[#0a1628] border border-white/10 p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500">Filtros</span>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#020617] border border-white/10 text-white text-xs px-3 py-1.5 font-crimson">
          <option value="">Todos los estados</option>
          <option value="confirmed">Confirmada</option>
          <option value="cancelled">Cancelada</option>
          <option value="rescheduled">Reprogramada</option>
        </select>
        <input type="date" value={fromFilter} onChange={(e) => setFromFilter(e.target.value)}
          className="bg-[#020617] border border-white/10 text-white text-xs px-3 py-1.5 font-crimson" />
        <input type="date" value={toFilter} onChange={(e) => setToFilter(e.target.value)}
          className="bg-[#020617] border border-white/10 text-white text-xs px-3 py-1.5 font-crimson" />
        <button onClick={() => { setStatusFilter(""); setFromFilter(""); setToFilter(""); }}
          className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 hover:text-gray-300 transition">
          Limpiar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-8 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Cargando…</div>
      ) : bookings.length === 0 ? (
        <p className="font-crimson text-gray-500 text-sm py-8 text-center">No hay reservas con estos filtros.</p>
      ) : (
        <>
          <div className="space-y-2">
            {bookings.map((b) => (
              <div key={b.id} className="bg-[#0a1628] border border-white/10 p-4">
                <div className="flex flex-wrap items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-cinzel text-white text-xs">{b.patient_name}</p>
                    <p className="font-crimson text-gray-400 text-xs">{b.patient_email} · {b.patient_phone}</p>
                  </div>
                  <span className={`font-cinzel text-[8px] uppercase tracking-widest px-2 py-0.5 border rounded-sm ${STATUS_COLORS[b.status] ?? "text-gray-400 border-white/10"}`}>
                    {STATUS_LABELS[b.status] ?? b.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3">
                  <p className="font-crimson text-sm text-[#C5A059]">{b.date} · {b.time_slot}</p>
                  <p className="font-crimson text-sm text-gray-400">{b.type === "session" ? "Sesión TRVP" : "Entrevista de Admisión"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCopy(b.booking_code)}
                    className="flex items-center gap-1.5 font-cinzel text-[8px] uppercase tracking-widest text-gray-500 border border-white/10 px-2.5 py-1 hover:border-white/20 transition"
                  >
                    {copied === b.booking_code ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
                    {b.booking_code}
                  </button>
                  {b.zoom_join_url && (
                    <button
                      onClick={() => handleCopy(b.zoom_join_url!)}
                      className="flex items-center gap-1.5 font-cinzel text-[8px] uppercase tracking-widest text-blue-400 border border-blue-500/20 px-2.5 py-1 hover:bg-blue-500/10 transition"
                    >
                      {copied === b.zoom_join_url ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                      Zoom link
                    </button>
                  )}
                  {b.google_event_link && (
                    <a
                      href={b.google_event_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-cinzel text-[8px] uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/20 px-2.5 py-1 hover:bg-[#C5A059]/10 transition"
                    >
                      Google Cal
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 border border-white/10 px-4 py-2 hover:border-white/20 disabled:opacity-40 transition">
                Anterior
              </button>
              <span className="font-cinzel text-[9px] text-gray-500">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 border border-white/10 px-4 py-2 hover:border-white/20 disabled:opacity-40 transition">
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
