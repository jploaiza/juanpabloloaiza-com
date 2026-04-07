import type { Metadata } from "next";
import Header from "@/components/Header";
import VideosContent from "./VideosContent";

export const metadata: Metadata = {
  title: "Videos de Hipnosis Terapéutica y Regresión a Vidas Pasadas | Juan Pablo Loaiza",
  description: "Biblioteca de videos informativos sobre hipnosis terapéutica de regresión a vidas pasadas, liberación de entidades espirituales y preguntas frecuentes. Resuelve tus dudas antes de comenzar.",
  alternates: { canonical: "https://juanpabloloaiza.com/videos" },
  openGraph: {
    title: "Videos de Hipnosis Terapéutica y Regresión a Vidas Pasadas | Juan Pablo Loaiza",
    description: "Biblioteca de videos informativos sobre hipnosis terapéutica de regresión a vidas pasadas y liberación espiritual.",
    url: "https://juanpabloloaiza.com/videos",
    type: "website",
  },
};

export default function VideosPage() {
  return (
    <>
      <Header />
      <VideosContent />
    </>
  );
}
