/**
 * GET /api/admin/calendar/bookings?status=&from=&to=&page=&limit=
 */
import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const offset = (page - 1) * limit;

  let query = sb
    .from("bookings")
    .select("*", { count: "exact" })
    .order("date", { ascending: false })
    .order("time_slot", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ bookings: data, total: count ?? 0, page, limit });
}
