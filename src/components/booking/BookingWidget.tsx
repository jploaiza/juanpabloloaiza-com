"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Clock, Check, Loader2, AlertCircle } from "lucide-react";

type BookingType = "session" | "entrevista";

interface Props {
  type: BookingType;
}

const TYPE_LABELS: Record<BookingType, string> = {
  session: "Sesión TRVP",
  entrevista: "Entrevista de Admisión",
};

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function formatDateLabel(date: Date): string {
  return `${DAYS_ES[date.getDay()]} ${date.getDate()} de ${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`;
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getWeekDates(offsetWeeks: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay();
  const toMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(today);
  mon.setDate(today.getDate() + toMon + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

export default function BookingWidget({ type }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<"date" | "time" | "form" | "success">("date");

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDates = getWeekDates(weekOffset);

  const fetchSlots = useCallback(async (date: string) => {
    setSlotsLoading(true);
    setSlots([]);
    try {
      const res = await fetch(`/api/calendar/availability?date=${date}&type=${type}`);
      const json = await res.json();
      setSlots(json.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  const handleDateSelect = (date: Date) => {
    const iso = isoDate(date);
    setSelectedDate(iso);
    setSelectedTime(null);
    setStep("time");
    setError(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("form");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/calendar/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, notes, date: selectedDate, time: selectedTime, type }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Error al reservar. Intenta de nuevo.");
      } else {
        setStep("success");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (step === "success") {
    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
          <Check className="w-7 h-7 text-emerald-400" />
        </div>
        <h2 className="font-cinzel text-2xl text-white mb-3">¡Cita confirmada!</h2>
        <p className="font-crimson text-lg text-gray-400 mb-2">
          {selectedDate && selectedTime && (
            <>{formatDateLabel(new Date(`${selectedDate}T12:00:00`))} a las {selectedTime}</>
          )}
        </p>
        <p className="font-crimson text-gray-500 mb-8">Revisa tu correo — te enviamos la confirmación.</p>
        <button
          onClick={() => { setStep("date"); setSelectedDate(null); setSelectedTime(null); setName(""); setEmail(""); setPhone(""); setNotes(""); }}
          className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/30 px-6 py-2.5 hover:bg-[#C5A059]/10 transition"
        >
          Agendar otra cita
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(["date", "time", "form"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-cinzel text-[9px] border transition
              ${step === s || (step === "form" && s === "date") || (step === "form" && s === "time")
                ? "bg-[#C5A059] border-[#C5A059] text-[#020617]"
                : "border-white/10 text-gray-600"}`}
            >
              {i + 1}
            </div>
            <span className={`font-cinzel text-[8px] uppercase tracking-widest hidden sm:block
              ${step === s ? "text-[#C5A059]" : "text-gray-600"}`}>
              {s === "date" ? "Fecha" : s === "time" ? "Hora" : "Datos"}
            </span>
            {i < 2 && <div className="w-8 h-px bg-white/10" />}
          </div>
        ))}
      </div>

      {/* DATE STEP */}
      {step === "date" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
              disabled={weekOffset === 0}
              className="p-2 text-gray-500 hover:text-[#C5A059] disabled:opacity-20 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="font-cinzel text-[10px] uppercase tracking-widest text-gray-400">
              {weekDates[0].getDate()} {MONTHS_ES[weekDates[0].getMonth()]} — {weekDates[6].getDate()} {MONTHS_ES[weekDates[6].getMonth()]} {weekDates[6].getFullYear()}
            </p>
            <button
              onClick={() => setWeekOffset((w) => Math.min(w + 1, 8))}
              className="p-2 text-gray-500 hover:text-[#C5A059] transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekDates.map((date, i) => {
              const iso = isoDate(date);
              const isPast = date < today;
              const isSun = i === 0;
              const disabled = isPast || isSun;
              return (
                <button
                  key={iso}
                  onClick={() => !disabled && handleDateSelect(date)}
                  disabled={disabled}
                  className={`flex flex-col items-center py-3 px-1 border transition
                    ${disabled ? "opacity-20 cursor-not-allowed border-white/5" : "border-white/5 hover:border-[#C5A059]/40 hover:bg-[#C5A059]/5 cursor-pointer"}
                    ${selectedDate === iso ? "bg-[#C5A059]/10 border-[#C5A059]/50" : "bg-[#0a1628]"}`}
                >
                  <span className="font-cinzel text-[8px] uppercase tracking-widest text-gray-500 mb-1">{DAYS_ES[date.getDay()]}</span>
                  <span className={`font-cinzel text-lg ${selectedDate === iso ? "text-[#C5A059]" : "text-white"}`}>{date.getDate()}</span>
                </button>
              );
            })}
          </div>
          <p className="font-crimson text-xs text-gray-600 mt-4 text-center">Selecciona una fecha para ver los horarios disponibles</p>
        </div>
      )}

      {/* TIME STEP */}
      {step === "time" && selectedDate && (
        <div>
          <button onClick={() => { setStep("date"); setSelectedDate(null); }} className="flex items-center gap-1 font-cinzel text-[8px] uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition mb-6">
            <ChevronLeft className="w-3 h-3" /> Cambiar fecha
          </button>
          <p className="font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059] mb-6">
            {formatDateLabel(new Date(`${selectedDate}T12:00:00`))}
          </p>

          {slotsLoading ? (
            <div className="flex items-center gap-2 py-12 justify-center">
              <Loader2 className="w-4 h-4 text-[#C5A059] animate-spin" />
              <span className="font-crimson text-gray-500">Consultando disponibilidad…</span>
            </div>
          ) : slots.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="w-6 h-6 text-gray-600 mx-auto mb-3" />
              <p className="font-crimson text-gray-500">Sin horarios disponibles este día.</p>
              <button onClick={() => setStep("date")} className="mt-4 font-cinzel text-[8px] uppercase tracking-widest text-[#C5A059] hover:underline">
                Elegir otra fecha
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => handleTimeSelect(slot)}
                  className={`py-3 font-cinzel text-sm border transition
                    ${selectedTime === slot
                      ? "bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059]"
                      : "bg-[#0a1628] border-white/5 text-gray-300 hover:border-[#C5A059]/40 hover:text-[#C5A059]"}`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FORM STEP */}
      {step === "form" && selectedDate && selectedTime && (
        <div>
          <button onClick={() => { setStep("time"); setSelectedTime(null); }} className="flex items-center gap-1 font-cinzel text-[8px] uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition mb-6">
            <ChevronLeft className="w-3 h-3" /> Cambiar hora
          </button>

          <div className="bg-[#0a1628] border border-[#C5A059]/20 px-5 py-4 mb-8">
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">{TYPE_LABELS[type]}</p>
            <p className="font-crimson text-lg text-white">
              {formatDateLabel(new Date(`${selectedDate}T12:00:00`))} — <span className="text-[#C5A059] font-bold">{selectedTime}</span>
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 mb-6">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="font-crimson text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-2">Nombre completo *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                className="w-full bg-[#0a1628] border border-white/10 text-white px-4 py-3 font-crimson text-base focus:outline-none focus:border-[#C5A059]/50 transition placeholder-gray-600"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-2">Correo electrónico *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0a1628] border border-white/10 text-white px-4 py-3 font-crimson text-base focus:outline-none focus:border-[#C5A059]/50 transition placeholder-gray-600"
                placeholder="tu@correo.com"
              />
            </div>
            <div>
              <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-2">Teléfono / WhatsApp *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-[#0a1628] border border-white/10 text-white px-4 py-3 font-crimson text-base focus:outline-none focus:border-[#C5A059]/50 transition placeholder-gray-600"
                placeholder="+56 9 1234 5678"
              />
            </div>
            <div>
              <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-2">¿Algo que quieras compartir antes? <span className="text-gray-600">(opcional)</span></label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full bg-[#0a1628] border border-white/10 text-white px-4 py-3 font-crimson text-base focus:outline-none focus:border-[#C5A059]/50 transition resize-none placeholder-gray-600"
                placeholder="Contexto, preguntas, motivación…"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-[10px] uppercase tracking-widest py-4 hover:bg-[#C5A059]/90 disabled:opacity-60 transition"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting ? "Confirmando…" : "Confirmar cita"}
            </button>
            <p className="font-crimson text-xs text-gray-600 text-center">
              Al confirmar aceptas que tus datos se usarán únicamente para gestionar esta cita.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
