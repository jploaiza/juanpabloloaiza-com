"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Clock, Check, Loader2,
  AlertCircle, UserCheck, Globe, Copy, Video, Calendar,
} from "lucide-react";
import {
  getBrowserTz, detectCountryCode, slotTimeInUserTz, getMonthDays,
  TZ_OPTIONS, COUNTRY_CODES,
  type ConfirmationData,
} from "./booking-types";

type BookingType = "session" | "entrevista";

interface Props { type: BookingType }

const TYPE_LABELS: Record<BookingType, string> = {
  session: "Sesión TRVP",
  entrevista: "Entrevista de Admisión",
};
const DURATION: Record<BookingType, number> = { session: 90, entrevista: 45 };
const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DAYS_HDR = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

type Step = "calendar" | "form" | "confirm";

export default function BookingWidget({ type }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Timezone / time format ────────────────────────────────────────────────
  const [userTz, setUserTz] = useState("America/Bogota");
  const [use24h, setUse24h] = useState(true);
  const [tzOpen, setTzOpen] = useState(false);
  const tzRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tz = getBrowserTz();
    setUserTz(tz);
    const def = detectCountryCode(tz);
    setCountryCode(def);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (tzRef.current && !tzRef.current.contains(e.target as Node)) setTzOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Calendar nav ──────────────────────────────────────────────────────────
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // ── Slots ─────────────────────────────────────────────────────────────────
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const fetchSlots = useCallback(async (date: string) => {
    setSlotsLoading(true);
    setSlots([]);
    try {
      const res = await fetch(`/api/calendar/availability?date=${date}&type=${type}`);
      const json = await res.json();
      setSlots(json.slots ?? []);
    } catch { setSlots([]); }
    finally { setSlotsLoading(false); }
  }, [type]);

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  // ── Form fields ───────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("calendar");
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [patientFound, setPatientFound] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+57");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const calDays = getMonthDays(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const isPrevDisabled = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  function handleDateClick(dateStr: string) {
    if (!dateStr || dateStr < today.toISOString().slice(0, 10)) return;
    setSelectedDate(dateStr);
    setSelectedTime(null);
  }

  function handleTimeSelect(time: string) {
    setSelectedTime(time);
  }

  async function handleEmailLookup(e: React.FormEvent) {
    e.preventDefault();
    const val = emailInput.trim().toLowerCase();
    if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailError("Ingresa un correo válido");
      return;
    }
    setEmailError(null);
    setLookingUp(true);
    try {
      const res = await fetch(`/api/calendar/patient-lookup?email=${encodeURIComponent(val)}`);
      const json = await res.json();
      if (json.found) {
        setName(json.name ?? "");
        const rawPhone: string = json.phone ?? "";
        const matched = COUNTRY_CODES.find(c => rawPhone.startsWith(c.code));
        if (matched) {
          setCountryCode(matched.code);
          setPhone(rawPhone.slice(matched.code.length).trim());
        } else {
          setPhone(rawPhone);
        }
        setPatientFound(true);
      } else {
        setPatientFound(false);
      }
    } catch { setPatientFound(false); }
    finally { setLookingUp(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    setFormError(null);
    const fullPhone = `${countryCode}${phone.trim()}`;
    try {
      const res = await fetch("/api/calendar/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email: emailInput.trim().toLowerCase(),
          phone: fullPhone, notes, date: selectedDate,
          time: selectedTime, type,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "Error al reservar. Intenta de nuevo.");
      } else {
        setConfirmation({
          bookingCode: json.booking_code ?? "",
          name,
          email: emailInput.trim().toLowerCase(),
          type: TYPE_LABELS[type],
          date: selectedDate,
          time: selectedTime,
          durationMin: DURATION[type],
          eventLink: json.event_link ?? "",
          userTz,
        });
        setStep("confirm");
      }
    } catch {
      setFormError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetAll() {
    setStep("calendar");
    setSelectedDate(null); setSelectedTime(null);
    setEmailInput(""); setEmailError(null); setPatientFound(false);
    setName(""); setPhone(""); setNotes(""); setFormError(null);
    setConfirmation(null);
  }

  const tzLabel = TZ_OPTIONS.find(t => t.value === userTz)?.label ?? userTz;

  // ── Confirmation screen ───────────────────────────────────────────────────
  if (step === "confirm" && confirmation) {
    const utcMs = (() => {
      const [h, m] = confirmation.time.split(":").map(Number);
      const probe = new Date(`${confirmation.date}T12:00:00Z`);
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Santiago", hour: "numeric", hour12: false, timeZoneName: "shortOffset",
      }).formatToParts(probe);
      const offsetStr = parts.find(p => p.type === "timeZoneName")?.value ?? "GMT-4";
      const offsetMatch = offsetStr.match(/GMT([+-]\d+)/);
      const offsetH = offsetMatch ? parseInt(offsetMatch[1]) : -4;
      const midnightUtc = new Date(`${confirmation.date}T${String(-offsetH).padStart(2, "0")}:00:00Z`).getTime();
      return midnightUtc + (h * 60 + m) * 60_000;
    })();

    const dateLabel = new Date(utcMs).toLocaleDateString("es-CL", {
      timeZone: confirmation.userTz, weekday: "long", day: "numeric",
      month: "long", year: "numeric",
    });
    const timeLabel = new Date(utcMs).toLocaleTimeString("es-CL", {
      timeZone: confirmation.userTz, hour: "2-digit", minute: "2-digit", hour12: !use24h,
    });

    return (
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
            <Check className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="font-cinzel text-2xl text-white mb-2">¡Cita confirmada!</h2>
          <p className="font-crimson text-gray-400">Revisa tu correo — te enviamos la confirmación.</p>
        </div>

        <div className="bg-[#0a1628] border border-[#C5A059]/30 p-6 mb-4">
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-4">Detalles de tu reserva</p>
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="font-crimson text-gray-400 text-sm">Tipo</span>
              <span className="font-crimson text-white">{confirmation.type}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-crimson text-gray-400 text-sm">Fecha</span>
              <span className="font-crimson text-white capitalize">{dateLabel}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-crimson text-gray-400 text-sm">Hora</span>
              <span className="font-crimson text-[#C5A059] font-bold text-lg">{timeLabel}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-crimson text-gray-400 text-sm">Duración</span>
              <span className="font-crimson text-white">{confirmation.durationMin} min</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-crimson text-gray-400 text-sm">Zona horaria</span>
              <span className="font-crimson text-white text-xs">{confirmation.userTz}</span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between items-center">
              <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500">Código de reserva</span>
              <div className="flex items-center gap-2">
                <span className="font-cinzel text-[#C5A059] text-lg tracking-widest">{confirmation.bookingCode}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(confirmation.bookingCode)}
                  className="text-gray-500 hover:text-[#C5A059] transition"
                  title="Copiar código"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="font-crimson text-xs text-gray-600 text-center mb-6">
          Guarda tu código de reserva para reprogramar o cancelar sin iniciar sesión.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {confirmation.eventLink && (
            <a
              href={confirmation.eventLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 border border-[#C5A059]/40 text-[#C5A059] font-cinzel text-[9px] uppercase tracking-widest py-3 hover:bg-[#C5A059]/10 transition"
            >
              <Calendar className="w-3.5 h-3.5" />
              Ver en Google Calendar
            </a>
          )}
          <button
            onClick={resetAll}
            className="flex-1 font-cinzel text-[9px] uppercase tracking-widest text-gray-500 border border-white/10 py-3 hover:border-white/20 transition"
          >
            Agendar otra cita
          </button>
        </div>
      </div>
    );
  }

  // ── Form step ─────────────────────────────────────────────────────────────
  if (step === "form" && selectedDate && selectedTime) {
    const displayTime = slotTimeInUserTz(selectedDate, selectedTime, userTz, use24h);
    const dateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString("es-CL", {
      weekday: "long", day: "numeric", month: "long",
    });

    return (
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0 lg:gap-8">
        {/* Sidebar */}
        <div className="lg:border-r lg:border-white/10 lg:pr-8 pb-8 lg:pb-0">
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">Juan Pablo Loaiza</p>
          <h3 className="font-cinzel text-white text-lg mb-4">{TYPE_LABELS[type]}</h3>
          <div className="space-y-2 text-sm font-crimson text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C5A059] shrink-0" />
              <span>{DURATION[type]} minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#C5A059] shrink-0" />
              <span>Zoom (enlace tras confirmar)</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#C5A059] shrink-0" />
              <span className="text-xs">{tzLabel}</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Fecha seleccionada</p>
            <p className="font-crimson text-white capitalize">{dateLabel}</p>
            <p className="font-crimson text-[#C5A059] font-bold text-xl mt-1">{displayTime}</p>
            <button
              onClick={() => setStep("calendar")}
              className="mt-3 font-cinzel text-[8px] uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition"
            >
              ← Cambiar
            </button>
          </div>
        </div>

        {/* Form */}
        <div>
          <h3 className="font-cinzel text-white text-base mb-6 hidden lg:block">Tus datos</h3>

          {/* Email lookup */}
          <form onSubmit={handleEmailLookup} className="mb-6">
            <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-2">
              Correo electrónico *
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={e => { setEmailInput(e.target.value); setEmailError(null); setPatientFound(false); setName(""); setPhone(""); }}
                required
                autoFocus
                placeholder="tu@correo.com"
                className="flex-1 bg-[#0a1628] border border-white/10 text-white px-4 py-3 font-crimson text-base focus:outline-none focus:border-[#C5A059]/50 transition placeholder-gray-600"
              />
              <button
                type="submit"
                disabled={lookingUp}
                className="px-4 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] font-cinzel text-[9px] uppercase tracking-widest hover:bg-[#C5A059]/20 transition disabled:opacity-50 whitespace-nowrap"
              >
                {lookingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Buscar"}
              </button>
            </div>
            {emailError && <p className="font-crimson text-xs text-red-400 mt-1">{emailError}</p>}
          </form>

          {patientFound && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 mb-5">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="font-crimson text-sm text-emerald-300">
                Hola <strong>{name.split(" ")[0]}</strong>, encontramos tu perfil. Datos cargados automáticamente.
              </p>
            </div>
          )}

          {formError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="font-crimson text-sm text-red-300">{formError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-2">Nombre completo *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                placeholder="Tu nombre"
                className="w-full bg-[#0a1628] border border-white/10 text-white px-4 py-3 font-crimson text-base focus:outline-none focus:border-[#C5A059]/50 transition placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-2">Teléfono / WhatsApp *</label>
              <div className="flex gap-0">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="bg-[#0a1628] border border-r-0 border-white/10 text-white px-3 py-3 font-crimson text-sm focus:outline-none focus:border-[#C5A059]/50 transition shrink-0 max-w-[130px]"
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code + c.country} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  placeholder="300 000 0000"
                  className="flex-1 bg-[#0a1628] border border-white/10 text-white px-4 py-3 font-crimson text-base focus:outline-none focus:border-[#C5A059]/50 transition placeholder-gray-600 min-w-0"
                />
              </div>
            </div>

            <div>
              <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-2">
                ¿Algo que quieras compartir? <span className="text-gray-600">(opcional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Contexto, preguntas, motivación…"
                className="w-full bg-[#0a1628] border border-white/10 text-white px-4 py-3 font-crimson text-base focus:outline-none focus:border-[#C5A059]/50 transition resize-none placeholder-gray-600"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !emailInput.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-[10px] uppercase tracking-widest py-4 hover:bg-[#C5A059]/90 disabled:opacity-60 transition"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting ? "Confirmando…" : "Confirmar cita"}
            </button>
            <p className="font-crimson text-xs text-gray-600 text-center">
              Tus datos se usan únicamente para gestionar esta cita.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // ── Calendar step (default) ───────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0 lg:gap-8">
      {/* ── Left sidebar ────────────────────────────────────────────────────── */}
      <div className="lg:border-r lg:border-white/10 lg:pr-8 pb-8 lg:pb-0">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">Juan Pablo Loaiza</p>
        <h3 className="font-cinzel text-white text-lg mb-4">{TYPE_LABELS[type]}</h3>

        <div className="space-y-2 text-sm font-crimson text-gray-400">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C5A059] shrink-0" />
            <span>{DURATION[type]} minutos</span>
          </div>
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[#C5A059] shrink-0" />
            <span>Zoom (enlace tras confirmar)</span>
          </div>
        </div>

        {/* Timezone selector */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-2">Zona horaria</p>
          <div className="relative" ref={tzRef}>
            <button
              onClick={() => setTzOpen(o => !o)}
              className="w-full flex items-center justify-between gap-2 bg-[#0a1628] border border-white/10 px-3 py-2 text-left text-white hover:border-[#C5A059]/40 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                <span className="font-crimson text-sm truncate">{tzLabel}</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-gray-500 shrink-0 transition-transform ${tzOpen ? "rotate-90" : ""}`} />
            </button>
            {tzOpen && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#0a1628] border border-white/10 max-h-48 overflow-y-auto shadow-xl">
                {TZ_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setUserTz(opt.value); setTzOpen(false); }}
                    className={`w-full text-left px-3 py-2 font-crimson text-sm hover:bg-[#C5A059]/10 transition
                      ${userTz === opt.value ? "text-[#C5A059]" : "text-gray-300"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 12/24h toggle */}
        <div className="mt-4">
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-2">Formato de hora</p>
          <div className="flex gap-1">
            {([true, false] as const).map(is24 => (
              <button
                key={String(is24)}
                onClick={() => setUse24h(is24)}
                className={`flex-1 py-1.5 font-cinzel text-[9px] uppercase tracking-widest border transition
                  ${use24h === is24
                    ? "bg-[#C5A059]/10 border-[#C5A059]/50 text-[#C5A059]"
                    : "border-white/10 text-gray-500 hover:border-white/20"}`}
              >
                {is24 ? "24h" : "12h"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: calendar + slots ───────────────────────────────────── */}
      <div>
        {/* Month header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            disabled={isPrevDisabled}
            className="p-2 text-gray-500 hover:text-[#C5A059] disabled:opacity-20 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p className="font-cinzel text-sm text-white capitalize">
            {MONTHS_ES[viewMonth]} {viewYear}
          </p>
          <button
            onClick={nextMonth}
            className="p-2 text-gray-500 hover:text-[#C5A059] transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_HDR.map(d => (
            <div key={d} className="text-center font-cinzel text-[8px] uppercase tracking-widest text-gray-600 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {calDays.map((day, idx) => {
            if (!day.dateStr) {
              return <div key={`pad-${idx}`} />;
            }
            const todayStr = today.toISOString().slice(0, 10);
            const disabled = day.dateStr < todayStr;
            const isSelected = day.dateStr === selectedDate;
            const isToday = day.dateStr === todayStr;
            return (
              <button
                key={day.dateStr}
                onClick={() => !disabled && handleDateClick(day.dateStr)}
                disabled={disabled}
                className={`aspect-square flex items-center justify-center font-cinzel text-sm rounded-sm transition
                  ${disabled ? "text-gray-700 cursor-not-allowed" : "hover:bg-[#C5A059]/10 hover:text-[#C5A059] cursor-pointer text-gray-300"}
                  ${isSelected ? "bg-[#C5A059] text-[#020617] hover:bg-[#C5A059] hover:text-[#020617] font-bold" : ""}
                  ${isToday && !isSelected ? "border border-[#C5A059]/40 text-[#C5A059]" : ""}`}
              >
                {day.dayNum}
              </button>
            );
          })}
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div>
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-3">
              Horarios disponibles
            </p>
            {slotsLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <Loader2 className="w-4 h-4 text-[#C5A059] animate-spin" />
                <span className="font-crimson text-gray-500">Consultando…</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="py-8 text-center">
                <Clock className="w-5 h-5 text-gray-600 mx-auto mb-2" />
                <p className="font-crimson text-gray-500 text-sm">Sin horarios disponibles este día.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {slots.map(slot => {
                  const displayTime = slotTimeInUserTz(selectedDate, slot, userTz, use24h);
                  const isSelected = slot === selectedTime;
                  return (
                    <button
                      key={slot}
                      onClick={() => handleTimeSelect(slot)}
                      className={`py-2.5 font-cinzel text-xs border transition
                        ${isSelected
                          ? "bg-[#C5A059] border-[#C5A059] text-[#020617] font-bold"
                          : "bg-[#0a1628] border-white/10 text-gray-300 hover:border-[#C5A059]/40 hover:text-[#C5A059]"}`}
                    >
                      {displayTime}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedTime && (
              <div className="mt-6">
                <button
                  onClick={() => setStep("form")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-10 py-3.5 hover:bg-[#C5A059]/90 transition"
                >
                  Continuar
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {!selectedDate && (
          <p className="font-crimson text-sm text-gray-600 text-center py-4">
            Selecciona una fecha para ver los horarios disponibles
          </p>
        )}
      </div>
    </div>
  );
}
