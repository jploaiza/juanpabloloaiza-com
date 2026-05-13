"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";

interface Blackout {
  id: string;
  date_start: string;
  date_end: string | null;
  reason: string | null;
  created_at: string;
}

export default function BlackoutsPanel() {
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ date_start: "", date_end: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/calendar/blackouts");
    const d = await res.json();
    setBlackouts(d.blackouts ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!draft.date_start) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/calendar/blackouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date_start: draft.date_start,
          date_end: draft.date_end || null,
          reason: draft.reason || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Error"); }
      else { setAdding(false); setDraft({ date_start: "", date_end: "", reason: "" }); await load(); }
    } catch { setError("Error de conexión"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/calendar/blackouts/${id}`, { method: "DELETE" });
    await load();
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Cargando…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-white text-sm uppercase tracking-widest">Días bloqueados</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/30 px-4 py-2 hover:bg-[#C5A059]/10 transition"
          >
            <Plus className="w-3 h-3" /> Bloquear fecha
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-[#0a1628] border border-[#C5A059]/20 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Fecha inicio</label>
              <input type="date" value={draft.date_start} onChange={(e) => setDraft((d) => ({ ...d, date_start: e.target.value }))} className="w-full bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson" />
            </div>
            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Fecha fin (opcional)</label>
              <input type="date" value={draft.date_end} onChange={(e) => setDraft((d) => ({ ...d, date_end: e.target.value }))} className="w-full bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson" />
            </div>
            <div className="col-span-2">
              <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Razón (opcional)</label>
              <input type="text" value={draft.reason} onChange={(e) => setDraft((d) => ({ ...d, reason: e.target.value }))} className="w-full bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson" placeholder="Vacaciones, feriado…" />
            </div>
          </div>
          {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-2"><AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /><p className="font-crimson text-sm text-red-300">{error}</p></div>}
          <div className="flex gap-3">
            <button onClick={handleAdd} disabled={saving || !draft.date_start} className="flex items-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-[9px] uppercase tracking-widest px-5 py-2.5 hover:bg-[#C5A059]/90 disabled:opacity-60 transition">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Bloquear
            </button>
            <button onClick={() => setAdding(false)} className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 border border-white/10 px-5 py-2.5 hover:border-white/20 transition">Cancelar</button>
          </div>
        </div>
      )}

      {blackouts.length === 0 ? (
        <p className="font-crimson text-gray-500 text-sm">No hay días bloqueados.</p>
      ) : (
        <div className="space-y-2">
          {blackouts.map((b) => (
            <div key={b.id} className="flex items-center gap-4 bg-[#0a1628] border border-white/10 px-4 py-3">
              <div className="flex-1">
                <p className="font-crimson text-white text-sm">
                  {b.date_start}{b.date_end && b.date_end !== b.date_start ? ` — ${b.date_end}` : ""}
                </p>
                {b.reason && <p className="font-crimson text-gray-400 text-xs">{b.reason}</p>}
              </div>
              <button onClick={() => handleDelete(b.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
