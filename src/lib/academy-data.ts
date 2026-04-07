// Static course structure — source of truth for seed and UI
// Video URLs are managed via the admin panel in Supabase

export const COURSE_SLUG = "hipnosis-regresiva-preparacion";

export const COURSE_META = {
  slug: COURSE_SLUG,
  title: "Preparación para tu Regresión a Vidas Pasadas",
  description:
    "Un recorrido completo para que llegues a tu sesión preparado, confiado y abierto. Aprende sobre hipnosis, liberación de entidades y qué esperar del proceso terapéutico.",
  instructor_name: "Juan Pablo Loaiza",
  instructor_bio:
    "Terapeuta Holístico Certificado Internacionalmente en Hipnosis Clínica con Técnicas Regresivas y Liberación de Entidades Espirituales, con más de 18 años de experiencia. Ha acompañado a miles de personas en su proceso de sanación a través de sesiones de Regresión a Vidas Pasadas y Liberación Espiritual en todo el mundo.",
  instructor_photo_url: "https://media.juanpabloloaiza.com/images/jpl-newwsp.jpeg",
  thumbnail_url: "https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png",
  is_free: true,
  is_published: true,
};

export const COURSE_SECTIONS = [
  {
    title: "Introducción",
    order_index: 0,
    lessons: [
      { title: "Introducción", duration_seconds: 100, order_index: 0 },
    ],
  },
  {
    title: "Liberación de Entidades Espirituales",
    order_index: 1,
    lessons: [
      { title: "Introducción a la TLEE", duration_seconds: 128, order_index: 0 },
      { title: "Guía Espiritual", duration_seconds: 75, order_index: 1 },
      { title: "Telepatía", duration_seconds: 139, order_index: 2 },
      { title: "Función del Guía Espiritual", duration_seconds: 193, order_index: 3 },
      { title: "Desencarnados", duration_seconds: 259, order_index: 4 },
      { title: "Entidades de Fuerza Oscura", duration_seconds: 336, order_index: 5 },
      { title: "Energías Extraterrestres", duration_seconds: 217, order_index: 6 },
      { title: "¿Cuál es el beneficio de la TLEE?", duration_seconds: 164, order_index: 7 },
    ],
  },
  {
    title: "Hipnosis",
    order_index: 2,
    lessons: [
      { title: "¿Qué es la Hipnosis?", duration_seconds: 91, order_index: 0 },
      { title: "Estado Despierto", duration_seconds: 135, order_index: 1 },
      { title: "Estado Duermiendo", duration_seconds: 170, order_index: 2 },
      { title: "El Poder de la Mente Subconsciente", duration_seconds: 71, order_index: 3 },
      { title: "Estado Hipnótico", duration_seconds: 70, order_index: 4 },
      { title: "¿Qué pasa si me desconcentro?", duration_seconds: 75, order_index: 5 },
      { title: "¿Y si me dan ganas de ir al baño?", duration_seconds: 76, order_index: 6 },
      { title: "1, 2, 3 Duerme!", duration_seconds: 92, order_index: 7 },
      { title: "¿Cómo se siente estar en Hipnosis?", duration_seconds: 54, order_index: 8 },
      { title: "¿Cuál es el rol del paciente?", duration_seconds: 141, order_index: 9 },
      { title: "Relatar, no solo responder", duration_seconds: 73, order_index: 10 },
      { title: "No cambies ni modifiques nada!", duration_seconds: 140, order_index: 11 },
      { title: "¿Y si me lo estoy imaginando todo?", duration_seconds: 114, order_index: 12 },
      { title: "Diferencia entre recuerdo e imaginación", duration_seconds: 193, order_index: 13 },
      { title: "Aunque sea muy raro, tienes que decirlo!", duration_seconds: 110, order_index: 14 },
      { title: "Confía en lo primero que sientas", duration_seconds: 79, order_index: 15 },
      { title: "¿Qué hacer si no llega la respuesta?", duration_seconds: 189, order_index: 16 },
      { title: "No tiene que ser históricamente correcto", duration_seconds: 77, order_index: 17 },
      { title: "No buscamos una experiencia Audiovisual!", duration_seconds: 199, order_index: 18 },
    ],
  },
  {
    title: "Final",
    order_index: 3,
    lessons: [
      { title: "Palabras finales", duration_seconds: 70, order_index: 0 },
    ],
  },
];

export const TOTAL_LESSONS = COURSE_SECTIONS.reduce(
  (acc, s) => acc + s.lessons.length,
  0
); // 28

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
