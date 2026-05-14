"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Loader2, AlertCircle, Check, Calendar, Clock, Video, ChevronLeft } from "lucide-react";
import BookingWidget from "@/components/booking/BookingWidget";

interface BookingData {
  id: string;
  booking_code: string;
  type: "session" | "entrevista";
  date: string;
  time_slot: string;
  patient_name: string;
  patient_email: string;
  status: string;
  zoom_join_url?: string;
  google_event_link?: string;
  allow_cancellation?: boolean;
  allow_reschedule?: boolean;
}

const TYPE_LABELS = { session: "Sesión TRVP", entrevista: "Entrevista de Admisión" };
const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  return `${days[date.getDay()]} ${d} de ${MONTHS_ES[m - 1]} de ${y}`;
}

export default function GestionarContent() {
  const params = useSearchParams();
  const router = useRouter();
  const code = params.get("code")?.trim().toUpperCase() ?? "";
  const actionParam = params.get("action") ?? "";

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"details" | "cancel-confirm" | "cancelled" | "reschedule">("details");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const fetchBooking = useCallback(async () => {
    if (!code) { setError("Código de reserva no encontrado en la URL."); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar/booking?code=${encodeURIComponent(code)}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "No se encontró la reserva."); }
      else { setBooking(json.booking); }
    } catch { setError("Error de conexión. Intenta de nuevo."); }
    finally { setLoading(false); }
  }, [code]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  useEffect(() => {
    if (booking && actionParam === "cancel") setView("cancel-confirm");
    if (booking && actionParam === "reschedule") setView("reschedule");
  }, [booking, actionParam]);

  async function handleCancel() {
    if (!code) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/calendar/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, action: "cancel", cancel_reason: cancelReason.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { setCancelError(json.error ?? "Error al cancelar."); }
      else { setView("cancelled"); }
    } catch { setCancelError("Error de conexión. Intenta de nuevo."); }
    finally { setCancelling(false); }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <Loader2 className="w-5 h-5 text-[#C5A059] animate-spin" />
        <span className="font-crimson text-gray-400">Buscando tu reserva…</span>
      </div>
    );
  }

  // ── Error / not found ─────────────────────────────────────────────────────
  if (error || !booking) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <p className="font-cinzel text-white text-lg mb-2">Reserva no encontrada</p>
        <p className="font-crimson text-gray-400 mb-6">{error ?? "Verifica el código e intenta de nuevo."}</p>
        <button onClick={() => router.push("/agenda")} className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/30 px-6 py-2.5 hover:bg-[#C5A059]/10 transition">
          Volver a agenda
        </button>
      </div>
    );
  }

  // ── Cancelled ─────────────────────────────────────────────────────────────
  if (view === "cancelled" || booking.status === "cancelled") {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-500/10 border border-gray-500/20 mb-5">
          <Check className="w-6 h-6 text-gray-400" />
        </div>
        <h2 className="font-cinzel text-white text-xl mb-2">Reserva cancelada</h2>
        <p className="font-crimson text-gray-400 mb-6">
          Tu {TYPE_LABELS[booking.type]} del {formatDate(booking.date)} ha sido cancelada.
        </p>
        <button onClick={() => router.push("/agenda")} className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/30 px-6 py-2.5 hover:bg-[#C5A059]/10 transition">
          Agendar nueva cita
        </button>
      </div>
    );
  }

  // ── Reschedule: show booking widget ───────────────────────────────────────
  if (view === "reschedule") {
    return (
      <div>
        <button onClick={() => setView("details")} className="flex items-center gap-1 font-cinzel text-[8px] uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition mb-8">
          <ChevronLeft className="w-3 h-3" /> Volver
        </button>
        <div className="mb-8">
          <span className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]">Reprogramando</span>
          <p className="font-crimson text-gray-400 text-sm mt-1">
            Elige una nueva fecha y hora. Tu cita actual ({formatDate(booking.date)} — {booking.time_slot}) será cancelada automáticamente.
          </p>
        </div>
        <BookingWidget type={booking.type} rescheduleCode={code} />
      </div>
    );
  }

  // ── Cancel confirmation ───────────────────────────────────────────────────
  if (view === "cancel-confirm") {
    return (
      <div className="max-w-md">
        <button onClick={() => setView("details")} className="flex items-center gap-1 font-cinzel text-[8px] uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition mb-8">
          <ChevronLeft className="w-3 h-3" /> Volver
        </button>
        <h2 className="font-cinzel text-white text-xl mb-2">¿Cancelar esta reserva?</h2>
        <p className="font-crimson text-gray-400 mb-6">Esta acción no se puede deshacer.</p>
        <div className="bg-[#0a1628] border border-white/10 p-5 mb-6">
          <p className="font-crimson text-white">{TYPE_LABELS[booking.type]}</p>
          <p className="font-crimson text-[#C5A059] font-bold capitalize">{formatDate(booking.date)} — {booking.time_slot}</p>
        </div>
        <div className="mb-6">
          <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">¿Cuál es el motivo? (opcional)</label>
          <textarea
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Cuéntanos por qué cancelas…"
            className="w-full bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson resize-none placeholder:text-gray-700"
            maxLength={500}
          />
        </div>
        {cancelError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="font-crimson text-sm text-red-300">{cancelError}</p>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex items-center gap-2 bg-red-600/80 text-white font-cinzel text-[9px] uppercase tracking-widest px-6 py-3 hover:bg-red-600 disabled:opacity-60 transition"
          >
            {cancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {cancelling ? "Cancelando…" : "Sí, cancelar cita"}
          </button>
          <button onClick={() => setView("details")} className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 border border-white/10 px-6 py-3 hover:border-white/20 transition">
            No, mantener
          </button>
        </div>
      </div>
    );
  }

  // ── Details view ──────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-8">
        <span className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]">Gestión de Reserva</span>
        <h1 className="font-cinzel text-white text-2xl mt-2">Código: {booking.booking_code}</h1>
      </div>

      <div className="bg-[#0a1628] border border-[#C5A059]/20 p-6 mb-6">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-4">Detalles</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
            <div>
              <p className="font-crimson text-white capitalize">{formatDate(booking.date)}</p>
              <p className="font-crimson text-gray-400 text-sm">{TYPE_LABELS[booking.type]}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-[#C5A059] shrink-0" />
            <p className="font-crimson text-[#C5A059] font-bold text-lg">{booking.time_slot} (hora Chile)</p>
          </div>
          {booking.zoom_join_url && (
            <div className="flex items-center gap-3">
              <Video className="w-4 h-4 text-[#C5A059] shrink-0" />
              <a href={booking.zoom_join_url} target="_blank" rel="noopener noreferrer"
                className="font-crimson text-blue-400 hover:text-blue-300 transition text-sm underline">
                Unirse a Zoom
              </a>
            </div>
          )}
          <div className="border-t border-white/10 pt-3">
            <p className="font-crimson text-gray-400 text-sm">{booking.patient_name} · {booking.patient_email}</p>
          </div>
        </div>
      </div>

      {booking.status === "rescheduled" && (
        <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-3 mb-6">
          <p className="font-crimson text-amber-300 text-sm">Esta reserva ya fue reprogramada.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {booking.allow_reschedule !== false && (
          <button
            onClick={() => setView("reschedule")}
            disabled={booking.status !== "confirmed"}
            className="flex-1 bg-[#C5A059] text-[#020617] font-cinzel text-[9px] uppercase tracking-widest py-3 hover:bg-[#C5A059]/90 disabled:opacity-40 transition"
          >
            Reprogramar
          </button>
        )}
        {booking.allow_cancellation !== false && (
          <button
            onClick={() => setView("cancel-confirm")}
            disabled={booking.status !== "confirmed"}
            className="flex-1 border border-white/20 text-gray-400 font-cinzel text-[9px] uppercase tracking-widest py-3 hover:border-red-500/40 hover:text-red-400 disabled:opacity-40 transition"
          >
            Cancelar reserva
          </button>
        )}
      </div>
    </div>
  );
}
