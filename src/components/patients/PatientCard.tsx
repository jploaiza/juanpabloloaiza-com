"use client";

import { useState } from "react";
import {
  Plus, FileText, MessageCircle, Mail,
  PauseCircle, PlayCircle, CheckCircle, Pencil, Trash2,
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

export default function PatientCard({ patient, lastSessionAt, onEdit, onRefresh }: Props) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const dl = daysLeft(patient.end_date);
  const sl = sessionsLeft(patient);
  const alerts = getAlerts(patient, lastSessionAt);
  const progress = Math.min(100, Math.round((patient.sessions_used / patient.pack_size) * 100));

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
    if (sl <= 0) return;
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

  const isPausing = patient.status === "active";

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

      {/* Pack info */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400 font-cinzel">
            Pack {patient.pack_size} · {patient.sessions_used}/{patient.pack_size} sesiones
          </span>
          <span className={`text-xs font-cinzel font-bold ${daysLeftColor(dl)}`}>
            {dl > 0 ? `${dl}d restantes` : "Vencido"}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-[#020617] border border-[#C5A059]/10">
          <div
            className="h-full bg-[#C5A059] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Alerts */}
      <AlertBanner alerts={alerts} />

      {/* Actions */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {/* +Sesión */}
        <button
          onClick={addSession}
          disabled={!!loadingAction || sl <= 0 || patient.status !== "active"}
          title="Registrar sesión"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-[11px] font-cinzel uppercase tracking-wide hover:bg-[#C5A059]/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={11} />
          Sesión
        </button>

        {/* Notas / Detalle */}
        <Link
          href={`/academy/admin/crm/${patient.id}`}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800/60 border border-gray-600/30 text-gray-400 text-[11px] font-cinzel uppercase tracking-wide hover:text-white hover:border-gray-500/50 transition"
        >
          <FileText size={11} />
          Notas
        </Link>

        {/* WhatsApp */}
        <a
          href={buildWhatsappUrl(patient)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-950/60 border border-emerald-600/30 text-emerald-400 text-[11px] font-cinzel uppercase tracking-wide hover:bg-emerald-900/40 transition"
        >
          <MessageCircle size={11} />
          WA
        </a>

        {/* Email */}
        <a
          href={buildEmailUrl(patient)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-950/60 border border-blue-600/30 text-blue-400 text-[11px] font-cinzel uppercase tracking-wide hover:bg-blue-900/40 transition"
        >
          <Mail size={11} />
          Email
        </a>

        {/* Editar */}
        <button
          onClick={() => onEdit(patient)}
          title="Editar paciente"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800/60 border border-gray-600/30 text-gray-400 text-[11px] font-cinzel uppercase tracking-wide hover:text-white transition"
        >
          <Pencil size={11} />
        </button>

        {/* Pausar / Reactivar */}
        {patient.status !== "finished" && (
          <button
            onClick={() => doAction(isPausing ? "pause" : "activate", { action: isPausing ? "pause" : "activate" })}
            disabled={!!loadingAction}
            title={isPausing ? "Pausar" : "Reactivar"}
            className={`flex items-center gap-1 px-2.5 py-1.5 border text-[11px] font-cinzel uppercase tracking-wide transition disabled:opacity-40 ${
              isPausing
                ? "bg-yellow-950/60 border-yellow-600/30 text-yellow-400 hover:bg-yellow-900/40"
                : "bg-emerald-950/60 border-emerald-600/30 text-emerald-400 hover:bg-emerald-900/40"
            }`}
          >
            {isPausing ? <PauseCircle size={11} /> : <PlayCircle size={11} />}
            {isPausing ? "Pausar" : "Reactivar"}
          </button>
        )}

        {/* Finalizar */}
        {patient.status !== "finished" && (
          <button
            onClick={() => {
              if (confirm(`¿Finalizar el pack de ${patientFullName(patient)}?`)) {
                doAction("finish", { action: "finish" });
              }
            }}
            disabled={!!loadingAction}
            title="Finalizar pack"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-900/60 border border-gray-600/20 text-gray-500 text-[11px] font-cinzel uppercase tracking-wide hover:text-red-400 hover:border-red-500/30 transition disabled:opacity-40"
          >
            <CheckCircle size={11} />
            Finalizar
          </button>
        )}
      </div>
    </div>
  );
}
