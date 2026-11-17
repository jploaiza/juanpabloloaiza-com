import { MetadataRoute } from "next";
import { getAllBlogPosts } from "@/lib/blog-data";
import { getAllPublishedPosts } from "@/lib/supabase/blog";
import { getTopics } from "@/lib/blog-topics";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

const BASE = SITE_URL;

const asDate = (d: string) => {
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? undefined : t;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPosts = getAllBlogPosts();
  const supabasePosts = await getAllPublishedPosts().catch(() => []);

  // Merge: Supabase posts take precedence; static posts fill the rest
  const staticSlugs = new Set(supabasePosts.map((p) => p.slug));
  const filteredStatic = staticPosts.filter((p) => !staticSlugs.has(p.slug));
  const allPosts = [...supabasePosts, ...filteredStatic];

  const blogUrls: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: asDate(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // lastmod real: la fecha del artículo más reciente (antes era "hoy" en cada lectura,
  // lo que hace que Google deje de confiar en el campo).
  const latest = allPosts.map((p) => asDate(p.date)).filter((d): d is Date => !!d).sort((a, b) => b.getTime() - a.getTime())[0];

  // Páginas de tema: solo etiquetas con suficientes artículos (las demás devuelven 404)
  const topicUrls: MetadataRoute.Sitemap = getTopics(allPosts).map((t) => ({
    url: `${BASE}/blog/tema/${t.slug}`,
    lastModified: latest,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    { url: BASE, changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE}/blog`, lastModified: latest, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/videos`, changeFrequency: "monthly", priority: 0.8 },
    ...topicUrls,
    ...blogUrls,
  ];
}
