"use client";

import { Calendar, Check, RefreshCw, LogOut, AlertCircle } from "lucide-react";

interface Props {
  connected: boolean | null; // null = loading
  loading: boolean;
  scheduledCount: number;
  weekStart?: string;
  weekEnd?: string;
  onDisconnect: () => void;
  onRefresh: () => void;
}

export default function CalendarStatusBanner({
  connected,
  loading,
  scheduledCount,
  weekStart,
  weekEnd,
  onDisconnect,
  onRefresh,
}: Props) {
  if (connected === null || loading) {
    return (
      <div className="bg-[#0a1628] border border-[#C5A059]/20 px-5 py-3 flex items-center gap-2">
        <RefreshCw size={12} className="text-gray-500 animate-spin" />
        <span className="text-[10px] font-cinzel text-gray-500 uppercase tracking-widest">
          Verificando Google Calendar...
        </span>
      </div>
    );
  }

  if (!connected) {
    const authUrl = `/api/calendar/auth?returnTo=${encodeURIComponent(
      typeof window !== "undefined" ? window.location.pathname : "/admin/pacientes"
    )}`;
    return (
      <div className="bg-[#0a1628] border border-[#C5A059]/20 px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle size={12} className="text-gray-600 flex-shrink-0" />
          <span className="text-[10px] font-cinzel text-gray-500 uppercase tracking-widest">
            Google Calendar no conectado — no puedes ver quién ya agendó
          </span>
        </div>
        <a
          href={authUrl}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#C5A059] text-[#020617] text-[10px] font-cinzel uppercase tracking-widest hover:bg-[#D4B06A] transition"
        >
          <Calendar size={11} />
          Conectar
        </a>
      </div>
    );
  }

  const weekLabel =
    weekStart && weekEnd
      ? `${new Date(weekStart + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "short" })} – ${new Date(weekEnd + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "short" })}`
      : "esta semana";

  return (
    <div className="bg-emerald-950/30 border border-emerald-600/20 px-5 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Check size={12} className="text-emerald-400 flex-shrink-0" />
        <span className="text-[10px] font-cinzel text-emerald-400 uppercase tracking-widest">
          Google Calendar conectado
        </span>
        <span className="text-[10px] font-cinzel text-gray-500">·</span>
        <span className="text-[10px] font-cinzel text-gray-400">
          <span className="text-emerald-400">{scheduledCount}</span> con cita {weekLabel}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Actualizar citas"
          className="p-1 text-gray-500 hover:text-[#C5A059] transition"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
        <button
          onClick={onDisconnect}
          title="Desconectar Google Calendar"
          className="flex items-center gap-1 text-[10px] font-cinzel text-gray-600 hover:text-red-400 transition uppercase tracking-widest"
        >
          <LogOut size={11} />
          <span className="hidden sm:inline">Desconectar</span>
        </button>
      </div>
    </div>
  );
}
