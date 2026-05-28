import { MetadataRoute } from "next";
import { getAllBlogPosts } from "@/lib/blog-data";
import { getAllPublishedPosts } from "@/lib/supabase/blog";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

const BASE = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPosts = getAllBlogPosts();
  const supabasePosts = await getAllPublishedPosts().catch(() => []);

  // Merge: Supabase posts take precedence; static posts fill the rest
  const staticSlugs = new Set(supabasePosts.map((p) => p.slug));
  const filteredStatic = staticPosts.filter((p) => !staticSlugs.has(p.slug));
  const allPosts = [...supabasePosts, ...filteredStatic];

  const blogUrls: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/videos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    ...blogUrls,
  ];
}
