import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import Header from "@/components/Header";
import BlogContent from "./BlogContent";
import { getAllPublishedPosts } from "@/lib/supabase/blog";
import { getTopics } from "@/lib/blog-topics";

export const dynamic = "force-dynamic";

const OG_IMAGE = "https://media.juanpabloloaiza.com/blog/la-conexion-entre-miedos-actuales-y-vidas-pasadas.webp";

type SearchParams = Promise<{ page?: string }>;

function parsePage(raw: string | undefined): number {
  const n = parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

const BASE_METADATA: Metadata = {
  title: "Blog — Regresión a Vidas Pasadas y Sanación Espiritual | Juan Pablo Loaiza",
  description: "Artículos sobre hipnosis terapéutica, regresión a vidas pasadas, liberación de entidades espirituales y sanación del alma. Aprende sobre el proceso terapéutico.",
  keywords: "blog vidas pasadas, artículos hipnosis terapéutica, sanación espiritual, karma, regresión, liberación entidades",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "Blog — Regresión a Vidas Pasadas y Sanación Espiritual | Juan Pablo Loaiza",
    description: "Artículos sobre hipnosis terapéutica, regresión a vidas pasadas, sanación kármica y liberación espiritual.",
    url: `${SITE_URL}/blog`,
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

// Las páginas 2+ del listado mantienen su propia canónica pero van en noindex,follow: en GSC
// quedaban como "Rastreada: sin indexar" y ya recibían impresiones basura (?page=9, ?page=10).
// Los artículos se descubren igual por el sitemap, los temas y los relacionados.
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  if (page <= 1) return BASE_METADATA;
  return {
    ...BASE_METADATA,
    robots: { index: false, follow: true },
    title: `Blog — Página ${page} | Juan Pablo Loaiza`,
    alternates: { canonical: `${SITE_URL}/blog?page=${page}` },
    openGraph: { ...BASE_METADATA.openGraph, url: `${SITE_URL}/blog?page=${page}` },
  };
}

export default async function BlogPage({ searchParams }: { searchParams: SearchParams }) {
  // /blog?page=1 se redirige en middleware.ts
  const page = parsePage((await searchParams).page);

  const posts = await getAllPublishedPosts();
  if (page > Math.max(1, Math.ceil(posts.length / 10))) redirect("/blog");
  return (
    <>
      <Header />
      <BlogContent posts={posts} page={page} topics={getTopics(posts)} />
    </>
  );
}
