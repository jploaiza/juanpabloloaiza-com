export const MEDIA_BASE = "https://media.juanpabloloaiza.com";

/** URL pública de un video en R2. */
export const mediaUrl = (file: string) => `${MEDIA_BASE}/${file}`;

/**
 * Poster local (public/assets/video-posters/<nombre>.webp) derivado del nombre del archivo.
 * Ej: ".../QA1.m4v" -> "/assets/video-posters/QA1.webp".
 * Si se sube una versión recodificada (ej: "SRT1-2-v2.mp4") el sufijo "-vN" se ignora.
 */
export function videoPoster(src: string): string {
  const file = src.split("?")[0].split("/").pop() ?? "";
  const base = file.replace(/\.[^.]+$/, "").replace(/-v\d+$/, "");
  return `/assets/video-posters/${base}.webp`;
}
