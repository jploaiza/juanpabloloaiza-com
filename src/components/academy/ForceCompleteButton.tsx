"use client";

import { useState } from "react";
import { CheckCircle, Zap, Loader2 } from "lucide-react";

interface Props {
  userId: string;
  courseId: string;
}

export default function ForceCompleteButton({ userId, courseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleForce = async () => {
    if (!confirm("¿Marcar todas las lecciones como completadas y emitir certificado para este estudiante?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/academy/admin/force-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, courseId }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
      } else {
        setError(data.error ?? "Error desconocido");
      }
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <span className="flex items-center gap-1 font-cinzel text-[9px] uppercase tracking-widest text-emerald-500">
        <CheckCircle className="w-3 h-3" /> Completado
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={handleForce}
        disabled={loading}
        className="flex items-center gap-1 font-cinzel text-[9px] uppercase tracking-widest text-amber-400 hover:text-amber-300 transition disabled:opacity-50"
        title="Forzar completado del curso (marca todas las lecciones y emite certificado)"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Zap className="w-3 h-3" />
        )}
        Forzar completado
      </button>
      {error && (
        <span className="font-cinzel text-[8px] text-red-400">{error}</span>
      )}
    </div>
  );
}
