import { NextRequest, NextResponse } from "next/server";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DELETE_BATCH = 100;

function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length <= 50;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  if (!validateSlug(slug)) {
    return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  }

  const body = await req.json();
  const rawIds: unknown[] = Array.isArray(body.subscriber_ids) ? body.subscriber_ids : [];
  const action = body.action === "remove" ? "remove" : "add";

  if (rawIds.length === 0) {
    return NextResponse.json({ error: "Se requiere al menos un suscriptor." }, { status: 400 });
  }
  if (rawIds.length > 500) {
    return NextResponse.json({ error: "Máximo 500 suscriptores por operación." }, { status: 400 });
  }

  // Validate every id is a proper UUID — no injection via raw strings
  const subscriberIds = rawIds.map(String);
  if (!subscriberIds.every((id) => UUID_RE.test(id))) {
    return NextResponse.json({ error: "Formato de ID inválido." }, { status: 400 });
  }

  const tag = `lista:${slug}`;

  const { data: subs, error } = await auth.adminSb
    .from("newsletter_subscribers")
    .select("id, tags")
    .in("id", subscriberIds)
    .neq("status", "deleted");

  if (error) {
    console.error("[newsletter/lists subscribers POST]", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }

  let affected = 0;
  await Promise.all(
    (subs ?? []).map(async (sub) => {
      const current = (sub.tags as string[]) ?? [];
      const updated =
        action === "add"
          ? current.includes(tag) ? current : [...current, tag]
          : current.filter((t) => t !== tag);

      if (updated.length === current.length && updated.every((t, i) => t === current[i])) return;
      affected++;
      await auth.adminSb
        .from("newsletter_subscribers")
        .update({ tags: updated })
        .eq("id", sub.id);
    })
  );

  return NextResponse.json({ ok: true, affected });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  if (!validateSlug(slug)) {
    return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  }

  const tag = `lista:${slug}`;
  let affected = 0;
  let cursor = 0;

  // Process in bounded batches to avoid connection pool exhaustion on large lists
  while (true) {
    const { data: batch } = await auth.adminSb
      .from("newsletter_subscribers")
      .select("id, tags")
      .contains("tags", [tag])
      .neq("status", "deleted")
      .range(cursor, cursor + DELETE_BATCH - 1);

    if (!batch?.length) break;

    for (const sub of batch) {
      await auth.adminSb
        .from("newsletter_subscribers")
        .update({ tags: ((sub.tags as string[]) ?? []).filter((t) => t !== tag) })
        .eq("id", sub.id);
      affected++;
    }

    if (batch.length < DELETE_BATCH) break;
    cursor += DELETE_BATCH;
  }

  return NextResponse.json({ ok: true, affected });
}
