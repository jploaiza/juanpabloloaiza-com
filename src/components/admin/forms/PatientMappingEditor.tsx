"use client";

import { UserCog } from "lucide-react";
import type { Question, PatientMapping } from "@/lib/forms/types";

const sel =
  "w-full bg-[#0a1628] border border-white/10 text-white px-3 py-2 font-crimson text-sm focus:outline-none focus:border-[#C5A059] transition";
const labelCls = "block font-cinzel text-[9px] uppercase tracking-widest text-gray-400 mb-1.5";

const FIELDS: { key: keyof Pick<PatientMapping, "full_name" | "email" | "phone">; label: string }[] = [
  { key: "full_name", label: "Nombre completo" },
  { key: "email", label: "Correo" },
  { key: "phone", label: "Teléfono" },
];

export default function PatientMappingEditor({
  questions,
  mapping,
  setMapping,
  markDirty,
}: {
  questions: Question[];
  mapping: PatientMapping | null;
  setMapping: (m: PatientMapping | null) => void;
  markDirty: () => void;
}) {
  const m = mapping ?? {};
  const usable = questions.filter((q) => q.type !== "statement");

  function set(key: keyof PatientMapping, qid: string) {
    const next: PatientMapping = { ...m, [key]: qid || undefined };
    setMapping(next);
    markDirty();
  }

  return (
    <div className="border-t border-white/5 pt-4 mt-1">
      <div className="flex items-center gap-2 mb-1">
        <UserCog className="w-3.5 h-3.5 text-[#C5A059]" />
        <p className="font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059]">Mapeo al CRM</p>
      </div>
      <p className="font-crimson text-xs text-gray-500 mb-3">
        Indica qué preguntas contienen estos datos. Al enviarse, la respuesta se vincula a un paciente existente con ese
        correo. Si no se especifica, se detectan automáticamente por tipo de campo.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className={labelCls}>{label}</label>
            <select className={sel} value={m[key] ?? ""} onChange={(e) => set(key, e.target.value)}>
              <option value="">Detección automática</option>
              {usable.map((q, i) => (
                <option key={q.id} value={q.id}>{i + 1}. {q.title || "Sin título"}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
