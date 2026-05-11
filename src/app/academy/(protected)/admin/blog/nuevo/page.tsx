import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import NuevoPostClient from "@/app/admin/blog/nuevo/NuevoPostClient";

export const metadata: Metadata = { title: "Nuevo Post — JPL Academy" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_GEOS = new Set(["ES", "US", "MX", "CL", "ALL"]);

function sanitize(s: string, max: number) {
  return s.replace(/[<>"'&]/g, "").slice(0, max);
}

export default async function AcademyNuevoPostPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string; keyword?: string; geo?: string; idea?: string;
    prefillTitle?: string; prefillExcerpt?: string; prefillContent?: string;
    prefillTags?: string; prefillSeoTitle?: string; prefillSeoDesc?: string;
  }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  const params = await searchParams;
  const rawKeyword = params.keyword ?? "";
  const rawIdea = params.idea ?? "";
  const rawGeo = params.geo ?? "ES";

  const hasPrefill = rawKeyword.length > 0 && rawKeyword.length <= 200 && params.from === "trend";
  const fromTrend = hasPrefill
    ? {
        keyword: sanitize(rawKeyword, 200),
        geo: VALID_GEOS.has(rawGeo) ? rawGeo : "ES",
        ideaId: UUID_RE.test(rawIdea) ? rawIdea : undefined,
        prefillTitle: params.prefillTitle ? sanitize(params.prefillTitle, 200) : undefined,
        prefillExcerpt: params.prefillExcerpt ? sanitize(params.prefillExcerpt, 400) : undefined,
        prefillContent: params.prefillContent ? params.prefillContent.slice(0, 60000) : undefined,
        prefillTags: params.prefillTags ? sanitize(params.prefillTags, 500) : undefined,
        prefillSeoTitle: params.prefillSeoTitle ? sanitize(params.prefillSeoTitle, 80) : undefined,
        prefillSeoDesc: params.prefillSeoDesc ? sanitize(params.prefillSeoDesc, 200) : undefined,
      }
    : undefined;

  return (
    <main className="pt-4">
      <NuevoPostClient basePath="/academy/admin/blog" initialFromTrend={fromTrend} />
    </main>
  );
}
