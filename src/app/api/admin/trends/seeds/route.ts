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

// GET /api/admin/trends/seeds
export async function GET() {
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await adminSb
    .from("trends_seeds")
    .select("id,keyword,active,created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ seeds: data ?? [] });
}

// POST /api/admin/trends/seeds  { keyword: string }
export async function POST(req: NextRequest) {
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const keyword = typeof body.keyword === "string" ? body.keyword.trim().toLowerCase() : "";
  if (!keyword || keyword.length < 2 || keyword.length > 100) {
    return NextResponse.json({ error: "keyword must be 2–100 chars" }, { status: 400 });
  }

  const { data, error } = await adminSb
    .from("trends_seeds")
    .upsert({ keyword, active: true }, { onConflict: "keyword", ignoreDuplicates: false })
    .select("id,keyword,active,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ seed: data }, { status: 201 });
}
