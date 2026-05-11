import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return createAdminClient();
}

// GET /api/admin/trends/saved?type=trend|angle|all
export async function GET(req: NextRequest) {
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const rawType = searchParams.get("type") ?? "all";

  let q = adminSb
    .from("saved_content_items")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (rawType === "trend" || rawType === "angle") q = q.eq("type", rawType);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

// POST /api/admin/trends/saved
// Body: { type: 'trend'|'angle', keyword, geo, title, data? }
export async function POST(req: NextRequest) {
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const type = body.type === "trend" || body.type === "angle" ? body.type : null;
  const keyword = typeof body.keyword === "string" ? body.keyword.trim().slice(0, 200) : "";
  const geo = typeof body.geo === "string" ? body.geo.toUpperCase().slice(0, 10) : "ES";
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 300) : keyword;
  const data = body.data ?? null;

  if (!type || !keyword) return NextResponse.json({ error: "type and keyword required" }, { status: 400 });

  const { data: row, error } = await adminSb
    .from("saved_content_items")
    .insert({ type, keyword, geo, title, data, status: "pending" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: row }, { status: 201 });
}
