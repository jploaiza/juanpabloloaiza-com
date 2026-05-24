import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import NewCampaignForm from "@/components/newsletter/NewCampaignForm";

export const metadata: Metadata = { title: "Nueva Campaña — Newsletter" };

export default async function NuevaCampañaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      <div className="mb-8">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Newsletter › Campañas</p>
        <h1 className="font-cinzel text-2xl text-white">Nueva campaña</h1>
      </div>
      <NewCampaignForm />
    </div>
  );
}
