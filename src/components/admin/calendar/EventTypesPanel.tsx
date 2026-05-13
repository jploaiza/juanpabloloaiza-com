"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Check, AlertCircle, Pencil, X } from "lucide-react";

interface EventType {
  id: string;
  slug: string;
  label: string;
  duration_min: number;
  buffer_before_min: number;
  buffer_after_min: number;
  color: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

const EMPTY: Omit<EventType, "id" | "created_at"> = {
  slug: "", label: "", duration_min: 60, buffer_before_min: 0, buffer_after_min: 0,
  color: "#C5A059", description: "", sort_order: 99, is_active: true,
};

export default function EventTypesPanel() {
  const [types, setTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EventType | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/calendar/event-types");
    const d = await res.json();
    setTypes(d.types ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      let res: Response;
      if (editing) {
        res = await fetch(`/api/admin/calendar/event-types/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
      } else {
        res = await fetch("/api/admin/calendar/event-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
      }
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Error"); }
      else { setEditing(null); setCreating(false); setDraft({ ...EMPTY }); await load(); }
    } catch { setError("Error de conexión"); }
    finally { setSaving(false); }
  }

  async function handleToggle(t: EventType) {
    await fetch(`/api/admin/calendar/event-types/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !t.is_active }),
    });
    await load();
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Cargando…</div>;

  const showForm = editing !== null || creating;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-white text-sm uppercase tracking-widest">Tipos de evento</h2>
        {!showForm && (
          <button
            onClick={() => { setCreating(true); setDraft({ ...EMPTY }); }}
            className="flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/30 px-4 py-2 hover:bg-[#C5A059]/10 transition"
          >
            <Plus className="w-3 h-3" /> Nuevo tipo
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2">
        {types.map((t) => (
          <div key={t.id} className={`flex items-center gap-4 bg-[#0a1628] border px-4 py-3 ${t.is_active ? "border-white/10" : "border-white/5 opacity-60"}`}>
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
            <div className="flex-1 min-w-0">
              <p className="font-cinzel text-white text-xs">{t.label}</p>
              <p className="font-crimson text-gray-500 text-xs">{t.slug} · {t.duration_min} min</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { setEditing(t); setDraft({ slug: t.slug, label: t.label, duration_min: t.duration_min, buffer_before_min: t.buffer_before_min, buffer_after_min: t.buffer_after_min, color: t.color, description: t.description ?? "", sort_order: t.sort_order, is_active: t.is_active }); }}
                className="p-1.5 text-gray-500 hover:text-[#C5A059] transition"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleToggle(t)}
                className={`font-cinzel text-[8px] uppercase tracking-widest px-2 py-1 border transition ${t.is_active ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-white/10 text-gray-500 hover:border-white/20"}`}
              >
                {t.is_active ? "Activo" : "Inactivo"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#0a1628] border border-[#C5A059]/20 p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-cinzel text-[#C5A059] text-xs uppercase tracking-widest">
              {editing ? "Editar tipo" : "Nuevo tipo"}
            </p>
            <button onClick={() => { setEditing(null); setCreating(false); }} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Slug (único)</label>
              <input
                type="text" value={draft.slug} disabled={!!editing}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
                className="w-full bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson disabled:opacity-50"
                placeholder="session"
              />
            </div>
            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Label</label>
              <input
                type="text" value={draft.label}
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                className="w-full bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson"
                placeholder="Sesión TRVP"
              />
            </div>
            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Duración (min)</label>
              <input
                type="number" min={5} value={draft.duration_min}
                onChange={(e) => setDraft((d) => ({ ...d, duration_min: parseInt(e.target.value) }))}
                className="w-full bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson"
              />
            </div>
            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={draft.color} onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))} className="w-10 h-9 bg-transparent border-0 cursor-pointer" />
                <input type="text" value={draft.color} onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))} className="flex-1 bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson" />
              </div>
            </div>
            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Buffer antes (min)</label>
              <input type="number" min={0} value={draft.buffer_before_min} onChange={(e) => setDraft((d) => ({ ...d, buffer_before_min: parseInt(e.target.value) }))} className="w-full bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson" />
            </div>
            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Buffer después (min)</label>
              <input type="number" min={0} value={draft.buffer_after_min} onChange={(e) => setDraft((d) => ({ ...d, buffer_after_min: parseInt(e.target.value) }))} className="w-full bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson" />
            </div>
            <div className="col-span-2">
              <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Descripción</label>
              <input type="text" value={draft.description ?? ""} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} className="w-full bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson" />
            </div>
          </div>

          {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-2"><AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /><p className="font-crimson text-sm text-red-300">{error}</p></div>}

          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-[9px] uppercase tracking-widest px-6 py-2.5 hover:bg-[#C5A059]/90 disabled:opacity-60 transition">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      )}
    </div>
  );
}
