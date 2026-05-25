import { NextRequest, NextResponse } from "next/server";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";

export const dynamic = "force-dynamic";

const PRESET_LISTS = [
  { slug: "semanal", label: "Semanal", description: "Reciben correos semanalmente" },
  { slug: "mensual", label: "Mensual", description: "Reciben correos mensualmente" },
  { slug: "trimestral", label: "Trimestral", description: "Reciben correos trimestralmente" },
];

export async function GET(_req: NextRequest) {
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  // Discover all lista: tags from existing subscribers
  const { data: tagsData } = await auth.adminSb
    .from("newsletter_subscribers")
    .select("tags")
    .not("tags", "is", null)
    .neq("status", "deleted");

  const discovered = new Set<string>();
  for (const row of tagsData ?? []) {
    for (const tag of (row.tags as string[]) ?? []) {
      if (tag.startsWith("lista:")) discovered.add(tag.slice(6));
    }
  }

  const presetSlugs = new Set(PRESET_LISTS.map((l) => l.slug));
  const customSlugs = [...discovered].filter((s) => !presetSlugs.has(s));
  const allSlugs = [...PRESET_LISTS.map((l) => l.slug), ...customSlugs];

  const lists = await Promise.all(
    allSlugs.map(async (slug) => {
      const preset = PRESET_LISTS.find((p) => p.slug === slug);
      const { count } = await auth.adminSb
        .from("newsletter_subscribers")
        .select("*", { count: "exact", head: true })
        .contains("tags", [`lista:${slug}`])
        .eq("status", "confirmed");
      return {
        slug,
        label: preset?.label ?? slug,
        description: preset?.description ?? null,
        preset: presetSlugs.has(slug),
        count: count ?? 0,
      };
    })
  );

  return NextResponse.json({ lists });
}

export async function POST(req: NextRequest) {
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const slug = String(body.slug ?? "").trim().toLowerCase();
  const label = String(body.label ?? slug).trim().slice(0, 80) || slug;

  if (!slug || !/^[a-z0-9-]+$/.test(slug) || slug.length > 50) {
    return NextResponse.json(
      { error: "Identificador inválido (solo letras minúsculas, números y guiones, máx 50 caracteres)." },
      { status: 400 }
    );
  }

  // Reject preset slugs
  const presetSlugs = new Set(PRESET_LISTS.map((l) => l.slug));
  if (presetSlugs.has(slug)) {
    return NextResponse.json({ error: "Ese identificador está reservado para una lista predefinida." }, { status: 409 });
  }

  // Check if already has subscribers
  const { count } = await auth.adminSb
    .from("newsletter_subscribers")
    .select("*", { count: "exact", head: true })
    .contains("tags", [`lista:${slug}`]);

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "Ya existe una lista con ese identificador." }, { status: 409 });
  }

  return NextResponse.json({ slug, label, count: 0 });
}
