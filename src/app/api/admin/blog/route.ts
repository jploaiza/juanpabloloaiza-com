import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, slug, excerpt, content, featuredImageUrl, tags, status, seoTitle, seoDescription } = body;

  if (!title || !slug || !content) {
    return NextResponse.json({ error: "Faltan campos requeridos: título, slug y contenido." }, { status: 400 });
  }

  const finalSlug = slug || slugify(title);
  const now = new Date().toISOString();

  const adminSb = await createAdminClient();

  const { data: existing } = await adminSb
    .from("blog_posts")
    .select("id")
    .eq("slug", finalSlug)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Ya existe un post con ese slug." }, { status: 409 });
  }

  const { data: post, error } = await adminSb
    .from("blog_posts")
    .insert({
      title,
      slug: finalSlug,
      excerpt: excerpt || null,
      content,
      featured_image_url: featuredImageUrl || null,
      tags: Array.isArray(tags) ? tags : [],
      status: status === "published" ? "published" : "draft",
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      author_id: user.id,
      published_at: status === "published" ? now : null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post }, { status: 201 });
}
