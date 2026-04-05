import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import BlogContent from "./BlogContent";

export const metadata: Metadata = {
  title: "Blog de Hipnoterapia y Regresión a Vidas Pasadas | Juan Pablo Loaiza",
  description: "Artículos sobre hipnoterapia, regresión a vidas pasadas, liberación de entidades espirituales y sanación del alma. Aprende sobre el proceso terapéutico.",
  alternates: { canonical: "https://juanpabloloaiza.com/blog" },
  openGraph: {
    title: "Blog de Hipnoterapia y Regresión a Vidas Pasadas | Juan Pablo Loaiza",
    description: "Artículos sobre hipnoterapia, regresión a vidas pasadas y sanación espiritual.",
    url: "https://juanpabloloaiza.com/blog",
    type: "website",
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
