"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Plus, Search, RefreshCw, Users, Activity, Clock, Download, Bell, Settings, BarChart2,
  AlertTriangle, Calendar, CalendarX, AlarmClock, ArrowUpDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type Patient, type PatientStatus, patientFullName, sessionsLeft, daysLeft } from "@/lib/patients";
import { type PatientCalendarStatus } from "@/lib/google-calendar";
import PatientCard from "./PatientCard";
import PatientForm from "./PatientForm";
import ImportModal from "./ImportModal";
import RemindersConsole from "./RemindersConsole";
import SettingsPanel from "./SettingsPanel";
import CrmAnalyticsPanel from "./CrmAnalyticsPanel";

type Tab = PatientStatus | "reminders" | "settings" | "analytics";
type QuickFilter = "all" | "cita_paso" | "sin_sesion_semana" | "con_cita" | "con_alerta";
type SortKey = "reciente" | "sin_sesion" | "vence_pronto" | "sesiones_restantes" | "nombre";

function isThisWeek(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const nowChile = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const dow = nowChile.getUTCDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(nowChile);
  mon.setUTCDate(nowChile.getUTCDate() + daysToMon);
  mon.setUTCHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);
  sun.setUTCHours(23, 59, 59, 999);
  const d = new Date(dateStr);
  return d >= mon && d <= sun;
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "active", label: "Activos", icon: <Activity size={13} /> },
  { key: "paused", label: "Pausados", icon: <Clock size={13} /> },
  { key: "finished", label: "Finalizados", icon: <Users size={13} /> },
  { key: "reminders", label: "Recordatorios", icon: <Bell size={13} /> },
  { key: "analytics", label: "Analíticas", icon: <BarChart2 size={13} /> },
  { key: "settings", label: "Configuración", icon: <Settings size={13} /> },
];

interface Props {
  initialPatients: Patient[];
  lastSessions: Record<string, string | null>;
}

