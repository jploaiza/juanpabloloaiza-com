"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, Plus, Trash2, ChevronDown, ChevronUp,
  Mail, MessageCircle, Zap, Timer, Calendar,
} from "lucide-react";

interface ReminderConfig {
  id: string;
  label: string | null;
  day_of_week: number;
  hour_chile: number;
  channels: string[];
  patient_filter: string;
  whatsapp_template: string | null;
  send_mode: string;
  delay_min: number;
  delay_max: number;
  is_active: boolean;
  last_run_at: string | null;
  created_at: string;
}

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const FILTER_LABELS: Record<string, string> = {
  active: "Activos",
  paused: "Pausados",
  finished: "Finalizados",
  all: "Todos",
};

const EMPTY_FORM = {
  label: "",
  day_of_week: 1,
  hour_chile: 9,
  channels: ["whatsapp", "email"] as string[],
  patient_filter: "active",
  send_mode: "batch",
  delay_min: 30,
  delay_max: 120,
  whatsapp_template: "",
};

export default function AutoSchedulePanel() {
  const [configs, setConfigs] = useState<ReminderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showTemplate, setShowTemplate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/patients/reminder-configs");
      if (res.ok) {
        const { configs: data } = await res.json();
        setConfigs(data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleChannel(ch: string) {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(ch)
        ? f.channels.filter((c) => c !== ch)
        : [...f.channels, ch],
    }));
  }

  async function saveConfig() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        label: form.label || null,
        whatsapp_template: form.whatsapp_template || null,
      };
      const res = await fetch("/api/patients/reminder-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowForm(false);
        setForm(EMPTY_FORM);
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(config: ReminderConfig) {
    await fetch(`/api/patients/reminder-configs/${config.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !config.is_active }),
    });
    setConfigs((prev) => prev.map((c) => c.id === config.id ? { ...c, is_active: !c.is_active } : c));
  }

  async function deleteConfig(id: string) {
    if (!confirm("¿Eliminar esta regla automática?")) return;
    await fetch(`/api/patients/reminder-configs/${id}`, { method: "DELETE" });
    setConfigs((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="bg-[#0a1628] border border-[#C5A059]/20">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 border-b border-[#C5A059]/10"
      >
        <span className="font-cinzel text-xs uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
          <Settings size={12} className="text-[#C5A059]" /> Envío automático
        </span>
        {open ? <ChevronUp size={14} className="text-gray-600" /> : <ChevronDown size={14} className="text-gray-600" />}
      </button>

      {open && (
        <div className="px-5 py-4 space-y-3">
          {/* Config list */}
          {loading ? (
            <p className="text-gray-700 font-crimson text-sm text-center py-4">Cargando...</p>
          ) : configs.length === 0 && !showForm ? (
            <p className="text-gray-700 font-crimson text-sm text-center py-4">Sin reglas configuradas</p>
          ) : (
            <div className="space-y-2">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className={`flex items-center gap-3 px-3 py-2.5 border text-xs transition ${
                    config.is_active ? "border-[#C5A059]/20 bg-[#020617]" : "border-gray-800 bg-[#020617] opacity-50"
                  }`}
                >
                  <Calendar size={12} className={config.is_active ? "text-[#C5A059]" : "text-gray-600"} />
                  <div className="flex-1 min-w-0">
                    <p className="font-cinzel text-white text-[11px] truncate">
                      {config.label || `${DAYS[config.day_of_week]} a las ${config.hour_chile}:00`}
                    </p>
                    <p className="text-gray-500 font-crimson text-[10px] mt-0.5">
                      {DAYS[config.day_of_week]} {config.hour_chile}:00 ·{" "}
                      {FILTER_LABELS[config.patient_filter]} ·{" "}
                      {config.channels.map((c) => c === "email" ? "Email" : "WA").join(" + ")} ·{" "}
                      {config.send_mode === "human" ? `Humano (${config.delay_min}s–${config.delay_max}s)` : "Batch"}
                    </p>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => toggleActive(config)}
                    className={`flex-shrink-0 transition ${config.is_active ? "text-[#C5A059]" : "text-gray-600 hover:text-gray-400"}`}
                    title={config.is_active ? "Desactivar" : "Activar"}
                  >
                    {config.is_active
                      ? <span className="text-[10px] font-cinzel text-emerald-400">ON</span>
                      : <span className="text-[10px] font-cinzel text-gray-600">OFF</span>
                    }
                  </button>
                  <button
                    onClick={() => deleteConfig(config.id)}
                    className="flex-shrink-0 text-gray-700 hover:text-red-400 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          {showForm && (
            <div className="border border-[#C5A059]/20 p-4 space-y-3 bg-[#020617]">
              <p className="font-cinzel text-[11px] uppercase tracking-widest text-[#C5A059]">Nueva regla</p>

              {/* Label */}
              <div>
                <label className="text-gray-500 text-[10px] font-cinzel uppercase tracking-widest block mb-1">Nombre (opcional)</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="ej. Lunes activos"
                  className="w-full bg-[#0a1628] border border-[#C5A059]/15 text-white text-xs font-crimson px-3 py-1.5 outline-none focus:border-[#C5A059]/40"
                />
              </div>

              {/* Day + Hour */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-[10px] font-cinzel uppercase tracking-widest block mb-1">Día</label>
                  <select
                    value={form.day_of_week}
                    onChange={(e) => setForm((f) => ({ ...f, day_of_week: Number(e.target.value) }))}
                    className="w-full bg-[#0a1628] border border-[#C5A059]/15 text-white text-xs font-cinzel px-2 py-1.5 outline-none"
                  >
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] font-cinzel uppercase tracking-widest block mb-1">Hora (Chile)</label>
                  <select
                    value={form.hour_chile}
                    onChange={(e) => setForm((f) => ({ ...f, hour_chile: Number(e.target.value) }))}
                    className="w-full bg-[#0a1628] border border-[#C5A059]/15 text-white text-xs font-cinzel px-2 py-1.5 outline-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Patient filter */}
              <div>
                <label className="text-gray-500 text-[10px] font-cinzel uppercase tracking-widest block mb-1">Pacientes</label>
                <select
                  value={form.patient_filter}
                  onChange={(e) => setForm((f) => ({ ...f, patient_filter: e.target.value }))}
                  className="w-full bg-[#0a1628] border border-[#C5A059]/15 text-white text-xs font-cinzel px-2 py-1.5 outline-none"
                >
                  <option value="active">Activos</option>
                  <option value="paused">Pausados</option>
                  <option value="finished">Finalizados</option>
                  <option value="all">Todos</option>
                </select>
              </div>

              {/* Channels */}
              <div>
                <label className="text-gray-500 text-[10px] font-cinzel uppercase tracking-widest block mb-1.5">Canales</label>
                <div className="flex gap-2">
                  {[
                    { key: "whatsapp", icon: <MessageCircle size={11} />, label: "WhatsApp", color: "emerald" },
                    { key: "email", icon: <Mail size={11} />, label: "Email", color: "blue" },
                  ].map(({ key, icon, label, color }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleChannel(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-cinzel uppercase tracking-widest transition ${
                        form.channels.includes(key)
                          ? color === "emerald"
                            ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                            : "border-blue-500/50 text-blue-400 bg-blue-500/10"
                          : "border-gray-700 text-gray-600"
                      }`}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Send mode */}
              <div>
                <label className="text-gray-500 text-[10px] font-cinzel uppercase tracking-widest block mb-1.5">Modo</label>
                <div className="flex gap-2">
                  {[
                    { key: "batch", icon: <Zap size={11} />, label: "Batch" },
                    { key: "human", icon: <Timer size={11} />, label: "Humano" },
                  ].map(({ key, icon, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, send_mode: key }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-cinzel uppercase tracking-widest transition ${
                        form.send_mode === key
                          ? "border-[#C5A059]/50 text-[#C5A059] bg-[#C5A059]/10"
                          : "border-gray-700 text-gray-600"
                      }`}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delay range (human mode) */}
              {form.send_mode === "human" && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { field: "delay_min" as const, label: "Mín (seg)" },
                    { field: "delay_max" as const, label: "Máx (seg)" },
                  ].map(({ field, label }) => (
                    <div key={field}>
                      <label className="text-gray-500 text-[10px] font-cinzel uppercase tracking-widest block mb-1">{label}</label>
                      <input
                        type="number"
                        min={5}
                        value={form[field]}
                        onChange={(e) => setForm((f) => ({ ...f, [field]: Number(e.target.value) }))}
                        className="w-full bg-[#0a1628] border border-[#C5A059]/15 text-white text-xs font-crimson px-3 py-1.5 outline-none focus:border-[#C5A059]/40"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Template (optional) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowTemplate((v) => !v)}
                  className="text-[10px] font-cinzel uppercase tracking-widest text-gray-600 hover:text-gray-400 transition flex items-center gap-1"
                >
                  {showTemplate ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  Template WA (opcional)
                </button>
                {showTemplate && (
                  <textarea
                    value={form.whatsapp_template}
                    onChange={(e) => setForm((f) => ({ ...f, whatsapp_template: e.target.value }))}
                    placeholder="Dejar vacío para usar template por defecto. Variables: {nombre} {sesiones} {vencimiento} {dias}"
                    rows={3}
                    className="mt-2 w-full bg-[#0a1628] border border-[#C5A059]/15 text-white text-xs font-crimson px-3 py-2 outline-none focus:border-[#C5A059]/40 resize-none"
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                  className="px-3 py-1.5 text-[10px] font-cinzel uppercase tracking-widest text-gray-500 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveConfig}
                  disabled={saving || form.channels.length === 0}
                  className="px-4 py-1.5 bg-[#C5A059] text-[#020617] text-[10px] font-cinzel uppercase tracking-widest hover:bg-[#D4B06A] transition disabled:opacity-40"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          )}

          {/* Add button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-[10px] font-cinzel uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition"
            >
              <Plus size={11} /> Nueva regla
            </button>
          )}
        </div>
      )}
    </div>
  );
}
