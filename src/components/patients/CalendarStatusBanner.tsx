"use client";

import { useState, useEffect } from "react";
import { Calendar, Check, RefreshCw, LogOut, AlertCircle, ChevronDown } from "lucide-react";

interface CalendarOption {
  id: string;
  summary: string;
  primary: boolean;
}

interface Props {
  connected: boolean | null;
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
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [calLoading, setCalLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!connected) return;
    setCalLoading(true);
    fetch("/api/calendar/calendars")
      .then((r) => r.json())
      .then((data) => {
        setCalendars(data.calendars ?? []);
        setSelectedId(data.selected ?? "primary");
      })
      .catch(() => {})
      .finally(() => setCalLoading(false));
  }, [connected]);

  async function handleCalendarChange(id: string) {
    setSelectedId(id);
    setSaving(true);
    try {
      await fetch("/api/calendar/calendars", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendar_id: id }),
      });
      // Refresh events with new calendar
      onRefresh();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  // ── Loading ────────────────────────────────────────────────────
  if (connected === null || loading) {
    return (
      <div className="bg-[#16213e] border border-[#C5A059]/20 px-5 py-3 flex items-center gap-2">
        <RefreshCw size={12} className="text-gray-500 animate-spin" />
        <span className="text-[10px] font-cinzel text-gray-500 uppercase tracking-widest">
          Verificando Google Calendar...
        </span>
      </div>
    );
  }

  // ── Not connected ──────────────────────────────────────────────
  if (!connected) {
    const authUrl = `/api/calendar/auth?returnTo=${encodeURIComponent(
      typeof window !== "undefined" ? window.location.pathname : "/admin/pacientes"
    )}`;
    return (
      <div className="bg-[#16213e] border border-[#C5A059]/20 px-5 py-3 flex items-center justify-between gap-3">
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

  // ── Connected ──────────────────────────────────────────────────
  const weekLabel =
    weekStart && weekEnd
      ? `${new Date(weekStart + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "short" })} – ${new Date(weekEnd + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "short" })}`
      : "esta semana";

  const selectedName = calendars.find((c) => c.id === selectedId)?.summary ?? selectedId;

  return (
    <div className="bg-emerald-950/30 border border-emerald-600/20">
      {/* Status row */}
      <div className="px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Check size={12} className="text-emerald-400 flex-shrink-0" />
          <span className="text-[10px] font-cinzel text-emerald-400 uppercase tracking-widest">
            Google Calendar conectado
          </span>
          <span className="text-[10px] font-cinzel text-gray-500">·</span>
          <span className="text-[10px] font-cinzel text-gray-400">
            <span className="text-emerald-400">{scheduledCount}</span> con cita {weekLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onRefresh}
            disabled={loading || saving}
            title="Actualizar citas"
            className="p-1 text-gray-500 hover:text-[#C5A059] transition"
          >
            <RefreshCw size={12} className={loading || saving ? "animate-spin" : ""} />
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

      {/* Calendar selector */}
      <div className="px-5 py-2.5 border-t border-emerald-700/20 flex items-center gap-3">
        <Calendar size={11} className="text-emerald-400/60 flex-shrink-0" />
        <span className="text-[10px] font-cinzel text-gray-500 uppercase tracking-widest flex-shrink-0">
          Calendario:
        </span>
        {calLoading ? (
          <span className="text-[10px] font-cinzel text-gray-600">Cargando...</span>
        ) : calendars.length === 0 ? (
          <span className="text-[10px] font-cinzel text-gray-600">{selectedId}</span>
        ) : (
          <div className="relative flex-1 max-w-xs">
            <select
              value={selectedId}
              onChange={(e) => handleCalendarChange(e.target.value)}
              disabled={saving}
              className="w-full appearance-none bg-[#0a1628] border border-emerald-700/30 text-white text-[11px] font-cinzel px-3 py-1.5 pr-7 outline-none focus:border-emerald-500/50 transition cursor-pointer disabled:opacity-60"
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.summary}{c.primary ? " (principal)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        )}
        {saving && (
          <span className="text-[10px] font-cinzel text-emerald-400/60">Guardando...</span>
        )}
      </div>
    </div>
  );
}
