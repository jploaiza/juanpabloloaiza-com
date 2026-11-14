export const MEDIA_BASE = "https://media.juanpabloloaiza.com";

/** URL pública de un video en R2. */
export const mediaUrl = (file: string) => `${MEDIA_BASE}/${file}`;

/**
 * Portada única para todos los videos: primer frame de
 * "Que-es-la-terapia-de-Regresion-a-Vidas-Pasadas.mp4" (9:16).
 * Para cambiarla, reemplaza el archivo (usa un nombre nuevo para evitar caché).
 */
export const VIDEO_POSTER = "/assets/video-posters/portada-2026.webp";
