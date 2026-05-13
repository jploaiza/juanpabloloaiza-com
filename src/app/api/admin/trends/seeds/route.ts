import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const VALID_CATEGORIES = new Set(["spiritual", "clinical", "world"]);
type Category = "spiritual" | "clinical" | "world";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return createAdminClient();
}

// Default seeds per category — mirrors migration 013 data
const DEFAULT_SEEDS: Record<Category, string[]> = {
  spiritual: [
    "hipnosis",
    "terapia regresiva",
    "vidas pasadas",
    "liberación de entidades",
    "terapia espiritual",
    "regresión a vidas pasadas",
    "hipnosis clínica",
    "sanación espiritual",
    "ansiedad y estrés",
    "depresión espiritual",
    "trauma emocional",
    "bloqueos energéticos",
    "duelo y pérdida",
    "miedos profundos",
    "ataques de pánico",
    "autoestima",
    "despertar espiritual",
    "consciencia expandida",
    "karma y dharma",
    "registros akáshicos",
    "reencarnación",
    "alma gemela",
    "misión de vida",
    // "propósito de vida" belongs to 'world' category — removed from spiritual to avoid UNIQUE conflict
    "bienestar integral",
    "salud holística",
    "cuerpo y mente",
    "somatización emocional",
    "energía vital",
    "chakras",
    "meditación profunda",
    "mindfulness espiritual",
    "relaciones tóxicas",
    "codependencia emocional",
    "límites emocionales",
    "patrones familiares",
    "heridas de infancia",
    "sanación del niño interior",
    "transformación personal",
    "crecimiento personal",
    "medicina alternativa",
    "terapias complementarias",
    // Note: "propósito de vida" belongs to 'world' — not duplicated here
  ],
  clinical: [
    "depresión",
    "ansiedad",
    "TDAH",
    "trastorno de ansiedad",
    "terapia cognitiva conductual",
    "psicología clínica",
    "salud mental",
    "burnout",
    "estrés crónico",
    "trauma psicológico",
    "apego ansioso",
    "terapia de pareja",
    "autoestima baja",
    "duelo",
    "fobia social",
    "crisis de pánico",
    "insomnio",
    "trastorno bipolar",
    "EMDR terapia",
    "psiquiatría",
    "TOC trastorno obsesivo",
    "antidepresivos y terapia",
    "terapia psicológica online",
    "mindfulness terapéutico",
  ],
  world: [
    "soledad moderna",
    "crisis existencial",
    "redes sociales y ansiedad",
    "inteligencia artificial y bienestar",
    "propósito de vida",
    "crisis de identidad",
    "ansiedad climática",
    "pandemia salud mental",
    "trabajo remoto y bienestar",
    "desconexión digital",
    "crisis económica y salud mental",
    "migración y duelo",
    "masculinidad y emociones",
    "feminismo y salud mental",
    "espiritualidad sin religión",
  ],
};

// GET /api/admin/trends/seeds
// Returns seeds grouped by category: { seeds: { spiritual: Seed[], clinical: Seed[], world: Seed[] } }
export async function GET() {
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await adminSb
    .from("trends_seeds")
    .select("id,keyword,active,category,created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const grouped: Record<Category, typeof data> = { spiritual: [], clinical: [], world: [] };
  for (const seed of data ?? []) {
    const cat = (seed.category ?? "spiritual") as Category;
    if (grouped[cat]) {
      grouped[cat]!.push(seed);
    } else {
      grouped.spiritual!.push(seed);
    }
  }

  return NextResponse.json({ seeds: grouped });
}

// POST /api/admin/trends/seeds
//   Body { keyword, category? }  → upsert seed with category
//   ?action=restore&category=spiritual|clinical|world|all  → re-insert defaults for that category
export async function POST(req: NextRequest) {
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // --- Restore defaults ---
  if (action === "restore") {
    const rawCat = searchParams.get("category") ?? "all";
    const categoriesToRestore: Category[] =
      rawCat === "all"
        ? ["spiritual", "clinical", "world"]
        : VALID_CATEGORIES.has(rawCat)
        ? [rawCat as Category]
        : null!;

    if (!categoriesToRestore) {
      return NextResponse.json({ error: "Invalid category. Must be spiritual, clinical, world, or all" }, { status: 400 });
    }

    const rows: { keyword: string; active: boolean; category: Category }[] = [];
    for (const cat of categoriesToRestore) {
      for (const kw of DEFAULT_SEEDS[cat]) {
        rows.push({ keyword: kw, active: true, category: cat });
      }
    }

    const { error } = await adminSb
      .from("trends_seeds")
      .upsert(rows, { onConflict: "keyword", ignoreDuplicates: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, restored: rows.length });
  }

  // --- Upsert single seed ---
  const body = await req.json().catch(() => ({}));
  const keyword = typeof body.keyword === "string" ? body.keyword.trim().toLowerCase() : "";
  if (!keyword || keyword.length < 2 || keyword.length > 100) {
    return NextResponse.json({ error: "keyword must be 2–100 chars" }, { status: 400 });
  }

  const rawCategory = typeof body.category === "string" ? body.category.trim() : "spiritual";
  if (!VALID_CATEGORIES.has(rawCategory)) {
    return NextResponse.json({ error: "category must be one of: spiritual, clinical, world" }, { status: 400 });
  }
  const category = rawCategory as Category;

  const { data, error } = await adminSb
    .from("trends_seeds")
    .upsert({ keyword, active: true, category }, { onConflict: "keyword", ignoreDuplicates: false })
    .select("id,keyword,active,category,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ seed: data }, { status: 201 });
}

// DELETE /api/admin/trends/seeds?action=clear&category=spiritual|clinical|world|all
export async function DELETE(req: NextRequest) {
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  if (action !== "clear") {
    return NextResponse.json({ error: "action must be 'clear'" }, { status: 400 });
  }

  const rawCat = searchParams.get("category") ?? "all";

  if (rawCat === "all") {
    const { error } = await adminSb.from("trends_seeds").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, deleted: "all" });
  }

  if (!VALID_CATEGORIES.has(rawCat)) {
    return NextResponse.json({ error: "category must be one of: spiritual, clinical, world, or all" }, { status: 400 });
  }

  const { error } = await adminSb
    .from("trends_seeds")
    .delete()
    .eq("category", rawCat);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: rawCat });
}
