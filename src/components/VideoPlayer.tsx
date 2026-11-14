"use client";

import { useCallback, useState } from "react";
import { videoPoster } from "@/lib/videos";

interface VideoPlayerProps {
  src: string;
  /** Si no se pasa, se deriva del nombre del archivo (ver lib/videos.ts). */
  poster?: string;
  /** Reproduce apenas se monta (útil cuando el montaje viene de un clic del usuario). */
  autoPlay?: boolean;
  preload?: "none" | "metadata" | "auto";
  className?: string;
  /** "contain" para mostrar el video completo, "cover" para llenar el contenedor. */
  fit?: "contain" | "cover";
}

/**
 * <video> con poster siempre presente y fallback visible si el archivo no carga
 * (en lugar de una caja negra que parece un link roto).
 */
export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  preload = "metadata",
  className = "",
  fit = "contain",
}: VideoPlayerProps) {
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const posterUrl = poster ?? videoPoster(src);
  const key = `${src}#${attempt}`;
  const failed = failedKey === key;

  // En iOS Safari el play() debe ocurrir dentro del gesto del usuario; un ref callback
  // se ejecuta de forma síncrona al montar, que es lo que necesitamos.
  const videoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      if (node && autoPlay) node.play().catch(() => {});
    },
    [autoPlay]
  );

  if (failed) {
    return (
      <div
        role="alert"
        className={`relative w-full h-full flex flex-col items-center justify-center gap-3 text-center p-4 bg-[#0a1628] bg-cover bg-center ${className}`}
        style={{ backgroundImage: `linear-gradient(rgba(2,6,23,0.8), rgba(2,6,23,0.9)), url(${posterUrl})` }}
      >
        <p className="font-crimson text-gray-200 text-base leading-snug">No se pudo cargar el video.</p>
        <button
          type="button"
          onClick={() => setAttempt((n) => n + 1)}
          className="px-4 py-2 border border-[#C5A059]/60 text-[#C5A059] hover:bg-[#C5A059] hover:text-[#020617] transition text-xs uppercase tracking-widest font-cinzel"
        >
          Reintentar
        </button>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-[#C5A059] underline underline-offset-2 transition"
        >
          Abrir video en otra pestaña
        </a>
      </div>
    );
  }

  return (
    <video
      key={key}
      ref={videoRef}
      src={src}
      poster={posterUrl}
      controls
      playsInline
      preload={preload}
      onError={() => setFailedKey(key)}
      controlsList="nodownload"
      disablePictureInPicture
      className={`w-full h-full ${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
    />
  );
}
