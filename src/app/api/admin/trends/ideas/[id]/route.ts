import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return createAdminClient();
}

// PATCH /api/admin/trends/ideas/[id]
// Body: { status?: string, blog_post_id?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid idea id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  const update: Record<string, unknown> = {};
  if (body.status && ["new", "drafting", "published", "rejected"].includes(body.status)) {
    update.status = body.status;
  }
  if (body.blog_post_id) {
    if (!UUID_RE.test(String(body.blog_post_id))) {
      return NextResponse.json({ error: "Invalid blog_post_id" }, { status: 400 });
    }
    update.blog_post_id = body.blog_post_id;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await adminSb
    .from("content_ideas")
    .update(update)
    .eq("id", id);

  if (error) {
    console.error("[trends/ideas PATCH]", error.message);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
