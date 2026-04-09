"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  type Patient, type PackSize,
  PACK_WEEKS, REMINDER_DAYS, calcEndDate,
} from "@/lib/patients";

interface Props {
  patient?: Patient | null;
  onClose: () => void;
  onSaved: () => void;
}

const PACK_OPTIONS: PackSize[] = [3, 5, 8];

export default function PatientForm({ patient, onClose, onSaved }: Props) {
  const isEdit = !!patient;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    first_name: patient?.first_name ?? "",
    last_name: patient?.last_name ?? "",
    email: patient?.email ?? "",
    phone: patient?.phone ?? "",
    pack_size: (patient?.pack_size ?? 5) as PackSize,
    start_date: patient?.start_date ?? new Date().toISOString().split("T")[0],
    notes: patient?.notes ?? "",
    reminder_day: patient?.reminder_day ?? 1,
  });

  const endDate = calcEndDate(form.start_date, form.pack_size);

  function set(k: keyof typeof form, v: unknown) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = { ...form, end_date: endDate };
      const url = isEdit ? `/api/patients/${patient!.id}` : "/api/patients";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Error al guardar");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0a1628] border border-[#C5A059]/30 relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C5A059]/15">
          <h2 className="font-cinzel text-[#C5A059] uppercase tracking-widest text-sm">
            {isEdit ? "Editar Paciente" : "Nuevo Paciente"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Nombre + Apellido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-cinzel text-gray-400 uppercase tracking-widest mb-1">
                Nombre(s) *
              </label>
              <input
                required
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                className="w-full bg-[#020617] border border-[#C5A059]/20 text-white px-3 py-2 text-sm font-crimson focus:border-[#C5A059]/60 outline-none"
                placeholder="María Fernanda"
              />
            </div>
            <div>
              <label className="block text-xs font-cinzel text-gray-400 uppercase tracking-widest mb-1">
                Apellido(s)
              </label>
              <input
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                className="w-full bg-[#020617] border border-[#C5A059]/20 text-white px-3 py-2 text-sm font-crimson focus:border-[#C5A059]/60 outline-none"
                placeholder="González"
              />
            </div>
          </div>

          {/* Email + Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-cinzel text-gray-400 uppercase tracking-widest mb-1">
                Email *
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full bg-[#020617] border border-[#C5A059]/20 text-white px-3 py-2 text-sm font-crimson focus:border-[#C5A059]/60 outline-none"
                placeholder="maria@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-cinzel text-gray-400 uppercase tracking-widest mb-1">
                Teléfono *
              </label>
              <input
                required
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="w-full bg-[#020617] border border-[#C5A059]/20 text-white px-3 py-2 text-sm font-crimson focus:border-[#C5A059]/60 outline-none"
                placeholder="+56912345678"
              />
            </div>
          </div>

          {/* Pack + Fecha inicio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-cinzel text-gray-400 uppercase tracking-widest mb-1">
                Pack *
              </label>
              <select
                value={form.pack_size}
                onChange={(e) => set("pack_size", Number(e.target.value) as PackSize)}
                className="w-full bg-[#020617] border border-[#C5A059]/20 text-white px-3 py-2 text-sm font-crimson focus:border-[#C5A059]/60 outline-none"
              >
                {PACK_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    Pack {p} sesiones ({PACK_WEEKS[p]} semanas)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-cinzel text-gray-400 uppercase tracking-widest mb-1">
                Fecha de inicio *
              </label>
              <input
                required
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                className="w-full bg-[#020617] border border-[#C5A059]/20 text-white px-3 py-2 text-sm font-crimson focus:border-[#C5A059]/60 outline-none"
              />
            </div>
          </div>

          {/* End date (calculated, read-only) */}
          <div className="bg-[#020617] border border-[#C5A059]/10 px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-cinzel text-gray-500 uppercase tracking-widest">Fecha de vencimiento</span>
            <span className="text-[#C5A059] font-crimson text-sm">
              {new Date(endDate + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>

          {/* Día recordatorio */}
          <div>
            <label className="block text-xs font-cinzel text-gray-400 uppercase tracking-widest mb-1">
              Día preferido de sesión
            </label>
            <select
              value={form.reminder_day}
              onChange={(e) => set("reminder_day", Number(e.target.value))}
              className="w-full bg-[#020617] border border-[#C5A059]/20 text-white px-3 py-2 text-sm font-crimson focus:border-[#C5A059]/60 outline-none"
            >
              {REMINDER_DAYS.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-cinzel text-gray-400 uppercase tracking-widest mb-1">
              Notas
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="w-full bg-[#020617] border border-[#C5A059]/20 text-white px-3 py-2 text-sm font-crimson focus:border-[#C5A059]/60 outline-none resize-none"
              placeholder="Observaciones, contexto del paciente..."
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm font-crimson">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-[#C5A059]/20 text-gray-400 hover:text-white text-sm font-cinzel uppercase tracking-widest transition">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#C5A059] text-[#020617] text-sm font-cinzel uppercase tracking-widest hover:bg-[#D4B06A] transition disabled:opacity-50"
            >
              {loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear Paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
