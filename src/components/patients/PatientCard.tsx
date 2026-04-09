"use client";

import { useState } from "react";
import {
  Plus, FileText, MessageCircle, Mail,
  PauseCircle, PlayCircle, CheckCircle, Pencil,
  ShoppingBag, RefreshCw, CalendarPlus,
} from "lucide-react";
import {
  type Patient,
  daysLeft, sessionsLeft, getAlerts,
  statusColor, statusLabel, daysLeftColor,
  buildWhatsappUrl, buildEmailUrl, patientFullName,
} from "@/lib/patients";
import AlertBanner from "./AlertBanner";
import Link from "next/link";

interface Props {
  patient: Patient;
  lastSessionAt?: string | null;
  onEdit: (p: Patient) => void;
  onRefresh: () => void;
}

const PRESETS = [1, 3, 5, 8, 10];

export default function PatientCard({ patient, lastSessionAt, onEdit, onRefresh }: Props) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showAddSessions, setShowAddSessions] = useState(false);
  const [addQty, setAddQty] = useState(5);
  const [addNotes, setAddNotes] = useState("");
  const [addStartDate, setAddStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [addingPurchase, setAddingPurchase] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [extendDays, setExtendDays] = useState(7);
  const [extendingDeadline, setExtendingDeadline] = useState(false);

  const dl = daysLeft(patient.end_date);
  const sl = sessionsLeft(patient);
  const alerts = getAlerts(patient, lastSessionAt);
  const total = patient.total_sessions || patient.pack_size;
  const progress = total > 0 ? Math.min(100, Math.round((patient.sessions_used / total) * 100)) : 0;

  async function doAction(action: string, body?: object) {
    setLoadingAction(action);
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? { action }),
      });
      if (!res.ok) throw new Error();
      onRefresh();
    } catch {
      alert("Error al ejecutar la acción");
    } finally {
      setLoadingAction(null);
    }
  }

  async function addSession() {
    if (patient.status !== "active") return;
    setLoadingAction("session");
    try {
      const res = await fetch(`/api/patients/${patient.id}/session`, { method: "POST" });
      if (!res.ok) throw new Error();
      onRefresh();
    } catch {
      alert("Error al registrar sesión");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleAddSessions() {
    if (addQty < 1) return;
    setAddingPurchase(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}/add-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: addQty, notes: addNotes, start_date: addStartDate }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Error");
      }
      setShowAddSessions(false);
      setAddQty(5);
      setAddNotes("");
      setAddStartDate(new Date().toISOString().split("T")[0]);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al agregar sesiones");
    } finally {
      setAddingPurchase(false);
    }
  }

  async function handleExtend() {
    if (extendDays < 1) return;
    setExtendingDeadline(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend_deadline", days: extendDays }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? "Error"); }
      setShowExtend(false);
      setExtendDays(7);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al extender plazo");
    } finally {
      setExtendingDeadline(false);
    }
  }

  const expiryLabel = sl === 0
    ? "Sin sesiones"
    : dl > 0 ? `${dl}d` : "Vencido";
  const expiryColor = sl === 0
    ? "text-gray-500"
    : daysLeftColor(dl);

  return (
    <div className="relative bg-[#0a1628] border border-[#C5A059]/15 hover:border-[#C5A059]/35 transition-all duration-300 p-4">
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#C5A059]/30" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#C5A059]/30" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#C5A059]/30" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#C5A059]/30" />

      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <Link href={`/academy/admin/crm/${patient.id}`} className="font-cinzel text-white text-sm leading-snug hover:text-[#C5A059] transition line-clamp-1">
            {patientFullName(patient)}
          </Link>
          <p className="text-gray-500 text-xs font-crimson mt-0.5">{patient.email}</p>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-cinzel uppercase tracking-wide px-2 py-0.5 border ${statusColor(patient.status)}`}>
          {statusLabel(patient.status)}
        </span>
      </div>

      {/* Session info */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400 font-cinzel">
            {patient.sessions_used}/{total} sesiones
          </span>
          <span className={`text-xs font-cinzel font-bold ${expiryColor}`}>
            {expiryLabel}
          </span>
        </div>
        <div className="h-1.5 bg-[#020617] border border-[#C5A059]/10">
          <div
            className="h-full bg-[#C5A059] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <AlertBanner alerts={alerts} />

      {/* Actions */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        <button
          onClick={addSession}
          disabled={!!loadingAction || patient.status !== "active"}
          title="Registrar sesión"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-[11px] font-cinzel uppercase tracking-wide hover:bg-[#C5A059]/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={11} />
          Sesión
        </button>

        <button
          onClick={() => setShowAddSessions((v) => !v)}
          title="Agregar sesiones compradas"
          className={`flex items-center gap-1 px-2.5 py-1.5 border text-[11px] font-cinzel uppercase tracking-wide transition ${
            showAddSessions
              ? "border-[#C5A059]/50 text-[#C5A059] bg-[#C5A059]/10"
              : "border-[#C5A059]/20 text-[#C5A059]/60 hover:text-[#C5A059] hover:border-[#C5A059]/40"
          }`}
        >
          <ShoppingBag size={11} />
          Compra
        </button>

        <button
          onClick={() => setShowExtend((v) => !v)}
          title="Extender plazo de vencimiento"
          className={`flex items-center gap-1 px-2.5 py-1.5 border text-[11px] font-cinzel uppercase tracking-wide transition ${
            showExtend
              ? "border-blue-400/50 text-blue-400 bg-blue-950/40"
              : "border-blue-400/20 text-blue-400/50 hover:text-blue-400 hover:border-blue-400/40"
          }`}
        >
          <CalendarPlus size={11} />
          Plazo
        </button>

        <Link
          href={`/academy/admin/crm/${patient.id}`}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800/60 border border-gray-600/30 text-gray-400 text-[11px] font-cinzel uppercase tracking-wide hover:text-white hover:border-gray-500/50 transition"
        >
          <FileText size={11} />
          Detalle
        </Link>

        <a
          href={buildWhatsappUrl(patient)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-950/60 border border-emerald-600/30 text-emerald-400 text-[11px] font-cinzel uppercase tracking-wide hover:bg-emerald-900/40 transition"
        >
          <MessageCircle size={11} />WA
        </a>

        <a
          href={buildEmailUrl(patient)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-950/60 border border-blue-600/30 text-blue-400 text-[11px] font-cinzel uppercase tracking-wide hover:bg-blue-900/40 transition"
        >
          <Mail size={11} />Email
        </a>

        <button
          onClick={() => onEdit(patient)}
          title="Editar paciente"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800/60 border border-gray-600/30 text-gray-400 text-[11px] font-cinzel uppercase tracking-wide hover:text-white transition"
        >
          <Pencil size={11} />
        </button>

        {patient.status === "active" && (
          <button
            onClick={() => doAction("pause", { action: "pause" })}
            disabled={!!loadingAction}
            className="flex items-center gap-1 px-2.5 py-1.5 border bg-yellow-950/60 border-yellow-600/30 text-yellow-400 text-[11px] font-cinzel uppercase tracking-wide hover:bg-yellow-900/40 transition disabled:opacity-40"
          >
            <PauseCircle size={11} />Pausar
          </button>
        )}
        {patient.status !== "active" && (
          <button
            onClick={() => doAction("activate", { action: "activate" })}
            disabled={!!loadingAction}
            className="flex items-center gap-1 px-2.5 py-1.5 border bg-emerald-950/60 border-emerald-600/30 text-emerald-400 text-[11px] font-cinzel uppercase tracking-wide hover:bg-emerald-900/40 transition disabled:opacity-40"
          >
            <PlayCircle size={11} />Reactivar
          </button>
        )}

        {patient.status !== "finished" && (
          <button
            onClick={() => {
              if (confirm(`¿Finalizar a ${patientFullName(patient)}?`)) doAction("finish", { action: "finish" });
            }}
            disabled={!!loadingAction}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-900/60 border border-gray-600/20 text-gray-500 text-[11px] font-cinzel uppercase tracking-wide hover:text-red-400 hover:border-red-500/30 transition disabled:opacity-40"
          >
            <CheckCircle size={11} />Finalizar
          </button>
        )}
      </div>

      {/* Extend deadline inline form */}
      {showExtend && (
        <div className="mt-3 p-3 bg-[#020617] border border-blue-400/20 space-y-2">
          <p className="text-[10px] font-cinzel text-blue-400/70 uppercase tracking-widest">Extender plazo</p>
          <div className="flex gap-1 flex-wrap">
            {[7, 14, 21, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setExtendDays(d)}
                className={`px-2 py-0.5 text-[10px] font-cinzel border transition ${
                  extendDays === d ? "border-blue-400 text-blue-400 bg-blue-400/10" : "border-blue-400/15 text-gray-500 hover:text-gray-300"
                }`}
              >
                {d}d
              </button>
            ))}
            <input
              type="number"
              min={1}
              value={extendDays}
              onChange={(e) => setExtendDays(Math.max(1, Number(e.target.value)))}
              className="w-14 bg-[#0a1628] border border-blue-400/20 text-white px-2 py-0.5 text-xs font-crimson outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExtend}
              disabled={extendingDeadline}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/80 text-white text-[10px] font-cinzel uppercase tracking-widest hover:bg-blue-600 transition disabled:opacity-50"
            >
              {extendingDeadline ? <RefreshCw size={10} className="animate-spin" /> : <CalendarPlus size={10} />}
              {extendingDeadline ? "..." : `+${extendDays} días`}
            </button>
            <button
              onClick={() => setShowExtend(false)}
              className="px-3 py-1.5 border border-blue-400/15 text-gray-500 text-[10px] font-cinzel uppercase tracking-widest hover:text-gray-300 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Add sessions inline form */}
      {showAddSessions && (
        <div className="mt-3 p-3 bg-[#020617] border border-[#C5A059]/20 space-y-2">
          <p className="text-[10px] font-cinzel text-[#C5A059]/70 uppercase tracking-widest">Registrar compra</p>
          <div className="flex gap-1 flex-wrap">
            {PRESETS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAddQty(q)}
                className={`px-2 py-0.5 text-[10px] font-cinzel border transition ${
                  addQty === q ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/10" : "border-[#C5A059]/15 text-gray-500 hover:text-gray-300"
                }`}
              >
                {q}
              </button>
            ))}
            <input
              type="number"
              min={1}
              value={addQty}
              onChange={(e) => setAddQty(Math.max(1, Number(e.target.value)))}
              className="w-14 bg-[#0a1628] border border-[#C5A059]/20 text-white px-2 py-0.5 text-xs font-crimson outline-none"
            />
          </div>
          <input
            type="date"
            value={addStartDate}
            onChange={(e) => setAddStartDate(e.target.value)}
            className="w-full bg-[#0a1628] border border-[#C5A059]/15 text-white px-2 py-1 text-xs font-crimson outline-none"
          />
          <input
            type="text"
            value={addNotes}
            onChange={(e) => setAddNotes(e.target.value)}
            placeholder="Nota (opcional)"
            className="w-full bg-[#0a1628] border border-[#C5A059]/15 text-white px-2 py-1 text-xs font-crimson outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddSessions}
              disabled={addingPurchase}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#C5A059] text-[#020617] text-[10px] font-cinzel uppercase tracking-widest hover:bg-[#D4B06A] transition disabled:opacity-50"
            >
              {addingPurchase ? <RefreshCw size={10} className="animate-spin" /> : <ShoppingBag size={10} />}
              {addingPurchase ? "..." : `+${addQty} ses.`}
            </button>
            <button
              onClick={() => setShowAddSessions(false)}
              className="px-3 py-1.5 border border-[#C5A059]/15 text-gray-500 text-[10px] font-cinzel uppercase tracking-widest hover:text-gray-300 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
