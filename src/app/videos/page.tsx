import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import Header from "@/components/Header";
import VideosContent from "./VideosContent";

const R2 = "https://media.juanpabloloaiza.com";

const videoList = [
  { name: "Liberación de Entidades Espirituales", description: "Conoce en qué consiste la Terapia de Liberación de Entidades Espirituales, sus raíces en los estudios del Dr. Carl Wickland y el Dr. William Baldwin.", contentUrl: `${R2}/SRT1-2.mp4` },
  { name: "¿Cómo funciona el proceso?", description: "Juan Pablo explica el proceso terapéutico de la regresión a vidas pasadas: las tres etapas de Descubrir, Entender y Limpiar.", contentUrl: `${R2}/RVP1.m4v` },
  { name: "¿Qué es la Terapia de Regresión a Vidas Pasadas?", description: "Conoce en qué consiste esta terapia, cómo el alma acumula información de vidas pasadas y cómo la hipnosis clínica permite acceder a ella para sanar.", contentUrl: `${R2}/Que-es-la-terapia-de-Regresion-a-Vidas-Pasadas.mp4` },
  { name: "¿Se puede realizar en línea?", description: "Por supuesto. La terapia es completamente segura en línea. Más de 200 procesos terapéuticos se han realizado via Zoom con resultados maravillosos.", contentUrl: `${R2}/QA1.m4v` },
  { name: "¿Puedo tomar solo una sesión?", description: "No es recomendable. Una sola sesión deja más preguntas que respuestas. El proceso básico siempre comprende tres sesiones: descubrir, entender y limpiar.", contentUrl: `${R2}/QA2.m4v` },
  { name: "¿Existen contraindicaciones?", description: "La única contraindicación es para personas con enfermedades mentales diagnosticadas bajo tratamiento farmacológico. Esta terapia es siempre complementaria.", contentUrl: `${R2}/QA3.m4v` },
];

export const metadata: Metadata = {
  title: "Videos de Hipnosis Terapéutica y Regresión a Vidas Pasadas | Juan Pablo Loaiza",
  description: "Biblioteca de videos informativos sobre hipnosis terapéutica de regresión a vidas pasadas, liberación de entidades espirituales y preguntas frecuentes. Resuelve tus dudas antes de comenzar.",
  alternates: { canonical: `${SITE_URL}/videos` },
  openGraph: {
    title: "Videos de Hipnosis Terapéutica y Regresión a Vidas Pasadas | Juan Pablo Loaiza",
    description: "Biblioteca de videos informativos sobre hipnosis terapéutica de regresión a vidas pasadas y liberación espiritual.",
    url: `${SITE_URL}/videos`,
    type: "website",
  },
};

const videoSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Videos de Hipnosis Terapéutica y Regresión a Vidas Pasadas",
  url: `${SITE_URL}/videos`,
  numberOfItems: videoList.length,
  itemListElement: videoList.map((v, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "VideoObject",
      name: v.name,
      description: v.description,
      contentUrl: v.contentUrl,
      uploadDate: "2024-10-01",
      inLanguage: "es",
      author: { "@type": "Person", name: "Juan Pablo Loaiza", url: SITE_URL },
    },
  })),
};

export default function VideosPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
      />
      <Header />
      <VideosContent />
    </>
  );
}
