"use client";

import { useState } from "react";
import { CheckCircle, Zap, Loader2 } from "lucide-react";

interface Props {
  userId: string;
  courseId: string;
  variant?: "compact" | "prominent";
}

export default function ForceCompleteButton({ userId, courseId, variant = "compact" }: Props) {
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
      <span className={`flex items-center gap-1.5 font-cinzel uppercase tracking-widest text-emerald-500 ${variant === "prominent" ? "text-xs" : "text-[9px]"}`}>
        <CheckCircle className={variant === "prominent" ? "w-4 h-4" : "w-3 h-3"} />
        Curso completado ✓
      </span>
    );
  }

  if (variant === "prominent") {
    return (
      <div className="flex flex-col items-start gap-1">
        <button
          onClick={handleForce}
          disabled={loading}
          className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 hover:border-amber-400 font-cinzel text-[10px] uppercase tracking-widest px-4 py-2.5 transition disabled:opacity-50"
          title="Marca todas las lecciones como completadas y emite el certificado"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          Forzar completado del curso
        </button>
        {error && <span className="font-cinzel text-[9px] text-red-400">{error}</span>}
      </div>
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
