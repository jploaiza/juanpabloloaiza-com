import type { Metadata } from "next";
import Header from "@/components/Header";
import { notFound } from "next/navigation";
import ArticleContent from "./ArticleContent";
import { getPublishedPostBySlug, getAllPublishedPosts } from "@/lib/supabase/blog";

export const dynamic = "force-dynamic";

const OG_FALLBACK = "https://res.cloudinary.com/dvudfdhoi/image/upload/w_1200,h_630,c_fill,f_jpg,q_auto/main-juanpabloloaiza-regresion-vidas-pasadas_u6gseu";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return {};

  const image = post.imageUrl || OG_FALLBACK;

  return {
    title: `${post.title} | Juan Pablo Loaiza`,
    description: post.excerpt,
    keywords: `${post.category}, regresión a vidas pasadas, hipnosis terapéutica, ${post.title.toLowerCase()}`,
    alternates: { canonical: `https://juanpabloloaiza.com/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://juanpabloloaiza.com/blog/${slug}`,
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

  const image = post.imageUrl || OG_FALLBACK;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image,
    author: { "@type": "Person", name: post.author, url: "https://juanpabloloaiza.com" },
    publisher: {
      "@type": "Organization",
      name: "Juan Pablo Loaiza",
      logo: { "@type": "ImageObject", url: "https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png" },
    },
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://juanpabloloaiza.com/blog/${slug}` },
    url: `https://juanpabloloaiza.com/blog/${slug}`,
    articleSection: post.category,
    inLanguage: "es",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Header />
      <ArticleContent post={post} previousPost={previousPost} nextPost={nextPost} />
    </>
  );
}
