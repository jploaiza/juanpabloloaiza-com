"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Clock, Check, Loader2,
  AlertCircle, UserCheck, Globe, Copy, Video, Calendar, Link, Timer,
} from "lucide-react";
import {
  getBrowserTz, detectCountryCode, slotTimeInUserTz, getMonthDays,
  TZ_OPTIONS, COUNTRY_CODES,
  type ConfirmationData,
} from "./booking-types";

type BookingType = "session" | "entrevista";

interface Props {
  type: BookingType;
  rescheduleCode?: string;
}

interface EventTypeConfig {
  booking_questions: Array<{
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'phone' | 'checkbox';
    required: boolean;
    options?: string[];
  }>;
  requires_confirmation: boolean;
  redirect_url?: string | null;
  max_active_per_email?: number;
  label: string;
  duration_min: number;
  slug: string;
}

const TYPE_LABELS: Record<BookingType, string> = {
  session: "Sesión TRVP",
  entrevista: "Entrevista de Admisión",
};
const DURATION: Record<BookingType, number> = { session: 90, entrevista: 45 };
const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DAYS_HDR = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

type Step = "calendar" | "form" | "confirm";

const B = "font-baskerville";

const inputCls = `w-full bg-white border border-gray-200 text-gray-900 px-4 py-3 ${B} text-base focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/20 transition placeholder-gray-400 rounded-sm`;
const labelCls = `block ${B} text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2`;

