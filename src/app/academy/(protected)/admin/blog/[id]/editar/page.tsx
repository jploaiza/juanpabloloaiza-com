import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AcademyHeader from "@/components/academy/AcademyHeader";
import EditBlogPostClient from "@/app/admin/blog/[id]/editar/EditBlogPostClient";

export const metadata: Metadata = { title: "Editar Post — JPL Academy" };

export default async function AcademyEditarPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/academy/dashboard");

  const adminSb = await createAdminClient();
  const { data: post } = await adminSb
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, content, featured_image_url, tags, status, seo_title, seo_description, published_at, created_at"
    )
    .eq("id", id)
    .single();

  if (!post) notFound();

  return (
    <div className="min-h-screen bg-[#020617]">
      <AcademyHeader user={profile} />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_0%,rgba(197,160,89,0.04),transparent)]" />
      <main className="pt-20">
        <EditBlogPostClient post={post} basePath="/academy/admin/blog" />
      </main>
    </div>
  );
}
