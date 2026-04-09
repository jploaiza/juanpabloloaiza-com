"use client";

import { useState, useEffect } from "react";
import {
  Calendar, Check, RefreshCw, LogOut, AlertCircle, ChevronDown, Link2, Link2Off,
  MessageCircle, Eye, EyeOff,
} from "lucide-react";
import {
  type Patient,
  sessionsLeft, daysLeft,
  DEFAULT_REMINDER_TEMPLATE, DEFAULT_REMINDER_TEMPLATE_SIN_SESIONES,
  REMINDER_TEMPLATE_KEY, REMINDER_TEMPLATE_SIN_SESIONES_KEY,
} from "@/lib/patients";

interface CalendarOption {
  id: string;
  summary: string;
  primary: boolean;
}

const VARIABLES = [
  { label: "{nombre}", desc: "Primer nombre del paciente" },
  { label: "{sesiones}", desc: "Sesiones restantes" },
  { label: "{vencimiento}", desc: "Fecha de vencimiento del pack" },
  { label: "{dias}", desc: "Días restantes del pack" },
];

function renderTemplatePreview(tpl: string, patient: Patient): string {
  const sl = sessionsLeft(patient);
  const exp = new Date(patient.end_date + "T12:00:00").toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const dias = Math.ceil((new Date(patient.end_date + "T00:00:00").getTime() - now.getTime()) / 86400000);
  return tpl
    .replace(/\{nombre\}/g, patient.first_name)
    .replace(/\{sesiones\}/g, String(sl))
    .replace(/\{vencimiento\}/g, exp)
    .replace(/\{dias\}/g, String(dias));
}

