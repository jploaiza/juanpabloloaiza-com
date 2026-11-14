"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Loader2, Search, X, Cookie } from "lucide-react";
import Flag from "./Flag";
import { loadTzData, normalizeSearch, type CountryOption, type TzData, type ZoneOption } from "@/lib/tz-data";
import { cityFromTz, tzOffsetLabel } from "@/lib/tz";
import type { TzPref } from "@/lib/tz-preference";

type Step = "confirm" | "country" | "city" | "consent";

interface Props {
  open: boolean;
  /** "first": primera visita (pregunta "¿Estás en X?"). "change": el visitante quiere cambiarla. */
  mode: "first" | "change";
  /** Zona en uso o detectada por el navegador. */
  currentTz: string;
  /** País ya elegido, si existe. */
  currentCountry?: string;
  onSave: (pref: TzPref, persist: boolean) => void;
  onClose: () => void;
}

const B = "font-baskerville";
const primaryBtn = `w-full ${B} bg-[#C5A059] text-white text-base font-semibold py-3.5 hover:bg-[#b8924d] transition rounded-sm shadow-sm`;
const secondaryBtn = `w-full ${B} bg-white border border-gray-200 text-gray-700 text-base py-3.5 hover:border-[#C5A059]/60 hover:text-[#C5A059] transition rounded-sm`;
const rowBtn = `w-full flex items-center gap-3 text-left px-3 py-3 ${B} text-base border-b border-gray-100 last:border-b-0 hover:bg-[#C5A059]/5 transition`;

function zoneLabel(z: ZoneOption): string {
  return z.cities.slice(0, 3).join(", ") || cityFromTz(z.tz);
}

