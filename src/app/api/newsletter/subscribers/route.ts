import { NextRequest, NextResponse } from "next/server";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const tag = url.searchParams.get("tag");
  const search = url.searchParams.get("q");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = 50;
  const offset = (page - 1) * limit;

  let query = auth.adminSb
    .from("newsletter_subscribers")
    .select("id, name, apellido, email, status, tags, source, confirmed_at, created_at, last_engaged_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (tag) query = query.contains("tags", [tag]);
  if (search) query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,apellido.ilike.%${search}%`);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subscribers: data ?? [], total: count ?? 0, page, limit });
}
