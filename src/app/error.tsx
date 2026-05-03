"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  const isChunkError =
    error.name === "ChunkLoadError" ||
    error.message.includes("Loading chunk") ||
    error.message.includes("Failed to fetch") ||
    error.message.includes("Load failed");

  useEffect(() => {
    // Auto-retry once for chunk load errors (slow connection)
    if (isChunkError) {
      const timer = setTimeout(() => {
        router.refresh();
        reset();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isChunkError, reset, router]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-[#0a1628] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <img
            src="https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png"
            alt="Juan Pablo Loaiza"
            width={140}
            height={40}
            className="mx-auto mb-8 opacity-80"
          />

          {isChunkError ? (
            <>
              <p className="text-[#C5A059] uppercase tracking-widest text-xs mb-3" style={{ fontFamily: "serif" }}>
                Reconectando
              </p>
              <h1 className="text-white text-xl mb-4" style={{ fontFamily: "Georgia, serif" }}>
                Conexión lenta detectada
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed mb-8" style={{ fontFamily: "Georgia, serif" }}>
                La página no pudo cargar completamente. Reintentando automáticamente...
              </p>
              <div className="flex items-center justify-center gap-1.5 mb-8">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-[#C5A059] uppercase tracking-widest text-xs mb-3" style={{ fontFamily: "serif" }}>
                Algo salió mal
              </p>
              <h1 className="text-white text-xl mb-4" style={{ fontFamily: "Georgia, serif" }}>
                Error inesperado
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed mb-8" style={{ fontFamily: "Georgia, serif" }}>
                Ocurrió un error al cargar la página. Por favor intenta de nuevo.
              </p>
            </>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { reset(); router.refresh(); }}
              className="px-6 py-2.5 bg-[#C5A059] text-[#020617] text-xs uppercase tracking-widest hover:bg-[#D4B06A] transition"
              style={{ fontFamily: "serif" }}
            >
              Reintentar
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 border border-[#C5A059]/30 text-[#C5A059] text-xs uppercase tracking-widest hover:border-[#C5A059]/60 transition"
              style={{ fontFamily: "serif" }}
            >
              Inicio
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