export default function TimezonePicker({ open, mode, currentTz, currentCountry, onSave, onClose }: Props) {
  const [data, setData] = useState<TzData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [step, setStep] = useState<Step>("country");
  const [suggested, setSuggested] = useState<string | null>(null);
  const [country, setCountry] = useState<CountryOption | null>(null);
  const [zone, setZone] = useState<ZoneOption | null>(null);
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  // Carga el catálogo y decide el primer paso cada vez que se abre.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setData(null);
    setLoadError(false);
    setQuery("");
    setCountry(null);
    setZone(null);
    (async () => {
      try {
        const d = await loadTzData();
        let code: string | null = currentCountry ?? d.countryOfTz(currentTz);
        if (!code && mode === "first") {
          try {
            const geo = (await (await fetch("/api/geo")).json()) as { country: string | null; tz: string | null };
            code = geo.country ?? (geo.tz ? d.countryOfTz(geo.tz) : null);
          } catch { /* sin respaldo por IP */ }
        }
        if (cancelled) return;
        const valid = code && d.byCode.has(code) ? code : null;
        setData(d);
        setSuggested(valid);
        setStep(mode === "first" && valid ? "confirm" : "country");
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => { cancelled = true; };
    // Solo al abrir: los valores actuales se leen en ese momento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape cierra; se bloquea el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open, step, data]);

  const countryList = useMemo(() => {
    if (!data) return [];
    const q = normalizeSearch(query);
    if (q) return data.countries.filter((c) => normalizeSearch(c.name).includes(q));
    const pinned = suggested ? data.byCode.get(suggested) : undefined;
    return pinned ? [pinned, ...data.countries.filter((c) => c.code !== pinned.code)] : data.countries;
  }, [data, query, suggested]);

  if (!open) return null;

  function pickCountry(c: CountryOption) {
    setCountry(c);
    if (c.zones.length === 1) {
      setZone(c.zones[0]);
      setStep("consent");
    } else {
      setZone(data?.zoneOfTz(c.code, currentTz) ?? null);
      setStep("city");
    }
  }

  function pickZone(z: ZoneOption) {
    setZone(z);
    setStep("consent");
  }

  function finish(persist: boolean) {
    if (!country || !zone) return;
    onSave({ tz: zone.tz, country: country.code, city: zone.cities[0] ?? cityFromTz(zone.tz) }, persist);
  }

  function back() {
    if (step === "consent") setStep(country && country.zones.length > 1 ? "city" : "country");
    else if (step === "city") setStep("country");
    else if (step === "country" && mode === "first" && suggested) setStep("confirm");
  }

  const canGoBack = step === "consent" || step === "city" || (step === "country" && mode === "first" && !!suggested);
  const suggestedCountry = suggested && data ? data.byCode.get(suggested) : undefined;

  // Portal al <body>: el widget vive dentro de contenedores animados (opacity/transform) que
  // heredarían su opacidad y dejarían el modal debajo de otros elementos fijos.
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-[#020617]/70 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tz-title"
        tabIndex={-1}
        className={`relative w-full sm:max-w-md bg-white border-t-4 border-[#C5A059] shadow-2xl max-h-[92vh] overflow-y-auto outline-none ${B}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {canGoBack && (
            <button
              type="button"
              onClick={back}
              className={`mb-4 -ml-1 flex items-center gap-1 ${B} text-sm text-gray-400 hover:text-[#C5A059] transition`}
            >
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
          )}

          {loadError ? (
            <div className="text-center py-6">
              <h2 id="tz-title" className="text-xl font-bold text-gray-900 mb-2">No pudimos cargar las zonas horarias</h2>
              <p className="text-base text-gray-500 mb-6">Usaremos la hora de tu dispositivo. Puedes intentar de nuevo más tarde.</p>
              <button type="button" onClick={onClose} className={primaryBtn}>Continuar</button>
            </div>
          ) : !data ? (
            <div className="flex items-center justify-center gap-3 py-12">
              <Loader2 className="w-5 h-5 text-[#C5A059] animate-spin" />
              <span id="tz-title" className="text-base text-gray-400">Detectando tu ubicación…</span>
            </div>
          ) : step === "confirm" && suggestedCountry ? (
            <div className="text-center">
              <Flag code={suggestedCountry.code} className="w-20 h-[3.35rem] mx-auto mb-5" />
              <h2 id="tz-title" className="text-2xl font-bold text-gray-900 mb-2">¿Estás en {suggestedCountry.name}?</h2>
              <p className="text-base text-gray-500 mb-7">Así te mostraremos los horarios en tu hora local.</p>
              <div className="space-y-3">
                <button type="button" onClick={() => pickCountry(suggestedCountry)} className={primaryBtn}>
                  Sí, estoy en {suggestedCountry.name}
                </button>
                <button type="button" onClick={() => setStep("country")} className={secondaryBtn}>
                  Elegir otro país
                </button>
              </div>
              <button type="button" onClick={onClose} className={`mt-5 ${B} text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition`}>
                Ahora no, usar la hora de mi dispositivo
              </button>
            </div>
          ) : step === "country" ? (
            <div>
              <h2 id="tz-title" className="text-2xl font-bold text-gray-900 mb-1 pr-8">
                {mode === "first" ? "¿En qué país estás?" : "Cambiar zona horaria"}
              </h2>
              <p className="text-base text-gray-500 mb-4">Elige tu país.</p>
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar país…"
                  aria-label="Buscar país"
                  autoComplete="off"
                  className={`w-full ${B} text-base text-gray-900 bg-white placeholder-gray-400 border border-gray-200 pl-9 pr-3 py-2.5 rounded-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/20`}
                />
              </div>
              <div className="border border-gray-200 max-h-72 overflow-y-auto rounded-sm">
                {countryList.length === 0 ? (
                  <p className="px-3 py-6 text-center text-base text-gray-400">No encontramos ese país.</p>
                ) : (
                  countryList.map((c) => (
                    <button key={c.code} type="button" onClick={() => pickCountry(c)} className={rowBtn}>
                      <Flag code={c.code} />
                      <span className={`flex-1 ${c.code === suggested ? "font-semibold text-gray-900" : "text-gray-700"}`}>{c.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : step === "city" && country ? (
            <div>
              <div className="flex items-center gap-3 mb-1 pr-8">
                <Flag code={country.code} className="w-9 h-6" />
                <h2 id="tz-title" className="text-2xl font-bold text-gray-900">¿En qué ciudad?</h2>
              </div>
              <p className="text-base text-gray-500 mb-4">{country.name} tiene varias zonas horarias.</p>
              <div className="border border-gray-200 max-h-72 overflow-y-auto rounded-sm">
                {country.zones.map((z) => (
                  <button key={z.tz} type="button" onClick={() => pickZone(z)} className={rowBtn}>
                    <span className={`flex-1 ${zone?.tz === z.tz ? "font-semibold text-gray-900" : "text-gray-700"}`}>{zoneLabel(z)}</span>
                    <span className="text-sm text-gray-400 shrink-0">{tzOffsetLabel(z.tz)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : step === "consent" && country && zone ? (
            <div>
              <div className="flex items-center gap-3 mb-5 pr-8">
                <Flag code={country.code} className="w-10 h-[1.65rem]" />
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900 truncate">{zone.cities[0] ?? cityFromTz(zone.tz)}, {country.name}</p>
                  <p className="text-sm text-gray-500">{tzOffsetLabel(zone.tz)}</p>
                </div>
              </div>
              <div className="flex gap-3 bg-gray-50 border border-gray-100 p-4 mb-6 rounded-sm">
                <Cookie className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
                <div>
                  <h2 id="tz-title" className="text-base font-bold text-gray-900 mb-1">¿Guardamos tu zona horaria?</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Si aceptas, guardaremos una cookie en este dispositivo para recordar tu zona horaria y no volver a preguntarte.
                    No contiene datos personales y dura 1 año. Si la borras (por ejemplo, al limpiar el historial), te lo volveremos a preguntar.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <button type="button" onClick={() => finish(true)} className={primaryBtn}>Aceptar y guardar</button>
                <button type="button" onClick={() => finish(false)} className={secondaryBtn}>Solo esta vez</button>
              </div>
              <p className="mt-3 text-xs text-gray-400 text-center">
                Con &quot;Solo esta vez&quot; no se guarda ninguna cookie: la elección se olvida al cerrar la pestaña.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
