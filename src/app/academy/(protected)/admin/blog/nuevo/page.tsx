import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import NuevoPostClient from "@/app/admin/blog/nuevo/NuevoPostClient";

export const metadata: Metadata = { title: "Nuevo Post — JPL Academy" };

export default async function AcademyNuevoPostPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; keyword?: string; geo?: string; idea?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  const params = await searchParams;
  const fromTrend =
    params.from === "trend" && params.keyword && params.idea
      ? { keyword: params.keyword, geo: params.geo ?? "ES", ideaId: params.idea }
      : undefined;

  return (
    <main className="pt-4">
      <NuevoPostClient basePath="/academy/admin/blog" initialFromTrend={fromTrend} />
    </main>
  );
}