export default function CrmDashboard({ initialPatients, lastSessions }: Props) {
  const [patients, setPatients] = useState(initialPatients);
  const [lastSessionsMap, setLastSessionsMap] = useState(lastSessions);
  const [calendarMap, setCalendarMap] = useState<Record<string, PatientCalendarStatus>>({});
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("reciente");
  const [showSort, setShowSort] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar/week-events");
      if (!res.ok) return; // calendar not connected — graceful degradation
      const { statuses } = await res.json();
      const map: Record<string, PatientCalendarStatus> = {};
      for (const s of (statuses ?? []) as PatientCalendarStatus[]) {
        map[s.patient_id] = s;
      }
      setCalendarMap(map);
    } catch {
      // ignore — calendar may not be configured
    }
  }, []);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [patientsRes] = await Promise.all([
        fetch("/api/patients"),
        fetchCalendar(),
      ]);
      if (!patientsRes.ok) return;
      const { patients: fresh, lastSessions: freshSessions } = await patientsRes.json();
      setPatients(fresh ?? []);
      setLastSessionsMap(freshSessions ?? {});
    } finally {
      setLoading(false);
    }
  }, [fetchCalendar]);

  const isPatientTab = activeTab !== "reminders" && activeTab !== "settings" && activeTab !== "analytics";

  const filtered = (() => {
    if (!isPatientTab) return [];

    let list = patients.filter((p) => p.status === activeTab);

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        patientFullName(p).toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
      );
    }

    // Quick filter
    if (quickFilter !== "all") {
      list = list.filter((p) => {
        const cal = calendarMap[p.id];
        const lastSess = lastSessionsMap[p.id];
        const sessionWeek = isThisWeek(lastSess);
        const hasCalAppt = cal?.scheduled ?? false;
        const apptPassed =
          hasCalAppt && !!cal?.event_start && new Date(cal.event_start) < new Date() && !sessionWeek;

        if (quickFilter === "cita_paso") return apptPassed;
        if (quickFilter === "sin_sesion_semana") return !sessionWeek;
        if (quickFilter === "con_cita") return hasCalAppt;
        if (quickFilter === "con_alerta") {
          const dl = daysLeft(p.end_date);
          const sl = sessionsLeft(p);
          return sl === 0 || dl < 7 || sl <= 2 || (!!lastSess && (Date.now() - new Date(lastSess).getTime()) > 7 * 86400000);
        }
        return true;
      });
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sortKey === "nombre") return patientFullName(a).localeCompare(patientFullName(b));
      if (sortKey === "vence_pronto") return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
      if (sortKey === "sesiones_restantes") return sessionsLeft(a) - sessionsLeft(b);
      if (sortKey === "sin_sesion") {
        const la = lastSessionsMap[a.id] ? new Date(lastSessionsMap[a.id]!).getTime() : 0;
        const lb = lastSessionsMap[b.id] ? new Date(lastSessionsMap[b.id]!).getTime() : 0;
        return la - lb; // oldest first (nulls = 0 = first)
      }
      // reciente: default created_at desc (already sorted from API)
      return 0;
    });

    return list;
  })();

  const counts: Record<Tab, number> = {
    active: patients.filter((p) => p.status === "active").length,
    paused: patients.filter((p) => p.status === "paused").length,
    finished: patients.filter((p) => p.status === "finished").length,
    reminders: 0,
    analytics: 0,
    settings: 0,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-cinzel">Admin CRM</span>
          <h1 className="text-2xl sm:text-3xl font-cinzel text-white mt-1">Gestión de Pacientes</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 border border-[#C5A059]/20 text-gray-500 hover:text-[#C5A059] hover:border-[#C5A059]/40 transition disabled:opacity-40"
            title="Actualizar"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[#C5A059]/30 text-[#C5A059] text-xs font-cinzel uppercase tracking-widest hover:bg-[#C5A059]/10 transition"
          >
            <Download size={13} />
            Importar LMS
          </button>
          <button
            onClick={() => { setEditPatient(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#C5A059] text-[#020617] text-xs font-cinzel uppercase tracking-widest hover:bg-[#D4B06A] transition"
          >
            <Plus size={13} />
            Nuevo
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[#C5A059]/15 mb-6">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setQuickFilter("all"); setShowSort(false); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-cinzel uppercase tracking-widest transition border-b-2 -mb-px ${
              activeTab === key
                ? "border-[#C5A059] text-[#C5A059]"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {icon}
            {label}
            {key !== "reminders" && key !== "settings" && key !== "analytics" && (
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === key ? "bg-[#C5A059]/20 text-[#C5A059]" : "bg-gray-800 text-gray-500"
              }`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + filters + sort — hidden on non-patient tabs */}
      {isPatientTab && (
        <div className="space-y-3 mb-6">
          {/* Search + Sort row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="w-full sm:w-64 bg-[#0a1628] border border-[#C5A059]/15 text-white pl-9 pr-3 py-2 text-sm font-crimson focus:border-[#C5A059]/40 outline-none"
              />
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSort((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 border text-[11px] font-cinzel uppercase tracking-wide transition ${
                  sortKey !== "reciente"
                    ? "border-[#C5A059]/40 text-[#C5A059] bg-[#C5A059]/10"
                    : "border-[#C5A059]/20 text-gray-500 hover:text-gray-300 hover:border-[#C5A059]/30"
                }`}
              >
                <ArrowUpDown size={11} />
                {sortKey === "reciente" && "Reciente"}
                {sortKey === "sin_sesion" && "Sin sesión"}
                {sortKey === "vence_pronto" && "Vence pronto"}
                {sortKey === "sesiones_restantes" && "Sesiones"}
                {sortKey === "nombre" && "Nombre A-Z"}
              </button>
              {showSort && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-[#0a1628] border border-[#C5A059]/20 min-w-[160px] shadow-xl">
                  {(
                    [
                      { key: "reciente", label: "Más reciente" },
                      { key: "sin_sesion", label: "Sin sesión (más tiempo)" },
                      { key: "vence_pronto", label: "Pack vence pronto" },
                      { key: "sesiones_restantes", label: "Sesiones restantes" },
                      { key: "nombre", label: "Nombre A-Z" },
                    ] as { key: SortKey; label: string }[]
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => { setSortKey(key); setShowSort(false); }}
                      className={`w-full text-left px-3 py-2 text-[11px] font-cinzel uppercase tracking-wide transition ${
                        sortKey === key
                          ? "text-[#C5A059] bg-[#C5A059]/10"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { key: "all", label: "Todos", icon: null },
                { key: "cita_paso", label: "Cita pasó sin sesión", icon: <AlertTriangle size={10} /> },
                { key: "sin_sesion_semana", label: "Sin sesión esta semana", icon: <CalendarX size={10} /> },
                { key: "con_cita", label: "Con cita esta semana", icon: <Calendar size={10} /> },
                { key: "con_alerta", label: "Con alerta", icon: <AlarmClock size={10} /> },
              ] as { key: QuickFilter; label: string; icon: React.ReactNode }[]
            ).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setQuickFilter(key)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-cinzel uppercase tracking-wide border transition ${
                  quickFilter === key
                    ? key === "cita_paso"
                      ? "border-red-500/60 text-red-400 bg-red-950/60"
                      : key === "sin_sesion_semana"
                      ? "border-orange-500/50 text-orange-400 bg-orange-950/50"
                      : key === "con_cita"
                      ? "border-emerald-500/50 text-emerald-400 bg-emerald-950/50"
                      : key === "con_alerta"
                      ? "border-yellow-500/50 text-yellow-400 bg-yellow-950/50"
                      : "border-[#C5A059]/40 text-[#C5A059] bg-[#C5A059]/10"
                    : "border-[#C5A059]/10 text-gray-500 hover:text-gray-300 hover:border-[#C5A059]/25"
                }`}
              >
                {icon}
                {label}
                {key !== "all" && (() => {
                  const count = patients.filter((p) => {
                    if (p.status !== activeTab) return false;
                    const cal = calendarMap[p.id];
                    const lastSess = lastSessionsMap[p.id];
                    const sessionWeek = isThisWeek(lastSess);
                    const hasCalAppt = cal?.scheduled ?? false;
                    const apptPassed = hasCalAppt && !!cal?.event_start && new Date(cal.event_start) < new Date() && !sessionWeek;
                    if (key === "cita_paso") return apptPassed;
                    if (key === "sin_sesion_semana") return !sessionWeek;
                    if (key === "con_cita") return hasCalAppt;
                    if (key === "con_alerta") {
                      const dl = daysLeft(p.end_date);
                      const sl = sessionsLeft(p);
                      return sl === 0 || dl < 7 || sl <= 2 || (!!lastSess && (Date.now() - new Date(lastSess).getTime()) > 7 * 86400000);
                    }
                    return false;
                  }).length;
                  return count > 0 ? (
                    <span className="ml-0.5 px-1 py-0.5 rounded-full bg-white/10 text-[9px]">{count}</span>
                  ) : null;
                })()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "settings" ? (
            <SettingsPanel />
          ) : activeTab === "analytics" ? (
            <CrmAnalyticsPanel />
          ) : activeTab === "reminders" ? (
            <RemindersConsole />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-600 font-crimson text-lg">
                {quickFilter !== "all"
                  ? "Ningún paciente coincide con este filtro"
                  : search
                  ? "Sin resultados"
                  : `No hay pacientes ${activeTab === "active" ? "activos" : activeTab === "paused" ? "pausados" : "finalizados"}`}
              </p>
              {quickFilter !== "all" && (
                <button onClick={() => setQuickFilter("all")} className="mt-3 text-[11px] font-cinzel text-[#C5A059]/60 hover:text-[#C5A059] uppercase tracking-widest transition">
                  Ver todos
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  lastSessionAt={lastSessionsMap[patient.id]}
                  calendarStatus={calendarMap[patient.id]}
                  onEdit={(p) => { setEditPatient(p); setShowForm(true); }}
                  onRefresh={refresh}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Form modal */}
      {showForm && (
        <PatientForm
          patient={editPatient}
          onClose={() => { setShowForm(false); setEditPatient(null); }}
          onSaved={refresh}
        />
      )}

      {/* Import modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={refresh}
        />
      )}
    </div>
  );
}
