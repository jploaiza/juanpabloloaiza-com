import type { Metadata } from "next";
import Header from "@/components/Header";
import { notFound } from "next/navigation";
import ArticleContent from "./ArticleContent";
import { getPublishedPostBySlug, getAllPublishedPosts, getAllPublishedSlugs } from "@/lib/supabase/blog";
import { SITE_URL } from "@/lib/site";
import { getRelatedPosts, getTopics } from "@/lib/blog-topics";
import { autoLinkContent } from "@/lib/internal-links";
import { autoLinkPortal } from "@/lib/portal-links";

export const revalidate = 3600;

// Sin generateStaticParams, Next trata esta ruta dinámica como renderizada en cada petición
// (cache-control: private, no-store) aunque exista `revalidate`. Con la lista de slugs se
// prerenderiza y se sirve desde el CDN con ISR; los slugs nuevos se generan bajo demanda.
export async function generateStaticParams() {
  try {
    return (await getAllPublishedSlugs()).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

const OG_FALLBACK = "https://res.cloudinary.com/dvudfdhoi/image/upload/w_1200,h_630,c_fill,f_jpg,q_auto/main-juanpabloloaiza-regresion-vidas-pasadas_u6gseu";

function toJpegUrl(url: string): string {
  if (!url) return OG_FALLBACK;
  // Instagram and many crawlers don't support WebP OG images.
  // Use Cloudinary fetch to transcode the WebP to JPEG on the fly.
  if (url.endsWith(".webp")) {
    return `https://res.cloudinary.com/dvudfdhoi/image/fetch/w_1200,h_630,c_fill,f_jpg,q_auto/${encodeURIComponent(url)}`;
  }
  return url;
}

const BRAND = " | Juan Pablo Loaiza";

/**
 * Antes la etiqueta <title> usaba siempre "título del artículo | marca" (hasta 108 caracteres,
 * 75 de 95 artículos pasaban de 60 y Google los cortaba), e ignoraba el campo seo_title que ya
 * está escrito para cada artículo. Ahora se usa seo_title y la marca solo si cabe en 65.
 */
function seoTitleFor(post: { title: string; seoTitle?: string }): string {
  const base = post.seoTitle || post.title;
  return base.length + BRAND.length <= 65 ? `${base}${BRAND}` : base;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return {};

  const image = toJpegUrl(post.imageUrl || OG_FALLBACK);

  return {
    title: seoTitleFor(post),
    description: post.seoDescription || post.excerpt,
    keywords: `${post.category}, regresión a vidas pasadas, hipnosis terapéutica, ${post.title.toLowerCase()}`,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/blog/${slug}`,
      siteName: "Juan Pablo Loaiza",
      locale: "es_ES",
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: [post.category, "hipnosis terapéutica", "vidas pasadas"],
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [image],
      creator: "@jploaizao",
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const allPosts = await getAllPublishedPosts();
  const idx = allPosts.findIndex((p) => p.slug === slug);
  const previousPost = idx > 0 ? allPosts[idx - 1] : null;
  const nextPost = idx < allPosts.length - 1 ? allPosts[idx + 1] : null;
  const relatedPosts = getRelatedPosts(post, allPosts, 6);
  const topics = getTopics(allPosts);
  // Enlaces internos contextuales: solo 7 de 99 artículos enlazaban a otros dentro del texto.
  const internallyLinked = autoLinkContent(post, allPosts).content;
  // Enlaces contextuales hacia las fichas de autores del portal regresionvidaspasadas.com.
  const linkedPost = { ...post, content: autoLinkPortal(internallyLinked).content };

  const image = toJpegUrl(post.imageUrl || OG_FALLBACK);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image,
    author: { "@type": "Person", name: post.author, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Juan Pablo Loaiza",
      logo: { "@type": "ImageObject", url: "https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png" },
    },
    datePublished: post.date,
    dateModified: post.date,
    wordCount: post.content.trim().split(/\s+/).length,
    keywords: (post.tags ?? []).join(", "),
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${slug}` },
    url: `${SITE_URL}/blog/${slug}`,
    articleSection: post.category,
    inLanguage: "es",
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <Header />
      <ArticleContent post={linkedPost} previousPost={previousPost} nextPost={nextPost} relatedPosts={relatedPosts} topics={topics} />
    </>
  );
}
