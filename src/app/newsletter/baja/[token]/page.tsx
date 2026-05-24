"use client";

import { useState } from "react";
import Link from "next/link";
import { use } from "react";

export default function BajaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<"idle" | "loading" | "paused" | "done" | "error">("idle");

  async function handleAction(action: "pause" | "total") {
    setStatus("loading");
    try {
      const res = await fetch(`/api/newsletter/unsubscribe/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      setStatus(action === "pause" ? "paused" : "done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="border border-[#C5A059]/20 bg-[#16213e] p-10 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#C5A059]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#C5A059]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#C5A059]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#C5A059]" />

          {status === "done" && (
            <>
              <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-4">Listo</p>
              <h1 className="font-cinzel text-2xl text-white mb-4">Te damos de baja</h1>
              <p className="font-crimson text-base text-gray-400 leading-relaxed mb-8">
                Has sido eliminado de la lista. No recibirás más correos.
                Si cambias de opinión, puedes suscribirte de nuevo cuando quieras.
              </p>
              <Link href="/" className="inline-block border border-[#C5A059]/40 hover:border-[#C5A059] text-[#C5A059] font-cinzel text-[10px] uppercase tracking-widest px-8 py-3 transition">
                Volver al inicio
              </Link>
            </>
          )}

          {status === "paused" && (
            <>
              <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-4">Preferencia guardada</p>
              <h1 className="font-cinzel text-2xl text-white mb-4">Menos frecuencia</h1>
              <p className="font-crimson text-base text-gray-400 leading-relaxed mb-8">
                Hemos marcado tu preferencia. Seguirás en la lista pero con envíos reducidos.
              </p>
              <Link href="/" className="inline-block border border-[#C5A059]/40 hover:border-[#C5A059] text-[#C5A059] font-cinzel text-[10px] uppercase tracking-widest px-8 py-3 transition">
                Volver al inicio
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <p className="font-cinzel text-[9px] uppercase tracking-widest text-red-400 mb-4">Error</p>
              <p className="font-crimson text-base text-gray-400 mb-6">
                Algo salió mal. Intenta de nuevo o escríbenos a{" "}
                <a href="mailto:newsletter@juanpabloloaiza.com" className="text-[#C5A059]">
                  newsletter@juanpabloloaiza.com
                </a>
              </p>
              <button onClick={() => setStatus("idle")} className="text-[#C5A059] font-cinzel text-[10px] uppercase tracking-widest underline">
                Intentar de nuevo
              </button>
            </>
          )}

          {(status === "idle" || status === "loading") && (
            <>
              <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-4">Gestionar suscripción</p>
              <h1 className="font-cinzel text-xl text-white mb-4 leading-snug">
                ¿Qué prefieres hacer?
              </h1>
              <p className="font-crimson text-base text-gray-400 leading-relaxed mb-8">
                Puedes reducir la frecuencia de correos o darte de baja completamente.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleAction("pause")}
                  disabled={status === "loading"}
                  className="w-full border border-[#C5A059]/40 hover:border-[#C5A059] text-[#C5A059] font-cinzel text-[10px] uppercase tracking-widest px-6 py-3 transition disabled:opacity-50"
                >
                  Solo menos frecuencia
                </button>
                <button
                  onClick={() => handleAction("total")}
                  disabled={status === "loading"}
                  className="w-full border border-red-900/40 hover:border-red-500/60 text-red-400/70 hover:text-red-300 font-cinzel text-[10px] uppercase tracking-widest px-6 py-3 transition disabled:opacity-50"
                >
                  {status === "loading" ? "Procesando..." : "Darme de baja completamente"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
