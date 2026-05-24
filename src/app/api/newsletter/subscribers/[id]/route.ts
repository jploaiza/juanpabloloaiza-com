import { NextRequest, NextResponse } from "next/server";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  const { id } = await params;
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  const [subResult, sendsResult] = await Promise.all([
    auth.adminSb.from("newsletter_subscribers").select("*").eq("id", id).single(),
    auth.adminSb
      .from("newsletter_sends")
      .select("id, status, sent_at, opened_at, clicked_at, campaign:newsletter_campaigns(id, name, subject)")
      .eq("subscriber_id", id)
      .order("sent_at", { ascending: false })
      .limit(20),
  ]);

  if (!subResult.data) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  return NextResponse.json({ subscriber: subResult.data, sends: sendsResult.data ?? [] });
}

export async function PUT(req: NextRequest, { params }: P) {
  const { id } = await params;
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const allowed = ["name", "apellido", "tags", "status"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await auth.adminSb
    .from("newsletter_subscribers")
    .update(updates)
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    console.error("[newsletter/subscribers PUT]", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const { id } = await params;
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  // Soft-delete: preserve audit trail (GDPR accountability)
  const { error } = await auth.adminSb
    .from("newsletter_subscribers")
    .update({
      status: "deleted",
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[newsletter/subscribers DELETE]", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
