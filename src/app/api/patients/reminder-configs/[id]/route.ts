import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { adminSb: null, status: 401 as const };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { adminSb: null, status: 403 as const };
  return { adminSb: await createAdminClient(), status: 200 as const };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { adminSb, status } = await requireAdmin();
  if (!adminSb) return NextResponse.json({ error: "Forbidden" }, { status });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { data, error } = await adminSb
    .from("reminder_configs")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ config: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { adminSb, status } = await requireAdmin();
  if (!adminSb) return NextResponse.json({ error: "Forbidden" }, { status });

  const { id } = await params;
  const { error } = await adminSb.from("reminder_configs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
