"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell, Send, Check, MessageCircle, Mail, RefreshCw,
  Users, Activity, Clock, ChevronDown, ChevronUp,
  Zap, Timer, Hash, Shuffle, Eye, EyeOff, AlertCircle, Calendar,
} from "lucide-react";
import {
  type Patient, type PatientStatus,
  sessionsLeft, daysLeft, daysLeftColor, statusLabel, statusColor, patientFullName,
  DEFAULT_REMINDER_TEMPLATE, DEFAULT_REMINDER_TEMPLATE_SIN_SESIONES,
  REMINDER_TEMPLATE_KEY, REMINDER_TEMPLATE_SIN_SESIONES_KEY,
} from "@/lib/patients";
import Link from "next/link";
import AutoSchedulePanel from "./AutoSchedulePanel";

// ── Types ───────────────────────────────────────────────────────
interface SendResult {
  id: string;
  name: string;
  email: boolean;
  whatsapp: boolean;
  error?: string;
}

interface ReminderLog {
  id: string;
  patient_id: string;
  patient_name?: string;
  content: string;
  created_at: string;
}

type FilterTab = PatientStatus | "all";
type SendMode = "batch" | "human";
type Channel = "whatsapp" | "email";

// Aliases for convenience within this component
const DEFAULT_TEMPLATE = DEFAULT_REMINDER_TEMPLATE;
const DEFAULT_TEMPLATE_SIN_SESIONES = DEFAULT_REMINDER_TEMPLATE_SIN_SESIONES;

const VARIABLES = [
  { label: "{nombre}", desc: "Primer nombre" },
  { label: "{sesiones}", desc: "Sesiones restantes" },
  { label: "{vencimiento}", desc: "Fecha vencimiento" },
  { label: "{dias}", desc: "Días restantes" },
];

const FILTER_TABS: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "Todos", icon: <Hash size={12} /> },
  { key: "active", label: "Activos", icon: <Activity size={12} /> },
  { key: "paused", label: "Pausados", icon: <Clock size={12} /> },
  { key: "finished", label: "Finalizados", icon: <Users size={12} /> },
];

