"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import Flag from "./Flag";
import { COUNTRY_CODES } from "./booking-types";

interface Props {
  /** Prefijo telefónico, ej. "+57". */
  value: string;
  onChange: (code: string) => void;
}

/**
 * Selector de prefijo telefónico con banderas en imagen. El <select> nativo no puede mostrar
 * imágenes, y los emojis de bandera aparecen como letras ("CO") en Chrome/Edge de Windows.
 */
export default function PhoneCodePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = COUNTRY_CODES.find((c) => c.code === value) ?? COUNTRY_CODES[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0 flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Código de país: ${current.country} ${current.code}`}
        className="flex items-center gap-2 bg-white border border-r-0 border-gray-200 text-gray-900 px-3 py-3 font-baskerville text-sm hover:border-[#C5A059]/60 focus:outline-none focus:border-[#C5A059] transition rounded-sm rounded-r-none"
      >
        <Flag code={current.iso} className="w-5 h-[0.8rem]" />
        <span>{current.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Código de país"
          className="absolute z-50 top-full left-0 mt-1 w-64 max-h-64 overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-sm"
        >
          {COUNTRY_CODES.map((c) => (
            <li key={c.iso} role="option" aria-selected={c.iso === current.iso}>
              <button
                type="button"
                onClick={() => { onChange(c.code); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left font-baskerville text-sm hover:bg-[#C5A059]/5 transition ${
                  c.iso === current.iso ? "bg-[#C5A059]/5 font-semibold text-gray-900" : "text-gray-700"
                }`}
              >
                <Flag code={c.iso} className="w-6 h-4" />
                <span className="flex-1 truncate">{c.country}</span>
                <span className="text-gray-400">{c.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
