import { createAdminClient } from "@/lib/supabase/server";

const FALLBACK_SEEDS = [
  "hipnosis",
  "terapia regresiva",
  "vidas pasadas",
  "liberación de entidades",
  "terapia espiritual",
  "regresión a vidas pasadas",
  "hipnosis clínica",
  "sanación espiritual",
];

export async function getActiveSeeds(): Promise<string[]> {
  try {
    const adminSb = createAdminClient();
    const { data } = await adminSb
      .from("trends_seeds")
      .select("keyword")
      .eq("active", true)
      .order("created_at", { ascending: true });
    if (data && data.length > 0) return data.map((r) => r.keyword);
  } catch {
    // ignore
  }
  return FALLBACK_SEEDS;
}
