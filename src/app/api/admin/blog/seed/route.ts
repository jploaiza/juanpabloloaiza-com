import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { blogPosts } from "@/lib/blog-data";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminSb = await createAdminClient();

  // Check which slugs already exist to avoid duplicates
  const { data: existing } = await adminSb
    .from("blog_posts")
    .select("slug");
  const existingSlugs = new Set((existing ?? []).map((p) => p.slug));

  const toInsert = blogPosts
    .filter((p) => !existingSlugs.has(p.slug))
    .map((p) => ({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      featured_image_url: p.imageUrl ?? null,
      tags: [p.category],
      status: "published" as const,
      seo_title: null,
      seo_description: p.excerpt,
      author_id: user.id,
      published_at: new Date(p.date).toISOString(),
      created_at: new Date(p.date).toISOString(),
      updated_at: new Date(p.date).toISOString(),
    }));

  if (toInsert.length === 0) {
    return NextResponse.json({ message: "All posts already exist.", inserted: 0 });
  }

  const { data: inserted, error } = await adminSb
    .from("blog_posts")
    .insert(toInsert)
    .select("id, slug");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `Inserted ${inserted?.length} posts.`,
    inserted: inserted?.length,
    slugs: inserted?.map((p) => p.slug),
  });
}
