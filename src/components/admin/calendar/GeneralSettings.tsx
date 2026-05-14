"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, AlertCircle, Check, Copy } from "lucide-react";

interface WorkingHours {
  mon: [number, number] | null;
  tue: [number, number] | null;
  wed: [number, number] | null;
  thu: [number, number] | null;
  fri: [number, number] | null;
  sat: [number, number] | null;
  sun: [number, number] | null;
}

interface CalendarConfig {
  working_hours: WorkingHours;
  slot_step_min: number;
  lead_time_min: number;
  buffer_before_min: number;
  buffer_after_min: number;
  lookahead_days: number;
  max_bookings_per_day: number;
  from_email: string;
  site_url: string;
  logo_url: string;
}

const DOW_LABELS: [keyof WorkingHours, string][] = [
  ["mon", "Lunes"],
  ["tue", "Martes"],
  ["wed", "Miércoles"],
  ["thu", "Jueves"],
  ["fri", "Viernes"],
  ["sat", "Sábado"],
  ["sun", "Domingo"],
];

const DEFAULT_CFG: CalendarConfig = {
  working_hours: { mon: [9, 19], tue: [9, 19], wed: [9, 19], thu: [9, 19], fri: [9, 19], sat: null, sun: null },
  slot_step_min: 30,
  lead_time_min: 30,
  buffer_before_min: 0,
  buffer_after_min: 0,
  lookahead_days: 60,
  max_bookings_per_day: 8,
  from_email: "",
  site_url: "",
  logo_url: "",
};

export default function GeneralSettings() {
  const [config, setConfig] = useState<CalendarConfig>(DEFAULT_CFG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/calendar/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.config) setConfig({ ...DEFAULT_CFG, ...d.config });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/calendar/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Error al guardar"); }
      else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch { setError("Error de conexión"); }
    finally { setSaving(false); }
  }

  function setHours(dow: keyof WorkingHours, idx: 0 | 1, val: number) {
    setConfig((c) => {
      const curr = c.working_hours[dow] ?? [9, 19];
      const next: [number, number] = [curr[0], curr[1]];
      next[idx] = val;
      return { ...c, working_hours: { ...c.working_hours, [dow]: next } };
    });
  }

  function copyToAll(dow: keyof WorkingHours) {
    setConfig((c) => {
      const hours = c.working_hours[dow];
      if (!hours) return c;
      const next = { ...c.working_hours };
      for (const key of Object.keys(next) as (keyof WorkingHours)[]) {
        next[key] = [hours[0], hours[1]];
      }
      return { ...c, working_hours: next };
    });
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Cargando…</div>;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Working hours */}
      <section>
        <h2 className="font-cinzel text-white text-sm uppercase tracking-widest mb-4">Horario de atención</h2>
        <div className="space-y-2">
          {DOW_LABELS.map(([dow, label]) => {
            const hours = config.working_hours[dow];
            return (
              <div key={dow} className="flex items-center gap-4 bg-[#0a1628] border border-white/10 px-4 py-3">
                <div className="flex items-center gap-2 w-28">
                  <input
                    type="checkbox"
                    checked={hours !== null}
                    onChange={(e) => setConfig((c) => ({
                      ...c,
                      working_hours: { ...c.working_hours, [dow]: e.target.checked ? [9, 19] : null },
                    }))}
                    className="accent-[#C5A059]"
                  />
                  <span className="font-crimson text-sm text-gray-300">{label}</span>
                </div>
                {hours ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="number" min={0} max={23} value={hours[0]}
                      onChange={(e) => setHours(dow, 0, parseInt(e.target.value))}
                      className="w-16 bg-[#020617] border border-white/10 text-white text-sm px-2 py-1 font-crimson"
                    />
                    <span className="text-gray-500 text-sm">—</span>
                    <input
                      type="number" min={0} max={23} value={hours[1]}
                      onChange={(e) => setHours(dow, 1, parseInt(e.target.value))}
                      className="w-16 bg-[#020617] border border-white/10 text-white text-sm px-2 py-1 font-crimson"
                    />
                    <span className="text-gray-500 text-xs">hrs</span>
                    <button
                      type="button"
                      onClick={() => copyToAll(dow)}
                      title="Copiar a todos los días"
                      className="ml-2 flex items-center gap-1 font-cinzel text-[8px] uppercase tracking-widest text-gray-500 border border-white/10 px-2 py-1 hover:text-[#C5A059] hover:border-[#C5A059]/30 transition"
                    >
                      <Copy className="w-2.5 h-2.5" /> Copiar a todos
                    </button>
                  </div>
                ) : (
                  <span className="font-crimson text-gray-600 text-sm">Cerrado</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Slot settings */}
      <section>
        <h2 className="font-cinzel text-white text-sm uppercase tracking-widest mb-4">Slots y reservas</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Paso de slot (min)", key: "slot_step_min", min: 5, max: 120 },
            { label: "Lead time (min)", key: "lead_time_min", min: 0, max: 1440 },
            { label: "Tiempo previo a la sesión (min)", key: "buffer_before_min", min: 0, max: 120 },
            { label: "Tiempo posterior a la sesión (min)", key: "buffer_after_min", min: 0, max: 120 },
            { label: "Días adelante", key: "lookahead_days", min: 1, max: 365 },
            { label: "Máx. citas/día", key: "max_bookings_per_day", min: 1, max: 50 },
          ].map(({ label, key, min, max }) => (
            <div key={key}>
              <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">{label}</label>
              <input
                type="number" min={min} max={max}
                value={(config as unknown as Record<string, number>)[key]}
                onChange={(e) => setConfig((c) => ({ ...c, [key]: parseInt(e.target.value) }))}
                className="w-full bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Email + URLs */}
      <section>
        <h2 className="font-cinzel text-white text-sm uppercase tracking-widest mb-4">Email y URLs</h2>
        <div className="space-y-3">
          {[
            { label: "FROM email", key: "from_email" },
            { label: "Site URL", key: "site_url" },
            { label: "Logo URL", key: "logo_url" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">{label}</label>
              <input
                type="text"
                value={(config as unknown as Record<string, string>)[key]}
                onChange={(e) => setConfig((c) => ({ ...c, [key]: e.target.value }))}
                className="w-full bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Save */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="font-crimson text-sm text-red-300">{error}</p>
        </div>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-[9px] uppercase tracking-widest px-6 py-3 hover:bg-[#C5A059]/90 disabled:opacity-60 transition"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
        {saving ? "Guardando…" : saved ? "Guardado" : "Guardar cambios"}
      </button>
    </div>
  );
}
