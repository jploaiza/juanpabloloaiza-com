/**
 * GET /api/calendar/patient-lookup?email=...
 * Returns patient name and phone if found in the DB by email.
 * Rate-limited; only exposes name + phone to minimize PII exposure.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimit, getIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getIp(req.headers);
  if (!rateLimit(`cal-lookup:${ip}`, 10, 60 * 1000)) {
    return NextResponse.json({ found: false }, { status: 429 });
  }

  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ found: false });
  }

  const sb = createAdminClient();
  const { data } = await sb
    .from("patients")
    .select("first_name, last_name, phone")
    .ilike("email", email)
    .limit(1)
    .single();

  if (!data) return NextResponse.json({ found: false });

  return NextResponse.json({
    found: true,
    name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
    phone: data.phone ?? "",
  });
}