function renderPreview(tpl: string, patient: Patient): string {
  const sl = sessionsLeft(patient);
  const exp = new Date(patient.end_date + "T12:00:00").toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
  const now = new Date(); now.setHours(0,0,0,0);
  const dias = Math.ceil((new Date(patient.end_date + "T00:00:00").getTime() - now.getTime()) / 86400000);
  return tpl
    .replace(/\{nombre\}/g, patient.first_name)
    .replace(/\{sesiones\}/g, String(sl))
    .replace(/\{vencimiento\}/g, exp)
    .replace(/\{dias\}/g, String(dias));
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ── Main component ──────────────────────────────────────────────
export default function RemindersConsole() {
  // Data
  const [patients, setPatients] = useState<Patient[]>([]);
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & selection
  const [filterTab, setFilterTab] = useState<FilterTab>("active");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Template
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [templateSinSesiones, setTemplateSinSesiones] = useState(DEFAULT_TEMPLATE_SIN_SESIONES);
  const [activeTemplateTab, setActiveTemplateTab] = useState<"con_sesiones" | "sin_sesiones">("con_sesiones");
  const [showPreview, setShowPreview] = useState(false);
  const [previewPatient, setPreviewPatient] = useState<Patient | null>(null);

  // Send config
  const [sendMode, setSendMode] = useState<SendMode>("batch");
  const [channels, setChannels] = useState<Channel[]>(["whatsapp", "email"]);
  const [delayMin, setDelayMin] = useState(30);
  const [delayMax, setDelayMax] = useState(120);

  // Send state
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; results: SendResult[] } | null>(null);
  const abortRef = useRef(false);

  // History
  const [showHistory, setShowHistory] = useState(true);

  // Google Calendar integration
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [scheduledIds, setScheduledIds] = useState<Set<string>>(new Set());
  const [skipScheduled, setSkipScheduled] = useState(false);
  const [weekRange, setWeekRange] = useState<{ start?: string; end?: string }>({});

  // Load
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, lRes] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/patients/reminder-logs"),
      ]);
      const { patients: p } = await pRes.json();
      const { logs: l } = lRes.ok ? await lRes.json() : { logs: [] };
      setPatients(p ?? []);
      setLogs(l ?? []);
      if (!previewPatient && p?.length) {
        setPreviewPatient(p.find((pt: Patient) => pt.status === "active") ?? p[0]);
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadCalendarStatus = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const statusRes = await fetch("/api/calendar/status");
      if (!statusRes.ok) { setCalendarConnected(false); return; }
      const { connected } = await statusRes.json();
      setCalendarConnected(connected);
      if (connected) {
        const evRes = await fetch("/api/calendar/week-events");
        if (evRes.ok) {
          const data = await evRes.json();
          const ids = new Set<string>(
            (data.statuses as { patient_id: string; scheduled: boolean }[])
              .filter((s) => s.scheduled)
              .map((s) => s.patient_id),
          );
          setScheduledIds(ids);
          setWeekRange({ start: data.week_start, end: data.week_end });
        }
      }
    } catch { /* calendar unavailable */ }
    finally { setCalendarLoading(false); }
  }, []);

  useEffect(() => { loadCalendarStatus(); }, [loadCalendarStatus]);

  // Load saved templates from localStorage on mount (read-only — edits here are temporary)
  useEffect(() => {
    const saved = localStorage.getItem(REMINDER_TEMPLATE_KEY);
    if (saved) setTemplate(saved);
    const savedSin = localStorage.getItem(REMINDER_TEMPLATE_SIN_SESIONES_KEY);
    if (savedSin) setTemplateSinSesiones(savedSin);
  }, []);

  function restoreFromSettings() {
    const saved = localStorage.getItem(REMINDER_TEMPLATE_KEY) ?? DEFAULT_TEMPLATE;
    const savedSin = localStorage.getItem(REMINDER_TEMPLATE_SIN_SESIONES_KEY) ?? DEFAULT_TEMPLATE_SIN_SESIONES;
    setTemplate(saved);
    setTemplateSinSesiones(savedSin);
  }

  // Filtered patients
  const filtered = patients
    .filter((p) => filterTab === "all" || p.status === filterTab)
    .filter((p) =>
      !search ||
      patientFullName(p).toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
    )
    .filter((p) => !skipScheduled || !scheduledIds.has(p.id));

  const counts: Record<FilterTab, number> = {
    all: patients.length,
    active: patients.filter((p) => p.status === "active").length,
    paused: patients.filter((p) => p.status === "paused").length,
    finished: patients.filter((p) => p.status === "finished").length,
  };

  // Selection
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (filtered.every((p) => selected.has(p.id))) {
      setSelected((prev) => { const next = new Set(prev); filtered.forEach((p) => next.delete(p.id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); filtered.forEach((p) => next.add(p.id)); return next; });
    }
  }

  const selectedIds = [...selected].filter((id) => patients.find((p) => p.id === id));
  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  // Toggle channel
  function toggleChannel(ch: Channel) {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  }

  // Send
  async function sendAll() {
    if (!selectedIds.length) return;
    setSending(true);
    abortRef.current = false;
    setProgress({ current: 0, total: selectedIds.length, results: [] });

    function templateFor(patientId: string): string {
      const p = patients.find((pt) => pt.id === patientId);
      return p && sessionsLeft(p) === 0 ? templateSinSesiones : template;
    }

    if (sendMode === "batch") {
      try {
        // Split into two groups: with sessions and without sessions
        const withSessions = selectedIds.filter((id) => {
          const p = patients.find((pt) => pt.id === id);
          return !p || sessionsLeft(p) > 0;
        });
        const withoutSessions = selectedIds.filter((id) => {
          const p = patients.find((pt) => pt.id === id);
          return p && sessionsLeft(p) === 0;
        });

        const allResults: SendResult[] = [];
        const calls: Promise<void>[] = [];

        if (withSessions.length) {
          calls.push(
            fetch("/api/patients/send-reminders-now", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ patient_ids: withSessions, whatsapp_template: template, channels }),
            }).then((r) => r.json()).then((d) => { allResults.push(...(d.results ?? [])); })
          );
        }
        if (withoutSessions.length) {
          calls.push(
            fetch("/api/patients/send-reminders-now", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ patient_ids: withoutSessions, whatsapp_template: templateSinSesiones, channels }),
            }).then((r) => r.json()).then((d) => { allResults.push(...(d.results ?? [])); })
          );
        }

        await Promise.all(calls);
        setProgress({ current: selectedIds.length, total: selectedIds.length, results: allResults });
      } catch {
        setProgress((p) => p ? { ...p, results: [...p.results, { id: "", name: "Error de red", email: false, whatsapp: false }] } : null);
      }
    } else {
      // Human mode: send one by one with random delay
      const results: SendResult[] = [];
      for (let i = 0; i < selectedIds.length; i++) {
        if (abortRef.current) break;
        try {
          const res = await fetch("/api/patients/send-reminders-now", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ patient_ids: [selectedIds[i]], whatsapp_template: templateFor(selectedIds[i]), channels }),
          });
          const data = await res.json();
          if (data.results?.[0]) results.push(data.results[0]);
        } catch {
          const p = patients.find((pt) => pt.id === selectedIds[i]);
          results.push({ id: selectedIds[i], name: p ? patientFullName(p) : "?", email: false, whatsapp: false, error: "Error de red" });
        }
        setProgress({ current: i + 1, total: selectedIds.length, results: [...results] });
        if (i < selectedIds.length - 1 && !abortRef.current) {
          const delay = (delayMin + Math.random() * (delayMax - delayMin)) * 1000;
          await sleep(delay);
        }
      }
    }

    setSending(false);
    await load(); // refresh logs
  }

  function stopSend() {
    abortRef.current = true;
  }

  function insertVar(v: string) {
    if (activeTemplateTab === "sin_sesiones") {
      setTemplateSinSesiones((t) => t + v);
    } else {
      setTemplate((t) => t + v);
    }
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="grid lg:grid-cols-5 gap-6">

      {/* ── LEFT: Patient list ──────────────────────────────── */}
      <div className="lg:col-span-2 bg-[#0a1628] border border-[#C5A059]/20 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#C5A059]/10 flex items-center justify-between gap-2">
          <span className="font-cinzel text-xs uppercase tracking-widest text-gray-400">Pacientes</span>
          <div className="flex items-center gap-3">
            {calendarConnected && (
              <button
                onClick={() => setSkipScheduled((v) => !v)}
                title="Omitir pacientes con cita esta semana"
                className={`flex items-center gap-1 text-[10px] font-cinzel uppercase tracking-widest transition ${
                  skipScheduled ? "text-emerald-400" : "text-gray-600 hover:text-gray-400"
                }`}
              >
                <Calendar size={11} />
                <span className="hidden sm:inline">Sin cita</span>
              </button>
            )}
            <button
              onClick={toggleAll}
              className="text-[10px] font-cinzel text-gray-500 hover:text-[#C5A059] uppercase tracking-widest transition"
            >
              {allFilteredSelected ? "Desel. todos" : "Sel. todos"}
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-[#C5A059]/10 overflow-x-auto">
          {FILTER_TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilterTab(key)}
              className={`flex items-center gap-1 px-2 py-2 text-[10px] font-cinzel uppercase tracking-wide flex-1 justify-center transition border-b-2 -mb-px whitespace-nowrap min-w-0 ${
                filterTab === key ? "border-[#C5A059] text-[#C5A059]" : "border-transparent text-gray-600 hover:text-gray-400"
              }`}
            >
              {icon}
              <span className="hidden xs:inline sm:inline">{label}</span>
              <span className="text-[9px] opacity-60">({counts[key]})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-[#C5A059]/8">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-[#020617] border border-[#C5A059]/15 text-white px-3 py-1.5 text-xs font-crimson focus:border-[#C5A059]/40 outline-none"
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 min-h-0 max-h-[50vh] lg:max-h-[60vh] divide-y divide-[#C5A059]/6">
          {loading && <p className="py-8 text-center text-gray-600 font-crimson text-sm">Cargando...</p>}
          {!loading && filtered.length === 0 && (
            <p className="py-8 text-center text-gray-700 font-crimson text-sm">Sin pacientes</p>
          )}
          {filtered.map((patient) => {
            const sl = sessionsLeft(patient);
            const dl = daysLeft(patient.end_date);
            const isSel = selected.has(patient.id);
            return (
              <div
                key={patient.id}
                onClick={() => toggleOne(patient.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition ${isSel ? "bg-[#C5A059]/8" : "hover:bg-white/[0.02]"}`}
              >
                {/* Checkbox */}
                <div className={`flex-shrink-0 w-4 h-4 border flex items-center justify-center transition ${isSel ? "border-[#C5A059] bg-[#C5A059]/20" : "border-gray-700"}`}>
                  {isSel && <Check size={9} className="text-[#C5A059]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-cinzel truncate leading-snug">{patientFullName(patient)}</p>
                  <p className="text-gray-600 text-[10px] font-crimson truncate">{patient.email}</p>
                </div>

                <div className="flex-shrink-0 flex items-center gap-1.5 text-[10px]">
                  <span className={`font-cinzel ${sl === 0 ? "text-amber-400" : "text-gray-500"}`}>{sl}s</span>
                  <span className={`font-cinzel ${daysLeftColor(dl)}`}>{dl}d</span>
                  <span className={`px-1.5 py-0.5 border text-[9px] font-cinzel uppercase ${statusColor(patient.status)}`}>
                    {statusLabel(patient.status)[0]}
                  </span>
                  {calendarConnected && scheduledIds.has(patient.id) && (
                    <span title="Ya agendó esta semana" className="text-emerald-400">
                      <Calendar size={10} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selection summary */}
        <div className="px-4 py-2 border-t border-[#C5A059]/10 flex items-center justify-between">
          <span className="text-[10px] font-cinzel text-gray-500">
            {selectedIds.length} seleccionado{selectedIds.length !== 1 ? "s" : ""}
          </span>
          {selectedIds.length > 0 && (
            <button onClick={() => setSelected(new Set())} className="text-[10px] font-cinzel text-red-500/60 hover:text-red-400 transition">
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── RIGHT: Config + Send + History ─────────────────── */}
      <div className="lg:col-span-3 space-y-4">

        {/* Google Calendar status indicator */}
        <div className="bg-[#0a1628] border border-[#C5A059]/15 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {calendarLoading ? (
              <RefreshCw size={11} className="text-gray-600 animate-spin" />
            ) : (
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                calendarConnected === null ? "bg-gray-600" :
                calendarConnected ? "bg-emerald-400" : "bg-gray-600"
              }`} />
            )}
            <span className="text-[10px] font-cinzel text-gray-500 uppercase tracking-widest">
              Google Calendar
            </span>
            {calendarConnected && (
              <span className="text-[10px] font-cinzel text-emerald-400">
                · {scheduledIds.size} con cita
              </span>
            )}
          </div>
          <button
            onClick={loadCalendarStatus}
            disabled={calendarLoading}
            title="Actualizar estado"
            className="text-gray-600 hover:text-[#C5A059] transition disabled:opacity-40"
          >
            <RefreshCw size={11} className={calendarLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Message template */}
        <div className="bg-[#0a1628] border border-[#C5A059]/20">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#C5A059]/10">
            <span className="font-cinzel text-xs uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <MessageCircle size={12} className="text-[#C5A059]" /> Mensaje WhatsApp
              <span className="text-[9px] text-gray-600 normal-case font-crimson tracking-normal">(temporal)</span>
            </span>
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="text-[10px] font-cinzel text-gray-500 hover:text-[#C5A059] flex items-center gap-1 transition"
            >
              {showPreview ? <EyeOff size={11} /> : <Eye size={11} />}
              {showPreview ? "Ocultar" : "Vista previa"}
            </button>
          </div>

          {/* Template tabs */}
          <div className="flex border-b border-[#C5A059]/10">
            <button
              onClick={() => setActiveTemplateTab("con_sesiones")}
              className={`flex-1 px-4 py-2 text-[10px] font-cinzel uppercase tracking-widest transition border-b-2 -mb-px ${
                activeTemplateTab === "con_sesiones"
                  ? "border-[#C5A059] text-[#C5A059]"
                  : "border-transparent text-gray-600 hover:text-gray-400"
              }`}
            >
              Con sesiones
            </button>
            <button
              onClick={() => setActiveTemplateTab("sin_sesiones")}
              className={`flex-1 px-4 py-2 text-[10px] font-cinzel uppercase tracking-widest transition border-b-2 -mb-px ${
                activeTemplateTab === "sin_sesiones"
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-gray-600 hover:text-gray-400"
              }`}
            >
              Sin sesiones
            </button>
          </div>

          <div className="p-4 space-y-3">
            {activeTemplateTab === "sin_sesiones" && (
              <p className="text-[10px] font-crimson text-amber-400/70 italic">
                Esta plantilla se envía automáticamente a los pacientes con 0 sesiones restantes.
              </p>
            )}

            {/* Variables */}
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map(({ label, desc }) => (
                <button
                  key={label}
                  onClick={() => insertVar(label)}
                  title={desc}
                  className="text-[10px] font-cinzel px-2 py-0.5 bg-[#020617] border border-[#C5A059]/20 text-[#C5A059] hover:border-[#C5A059]/50 transition"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            {activeTemplateTab === "con_sesiones" ? (
              <textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={4}
                className="w-full bg-[#020617] border border-[#C5A059]/15 text-white px-3 py-2.5 text-sm font-crimson focus:border-[#C5A059]/40 outline-none resize-none leading-relaxed"
                placeholder="Escribe el mensaje..."
              />
            ) : (
              <textarea
                value={templateSinSesiones}
                onChange={(e) => setTemplateSinSesiones(e.target.value)}
                rows={4}
                className="w-full bg-[#020617] border border-amber-500/20 text-white px-3 py-2.5 text-sm font-crimson focus:border-amber-500/40 outline-none resize-none leading-relaxed"
                placeholder="Escribe el mensaje para pacientes sin sesiones..."
              />
            )}

            {/* Preview */}
            {showPreview && previewPatient && (
              <div className="bg-emerald-950/40 border border-emerald-700/30 rounded-sm p-3">
                <p className="text-[10px] font-cinzel text-emerald-400/70 uppercase tracking-widest mb-1.5">Vista previa con {previewPatient.first_name}</p>
                <p className="text-emerald-100 font-crimson text-sm leading-relaxed whitespace-pre-wrap">
                  {renderPreview(
                    activeTemplateTab === "sin_sesiones" ? templateSinSesiones : template,
                    previewPatient
                  )}
                </p>
              </div>
            )}

            {/* Restore / reset actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={restoreFromSettings}
                className="text-[10px] font-cinzel text-[#C5A059]/60 hover:text-[#C5A059] transition"
              >
                Cargar desde Configuración
              </button>
              <span className="text-gray-700 text-[10px]">·</span>
              <button
                onClick={() => {
                  if (activeTemplateTab === "sin_sesiones") {
                    setTemplateSinSesiones(DEFAULT_TEMPLATE_SIN_SESIONES);
                  } else {
                    setTemplate(DEFAULT_TEMPLATE);
                  }
                }}
                className="text-[10px] font-cinzel text-gray-600 hover:text-gray-400 transition"
              >
                Restablecer por defecto
              </button>
            </div>
          </div>
        </div>

        {/* Send config */}
        <div className="bg-[#0a1628] border border-[#C5A059]/20">
          <div className="px-5 py-3 border-b border-[#C5A059]/10">
            <span className="font-cinzel text-xs uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Send size={12} className="text-[#C5A059]" /> Configuración de envío
            </span>
          </div>
          <div className="p-4 space-y-4">

            {/* Channels */}
            <div>
              <p className="text-[10px] font-cinzel text-gray-500 uppercase tracking-widest mb-2">Canales</p>
              <div className="flex gap-2">
                {(["whatsapp", "email"] as Channel[]).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-cinzel uppercase tracking-widest transition ${
                      channels.includes(ch)
                        ? ch === "whatsapp"
                          ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-400"
                          : "border-blue-500/50 bg-blue-950/40 text-blue-400"
                        : "border-gray-700 text-gray-600"
                    }`}
                  >
                    {ch === "whatsapp" ? <MessageCircle size={11} /> : <Mail size={11} />}
                    {ch === "whatsapp" ? "WhatsApp" : "Email"}
                    {channels.includes(ch) && <Check size={9} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div>
              <p className="text-[10px] font-cinzel text-gray-500 uppercase tracking-widest mb-2">Modo de envío</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSendMode("batch")}
                  className={`flex items-center gap-2 p-3 border transition ${
                    sendMode === "batch"
                      ? "border-[#C5A059]/50 bg-[#C5A059]/10 text-white"
                      : "border-gray-700 text-gray-600 hover:text-gray-400"
                  }`}
                >
                  <Zap size={13} className={sendMode === "batch" ? "text-[#C5A059]" : ""} />
                  <div className="text-left">
                    <p className="text-[10px] font-cinzel uppercase tracking-widest">Todos juntos</p>
                    <p className="text-[9px] text-gray-500 font-crimson mt-0.5">Envío inmediato</p>
                  </div>
                </button>
                <button
                  onClick={() => setSendMode("human")}
                  className={`flex items-center gap-2 p-3 border transition ${
                    sendMode === "human"
                      ? "border-[#C5A059]/50 bg-[#C5A059]/10 text-white"
                      : "border-gray-700 text-gray-600 hover:text-gray-400"
                  }`}
                >
                  <Timer size={13} className={sendMode === "human" ? "text-[#C5A059]" : ""} />
                  <div className="text-left">
                    <p className="text-[10px] font-cinzel uppercase tracking-widest">Modo humano</p>
                    <p className="text-[9px] text-gray-500 font-crimson mt-0.5">Delay variable</p>
                  </div>
                </button>
              </div>

              {/* Delay config */}
              {sendMode === "human" && (
                <div className="mt-3 flex items-center gap-3 bg-[#020617] border border-[#C5A059]/10 px-3 py-2">
                  <Shuffle size={12} className="text-gray-500 flex-shrink-0" />
                  <span className="text-[10px] font-cinzel text-gray-500 flex-shrink-0">Delay entre envíos:</span>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="number"
                      min={10} max={300}
                      value={delayMin}
                      onChange={(e) => setDelayMin(Math.min(Number(e.target.value), delayMax - 5))}
                      className="w-14 bg-transparent border border-[#C5A059]/20 text-white text-xs font-cinzel px-2 py-1 outline-none text-center"
                    />
                    <span className="text-gray-600 text-xs">–</span>
                    <input
                      type="number"
                      min={15} max={300}
                      value={delayMax}
                      onChange={(e) => setDelayMax(Math.max(Number(e.target.value), delayMin + 5))}
                      className="w-14 bg-transparent border border-[#C5A059]/20 text-white text-xs font-cinzel px-2 py-1 outline-none text-center"
                    />
                    <span className="text-[10px] text-gray-500 font-cinzel">segundos</span>
                  </div>
                </div>
              )}
            </div>

            {/* Send button + progress */}
            {!sending && !progress && (
              <button
                onClick={sendAll}
                disabled={!selectedIds.length || !channels.length}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#C5A059] text-[#020617] font-cinzel text-xs uppercase tracking-widest hover:bg-[#D4B06A] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={13} />
                Enviar a {selectedIds.length} paciente{selectedIds.length !== 1 ? "s" : ""}
              </button>
            )}

            {sending && progress && (
              <div className="space-y-2">
                {/* Progress bar */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-cinzel text-[#C5A059]">
                    {sendMode === "human" ? "Modo humano — " : ""}
                    Enviando {progress.current}/{progress.total}...
                  </span>
                  <button onClick={stopSend} className="text-[10px] font-cinzel text-red-400 hover:text-red-300">
                    Detener
                  </button>
                </div>
                <div className="h-1.5 bg-[#020617] border border-[#C5A059]/10">
                  <div
                    className="h-full bg-[#C5A059] transition-all duration-500"
                    style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                  />
                </div>
                {/* Live results */}
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {progress.results.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 font-crimson flex-1 truncate">{r.name}</span>
                      <span className={r.whatsapp ? "text-emerald-400" : "text-gray-700"} title="WhatsApp">
                        <MessageCircle size={11} />
                      </span>
                      <span className={r.email ? "text-blue-400" : "text-gray-700"} title="Email">
                        <Mail size={11} />
                      </span>
                      {r.error && <span title={r.error}><AlertCircle size={11} className="text-red-400" /></span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Finished results */}
            {!sending && progress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-cinzel text-[#C5A059] uppercase tracking-widest">
                    ✓ {progress.results.filter((r) => r.whatsapp || r.email).length} enviados
                    {progress.results.some((r) => r.error) && ` · ${progress.results.filter((r) => r.error).length} con error`}
                  </p>
                  <button onClick={() => { setProgress(null); setSelected(new Set()); }} className="text-[10px] font-cinzel text-gray-500 hover:text-white">
                    Nueva campaña
                  </button>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {progress.results.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-[#020617] border border-[#C5A059]/8 px-3 py-1.5">
                      <span className="text-gray-300 font-crimson flex-1 truncate">{r.name}</span>
                      <span className={`flex items-center gap-0.5 ${r.whatsapp ? "text-emerald-400" : "text-gray-700"}`}>
                        <MessageCircle size={10} /> {r.whatsapp ? "OK" : "—"}
                      </span>
                      <span className={`flex items-center gap-0.5 ${r.email ? "text-blue-400" : "text-gray-700"}`}>
                        <Mail size={10} /> {r.email ? "OK" : "—"}
                      </span>
                      {r.error && <span className="text-red-400/70 text-[10px] max-w-[100px] truncate" title={r.error}>{r.error}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Auto schedule */}
        <AutoSchedulePanel />

        {/* History */}
        <div className="bg-[#0a1628] border border-[#C5A059]/20">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 border-b border-[#C5A059]/10"
          >
            <span className="font-cinzel text-xs uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Bell size={12} className="text-[#C5A059]" /> Historial de envíos
            </span>
            {showHistory ? <ChevronUp size={14} className="text-gray-600" /> : <ChevronDown size={14} className="text-gray-600" />}
          </button>

          {showHistory && (
            <div className="divide-y divide-[#C5A059]/6 max-h-72 overflow-y-auto">
              {logs.length === 0 && (
                <p className="py-8 text-center text-gray-700 font-crimson text-sm">Sin recordatorios enviados</p>
              )}
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3 px-5 py-3">
                  <Bell size={12} className="text-blue-400/60 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    {log.patient_name && (
                      <p className="text-gray-300 text-[11px] font-cinzel mb-0.5 truncate">{log.patient_name}</p>
                    )}
                    <p className="text-gray-500 font-crimson text-xs leading-relaxed">{log.content}</p>
                    <p className="text-gray-700 text-[10px] mt-0.5">
                      {new Date(log.created_at).toLocaleDateString("es-CL", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
