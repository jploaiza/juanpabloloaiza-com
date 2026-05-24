import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SubscribersList from "@/components/newsletter/SubscribersList";

export const metadata: Metadata = { title: "Suscriptores — Newsletter" };
export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      <div className="mb-6">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Newsletter</p>
        <h1 className="font-cinzel text-2xl text-white">Suscriptores</h1>
      </div>
      <SubscribersList />
    </div>
  );
}
