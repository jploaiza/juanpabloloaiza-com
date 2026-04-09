"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, Send, Check, X, MessageCircle, Mail,
  RefreshCw, CalendarClock, ChevronDown, ChevronUp,
} from "lucide-react";
import { type Patient, type PatientLog, sessionsLeft, daysLeft, REMINDER_DAYS, buildWhatsappUrl, buildEmailUrl, daysLeftColor, patientFullName } from "@/lib/patients";
import Link from "next/link";

interface TodayPatient extends Patient {
  selected: boolean;
}

interface ReminderLog {
  id: string;
  patient_id: string;
  content: string;
  created_at: string;
  patient_name?: string;
}

interface SendResult {
  id: string;
  name: string;
  email: boolean;
  whatsapp: boolean;
  error?: string;
}

const DAY_NAMES = REMINDER_DAYS;

export default function RemindersPanel() {
  const [todayPatients, setTodayPatients] = useState<TodayPatient[]>([]);
  const [recentLogs, setRecentLogs] = useState<ReminderLog[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<SendResult[] | null>(null);
  const [showLogs, setShowLogs] = useState(true);
  const [dayFilter, setDayFilter] = useState<number | "all">("all");

  // Current day in Chile time (UTC-4)
  const todayDow = new Date(Date.now() - 4 * 60 * 60 * 1000).getUTCDay();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, logRes] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/patients/reminder-logs"),
      ]);
      const { patients } = await pRes.json();
      const logsData = logRes.ok ? await logRes.json() : { logs: [] };

      const active = (patients ?? []).filter((p: Patient) => p.status === "active");
      setAllPatients(active);

      const today = active
        .filter((p: Patient) => p.reminder_day === todayDow && sessionsLeft(p) > 0)
        .map((p: Patient) => ({ ...p, selected: true }));
      setTodayPatients(today);
      setRecentLogs(logsData.logs ?? []);
    } finally {
      setLoading(false);
    }
  }, [todayDow]);

  useEffect(() => { load(); }, [load]);

  function togglePatient(id: string) {
    setTodayPatients((prev) =>
      prev.map((p) => p.id === id ? { ...p, selected: !p.selected } : p)
    );
  }

  async function sendReminders(ids?: string[]) {
    setSending(true);
    setSendResults(null);
    try {
      const body = ids ? { patient_ids: ids } : {};
      const res = await fetch("/api/patients/send-reminders-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setSendResults(data.results ?? []);
      await load(); // refresh logs
    } catch {
      setSendResults([]);
    } finally {
      setSending(false);
    }
  }

  const selectedIds = todayPatients.filter((p) => p.selected).map((p) => p.id);

  // Patients by day (for the "esta semana" view)
  const byDay = DAY_NAMES.map((name, dow) => ({
    name,
    dow,
    patients: allPatients.filter((p) => p.reminder_day === dow && sessionsLeft(p) > 0),
  }));

  const filteredByDay = dayFilter === "all" ? byDay : byDay.filter((d) => d.dow === dayFilter);

  return (
    <div className="space-y-6">
      {/* ── Enviar hoy ─────────────────────────────────────────── */}
      <div className="bg-[#0a1628] border border-[#C5A059]/20">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#C5A059]/10">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-[#C5A059]" />
            <h2 className="font-cinzel text-white text-sm uppercase tracking-widest">
              Recordatorios de hoy — {DAY_NAMES[todayDow]}
            </h2>
          </div>
          {!loading && (
            <span className={`text-xs font-cinzel px-2 py-0.5 border ${
              todayPatients.length > 0
                ? "text-[#C5A059] border-[#C5A059]/30 bg-[#C5A059]/10"
                : "text-gray-500 border-gray-700 bg-gray-900/30"
            }`}>
              {todayPatients.length} paciente{todayPatients.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-600 font-crimson">Cargando...</div>
        ) : todayPatients.length === 0 ? (
          <div className="py-10 text-center">
            <CalendarClock size={28} className="mx-auto text-gray-700 mb-2" />
            <p className="text-gray-600 font-crimson">No hay pacientes programados para hoy</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#C5A059]/8">
              {todayPatients.map((patient) => {
                const sl = sessionsLeft(patient);
                const dl = daysLeft(patient.end_date);
                return (
                  <div key={patient.id} className={`flex items-center gap-3 px-5 py-3 transition ${patient.selected ? "" : "opacity-50"}`}>
                    {/* Checkbox */}
                    <button
                      onClick={() => togglePatient(patient.id)}
                      className={`flex-shrink-0 w-5 h-5 border flex items-center justify-center transition ${
                        patient.selected ? "border-[#C5A059] bg-[#C5A059]/20" : "border-gray-600"
                      }`}
                    >
                      {patient.selected && <Check size={11} className="text-[#C5A059]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <Link href={`/academy/admin/crm/${patient.id}`} className="font-cinzel text-white text-sm hover:text-[#C5A059] transition truncate block">
                        {patientFullName(patient)}
                      </Link>
                      <p className="text-gray-500 text-xs font-crimson truncate">{patient.email}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs font-cinzel text-gray-400">{sl} ses.</span>
                      <span className={`text-xs font-cinzel ${daysLeftColor(dl)}`}>{dl}d</span>

                      {/* Manual contact */}
                      <a href={buildWhatsappUrl(patient)} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-emerald-600 hover:text-emerald-400 transition" title="WhatsApp manual">
                        <MessageCircle size={13} />
                      </a>
                      <a href={buildEmailUrl(patient)}
                        className="p-1.5 text-blue-600 hover:text-blue-400 transition" title="Email manual">
                        <Mail size={13} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Send button */}
            <div className="px-5 py-4 border-t border-[#C5A059]/10 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500 font-crimson">
                {selectedIds.length} seleccionado{selectedIds.length !== 1 ? "s" : ""} ·  Email + WhatsApp
              </p>
              <button
                onClick={() => sendReminders(selectedIds)}
                disabled={sending || selectedIds.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#C5A059] text-[#020617] text-xs font-cinzel uppercase tracking-widest hover:bg-[#D4B06A] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                {sending ? "Enviando..." : "Enviar recordatorios"}
              </button>
            </div>
          </>
        )}

        {/* Results */}
        {sendResults && (
          <div className="border-t border-[#C5A059]/10 px-5 py-4 space-y-2">
            <p className="text-xs font-cinzel text-[#C5A059] uppercase tracking-widest mb-3">Resultado del envío</p>
            {sendResults.length === 0 && (
              <p className="text-gray-500 font-crimson text-sm">No se envió ningún recordatorio</p>
            )}
            {sendResults.map((r) => (
              <div key={r.id} className="flex items-center gap-3 text-sm">
                <span className="font-crimson text-gray-300 flex-1 truncate">{r.name}</span>
                <span className={`flex items-center gap-1 text-xs ${r.email ? "text-emerald-400" : "text-red-400"}`}>
                  <Mail size={11} /> {r.email ? "OK" : "Error"}
                </span>
                <span className={`flex items-center gap-1 text-xs ${r.whatsapp ? "text-emerald-400" : "text-gray-600"}`}>
                  <MessageCircle size={11} /> {r.whatsapp ? "OK" : "—"}
                </span>
                {r.error && <span className="text-red-400 text-[10px] truncate max-w-[120px]">{r.error}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Por día de la semana ────────────────────────────────── */}
      <div className="bg-[#0a1628] border border-[#C5A059]/20">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#C5A059]/10">
          <h2 className="font-cinzel text-white text-sm uppercase tracking-widest">Programación semanal</h2>
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="bg-[#020617] border border-[#C5A059]/20 text-white text-xs font-cinzel px-2 py-1 outline-none"
          >
            <option value="all">Todos los días</option>
            {DAY_NAMES.map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
        </div>
        <div className="divide-y divide-[#C5A059]/8">
          {filteredByDay.map(({ name, dow, patients: pts }) => (
            <div key={dow} className={`px-5 py-3 ${dow === todayDow ? "bg-[#C5A059]/5" : ""}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-cinzel uppercase tracking-widest ${dow === todayDow ? "text-[#C5A059]" : "text-gray-500"}`}>
                  {name} {dow === todayDow && "· hoy"}
                </span>
                <span className="text-xs text-gray-600 font-cinzel">{pts.length}</span>
              </div>
              {pts.length === 0 ? (
                <p className="text-gray-700 text-xs font-crimson">Sin pacientes</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {pts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/academy/admin/crm/${p.id}`}
                      className="text-xs font-crimson text-gray-400 hover:text-[#C5A059] transition bg-[#020617] border border-[#C5A059]/10 px-2 py-0.5"
                    >
                      {p.first_name} ({sessionsLeft(p)}s)
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Historial de recordatorios ──────────────────────────── */}
      <div className="bg-[#0a1628] border border-[#C5A059]/20">
        <button
          onClick={() => setShowLogs((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 border-b border-[#C5A059]/10"
        >
          <h2 className="font-cinzel text-white text-sm uppercase tracking-widest">Historial de envíos</h2>
          {showLogs ? <ChevronUp size={15} className="text-gray-500" /> : <ChevronDown size={15} className="text-gray-500" />}
        </button>
        {showLogs && (
          <div className="divide-y divide-[#C5A059]/8 max-h-80 overflow-y-auto">
            {recentLogs.length === 0 && (
              <p className="py-8 text-center text-gray-600 font-crimson">Sin recordatorios enviados aún</p>
            )}
            {recentLogs.map((log) => (
              <div key={log.id} className="flex gap-3 px-5 py-3">
                <Bell size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  {log.patient_name && (
                    <p className="text-gray-300 text-xs font-cinzel mb-0.5">{log.patient_name}</p>
                  )}
                  <p className="text-gray-400 font-crimson text-sm leading-relaxed">{log.content}</p>
                  <p className="text-gray-600 text-[11px] mt-0.5">
                    {new Date(log.created_at).toLocaleDateString("es-CL", {
                      day: "numeric", month: "long", year: "numeric",
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
  );
}
