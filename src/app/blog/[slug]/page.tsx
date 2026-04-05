import type { Metadata } from "next";
import Header from "@/components/Header";
import { getBlogPostBySlug, getAllBlogPosts } from "@/lib/blog-data";
import { notFound } from "next/navigation";
import ArticleContent from "./ArticleContent";

const OG_FALLBACK = "https://res.cloudinary.com/dvudfdhoi/image/upload/w_1200,h_630,c_fill,f_jpg,q_auto/main-juanpabloloaiza-regresion-vidas-pasadas_u6gseu";

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};

  const image = post.imageUrl || OG_FALLBACK;

  return {
    title: `${post.title} | Juan Pablo Loaiza`,
    description: post.excerpt,
    alternates: { canonical: `https://juanpabloloaiza.com/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://juanpabloloaiza.com/blog/${slug}`,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [image],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const allPosts = getAllBlogPosts();
  const idx = allPosts.findIndex((p) => p.slug === slug);
  const previousPost = idx > 0 ? allPosts[idx - 1] : null;
  const nextPost = idx < allPosts.length - 1 ? allPosts[idx + 1] : null;

  return (
    <>
      <Header />
      <ArticleContent post={post} previousPost={previousPost} nextPost={nextPost} />
    </>
  );
}
