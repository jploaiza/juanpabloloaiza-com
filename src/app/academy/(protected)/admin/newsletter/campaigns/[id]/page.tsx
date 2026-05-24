import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import CampaignBuilder from "@/components/newsletter/CampaignBuilder";
import { getAllPublishedPosts } from "@/lib/supabase/blog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar Campaña — Newsletter" };

export default async function CampaignBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  const adminSb = await createAdminClient();
  const { data: campaign } = await adminSb.from("newsletter_campaigns").select("*").eq("id", id).single();
  if (!campaign) notFound();

  const posts = await getAllPublishedPosts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      <div className="mb-6">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Newsletter › Campañas</p>
        <h1 className="font-cinzel text-2xl text-white truncate">{campaign.name}</h1>
      </div>
      <CampaignBuilder campaign={campaign} posts={posts} />
    </div>
  );
}
