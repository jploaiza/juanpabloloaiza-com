"use client";

import { useState } from "react";
import { Save, Check } from "lucide-react";

interface Props {
  userId: string;
  initialNotes: string;
}

export default function TherapistNotesForm({ userId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/admin/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, notes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al guardar");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        rows={6}
        placeholder="Notas clínicas privadas..."
        className="w-full bg-[#0a1628] border border-white/10 text-gray-300 font-crimson text-sm p-3 resize-none focus:outline-none focus:border-[#C5A059]/40 placeholder:text-gray-700 transition"
      />

      {error && (
        <p className="font-cinzel text-[9px] text-red-400 mt-1">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-3 flex items-center gap-2 font-cinzel text-[10px] uppercase tracking-widest bg-[#C5A059] text-[#020617] px-4 py-2 hover:bg-[#C5A059]/90 transition disabled:opacity-50"
      >
        {saved ? (
          <>
            <Check className="w-3.5 h-3.5" /> Guardado
          </>
        ) : (
          <>
            <Save className="w-3.5 h-3.5" />
            {saving ? "Guardando..." : "Guardar notas"}
          </>
        )}
      </button>
    </div>
  );
}
