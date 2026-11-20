import type { BlogPost } from "@/lib/blog-data";

const FEED_URL = "https://www.regresionvidaspasadas.com/newsletter-articles.json";

interface FeedArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  date: string;
  category: string;
  tags?: string[];
}

/**
 * Artículos del portal (regresionvidaspasadas.com) con la forma de BlogPost,
 * para el selector de artículos del editor de campañas. El portal publica el
 * archivo en cada despliegue (scripts/build-article-feed.mjs).
 */
export async function getPortalArticles(): Promise<BlogPost[]> {
  try {
    const res = await fetch(FEED_URL, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { articles?: FeedArticle[] };
    return (data.articles ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      excerpt: a.excerpt ?? "",
      content: "",
      readTime: "",
      category: a.category ?? "Artículo",
      image: a.imageUrl ?? "",
      imageUrl: a.imageUrl,
      slug: a.slug,
      date: a.date,
      author: "Juan Pablo Loaiza",
      url: `https://www.regresionvidaspasadas.com/blog/${a.slug}/`,
      tags: a.tags ?? [],
    }));
  } catch (e) {
    console.error("[portal-articles]", e);
    return [];
  }
}
