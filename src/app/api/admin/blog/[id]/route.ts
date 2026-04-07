import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const adminSb = await createAdminClient();

  // Fetch current state to determine if we need to set published_at
  const { data: existing } = await adminSb
    .from("blog_posts")
    .select("published_at, status")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Post no encontrado." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const isBeingPublished = status === "published" && existing.status !== "published";

  const updates: Record<string, unknown> = {
    updated_at: now,
  };

  if (title !== undefined) updates.title = title;
  if (slug !== undefined) updates.slug = slug;
  if (excerpt !== undefined) updates.excerpt = excerpt || null;
  if (content !== undefined) updates.content = content;
  if (featuredImageUrl !== undefined) updates.featured_image_url = featuredImageUrl || null;
  if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [];
  if (status !== undefined) updates.status = status;
  if (seoTitle !== undefined) updates.seo_title = seoTitle || null;
  if (seoDescription !== undefined) updates.seo_description = seoDescription || null;

  // Set published_at only when first publishing
  if (isBeingPublished && !existing.published_at) {
    updates.published_at = now;
  }

  const { data: post, error } = await adminSb
    .from("blog_posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const adminSb = await createAdminClient();

  const { error } = await adminSb.from("blog_posts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
