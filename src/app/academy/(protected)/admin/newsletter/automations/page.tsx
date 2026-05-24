import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AutomationsClient from "@/components/newsletter/AutomationsClient";

export const metadata: Metadata = { title: "Automatizaciones — Newsletter" };
export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  const adminSb = await createAdminClient();
  const { data } = await adminSb.from("newsletter_automations").select("*").order("kind");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      <div className="mb-8">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Newsletter</p>
        <h1 className="font-cinzel text-2xl text-white">Automatizaciones</h1>
        <p className="font-crimson text-sm text-gray-500 mt-2">
          Emails que se envían automáticamente según eventos. Sin configuración adicional.
        </p>
      </div>
      <AutomationsClient automations={data ?? []} />
    </div>
  );
}
