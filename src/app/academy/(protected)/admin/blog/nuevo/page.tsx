import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import NuevoPostClient from "@/app/admin/blog/nuevo/NuevoPostClient";

export const metadata: Metadata = { title: "Nuevo Post — JPL Academy" };

export default async function AcademyNuevoPostPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  return (
    <main className="pt-4">
      <NuevoPostClient basePath="/academy/admin/blog" />
    </main>
  );
}
