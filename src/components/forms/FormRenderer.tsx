"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Loader2, AlertCircle } from "lucide-react";
import type { FormSchema, Question, Answers, AnswerValue } from "@/lib/forms/types";

declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
    };
  }
}

interface Props {
  slug: string;
  title: string;
  description?: string | null;
  schema: FormSchema;
  settings: {
    submitLabel?: string;
    thankYouTitle?: string;
    thankYouMessage?: string;
    redirectUrl?: string;
  };
  turnstileSiteKey?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validación cliente ligera (el server es la autoridad).
function validateOne(q: Question, value: AnswerValue): string | null {
  const empty = value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
  if (q.type === "statement") return null;
  if (empty) {
    if (q.type === "consent" && q.required) return "Debes aceptar para continuar.";
    return q.required ? "Este campo es requerido." : null;
  }
  if (q.type === "email" && (typeof value !== "string" || !EMAIL_REGEX.test(value))) return "Correo inválido.";
  if (q.type === "number" && Number.isNaN(Number(value))) return "Número inválido.";
  if (q.type === "multiple_choice") {
    const arr = value as string[];
    if (q.minSelected && arr.length < q.minSelected) return `Selecciona al menos ${q.minSelected}.`;
    if (q.maxSelected && arr.length > q.maxSelected) return `Selecciona máximo ${q.maxSelected}.`;
  }
  if (q.type === "consent" && value !== true && q.required) return "Debes aceptar para continuar.";
  return null;
}

const C = "#C5A059";

export default function FormRenderer({ slug, title, description, schema, settings, turnstileSiteKey }: Props) {
  const questions = schema.questions;
  const [step, setStep] = useState<number | "submit" | "done">(questions.length ? 0 : "submit");
  const [history, setHistory] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [doneData, setDoneData] = useState<{ title?: string | null; message?: string | null }>({});

  // Turnstile
  const [token, setToken] = useState("");
  const tsRef = useRef<HTMLDivElement>(null);
  const tsWidget = useRef<string>("");

  const renderTurnstile = useCallback(() => {
    if (!turnstileSiteKey || !tsRef.current || !window.turnstile || tsWidget.current) return;
    try {
      tsWidget.current = window.turnstile.render(tsRef.current, {
        sitekey: turnstileSiteKey,
        theme: "dark",
        callback: (t: string) => setToken(t),
        "expired-callback": () => setToken(""),
      });
    } catch {
      /* noop */
    }
  }, [turnstileSiteKey]);

  useEffect(() => {
    if (step === "submit") renderTurnstile();
  }, [step, renderTurnstile]);

  function setAnswer(qid: string, value: AnswerValue) {
    setAnswers((a) => ({ ...a, [qid]: value }));
    setError(null);
  }

  function goNext() {
    if (typeof step !== "number") return;
    const q = questions[step];
    const err = validateOne(q, answers[q.id] ?? null);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    const next = step + 1;
    setHistory((h) => [...h, step]);
    setStep(next >= questions.length ? "submit" : next);
  }

  function goBack() {
    setError(null);
    if (step === "submit") {
      setStep(questions.length ? questions.length - 1 : 0);
      setHistory((h) => h.slice(0, -1));
      return;
    }
    if (typeof step === "number") {
      const prev = history[history.length - 1];
      if (prev === undefined) return;
      setHistory((h) => h.slice(0, -1));
      setStep(prev);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/forms/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, turnstileToken: token }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Error al enviar. Intenta de nuevo.");
        if (tsWidget.current) window.turnstile?.reset(tsWidget.current);
        setToken("");
      } else {
        setDoneData({ title: json.thankYouTitle, message: json.thankYouMessage });
        setStep("done");
        if (json.redirectUrl) setTimeout(() => (window.location.href = json.redirectUrl), 2500);
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent, q: Question) {
    if (e.key === "Enter" && !(q.type === "long_text" && e.shiftKey)) {
      e.preventDefault();
      goNext();
    }
  }

  const progress =
    step === "done"
      ? 100
      : step === "submit"
        ? 100
        : questions.length
          ? Math.round((step / questions.length) * 100)
          : 0;

  return (
    <div className="min-h-screen w-full bg-[#0a1628] text-white flex flex-col">
      {turnstileSiteKey && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" onLoad={renderTurnstile} />
      )}

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <motion.div className="h-full" style={{ backgroundColor: C }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-20">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {step === "done" ? (
              <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 mb-6" style={{ borderColor: C }}>
                  <Check className="w-7 h-7" style={{ color: C }} />
                </div>
                <h2 className="font-cinzel text-3xl mb-4">{doneData.title || "¡Gracias!"}</h2>
                <p className="font-crimson text-xl text-gray-300 leading-relaxed">
                  {doneData.message || "Tu respuesta ha sido recibida. Me pondré en contacto contigo pronto."}
                </p>
              </motion.div>
            ) : step === "submit" ? (
              <motion.div key="submit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
                <h2 className="font-cinzel text-3xl mb-4">¿Todo listo?</h2>
                <p className="font-crimson text-lg text-gray-300 mb-8">Revisa tus respuestas y envía el formulario cuando estés listo.</p>
                {turnstileSiteKey && <div ref={tsRef} className="flex justify-center mb-6" />}
                {error && (
                  <div className="flex items-center justify-center gap-2 text-red-400 font-crimson mb-5">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
                <div className="flex items-center justify-center gap-4">
                  <button onClick={goBack} className="font-cinzel text-xs uppercase tracking-widest text-gray-400 hover:text-white transition flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Atrás
                  </button>
                  <button
                    onClick={submit}
                    disabled={submitting || (!!turnstileSiteKey && !token)}
                    className="inline-flex items-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-sm font-semibold uppercase tracking-widest px-10 py-4 hover:bg-[#b8924d] disabled:opacity-50 transition"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? "Enviando…" : settings.submitLabel || "Enviar"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key={step} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.35 }}>
                {step === 0 && (
                  <div className="mb-10 text-center">
                    <h1 className="font-cinzel text-2xl md:text-3xl text-[#C5A059] mb-2">{title}</h1>
                    {description && <p className="font-crimson text-lg text-gray-400">{description}</p>}
                  </div>
                )}
                <QuestionField
                  q={questions[step]}
                  value={answers[questions[step].id] ?? null}
                  onChange={(v) => setAnswer(questions[step].id, v)}
                  onKeyDown={(e) => onKeyDown(e, questions[step])}
                  index={step}
                />
                {error && (
                  <div className="flex items-center gap-2 text-red-400 font-crimson mt-4">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-8">
                  {history.length > 0 && (
                    <button onClick={goBack} className="font-cinzel text-xs uppercase tracking-widest text-gray-400 hover:text-white transition flex items-center gap-1">
                      <ChevronLeft className="w-4 h-4" /> Atrás
                    </button>
                  )}
                  <button
                    onClick={goNext}
                    className="inline-flex items-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-sm font-semibold uppercase tracking-widest px-8 py-3.5 hover:bg-[#b8924d] transition"
                  >
                    {questions[step].type === "statement" ? "Continuar" : step + 1 >= questions.length ? "Finalizar" : "Siguiente"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {questions[step].type !== "statement" && (
                    <span className="font-crimson text-sm text-gray-500 hidden sm:inline">
                      presiona <strong className="text-gray-400">Enter ↵</strong>
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Campo por tipo ──────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-transparent border-b-2 border-white/20 text-white text-2xl py-3 font-crimson focus:outline-none focus:border-[#C5A059] transition placeholder-white/30";

function QuestionField({
  q,
  value,
  onChange,
  onKeyDown,
  index,
}: {
  q: Question;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  index: number;
}) {
  const Label = (
    <div className="mb-6">
      <div className="flex items-start gap-3">
        {q.type !== "statement" && <span className="font-cinzel text-sm text-[#C5A059] mt-2">{index + 1}.</span>}
        <div>
          <h2 className="font-cinzel text-2xl md:text-3xl text-white leading-snug">
            {q.title}
            {q.required && <span className="text-[#C5A059] ml-1">*</span>}
          </h2>
          {q.description && <p className="font-crimson text-lg text-gray-400 mt-2">{q.description}</p>}
        </div>
      </div>
    </div>
  );

  switch (q.type) {
    case "statement":
      return Label;

    case "short_text":
    case "email":
    case "phone":
      return (
        <div>
          {Label}
          <input
            type={q.type === "email" ? "email" : q.type === "phone" ? "tel" : "text"}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
            placeholder={q.type === "short_text" && q.placeholder ? q.placeholder : "Escribe aquí…"}
            maxLength={q.type === "short_text" ? q.maxLength : undefined}
            className={inputCls}
          />
        </div>
      );

    case "long_text":
      return (
        <div>
          {Label}
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
            rows={4}
            placeholder={q.placeholder || "Escribe aquí…"}
            maxLength={q.maxLength}
            className={`${inputCls} resize-none text-xl`}
          />
        </div>
      );

    case "number":
      return (
        <div>
          {Label}
          <input
            type="number"
            value={(value as number) ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            onKeyDown={onKeyDown}
            autoFocus
            min={q.min}
            max={q.max}
            className={inputCls}
          />
        </div>
      );

    case "date":
      return (
        <div>
          {Label}
          <input
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
            min={q.minDate}
            max={q.maxDate}
            className={`${inputCls} text-xl [color-scheme:dark]`}
          />
        </div>
      );

    case "yes_no":
      return (
        <div>
          {Label}
          <div className="flex gap-4">
            {[
              { label: "Sí", val: true },
              { label: "No", val: false },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => onChange(opt.val)}
                className={`flex-1 py-4 border-2 font-cinzel uppercase tracking-widest text-sm transition ${
                  value === opt.val ? "bg-[#C5A059] border-[#C5A059] text-[#020617]" : "border-white/20 text-white hover:border-[#C5A059]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      );

    case "single_choice":
    case "dropdown":
      return (
        <div>
          {Label}
          <div className="space-y-3">
            {q.choices.map((c) => (
              <button
                key={c.id}
                onClick={() => onChange(c.value)}
                className={`w-full text-left px-5 py-4 border-2 font-crimson text-lg transition ${
                  value === c.value ? "bg-[#C5A059]/15 border-[#C5A059] text-white" : "border-white/15 text-gray-200 hover:border-[#C5A059]/60"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      );

    case "multiple_choice": {
      const arr = (value as string[]) ?? [];
      const toggle = (v: string) => onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
      return (
        <div>
          {Label}
          <div className="space-y-3">
            {q.choices.map((c) => {
              const sel = arr.includes(c.value);
              return (
                <button
                  key={c.id}
                  onClick={() => toggle(c.value)}
                  className={`w-full text-left px-5 py-4 border-2 font-crimson text-lg transition flex items-center gap-3 ${
                    sel ? "bg-[#C5A059]/15 border-[#C5A059] text-white" : "border-white/15 text-gray-200 hover:border-[#C5A059]/60"
                  }`}
                >
                  <span className={`w-5 h-5 border flex items-center justify-center shrink-0 ${sel ? "bg-[#C5A059] border-[#C5A059]" : "border-white/30"}`}>
                    {sel && <Check className="w-3.5 h-3.5 text-[#020617]" />}
                  </span>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    case "rating": {
      const current = (value as number) ?? 0;
      return (
        <div>
          {Label}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: q.scale }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => onChange(n)}
                className={`w-12 h-12 border-2 font-cinzel text-lg transition ${
                  current === n ? "bg-[#C5A059] border-[#C5A059] text-[#020617]" : "border-white/20 text-white hover:border-[#C5A059]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {(q.labelLow || q.labelHigh) && (
            <div className="flex justify-between font-crimson text-sm text-gray-500 mt-2">
              <span>{q.labelLow}</span>
              <span>{q.labelHigh}</span>
            </div>
          )}
        </div>
      );
    }

    case "consent":
      return (
        <div>
          {Label}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => onChange(e.target.checked)}
              className="accent-[#C5A059] w-5 h-5 mt-1 shrink-0"
            />
            <span className="font-crimson text-lg text-gray-200">{q.consentText}</span>
          </label>
        </div>
      );

    default:
      return Label;
  }
}
