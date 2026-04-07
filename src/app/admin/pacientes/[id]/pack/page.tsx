"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertTriangle } from "lucide-react";

type PackType = 1 | 3 | 5;

const PACK_OPTIONS: { type: PackType; label: string; days: number; description: string }[] = [
  { type: 1, label: "1 Sesión", days: 30, description: "Pack introductorio · Válido 30 días" },
  { type: 3, label: "3 Sesiones", days: 90, description: "Pack estándar · Válido 90 días" },
  { type: 5, label: "5 Sesiones", days: 150, description: "Pack completo · Válido 150 días" },
];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDateDisplay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AssignPackPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [packType, setPackType] = useState<PackType>(3);
  const [startDate, setStartDate] = useState<string>(formatDateInput(new Date()));
  const [endDate, setEndDate] = useState<string>("");
  const [pricePaid, setPricePaid] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasActivePack, setHasActivePack] = useState<boolean>(false);
  const [loadingCheck, setLoadingCheck] = useState(true);

  // Recalculate end date whenever pack type or start date changes
  useEffect(() => {
    const option = PACK_OPTIONS.find((o) => o.type === packType);
    if (option && startDate) {
      const start = new Date(startDate);
      const end = addDays(start, option.days);
      setEndDate(formatDateInput(end));
    }
  }, [packType, startDate]);

  // Check for active pack
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`/api/admin/packs?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setHasActivePack(data.hasActivePack ?? false);
        }
      } finally {
        setLoadingCheck(false);
      }
    };
    check();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          packType,
          startDate,
          pricePaid: pricePaid ? parseFloat(pricePaid) : null,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al crear el pack");
      }

      router.push(`/admin/pacientes/${userId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      <Link
        href={`/admin/pacientes/${userId}`}
        className="inline-flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition mb-6"
      >
        <ChevronLeft className="w-3 h-3" /> Ficha del paciente
      </Link>

      <div className="mb-8">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">
          CRM — Packs
        </p>
        <h1 className="font-cinzel text-2xl text-white">Asignar pack de sesiones</h1>
      </div>

      {/* Active pack warning */}
      {!loadingCheck && hasActivePack && (
        <div className="flex items-start gap-3 bg-amber-950/30 border border-amber-500/30 p-4 mb-6">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-cinzel text-[10px] uppercase tracking-widest text-amber-400 mb-1">
              Atención
            </p>
            <p className="font-crimson text-sm text-amber-200/80">
              Este paciente ya tiene un pack activo. Al asignar uno nuevo, el anterior permanecerá
              activo hasta vencer o completarse.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pack type selection */}
        <div>
          <label className="font-cinzel text-[10px] uppercase tracking-widest text-gray-400 block mb-3">
            Tipo de pack
          </label>
          <div className="grid grid-cols-3 gap-3">
            {PACK_OPTIONS.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => setPackType(option.type)}
                className={`relative p-4 border text-left transition overflow-hidden ${
                  packType === option.type
                    ? "border-[#C5A059] bg-[#C5A059]/10"
                    : "border-white/10 bg-[#0a1628] hover:border-white/20"
                }`}
              >
                <p
                  className={`font-cinzel text-sm mb-1 ${
                    packType === option.type ? "text-[#C5A059]" : "text-white"
                  }`}
                >
                  {option.label}
                </p>
                <p className="font-crimson text-xs text-gray-500 leading-tight">
                  {option.description}
                </p>
                {packType === option.type && (
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#C5A059] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Start date */}
        <div>
          <label className="font-cinzel text-[10px] uppercase tracking-widest text-gray-400 block mb-2">
            Fecha de inicio
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full bg-[#0a1628] border border-white/10 text-gray-200 font-cinzel text-sm px-4 py-3 focus:outline-none focus:border-[#C5A059]/40 transition [color-scheme:dark]"
          />
        </div>

        {/* End date — readonly, auto-calculated */}
        <div>
          <label className="font-cinzel text-[10px] uppercase tracking-widest text-gray-400 block mb-2">
            Fecha de vencimiento
            <span className="ml-2 text-gray-600">(calculada automáticamente)</span>
          </label>
          <div className="w-full bg-[#020617] border border-white/5 text-gray-500 font-cinzel text-sm px-4 py-3">
            {endDate
              ? formatDateDisplay(endDate)
              : "—"}
          </div>
        </div>

        {/* Price paid */}
        <div>
          <label className="font-cinzel text-[10px] uppercase tracking-widest text-gray-400 block mb-2">
            Precio cobrado
            <span className="ml-2 text-gray-600">(opcional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-cinzel text-sm text-gray-500">
              $
            </span>
            <input
              type="number"
              value={pricePaid}
              onChange={(e) => setPricePaid(e.target.value)}
              min={0}
              step={0.01}
              placeholder="0.00"
              className="w-full bg-[#0a1628] border border-white/10 text-gray-200 font-cinzel text-sm pl-8 pr-4 py-3 focus:outline-none focus:border-[#C5A059]/40 transition"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="font-cinzel text-[10px] uppercase tracking-widest text-gray-400 block mb-2">
            Notas del pack
            <span className="ml-2 text-gray-600">(opcional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Observaciones sobre este pack..."
            className="w-full bg-[#0a1628] border border-white/10 text-gray-300 font-crimson text-sm p-3 resize-none focus:outline-none focus:border-[#C5A059]/40 placeholder:text-gray-700 transition"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 border border-red-500/30 bg-red-950/20 p-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p className="font-crimson text-sm">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 font-cinzel text-[11px] uppercase tracking-widest bg-[#C5A059] text-[#020617] px-6 py-3 hover:bg-[#C5A059]/90 transition disabled:opacity-50"
          >
            {submitting ? "Creando pack..." : "Crear pack"}
          </button>
          <Link
            href={`/admin/pacientes/${userId}`}
            className="font-cinzel text-[11px] uppercase tracking-widest border border-white/10 text-gray-400 px-6 py-3 hover:border-white/20 transition text-center"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
