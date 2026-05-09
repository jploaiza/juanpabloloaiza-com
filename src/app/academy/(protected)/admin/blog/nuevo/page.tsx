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

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const VALID_GEOS = new Set(["ES", "US", "MX", "CL", "ALL"]);

  const params = await searchParams;
  const rawKeyword = params.keyword ?? "";
  const rawIdea = params.idea ?? "";
  const rawGeo = params.geo ?? "ES";

  const fromTrend =
    params.from === "trend" &&
    rawKeyword.length > 0 &&
    rawKeyword.length <= 200 &&
    UUID_RE.test(rawIdea)
      ? {
          keyword: rawKeyword.replace(/[<>"'&]/g, "").slice(0, 200),
          geo: VALID_GEOS.has(rawGeo) ? rawGeo : "ES",
          ideaId: rawIdea,
        }
      : undefined;

  return (
    <main className="pt-4">
      <NuevoPostClient basePath="/academy/admin/blog" initialFromTrend={fromTrend} />
    </main>
  );
}
