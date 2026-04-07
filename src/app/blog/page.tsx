import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import BlogContent from "./BlogContent";

const OG_IMAGE = "https://media.juanpabloloaiza.com/blog/la-conexion-entre-miedos-actuales-y-vidas-pasadas.webp";

export const metadata: Metadata = {
  title: "Blog — Regresión a Vidas Pasadas y Sanación Espiritual | Juan Pablo Loaiza",
  description: "Artículos sobre hipnosis terapéutica, regresión a vidas pasadas, liberación de entidades espirituales y sanación del alma. Aprende sobre el proceso terapéutico.",
  keywords: "blog vidas pasadas, artículos hipnosis terapéutica, sanación espiritual, karma, regresión, liberación entidades",
  alternates: { canonical: "https://juanpabloloaiza.com/blog" },
  openGraph: {
    title: "Blog — Regresión a Vidas Pasadas y Sanación Espiritual | Juan Pablo Loaiza",
    description: "Artículos sobre hipnosis terapéutica, regresión a vidas pasadas, sanación kármica y liberación espiritual.",
    url: "https://juanpabloloaiza.com/blog",
    siteName: "Juan Pablo Loaiza",
    locale: "es_ES",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Blog — Juan Pablo Loaiza" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Regresión a Vidas Pasadas y Sanación Espiritual | Juan Pablo Loaiza",
    description: "Artículos sobre hipnosis terapéutica, regresión a vidas pasadas y sanación espiritual.",
    images: [OG_IMAGE],
  },
};

export default function BlogPage() {
  return (
    <>
      <Header />
      <Suspense>
        <BlogContent />
      </Suspense>
    </>
  );
}
