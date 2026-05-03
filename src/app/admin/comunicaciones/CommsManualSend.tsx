"use client";

import { useState } from "react";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

type Patient = {
  id: string;
  full_name: string | null;
  email: string;
};

interface Props {
  patients: Patient[];
  commTypes: string[];
  typeLabels: Record<string, string>;
}

const selectClass =
  "w-full bg-[#0e1b30] border border-white/10 text-gray-200 font-crimson text-base px-4 py-3 focus:outline-none focus:border-[#C5A059]/60 transition-colors appearance-none";

export default function CommsManualSend({ patients, commTypes, typeLabels }: Props) {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!selectedPatientId || !selectedType) return;
    setSending(true);
    setSuccess(false);
    setError("");

    try {
      const res = await fetch("/api/admin/comms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedPatientId, type: selectedType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al enviar el email.");
        setSending(false);
        return;
      }

      setSuccess(true);
      setSelectedPatientId("");
      setSelectedType("");
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative bg-[#16213e] border border-[#C5A059]/20 p-6 overflow-hidden">
      <ScrollworkCorners size={40} opacity={0.75} />

      <div className="flex items-center gap-2 mb-6">
        <Send className="w-4 h-4 text-[#C5A059]" />
        <h2 className="font-cinzel text-sm uppercase tracking-widest text-white">
          Envío manual
        </h2>
      </div>

      <div className="space-y-4">
        {/* Patient select */}
        <div>
          <label className="block font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059]/80 mb-1.5">
            Paciente
          </label>
          <div className="relative">
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className={selectClass}
            >
              <option value="" disabled>
                Seleccionar paciente...
              </option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name ?? p.email}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {selectedPatientId && (
            <p className="font-cinzel text-[8px] text-gray-600 mt-1 tracking-widest">
              {patients.find((p) => p.id === selectedPatientId)?.email}
            </p>
          )}
        </div>

        {/* Type select */}
        <div>
          <label className="block font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059]/80 mb-1.5">
            Tipo de mensaje
          </label>
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={selectClass}
            >
              <option value="" disabled>
                Seleccionar tipo...
              </option>
              {commTypes.map((t) => (
                <option key={t} value={t}>
                  {typeLabels[t] ?? t}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {success && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <p className="font-crimson text-sm text-emerald-400">Email enviado correctamente.</p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <p className="font-crimson text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!selectedPatientId || !selectedType || sending}
          className="w-full flex items-center justify-center gap-2 bg-[#C5A059] hover:bg-[#d4b06a] disabled:opacity-40 disabled:cursor-not-allowed text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-6 py-3 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          {sending ? "Enviando..." : "Enviar ahora"}
        </button>
      </div>
    </div>
  );
}
