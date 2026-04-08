import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AcademyHeader from "@/components/academy/AcademyHeader";
import NuevoPostClient from "@/app/admin/blog/nuevo/NuevoPostClient";

export const metadata: Metadata = { title: "Nuevo Post — JPL Academy" };

export default async function AcademyNuevoPostPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/academy/dashboard");

  return (
    <div className="min-h-screen bg-[#020617]">
      <AcademyHeader user={profile} />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_0%,rgba(197,160,89,0.04),transparent)]" />
      <main className="pt-20">
        <NuevoPostClient basePath="/academy/admin/blog" />
      </main>
    </div>
  );
}
