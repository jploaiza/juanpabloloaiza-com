import { NextRequest, NextResponse } from "next/server";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  const { data: original } = await auth.adminSb
    .from("newsletter_campaigns")
    .select("name, subject, preheader, template_kind, template_data, sender_name, sender_email, segment")
    .eq("id", id)
    .single();

  if (!original) return NextResponse.json({ error: "No encontrada." }, { status: 404 });

  const { data, error } = await auth.adminSb
    .from("newsletter_campaigns")
    .insert({
      ...original,
      name: `${original.name} (copia)`,
      status: "draft",
      created_by: auth.userId,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
