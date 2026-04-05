import { MetadataRoute } from "next";
import { getAllBlogPosts } from "@/lib/blog-data";

const BASE = "https://juanpabloloaiza.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllBlogPosts();

  const blogUrls: MetadataRoute.Sitemap = posts.map((post) => ({
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
