"use client";

import { useState } from "react";
import {
  Bell, Dumbbell, StickyNote, RefreshCw, ArrowLeft,
  MessageCircle, Mail, Plus, Pencil, ShoppingBag, PlayCircle,
} from "lucide-react";
import Link from "next/link";
import {
  type Patient, type PatientLog,
  daysLeft, sessionsLeft, getAlerts,
  statusColor, statusLabel, daysLeftColor,
  buildWhatsappUrl, buildEmailUrl, patientFullName,
} from "@/lib/patients";
import AlertBanner from "./AlertBanner";
import PatientForm from "./PatientForm";

const LOG_ICONS: Record<string, React.ReactNode> = {
  reminder_sent: <Bell size={14} className="text-blue-400" />,
  session_registered: <Dumbbell size={14} className="text-emerald-400" />,
  note_added: <StickyNote size={14} className="text-yellow-400" />,
  status_changed: <RefreshCw size={14} className="text-purple-400" />,
  session_purchased: <ShoppingBag size={14} className="text-[#C5A059]" />,
};

interface Props {
  patient: Patient;
  logs: PatientLog[];
}

export default function PatientDetail({ patient: initialPatient, logs: initialLogs }: Props) {
  const [patient, setPatient] = useState(initialPatient);
  const [logs, setLogs] = useState(initialLogs);
  const [showEdit, setShowEdit] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showAddSessions, setShowAddSessions] = useState(false);
  const [addQty, setAddQty] = useState(5);
  const [addNotes, setAddNotes] = useState("");
  const [addingsessions, setAddingSessions] = useState(false);

  const dl = daysLeft(patient.end_date);
  const sl = sessionsLeft(patient);
  const alerts = getAlerts(patient, logs.find((l) => l.type === "session_registered")?.created_at);

  async function refresh() {
    const [pr, lr] = await Promise.all([
      fetch(`/api/patients/${patient.id}`).then((r) => r.json()),
      fetch(`/api/patients/${patient.id}/log`).then((r) => r.json()),
    ]);
    if (pr.patient) setPatient(pr.patient);
    if (lr.logs) setLogs(lr.logs);
  }

  async function addSession() {
    setLoadingAction("session");
    try {
      const res = await fetch(`/api/patients/${patient.id}/session`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Error");
      }
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al registrar sesión");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleAddSessions() {
    if (addQty < 1) return;
    setAddingSessions(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}/add-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: addQty, notes: addNotes }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Error");
      }
      setShowAddSessions(false);
      setAddQty(5);
      setAddNotes("");
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al agregar sesiones");
    } finally {
      setAddingSessions(false);
    }
  }

  async function changeStatus(action: "pause" | "activate" | "finish") {
    const labels = { pause: "pausar", activate: "reactivar", finish: "finalizar" };
    if (!confirm(`¿${labels[action]} a ${patientFullName(patient)}?`)) return;
    setLoadingAction(action);
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      await refresh();
    } catch {
      alert("Error al cambiar estado");
    } finally {
      setLoadingAction(null);
    }
  }

  async function saveNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "note_added", content: noteText.trim() }),
      });
      if (!res.ok) throw new Error();
      setNoteText("");
      await refresh();
    } catch {
      alert("Error al guardar nota");
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-12">
      {/* Back */}
      <Link
        href="/academy/admin/crm"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-[#C5A059] text-xs font-cinzel uppercase tracking-widest mb-6 transition"
      >
        <ArrowLeft size={13} />
        CRM
      </Link>

      {/* Header card */}
      <div className="bg-[#0a1628] border border-[#C5A059]/20 p-5 mb-6 relative">
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#C5A059]/40" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#C5A059]/40" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#C5A059]/40" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#C5A059]/40" />

        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-cinzel text-white text-lg leading-snug">{patientFullName(patient)}</h1>
              <span className={`text-[10px] font-cinzel uppercase tracking-wide px-2 py-0.5 border ${statusColor(patient.status)}`}>
                {statusLabel(patient.status)}
              </span>
            </div>
            <p className="text-gray-400 text-sm font-crimson">{patient.email} · {patient.phone}</p>
          </div>

          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#C5A059]/20 text-[#C5A059] text-xs font-cinzel uppercase tracking-widest hover:bg-[#C5A059]/10 transition flex-shrink-0"
          >
            <Pencil size={12} />
            Editar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-[#020617] border border-[#C5A059]/10 p-3 text-center">
            <p className="text-[10px] font-cinzel text-gray-500 uppercase tracking-wide mb-1">Total</p>
            <p className="text-[#C5A059] font-cinzel font-bold text-lg">{patient.total_sessions}</p>
          </div>
          <div className="bg-[#020617] border border-[#C5A059]/10 p-3 text-center">
            <p className="text-[10px] font-cinzel text-gray-500 uppercase tracking-wide mb-1">Usadas</p>
            <p className="text-white font-cinzel font-bold text-lg">{patient.sessions_used}/{patient.total_sessions}</p>
          </div>
          <div className="bg-[#020617] border border-[#C5A059]/10 p-3 text-center">
            <p className="text-[10px] font-cinzel text-gray-500 uppercase tracking-wide mb-1">Restantes</p>
            <p className={`font-cinzel font-bold text-lg ${sl === 0 ? "text-gray-500" : sl <= 2 ? "text-yellow-400" : "text-emerald-400"}`}>{sl}</p>
          </div>
          <div className="bg-[#020617] border border-[#C5A059]/10 p-3 text-center">
            <p className="text-[10px] font-cinzel text-gray-500 uppercase tracking-wide mb-1">Vence</p>
            <p className={`font-cinzel font-bold text-sm ${sl === 0 ? "text-gray-500" : daysLeftColor(dl)}`}>
              {sl === 0 ? "Sin ses." : dl > 0 ? `${dl}d` : "Vencido"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-[#020617] border border-[#C5A059]/10">
          <div
            className="h-full bg-[#C5A059] transition-all duration-500"
            style={{ width: `${patient.total_sessions > 0 ? Math.min(100, Math.round((patient.sessions_used / patient.total_sessions) * 100)) : 0}%` }}
          />
        </div>

        <AlertBanner alerts={alerts} />

        {/* Notes */}
        {patient.notes && (
          <div className="mt-4 p-3 bg-[#020617] border border-[#C5A059]/10">
            <p className="text-xs font-cinzel text-gray-500 uppercase tracking-wide mb-1">Notas</p>
            <p className="text-gray-300 font-crimson text-sm leading-relaxed whitespace-pre-line">{patient.notes}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={addSession}
            disabled={!!loadingAction || patient.status !== "active"}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-xs font-cinzel uppercase tracking-wide hover:bg-[#C5A059]/20 transition disabled:opacity-40"
          >
            <Plus size={12} />
            {loadingAction === "session" ? "Registrando..." : "+Sesión"}
          </button>
          <button
            onClick={() => setShowAddSessions((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#C5A059]/5 border border-[#C5A059]/20 text-[#C5A059]/70 text-xs font-cinzel uppercase tracking-wide hover:bg-[#C5A059]/15 hover:text-[#C5A059] transition"
          >
            <ShoppingBag size={12} />
            Agregar sesiones
          </button>
          <a href={buildWhatsappUrl(patient)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/60 border border-emerald-600/30 text-emerald-400 text-xs font-cinzel uppercase tracking-wide hover:bg-emerald-900/40 transition">
            <MessageCircle size={12} />WhatsApp
          </a>
          <a href={buildEmailUrl(patient)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-950/60 border border-blue-600/30 text-blue-400 text-xs font-cinzel uppercase tracking-wide hover:bg-blue-900/40 transition">
            <Mail size={12} />Email
          </a>
          {patient.status === "active" && (
            <button onClick={() => changeStatus("pause")} disabled={!!loadingAction}
              className="flex items-center gap-1.5 px-3 py-2 bg-yellow-950/60 border border-yellow-600/30 text-yellow-400 text-xs font-cinzel uppercase tracking-wide hover:bg-yellow-900/40 transition disabled:opacity-40">
              Pausar
            </button>
          )}
          {patient.status !== "active" && (
            <button onClick={() => changeStatus("activate")} disabled={!!loadingAction}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/60 border border-emerald-600/30 text-emerald-400 text-xs font-cinzel uppercase tracking-wide hover:bg-emerald-900/40 transition disabled:opacity-40">
              <PlayCircle size={12} />Reactivar
            </button>
          )}
          {patient.status !== "finished" && (
            <button onClick={() => changeStatus("finish")} disabled={!!loadingAction}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-900/60 border border-gray-600/20 text-gray-500 text-xs font-cinzel uppercase tracking-wide hover:text-red-400 hover:border-red-500/30 transition disabled:opacity-40">
              Finalizar
            </button>
          )}
        </div>

        {/* Add sessions inline form */}
        {showAddSessions && (
          <div className="mt-4 p-4 bg-[#020617] border border-[#C5A059]/20 space-y-3">
            <p className="text-[10px] font-cinzel text-[#C5A059] uppercase tracking-widest">Registrar compra de sesiones</p>
            <div className="flex gap-3 items-end">
              <div>
                <label className="block text-[10px] font-cinzel text-gray-500 uppercase tracking-wide mb-1">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={addQty}
                  onChange={(e) => setAddQty(Math.max(1, Number(e.target.value)))}
                  className="w-20 bg-[#0a1628] border border-[#C5A059]/20 text-white px-3 py-2 text-sm font-crimson focus:border-[#C5A059]/40 outline-none"
                />
              </div>
              <div className="flex gap-1">
                {[1, 3, 5, 8, 10].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAddQty(q)}
                    className={`px-2 py-1 text-[10px] font-cinzel border transition ${
                      addQty === q ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/10" : "border-[#C5A059]/15 text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-cinzel text-gray-500 uppercase tracking-wide mb-1">Nota (opcional)</label>
              <input
                type="text"
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                placeholder="Ej: Compra sesión suelta, Pack renovado..."
                className="w-full bg-[#0a1628] border border-[#C5A059]/20 text-white px-3 py-2 text-sm font-crimson focus:border-[#C5A059]/40 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddSessions}
                disabled={addingsessions}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#C5A059] text-[#020617] text-xs font-cinzel uppercase tracking-widest hover:bg-[#D4B06A] transition disabled:opacity-50"
              >
                {addingsessions ? <RefreshCw size={11} className="animate-spin" /> : <ShoppingBag size={11} />}
                {addingsessions ? "Guardando..." : `Agregar ${addQty} sesión${addQty === 1 ? "" : "es"}`}
              </button>
              <button
                onClick={() => setShowAddSessions(false)}
                className="px-4 py-2 border border-[#C5A059]/15 text-gray-500 text-xs font-cinzel uppercase tracking-widest hover:text-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add note */}
      <div className="bg-[#0a1628] border border-[#C5A059]/10 p-4 mb-6">
        <p className="text-xs font-cinzel text-gray-500 uppercase tracking-widest mb-2">Agregar nota</p>
        <div className="flex gap-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={2}
            placeholder="Escribe una observación..."
            className="flex-1 bg-[#020617] border border-[#C5A059]/15 text-white px-3 py-2 text-sm font-crimson focus:border-[#C5A059]/40 outline-none resize-none"
          />
          <button
            onClick={saveNote}
            disabled={savingNote || !noteText.trim()}
            className="px-4 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-xs font-cinzel uppercase tracking-wide hover:bg-[#C5A059]/20 transition disabled:opacity-40"
          >
            {savingNote ? "..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Logs */}
      <div>
        <h2 className="text-xs font-cinzel text-gray-500 uppercase tracking-widest mb-3">Historial</h2>
        {logs.length === 0 && (
          <p className="text-gray-600 font-crimson text-sm text-center py-8">Sin registros aún</p>
        )}
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 bg-[#0a1628] border border-[#C5A059]/8 px-4 py-3">
              <div className="flex-shrink-0 mt-0.5">{LOG_ICONS[log.type] ?? <StickyNote size={14} className="text-gray-500" />}</div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 font-crimson text-sm leading-relaxed">{log.content}</p>
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
      </div>

      {showEdit && (
        <PatientForm
          patient={patient}
          onClose={() => setShowEdit(false)}
          onSaved={async () => { await refresh(); }}
        />
      )}
    </div>
  );
}
