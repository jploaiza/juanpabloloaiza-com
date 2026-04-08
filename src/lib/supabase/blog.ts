import { createBrowserClient } from "@supabase/ssr";

export type SupabasePost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  tags: string[] | null;
  status: "draft" | "published";
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
};

function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

function computeReadTime(content: string): string {
  const words = wordCount(content);
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min`;
}

/** Convert a Supabase post to the shape expected by blog UI components */
export function toDisplayPost(p: SupabasePost) {
  const category = p.tags?.[0] ?? "General";
  return {
    id: p.id,
    title: p.title,
    excerpt: p.excerpt ?? "",
    content: p.content,
    readTime: computeReadTime(p.content),
    category,
    image: "bg-gradient-to-br from-indigo-600 to-purple-900",
    imageUrl: p.featured_image_url ?? undefined,
    slug: p.slug,
    date: p.published_at ?? p.created_at,
    author: "Juan Pablo Loaiza",
    url: `https://www.juanpabloloaiza.com/blog/${p.slug}`,
  };
}

function anonClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function getAllPublishedPosts() {
  const supabase = anonClient();
  const { data } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, content, featured_image_url, tags, status, seo_title, seo_description, published_at, created_at"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (data ?? []).map(toDisplayPost);
}

export async function getPublishedPostBySlug(slug: string) {
  const supabase = anonClient();
  const { data } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, content, featured_image_url, tags, status, seo_title, seo_description, published_at, created_at"
    )
    .eq("status", "published")
    .eq("slug", slug)
    .single();

  return data ? toDisplayPost(data) : null;
}

export async function getAllPublishedSlugs(): Promise<string[]> {
  const supabase = anonClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("status", "published");
  return (data ?? []).map((p) => p.slug);
}
