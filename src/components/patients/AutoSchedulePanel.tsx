"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, Plus, Trash2, ChevronDown, ChevronUp,
  Mail, MessageCircle, Zap, Timer, Calendar, Pencil, Check, CheckCircle,
} from "lucide-react";
import { type Patient, patientFullName } from "@/lib/patients";

interface ReminderConfig {
  id: string;
  label: string | null;
  day_of_week: number;
  hour_chile: number;
  minute_chile: number;
  channels: string[];
  patient_filter: string;
  patient_ids: string[] | null;
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
  without_appointment: "Sin cita esta semana",
  with_appointment: "Con cita esta semana",
  without_appointment_next_week: "Sin cita próx. semana",
  with_appointment_next_week: "Con cita próx. semana",
  specific: "Específicos",
};

const EMPTY_FORM = {
  label: "",
  day_of_week: 1,
  time_chile: "09:00",
  channels: ["whatsapp", "email"] as string[],
  patient_filter: "active",
  patient_ids: [] as string[],
  send_mode: "human",
  delay_min: 30,
  delay_max: 120,
  whatsapp_template: "",
};

function fmtTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute ?? 0).padStart(2, "0")}`;
}

export default function AutoSchedulePanel() {
  const [configs, setConfigs] = useState<ReminderConfig[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showTemplate, setShowTemplate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, pRes] = await Promise.all([
        fetch("/api/patients/reminder-configs"),
        fetch("/api/patients"),
      ]);
      if (cfgRes.ok) {
        const { configs: data } = await cfgRes.json();
        setConfigs(data ?? []);
      }
      if (pRes.ok) {
        const { patients: data } = await pRes.json();
        setPatients(data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleChannel(ch: string) {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter((c) => c !== ch) : [...f.channels, ch],
    }));
  }

  function togglePatient(id: string) {
    setForm((f) => ({
      ...f,
      patient_ids: f.patient_ids.includes(id)
        ? f.patient_ids.filter((x) => x !== id)
        : [...f.patient_ids, id],
    }));
  }

  function startEdit(config: ReminderConfig) {
    setForm({
      label: config.label ?? "",
      day_of_week: config.day_of_week,
      time_chile: fmtTime(config.hour_chile, config.minute_chile ?? 0),
      channels: config.channels ?? ["whatsapp", "email"],
      patient_filter: config.patient_filter,
      patient_ids: config.patient_ids ?? [],
      send_mode: config.send_mode,
      delay_min: config.delay_min,
      delay_max: config.delay_max,
      whatsapp_template: config.whatsapp_template ?? "",
    });
    setShowTemplate(!!config.whatsapp_template);
    setEditingId(config.id);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowTemplate(false);
    setPatientSearch("");
  }

  async function saveConfig() {
    setSaving(true);
    try {
      const [hh, mm] = form.time_chile.split(":").map(Number);
      const payload = {
        label: form.label || null,
        day_of_week: form.day_of_week,
        hour_chile: hh,
        minute_chile: mm ?? 0,
        channels: form.channels,
        patient_filter: form.patient_filter,
        patient_ids: form.patient_filter === "specific" && form.patient_ids.length > 0
          ? form.patient_ids
          : null,
        send_mode: form.send_mode,
        delay_min: form.delay_min,
        delay_max: form.delay_max,
        whatsapp_template: form.whatsapp_template || null,
      };

      const res = editingId
        ? await fetch(`/api/patients/reminder-configs/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/patients/reminder-configs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        const msg = editingId ? "Regla actualizada correctamente" : "Regla activada y guardada";
        cancelForm();
        await load();
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
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

  const filteredPatients = patients.filter((p) =>
    !patientSearch || patientFullName(p).toLowerCase().includes(patientSearch.toLowerCase()) || p.email.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <div className="bg-[#0a1628] border border-[#C5A059]/20">
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
          {/* Success toast */}
          {toast && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-cinzel uppercase tracking-widest">
              <CheckCircle size={12} />
              {toast}
            </div>
          )}

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
                      {config.label || `${DAYS[config.day_of_week]} a las ${fmtTime(config.hour_chile, config.minute_chile ?? 0)}`}
                    </p>
                    <p className="text-gray-500 font-crimson text-[10px] mt-0.5">
                      {DAYS[config.day_of_week]} {fmtTime(config.hour_chile, config.minute_chile ?? 0)} ·{" "}
                      {config.patient_filter === "specific"
                        ? `${config.patient_ids?.length ?? 0} específico${(config.patient_ids?.length ?? 0) !== 1 ? "s" : ""}`
                        : FILTER_LABELS[config.patient_filter] ?? config.patient_filter} ·{" "}
                      {config.channels.map((c) => c === "email" ? "Email" : "WA").join(" + ")} ·{" "}
                      {config.send_mode === "human" ? `Humano (${config.delay_min}s–${config.delay_max}s)` : "Batch"}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleActive(config)}
                    className={`flex-shrink-0 transition ${config.is_active ? "text-emerald-400" : "text-gray-600 hover:text-gray-400"}`}
                    title={config.is_active ? "Desactivar" : "Activar"}
                  >
                    <span className="text-[10px] font-cinzel">{config.is_active ? "ON" : "OFF"}</span>
                  </button>
                  <button onClick={() => startEdit(config)} title="Editar" className="flex-shrink-0 text-gray-600 hover:text-[#C5A059] transition">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => deleteConfig(config.id)} title="Eliminar" className="flex-shrink-0 text-gray-700 hover:text-red-400 transition">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          {showForm && (
            <div className="border border-[#C5A059]/20 p-4 space-y-3 bg-[#020617]">
              <p className="font-cinzel text-[11px] uppercase tracking-widest text-[#C5A059]">
                {editingId ? "Editar regla" : "Nueva regla"}
              </p>

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

              {/* Day + Time */}
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
                  <label className="text-gray-500 text-[10px] font-cinzel uppercase tracking-widest block mb-1">Hora Chile (HH:MM)</label>
                  <input
                    type="time"
                    value={form.time_chile}
                    onChange={(e) => setForm((f) => ({ ...f, time_chile: e.target.value }))}
                    className="w-full bg-[#0a1628] border border-[#C5A059]/15 text-white text-xs font-cinzel px-2 py-1.5 outline-none focus:border-[#C5A059]/40 [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Patient filter */}
              <div>
                <label className="text-gray-500 text-[10px] font-cinzel uppercase tracking-widest block mb-1">Pacientes</label>
                <select
                  value={form.patient_filter}
                  onChange={(e) => setForm((f) => ({ ...f, patient_filter: e.target.value, patient_ids: [] }))}
                  className="w-full bg-[#0a1628] border border-[#C5A059]/15 text-white text-xs font-cinzel px-2 py-1.5 outline-none"
                >
                  <option value="active">Activos</option>
                  <option value="paused">Pausados</option>
                  <option value="finished">Finalizados</option>
                  <option value="all">Todos</option>
                  <option value="without_appointment">Sin cita esta semana</option>
                  <option value="with_appointment">Con cita esta semana</option>
                  <option value="without_appointment_next_week">Sin cita próxima semana</option>
                  <option value="with_appointment_next_week">Con cita próxima semana</option>
                  <option value="specific">Específicos (elegir)</option>
                </select>
              </div>

              {/* Specific patient picker */}
              {form.patient_filter === "specific" && (
                <div className="border border-[#C5A059]/15 bg-[#0a1628]">
                  <div className="px-3 pt-2.5 pb-1.5 border-b border-[#C5A059]/10 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-cinzel text-gray-500 uppercase tracking-widest">
                      {form.patient_ids.length} seleccionado{form.patient_ids.length !== 1 ? "s" : ""}
                    </span>
                    <input
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder="Buscar..."
                      className="bg-[#020617] border border-[#C5A059]/10 text-white text-[10px] font-crimson px-2 py-1 outline-none w-32"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-[#C5A059]/6">
                    {filteredPatients.map((p) => {
                      const isSel = form.patient_ids.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => togglePatient(p.id)}
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition text-[10px] ${isSel ? "bg-[#C5A059]/8" : "hover:bg-white/[0.02]"}`}
                        >
                          <div className={`flex-shrink-0 w-3.5 h-3.5 border flex items-center justify-center ${isSel ? "border-[#C5A059] bg-[#C5A059]/20" : "border-gray-700"}`}>
                            {isSel && <Check size={8} className="text-[#C5A059]" />}
                          </div>
                          <span className="font-cinzel text-white truncate flex-1">{patientFullName(p)}</span>
                          <span className="text-gray-600 font-crimson truncate">{p.status}</span>
                        </div>
                      );
                    })}
                    {filteredPatients.length === 0 && (
                      <p className="py-4 text-center text-gray-700 font-crimson text-[10px]">Sin resultados</p>
                    )}
                  </div>
                </div>
              )}

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
                <button type="button" onClick={cancelForm} className="px-3 py-1.5 text-[10px] font-cinzel uppercase tracking-widest text-gray-500 hover:text-white transition">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveConfig}
                  disabled={saving || form.channels.length === 0 || (form.patient_filter === "specific" && form.patient_ids.length === 0)}
                  className="px-4 py-1.5 bg-[#C5A059] text-[#020617] text-[10px] font-cinzel uppercase tracking-widest hover:bg-[#D4B06A] transition disabled:opacity-40"
                >
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
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
