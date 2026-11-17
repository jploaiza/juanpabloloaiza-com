import { mediaUrl } from "@/lib/videos";

export type VideoCategory = "liberation" | "rvp" | "qa";

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  /** Nombre del archivo en R2 (media.juanpabloloaiza.com). */
  file: string;
  category: VideoCategory;
  /** Duración en segundos (medida con ffprobe sobre el archivo). */
  durationSec: number;
}

/** Fecha en que los archivos se subieron a R2 (Last-Modified), la única fecha real que se conoce. */
export const VIDEOS_UPLOAD_DATE = "2026-04-05";

export const videoItems: VideoItem[] = [
  {
    id: "liberation-1",
    title: "Liberación de Entidades Espirituales",
    description: "Conoce en qué consiste la Terapia de Liberación de Entidades Espirituales, sus raíces en los estudios del Dr. Carl Wickland y el Dr. William Baldwin, y cómo puede ayudarte a recuperar tu bienestar energético.",
    file: "SRT1-2.mp4",
    category: "liberation",
    durationSec: 181,
  },
  {
    id: "rvp-1",
    title: "¿Cómo funciona el proceso?",
    description: "Juan Pablo explica el proceso terapéutico de la regresión a vidas pasadas: las tres etapas de Descubrir, Entender y Limpiar, y cómo funciona cada sesión.",
    file: "RVP1.m4v",
    category: "rvp",
    durationSec: 97,
  },
  {
    id: "rvp-2",
    title: "¿Qué es la Terapia de Regresión a Vidas Pasadas?",
    description: "Conoce en qué consiste esta terapia, cómo el alma acumula información de vidas pasadas y cómo la hipnosis clínica permite acceder a ella para sanar.",
    file: "Que-es-la-terapia-de-Regresion-a-Vidas-Pasadas.mp4",
    category: "rvp",
    durationSec: 155,
  },
  { id: "qa-1", title: "¿Se puede realizar en línea?", description: "Por supuesto. La terapia es completamente segura en línea. Más de 200 procesos terapéuticos se han realizado via Zoom con resultados maravillosos.", file: "QA1.m4v", category: "qa", durationSec: 44 },
  { id: "qa-2", title: "¿Puedo tomar solo una sesión?", description: "No es recomendable. Una sola sesión deja más preguntas que respuestas. El proceso básico siempre comprende tres sesiones: descubrir, entender y limpiar.", file: "QA2.m4v", category: "qa", durationSec: 74 },
  { id: "qa-3", title: "¿Existen contraindicaciones?", description: "La única contraindicación es para personas con enfermedades mentales diagnosticadas bajo tratamiento farmacológico. Esta terapia es siempre complementaria.", file: "QA3.m4v", category: "qa", durationSec: 74 },
  { id: "qa-4", title: "¿Podré entrar en hipnosis?", description: "Si puedes dormir en la noche, podrás entrar en hipnosis. Es el mismo proceso natural de relajación profunda, guiado conscientemente.", file: "QA4.m4v", category: "qa", durationSec: 54 },
  { id: "qa-5", title: "¿Qué pasa si se corta la llamada?", description: "Podemos reconectarnos y retomar la sesión desde donde la dejamos. Puedes salir de hipnosis solo, igual que al despertar en la mañana.", file: "QA5.m4v", category: "qa", durationSec: 58 },
  { id: "qa-6", title: "¿Qué pasa si no veo nada?", description: "Ver imágenes no es el objetivo. Lo que define una terapia exitosa es conectar con la emoción atrapada y liberarla, independiente de las imágenes.", file: "QA6.m4v", category: "qa", durationSec: 82 },
  { id: "qa-7", title: "¿Y si me lo estuviera imaginando todo?", description: "La imaginación no tiene emoción. Los recuerdos de vidas pasadas vienen siempre acompañados de una emoción real que no puede ser fabricada.", file: "QA7.m4v", category: "qa", durationSec: 137 },
  { id: "qa-8", title: "¿Voy a estar consciente durante la hipnosis?", description: "Siempre estarás consciente. Tu mente consciente se queda presente, mirando y entendiendo todo lo que sucede durante el proceso.", file: "QA8.m4v", category: "qa", durationSec: 86 },
  { id: "qa-9", title: "¿Me acordaré de lo que viví en hipnosis?", description: "Sí. Nunca perderás la conciencia. Todo lo que aprendes y vives en estas sesiones quedará integrado en ti como un conocimiento adquirido.", file: "QA9.m4v", category: "qa", durationSec: 55 },
  { id: "qa-10", title: "¿Las sesiones se graban?", description: "Sí. Todas las sesiones se graban en audio y video por Zoom, para mantener registros y para que puedas acceder a tu grabación si la necesitas.", file: "QA10.m4v", category: "qa", durationSec: 48 },
  { id: "qa-11", title: "¿Quién puede tomar esta terapia?", description: "Todas las personas pueden tomar esta terapia, excepto menores de edad o personas con enfermedades mentales diagnosticadas bajo tratamiento farmacológico.", file: "QA11.m4v", category: "qa", durationSec: 45 },
];

export const videoUrl = (v: VideoItem) => mediaUrl(v.file);

/** Duración ISO 8601 (PT1M37S) para schema.org. */
export function isoDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `PT${m ? `${m}M` : ""}${s || !m ? `${s}S` : ""}`;
}
