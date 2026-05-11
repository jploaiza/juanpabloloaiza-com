import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import KeywordIdeasPanel from "@/components/admin/KeywordIdeasPanel";
import type { Angle } from "@/app/api/admin/ai/term-ideas/route";

export const metadata: Metadata = { title: "Ideas de contenido — Admin" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TermPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; geo?: string; savedItem?: string }>;
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

  const rawSavedItem = params.savedItem ?? "";
  let initialAngle: Angle | null = null;

  if (UUID_RE.test(rawSavedItem)) {
    const adminSb = await createAdminClient();
    const { data: savedItem } = await adminSb
      .from("saved_content_items")
      .select("type,data")
      .eq("id", rawSavedItem)
      .single();

    if (savedItem?.type === "angle" && savedItem.data) {
      initialAngle = savedItem.data as Angle;
      await adminSb
        .from("saved_content_items")
        .update({ status: "developing" })
        .eq("id", rawSavedItem);
    }
  }

  return <KeywordIdeasPanel keyword={keyword} geo={geo} initialAngle={initialAngle} />;
}