export default function SettingsPanel() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [calLoading, setCalLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);

  // Template state
  const [template, setTemplate] = useState(DEFAULT_REMINDER_TEMPLATE);
  const [templateSinSesiones, setTemplateSinSesiones] = useState(DEFAULT_REMINDER_TEMPLATE_SIN_SESIONES);
  const [activeTemplateTab, setActiveTemplateTab] = useState<"con_sesiones" | "sin_sesiones">("con_sesiones");
  const [templateSaved, setTemplateSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPatient, setPreviewPatient] = useState<Patient | null>(null);

  // Load status on mount
  useEffect(() => { checkStatus(); }, []);

  // Load saved templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(REMINDER_TEMPLATE_KEY);
    if (saved) setTemplate(saved);
    const savedSin = localStorage.getItem(REMINDER_TEMPLATE_SIN_SESIONES_KEY);
    if (savedSin) setTemplateSinSesiones(savedSin);
    // Fetch a patient for preview
    fetch("/api/patients").then((r) => r.json()).then(({ patients }) => {
      if (patients?.length) {
        setPreviewPatient(patients.find((p: Patient) => p.status === "active") ?? patients[0]);
      }
    }).catch(() => {});
  }, []);

  function saveTemplates() {
    localStorage.setItem(REMINDER_TEMPLATE_KEY, template);
    localStorage.setItem(REMINDER_TEMPLATE_SIN_SESIONES_KEY, templateSinSesiones);
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 2000);
  }

  function insertVar(v: string) {
    if (activeTemplateTab === "sin_sesiones") {
      setTemplateSinSesiones((t) => t + v);
    } else {
      setTemplate((t) => t + v);
    }
  }

  async function checkStatus() {
    setStatusLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/calendar/status");
      if (!res.ok) { setConnected(false); return; }
      const data = await res.json();
      setConnected(data.connected ?? false);
      if (data.connected) loadCalendars();
    } catch {
      setConnected(false);
    } finally {
      setStatusLoading(false);
    }
  }

  async function loadCalendars() {
    setCalLoading(true);
    setError(null);
    setNeedsReconnect(false);
    try {
      const res = await fetch("/api/calendar/calendars");
      let data: Record<string, unknown>;
      try {
        data = await res.json();
      } catch {
        setError(`El servidor devolvió respuesta inesperada (HTTP ${res.status}).`);
        setNeedsReconnect(true);
        return;
      }
      if (!res.ok) {
        const msg = (data.error as string) ?? `Error HTTP ${res.status}`;
        setError(msg);
        // 401/403/502 from Google = token issue → prompt reconnect
        if (res.status === 401 || res.status === 403 || res.status === 502) {
          setNeedsReconnect(true);
        }
        return;
      }
      setCalendars((data.calendars as CalendarOption[]) ?? []);
      setSelectedId((data.selected as string) ?? "primary");
    } catch (err) {
      setError(`Error de red: ${err instanceof Error ? err.message : "desconocido"}`);
    } finally {
      setCalLoading(false);
    }
  }

  async function handleCalendarChange(id: string) {
    setSelectedId(id);
    setSaving(true);
    try {
      await fetch("/api/calendar/calendars", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendar_id: id }),
      });
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function disconnect() {
    if (!confirm("¿Desconectar Google Calendar?")) return;
    await fetch("/api/calendar/disconnect", { method: "DELETE" });
    setConnected(false);
    setCalendars([]);
    setSelectedId("");
  }

  const authUrl = `/api/calendar/auth?returnTo=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.pathname : "/academy/admin/crm"
  )}`;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-cinzel text-white text-sm uppercase tracking-widest mb-0.5">Configuración</h2>
        <p className="text-gray-500 text-xs font-crimson">Ajustes del panel de administración</p>
      </div>

      {/* ── Google Calendar ───────────────────────────────────────── */}
      <div className="bg-[#0a1628] border border-[#C5A059]/20">
        {/* Section header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#C5A059]/10">
          <Calendar size={14} className="text-[#C5A059]" />
          <h3 className="font-cinzel text-white text-xs uppercase tracking-widest">Google Calendar</h3>
          {statusLoading && <RefreshCw size={11} className="text-gray-500 animate-spin ml-auto" />}
          {!statusLoading && connected !== null && (
            <span className={`ml-auto flex items-center gap-1.5 text-[10px] font-cinzel uppercase tracking-widest ${connected ? "text-emerald-400" : "text-gray-500"}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-gray-600"}`} />
              {connected ? "Conectado" : "Desconectado"}
            </span>
          )}
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Not connected */}
          {connected === false && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-[#020617] border border-yellow-700/20">
                <AlertCircle size={14} className="text-yellow-500/70 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-400 font-crimson text-sm leading-relaxed">
                    Conecta tu Google Calendar para ver qué pacientes ya tienen cita esta semana y evitar enviarles recordatorios innecesarios.
                  </p>
                </div>
              </div>
              <a
                href={authUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C5A059] text-[#020617] text-xs font-cinzel uppercase tracking-widest hover:bg-[#D4B06A] transition"
              >
                <Link2 size={13} />
                Conectar Google Calendar
              </a>
            </div>
          )}

          {/* Connected */}
          {connected === true && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 bg-emerald-950/30 border border-emerald-700/20">
                <Check size={13} className="text-emerald-400 flex-shrink-0" />
                <p className="text-emerald-300 font-crimson text-sm">
                  Cuenta de Google conectada. Los recordatorios omitirán a los pacientes con cita esta semana.
                </p>
              </div>

              {/* Calendar selector */}
              <div>
                <label className="block text-[10px] font-cinzel text-gray-400 uppercase tracking-widest mb-2">
                  Calendario a monitorear
                </label>
                {calLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <RefreshCw size={12} className="text-gray-500 animate-spin" />
                    <span className="text-xs font-cinzel text-gray-500">Cargando calendarios...</span>
                  </div>
                ) : error ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-3 bg-red-950/30 border border-red-700/20">
                      <AlertCircle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-300 font-crimson text-xs">{error}</p>
                        {needsReconnect && (
                          <p className="text-red-400/70 font-crimson text-xs mt-1">
                            El token de Google no es válido o no tiene permisos suficientes.
                          </p>
                        )}
                      </div>
                    </div>
                    {needsReconnect ? (
                      <div className="flex items-center gap-3">
                        <a
                          href={authUrl}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#C5A059] text-[#020617] text-xs font-cinzel uppercase tracking-widest hover:bg-[#D4B06A] transition"
                        >
                          <Link2 size={12} />
                          Reconectar Google Calendar
                        </a>
                        <button
                          onClick={loadCalendars}
                          className="flex items-center gap-1.5 text-[10px] font-cinzel text-gray-500 hover:text-gray-300 uppercase tracking-widest transition"
                        >
                          <RefreshCw size={11} />
                          Reintentar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={loadCalendars}
                        className="flex items-center gap-1.5 text-[10px] font-cinzel text-gray-400 hover:text-[#C5A059] uppercase tracking-widest transition"
                      >
                        <RefreshCw size={11} />
                        Reintentar
                      </button>
                    )}
                  </div>
                ) : calendars.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-gray-500 font-crimson text-sm">
                      No se encontraron calendarios. El calendario actual es: <span className="text-gray-300">{selectedId || "principal"}</span>
                    </p>
                    <button
                      onClick={loadCalendars}
                      className="flex items-center gap-1.5 text-[10px] font-cinzel text-gray-400 hover:text-[#C5A059] uppercase tracking-widest transition"
                    >
                      <RefreshCw size={11} />
                      Recargar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative max-w-sm">
                      <select
                        value={selectedId}
                        onChange={(e) => handleCalendarChange(e.target.value)}
                        disabled={saving}
                        className="w-full appearance-none bg-[#020617] border border-[#C5A059]/25 text-white text-sm font-crimson px-4 py-2.5 pr-9 outline-none focus:border-[#C5A059]/50 transition cursor-pointer disabled:opacity-60"
                      >
                        {calendars.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.summary}{c.primary ? " (principal)" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {saving && (
                      <p className="text-[10px] font-cinzel text-emerald-400/70 flex items-center gap-1">
                        <RefreshCw size={10} className="animate-spin" /> Guardando...
                      </p>
                    )}
                    <p className="text-[10px] font-cinzel text-gray-600 uppercase tracking-widest">
                      {calendars.length} calendario{calendars.length !== 1 ? "s" : ""} encontrado{calendars.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>

              {/* Disconnect */}
              <div className="pt-2 border-t border-[#C5A059]/8">
                <button
                  onClick={disconnect}
                  className="flex items-center gap-2 text-xs font-cinzel text-gray-500 hover:text-red-400 uppercase tracking-widest transition"
                >
                  <Link2Off size={13} />
                  Desconectar Google Calendar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Plantillas de Recordatorio ───────────────────────────── */}
      <div className="bg-[#0a1628] border border-[#C5A059]/20">
        {/* Section header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#C5A059]/10">
          <div className="flex items-center gap-2">
            <MessageCircle size={14} className="text-[#C5A059]" />
            <h3 className="font-cinzel text-white text-xs uppercase tracking-widest">Plantillas de Recordatorio</h3>
          </div>
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-cinzel text-gray-500 hover:text-[#C5A059] transition"
          >
            {showPreview ? <EyeOff size={11} /> : <Eye size={11} />}
            {showPreview ? "Ocultar vista previa" : "Vista previa"}
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <p className="text-xs font-crimson text-gray-500 leading-relaxed">
            Estas plantillas se usan en todos los envíos de recordatorios. En la consola de Recordatorios puedes modificarlas temporalmente para un envío puntual.
          </p>

          {/* Template tabs */}
          <div className="flex border border-[#C5A059]/15">
            <button
              onClick={() => setActiveTemplateTab("con_sesiones")}
              className={`flex-1 px-4 py-2.5 text-[10px] font-cinzel uppercase tracking-widest transition border-r border-[#C5A059]/15 ${
                activeTemplateTab === "con_sesiones"
                  ? "bg-[#C5A059]/10 text-[#C5A059]"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              Con sesiones
            </button>
            <button
              onClick={() => setActiveTemplateTab("sin_sesiones")}
              className={`flex-1 px-4 py-2.5 text-[10px] font-cinzel uppercase tracking-widest transition ${
                activeTemplateTab === "sin_sesiones"
                  ? "bg-amber-500/10 text-amber-400"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              Sin sesiones
            </button>
          </div>

          {activeTemplateTab === "sin_sesiones" && (
            <p className="text-[10px] font-crimson text-amber-400/70 italic">
              Se envía automáticamente a pacientes con 0 sesiones restantes. Úsala para invitarlos a renovar.
            </p>
          )}

          {/* Variable insertion buttons */}
          <div>
            <p className="text-[10px] font-cinzel text-gray-500 uppercase tracking-widest mb-2">Variables disponibles</p>
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
          </div>

          {/* Textarea */}
          {activeTemplateTab === "con_sesiones" ? (
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={4}
              className="w-full bg-[#020617] border border-[#C5A059]/15 text-white px-3 py-2.5 text-sm font-crimson focus:border-[#C5A059]/40 outline-none resize-none leading-relaxed"
              placeholder="Plantilla para pacientes con sesiones disponibles..."
            />
          ) : (
            <textarea
              value={templateSinSesiones}
              onChange={(e) => setTemplateSinSesiones(e.target.value)}
              rows={4}
              className="w-full bg-[#020617] border border-amber-500/20 text-white px-3 py-2.5 text-sm font-crimson focus:border-amber-500/40 outline-none resize-none leading-relaxed"
              placeholder="Plantilla para pacientes sin sesiones restantes..."
            />
          )}

          {/* Preview */}
          {showPreview && previewPatient && (
            <div className={`border rounded-sm p-3 ${activeTemplateTab === "sin_sesiones" ? "bg-amber-950/20 border-amber-700/30" : "bg-emerald-950/30 border-emerald-700/20"}`}>
              <p className={`text-[10px] font-cinzel uppercase tracking-widest mb-1.5 ${activeTemplateTab === "sin_sesiones" ? "text-amber-400/70" : "text-emerald-400/70"}`}>
                Vista previa con {previewPatient.first_name}
              </p>
              <p className="text-gray-200 font-crimson text-sm leading-relaxed whitespace-pre-wrap">
                {renderTemplatePreview(
                  activeTemplateTab === "sin_sesiones" ? templateSinSesiones : template,
                  previewPatient
                )}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={saveTemplates}
              className="flex items-center gap-2 px-4 py-2 bg-[#C5A059] text-[#020617] text-xs font-cinzel uppercase tracking-widest hover:bg-[#D4B06A] transition"
            >
              {templateSaved ? <Check size={13} /> : null}
              {templateSaved ? "Guardado" : "Guardar plantillas"}
            </button>
            <button
              onClick={() => {
                if (activeTemplateTab === "sin_sesiones") {
                  setTemplateSinSesiones(DEFAULT_REMINDER_TEMPLATE_SIN_SESIONES);
                } else {
                  setTemplate(DEFAULT_REMINDER_TEMPLATE);
                }
              }}
              className="text-[10px] font-cinzel text-gray-600 hover:text-gray-400 transition uppercase tracking-widest"
            >
              Restablecer por defecto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
