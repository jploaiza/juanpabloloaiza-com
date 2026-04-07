import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import EditBlogPostClient from "./EditBlogPostClient";

export const metadata: Metadata = { title: "Editar Post — Admin" };

export default async function EditarPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/academy/login");

  const adminSb = await createAdminClient();
  const { data: post } = await adminSb
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, content, featured_image_url, tags, status, seo_title, seo_description, published_at, created_at"
    )
    .eq("id", id)
    .single();

  if (!post) notFound();

  return <EditBlogPostClient post={post} />;
}