export default function BookingWidget({ type, rescheduleCode }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [eventTypeConfig, setEventTypeConfig] = useState<EventTypeConfig | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string | boolean>>({});
  const [isPending, setIsPending] = useState(false);

  const [userTz, setUserTz] = useState("America/Bogota");
  const [use24h, setUse24h] = useState(true);
  const [tzOpen, setTzOpen] = useState(false);
  const tzRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tz = getBrowserTz();
    setUserTz(tz);
    const def = detectCountryCode(tz);
    setCountryCode(def);
    fetch("/api/event-types")
      .then(r => r.json())
      .then(d => {
        const found = (d.types ?? []).find((t: EventTypeConfig) => t.slug === type);
        if (found) setEventTypeConfig(found);
      })
      .catch(() => {});
  }, [type]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (tzRef.current && !tzRef.current.contains(e.target as Node)) setTzOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
          answers: questionAnswers,
          ...(rescheduleCode ? { reschedule_code: rescheduleCode } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "Error al reservar. Intenta de nuevo.");
      } else {
        const resolvedLabel = eventTypeConfig?.label ?? TYPE_LABELS[type];
        const resolvedDuration = eventTypeConfig?.duration_min ?? DURATION[type];
        const confirmData: ConfirmationData = {
          bookingCode: json.booking_code ?? "",
          name,
          email: emailInput.trim().toLowerCase(),
          type: resolvedLabel,
          date: selectedDate,
          time: selectedTime,
          durationMin: resolvedDuration,
          eventLink: json.event_link ?? "",
          userTz,
          zoomJoinUrl: json.zoom_join_url ?? undefined,
        };
        setConfirmation(confirmData);
        setIsPending(json.status === "pending");
        setStep("confirm");

        if (json.redirect_url) {
          const url = new URL(json.redirect_url);
          url.searchParams.set("booking", json.booking_code ?? "");
          url.searchParams.set("email", emailInput.trim().toLowerCase());
          url.searchParams.set("name", name);
          setTimeout(() => { window.location.href = url.toString(); }, 2000);
        }
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
    setQuestionAnswers({});
    setIsPending(false);
  }

  const tzLabel = TZ_OPTIONS.find(t => t.value === userTz)?.label ?? userTz;

  // ── Confirmation ──────────────────────────────────────────────────────────
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
      <div className={`max-w-md mx-auto ${B}`}>
        <div className="text-center mb-8">
          {isPending ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 mb-5">
                <Timer className="w-7 h-7 text-amber-500" />
              </div>
              <h2 className={`${B} text-2xl font-bold text-gray-900 mb-2`}>¡Solicitud recibida!</h2>
              <p className={`${B} text-base text-gray-500`}>Tu solicitud está pendiente de aprobación. Te notificaremos por correo y WhatsApp.</p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 mb-5">
                <Check className="w-7 h-7 text-emerald-500" />
              </div>
              <h2 className={`${B} text-2xl font-bold text-gray-900 mb-2`}>¡Cita confirmada!</h2>
              <p className={`${B} text-base text-gray-500`}>Revisa tu correo — te enviamos todos los detalles.</p>
            </>
          )}
        </div>

        <div className="border border-gray-200 divide-y divide-gray-100 mb-5">
          {[
            { label: "Tipo", value: confirmation.type },
            { label: "Fecha", value: <span className="capitalize">{dateLabel}</span> },
            { label: "Hora", value: <span className="text-[#C5A059] font-bold text-lg">{timeLabel}</span> },
            { label: "Duración", value: `${confirmation.durationMin} min` },
            { label: "Zona horaria", value: <span className="text-sm">{confirmation.userTz}</span> },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-5 py-3">
              <span className={`${B} text-sm text-gray-500`}>{label}</span>
              <span className={`${B} text-base text-gray-900`}>{value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center px-5 py-3 bg-gray-50">
            <span className={`${B} text-xs font-semibold uppercase tracking-widest text-gray-500`}>Código de reserva</span>
            <div className="flex items-center gap-2">
              <span className={`${B} text-[#C5A059] font-bold text-lg tracking-widest`}>{confirmation.bookingCode}</span>
              <button
                onClick={() => navigator.clipboard.writeText(confirmation.bookingCode)}
                className="text-gray-400 hover:text-[#C5A059] transition"
                title="Copiar código"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <p className={`${B} text-sm text-gray-400 text-center mb-6`}>
          Guarda tu código para reprogramar o cancelar sin iniciar sesión.
        </p>

        {!isPending && (
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            {confirmation.zoomJoinUrl && (
              <a href={confirmation.zoomJoinUrl} target="_blank" rel="noopener noreferrer"
                className={`flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white ${B} text-sm font-semibold py-3 hover:bg-blue-700 transition rounded-sm`}>
                <Video className="w-4 h-4" /> Unirse a Zoom
              </a>
            )}
            {confirmation.eventLink && (
              <a href={confirmation.eventLink} target="_blank" rel="noopener noreferrer"
                className={`flex-1 flex items-center justify-center gap-2 border-2 border-[#C5A059] text-[#C5A059] ${B} text-sm font-semibold py-3 hover:bg-[#C5A059]/5 transition rounded-sm`}>
                <Calendar className="w-4 h-4" /> Google Calendar
              </a>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {confirmation.bookingCode && (
            <a href={`/agenda/gestionar?code=${confirmation.bookingCode}`}
              className={`flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 ${B} text-sm py-3 hover:border-gray-300 hover:text-gray-800 transition rounded-sm`}>
              <Link className="w-3.5 h-3.5" /> Gestionar reserva
            </a>
          )}
          <button onClick={resetAll}
            className={`flex-1 ${B} text-sm text-gray-400 border border-gray-100 py-3 hover:border-gray-200 transition rounded-sm`}>
            Agendar otra
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
      <div className={`grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-0 lg:gap-10 ${B}`}>
        {/* Sidebar */}
        <div className="bg-gray-50 border border-gray-100 p-6 mb-6 lg:mb-0 rounded-sm">
          <p className={`${B} text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1`}>Juan Pablo Loaiza</p>
          <h3 className={`${B} text-xl font-bold text-gray-900 mb-5`}>{eventTypeConfig?.label ?? TYPE_LABELS[type]}</h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-[#C5A059] shrink-0" />
              <span className={`${B} text-base text-gray-600`}>{eventTypeConfig?.duration_min ?? DURATION[type]} minutos</span>
            </div>
            <div className="flex items-center gap-3">
              <Video className="w-4 h-4 text-[#C5A059] shrink-0" />
              <span className={`${B} text-base text-gray-600`}>Zoom (enlace tras confirmar)</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-[#C5A059] shrink-0" />
              <span className={`${B} text-sm text-gray-500`}>{tzLabel}</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className={`${B} text-xs font-semibold uppercase tracking-widest text-[#C5A059] mb-2`}>Fecha seleccionada</p>
            <p className={`${B} text-base text-gray-700 capitalize`}>{dateLabel}</p>
            <p className={`${B} text-[#C5A059] font-bold text-2xl mt-1`}>{displayTime}</p>
            <button
              onClick={() => setStep("calendar")}
              className={`mt-4 ${B} text-sm text-gray-400 hover:text-[#C5A059] transition flex items-center gap-1`}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Cambiar fecha
            </button>
          </div>
        </div>

        {/* Form */}
        <div>
          <h3 className={`${B} text-2xl font-bold text-gray-900 mb-7 hidden lg:block`}>Tus datos</h3>

          {/* Email lookup */}
          <form onSubmit={handleEmailLookup} className="mb-6">
            <label className={labelCls}>Correo electrónico *</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={e => { setEmailInput(e.target.value); setEmailError(null); setPatientFound(false); setName(""); setPhone(""); }}
                required
                autoFocus
                placeholder="tu@correo.com"
                className={`flex-1 ${inputCls}`}
              />
              <button
                type="submit"
                disabled={lookingUp}
                className={`px-5 bg-[#C5A059]/10 border border-[#C5A059]/40 text-[#C5A059] ${B} text-sm font-semibold hover:bg-[#C5A059]/20 transition disabled:opacity-50 whitespace-nowrap rounded-sm`}
              >
                {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
              </button>
            </div>
            {emailError && <p className={`${B} text-sm text-red-500 mt-1`}>{emailError}</p>}
          </form>

          {patientFound && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-3 mb-5 rounded-sm">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className={`${B} text-sm text-emerald-700`}>
                Hola <strong>{name.split(" ")[0]}</strong>, encontramos tu perfil. Datos cargados automáticamente.
              </p>
            </div>
          )}

          {formError && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 px-4 py-3 mb-5 rounded-sm">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className={`${B} text-sm text-red-600`}>{formError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelCls}>Nombre completo *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                required minLength={2} maxLength={100} placeholder="Tu nombre completo"
                className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Teléfono / WhatsApp *</label>
              <div className="flex gap-0">
                <select
                  value={countryCode} onChange={e => setCountryCode(e.target.value)}
                  className={`bg-white border border-r-0 border-gray-200 text-gray-900 px-3 py-3 ${B} text-sm focus:outline-none focus:border-[#C5A059] transition shrink-0 max-w-[130px] rounded-sm rounded-r-none`}
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code + c.country} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  required placeholder="300 000 0000"
                  className={`flex-1 bg-white border border-gray-200 text-gray-900 px-4 py-3 ${B} text-base focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/20 transition placeholder-gray-400 min-w-0 rounded-sm rounded-l-none`}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>¿Algo que quieras compartir? <span className="text-gray-400 normal-case">(opcional)</span></label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                maxLength={500} rows={3} placeholder="Contexto, preguntas, motivación…"
                className={`${inputCls} resize-none`} />
            </div>

            {eventTypeConfig?.booking_questions?.map((q) => (
              <div key={q.id}>
                <label className={labelCls}>
                  {q.label}{q.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {q.type === 'textarea' && (
                  <textarea
                    value={(questionAnswers[q.id] as string) ?? ""}
                    onChange={e => setQuestionAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                    required={q.required} rows={3}
                    className={`${inputCls} resize-none`}
                  />
                )}
                {q.type === 'select' && (
                  <select
                    value={(questionAnswers[q.id] as string) ?? ""}
                    onChange={e => setQuestionAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                    required={q.required}
                    className={inputCls}
                  >
                    <option value="">Selecciona una opción</option>
                    {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                )}
                {q.type === 'checkbox' && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(questionAnswers[q.id] as boolean) ?? false}
                      onChange={e => setQuestionAnswers(a => ({ ...a, [q.id]: e.target.checked }))}
                      className="accent-[#C5A059] w-4 h-4"
                    />
                    <span className={`${B} text-base text-gray-700`}>{q.label}</span>
                  </label>
                )}
                {(q.type === 'text' || q.type === 'phone') && (
                  <input
                    type={q.type === 'phone' ? 'tel' : 'text'}
                    value={(questionAnswers[q.id] as string) ?? ""}
                    onChange={e => setQuestionAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                    required={q.required}
                    className={inputCls}
                  />
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting || !emailInput.trim()}
              className={`w-full flex items-center justify-center gap-2 bg-[#C5A059] text-white ${B} text-base font-semibold py-4 hover:bg-[#b8924d] disabled:opacity-60 transition rounded-sm shadow-sm`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Confirmando…" : "Confirmar cita"}
            </button>
            <p className={`${B} text-sm text-gray-400 text-center`}>
              Tus datos se usan únicamente para gestionar esta cita.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // ── Calendar step ─────────────────────────────────────────────────────────
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-0 lg:gap-10 ${B}`}>

      {/* Sidebar */}
      <div className="bg-gray-50 border border-gray-100 p-6 mb-6 lg:mb-0 rounded-sm">
        <p className={`${B} text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1`}>Juan Pablo Loaiza</p>
        <h3 className={`${B} text-xl font-bold text-gray-900 mb-5`}>{eventTypeConfig?.label ?? TYPE_LABELS[type]}</h3>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-[#C5A059] shrink-0" />
            <span className={`${B} text-base text-gray-600`}>{eventTypeConfig?.duration_min ?? DURATION[type]} minutos</span>
          </div>
          <div className="flex items-center gap-3">
            <Video className="w-4 h-4 text-[#C5A059] shrink-0" />
            <span className={`${B} text-base text-gray-600`}>Zoom</span>
          </div>
        </div>

        {/* Timezone selector */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className={`${B} text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2`}>Zona horaria</p>
          <div className="relative" ref={tzRef}>
            <button
              onClick={() => setTzOpen(o => !o)}
              className={`w-full flex items-center justify-between gap-2 bg-white border border-gray-200 px-3 py-2.5 text-left hover:border-[#C5A059]/50 transition rounded-sm`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                <span className={`${B} text-sm text-gray-700 truncate`}>{tzLabel}</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${tzOpen ? "rotate-90" : ""}`} />
            </button>
            {tzOpen && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 max-h-48 overflow-y-auto shadow-lg rounded-sm">
                {TZ_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => { setUserTz(opt.value); setTzOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 ${B} text-sm hover:bg-[#C5A059]/5 transition
                      ${userTz === opt.value ? "text-[#C5A059] font-semibold bg-[#C5A059]/5" : "text-gray-700"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 12/24h toggle */}
        <div className="mt-4">
          <p className={`${B} text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2`}>Formato de hora</p>
          <div className="flex gap-1">
            {([true, false] as const).map(is24 => (
              <button key={String(is24)} onClick={() => setUse24h(is24)}
                className={`flex-1 py-2 ${B} text-sm font-medium border transition rounded-sm
                  ${use24h === is24
                    ? "bg-[#C5A059] border-[#C5A059] text-white"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"}`}>
                {is24 ? "24h" : "12h"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar + slots */}
      <div>
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} disabled={isPrevDisabled}
            className="p-2 text-gray-400 hover:text-[#C5A059] disabled:opacity-20 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <p className={`${B} text-lg font-bold text-gray-900 capitalize`}>
            {MONTHS_ES[viewMonth]} {viewYear}
          </p>
          <button onClick={nextMonth} className="p-2 text-gray-400 hover:text-[#C5A059] transition">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_HDR.map(d => (
            <div key={d} className={`text-center ${B} text-xs font-semibold uppercase tracking-widest text-gray-400 py-2`}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1 mb-8">
          {calDays.map((day, idx) => {
            if (!day.dateStr) return <div key={`pad-${idx}`} />;
            const todayStr = today.toISOString().slice(0, 10);
            const disabled = day.dateStr < todayStr;
            const isSelected = day.dateStr === selectedDate;
            const isToday = day.dateStr === todayStr;
            return (
              <button
                key={day.dateStr}
                onClick={() => !disabled && handleDateClick(day.dateStr)}
                disabled={disabled}
                className={`aspect-square flex items-center justify-center ${B} text-base font-medium transition rounded-sm
                  ${disabled ? "text-gray-300 cursor-not-allowed" : "hover:bg-[#C5A059]/10 hover:text-[#C5A059] cursor-pointer text-gray-800"}
                  ${isSelected ? "bg-[#C5A059] !text-white font-bold shadow-sm" : ""}
                  ${isToday && !isSelected ? "border-2 border-[#C5A059] text-[#C5A059] font-bold" : ""}`}
              >
                {day.dayNum}
              </button>
            );
          })}
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gray-200" />
              <p className={`${B} text-xs font-semibold uppercase tracking-widest text-gray-400`}>
                Horarios disponibles
              </p>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            {slotsLoading ? (
              <div className="flex items-center gap-3 py-10 justify-center">
                <Loader2 className="w-5 h-5 text-[#C5A059] animate-spin" />
                <span className={`${B} text-base text-gray-400`}>Consultando disponibilidad…</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="py-10 text-center">
                <Clock className="w-6 h-6 text-gray-300 mx-auto mb-3" />
                <p className={`${B} text-base text-gray-400`}>Sin horarios disponibles este día.</p>
                <p className={`${B} text-sm text-gray-300 mt-1`}>Elige otro día en el calendario.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {slots.map(slot => {
                  const displayTime = slotTimeInUserTz(selectedDate, slot, userTz, use24h);
                  const isSlotSelected = slot === selectedTime;
                  return (
                    <button key={slot} onClick={() => setSelectedTime(slot)}
                      className={`py-3 ${B} text-sm font-medium border transition rounded-sm
                        ${isSlotSelected
                          ? "bg-[#C5A059] border-[#C5A059] text-white font-bold shadow-sm"
                          : "bg-white border-gray-200 text-gray-700 hover:border-[#C5A059]/60 hover:text-[#C5A059] hover:bg-[#C5A059]/5"}`}>
                      {displayTime}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedTime && (
              <div className="mt-8">
                <button
                  onClick={() => setStep("form")}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 bg-[#C5A059] text-white ${B} text-base font-semibold px-10 py-4 hover:bg-[#b8924d] transition rounded-sm shadow-sm`}
                >
                  Continuar
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {!selectedDate && (
          <div className="py-10 text-center border-t border-gray-100 mt-2">
            <Calendar className="w-7 h-7 text-gray-200 mx-auto mb-3" />
            <p className={`${B} text-base text-gray-400`}>
              Selecciona una fecha para ver los horarios disponibles
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
