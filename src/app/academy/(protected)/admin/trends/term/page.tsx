import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import KeywordIdeasPanel from "@/components/admin/KeywordIdeasPanel";

export const metadata: Metadata = { title: "Ideas de contenido — Admin" };

export default async function TermPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; geo?: string }>;
}) {
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

  const params = await searchParams;
  const keyword =
    typeof params.q === "string" ? params.q.trim() : "";
  const geo =
    typeof params.geo === "string" ? params.geo.toUpperCase() : "ES";

  if (!keyword) redirect("/academy/admin/trends");

  return <KeywordIdeasPanel keyword={keyword} geo={geo} />;
}
