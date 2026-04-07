import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const PACK_DAYS: Record<number, number> = {
  1: 30,
  3: 90,
  5: 150,
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminSb = await createAdminClient();
  const { data: profile } = await adminSb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const { data: activePacks } = await adminSb
    .from("patient_packs")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true);

  return NextResponse.json({ hasActivePack: (activePacks?.length ?? 0) > 0 });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminSb = await createAdminClient();
  const { data: profile } = await adminSb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    userId: string;
    packType: number;
    startDate: string;
    pricePaid?: number | null;
    notes?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, packType, startDate, pricePaid, notes } = body;

  if (!userId || !packType || !startDate) {
    return NextResponse.json({ error: "userId, packType, startDate are required" }, { status: 400 });
  }

  if (![1, 3, 5].includes(packType)) {
    return NextResponse.json({ error: "packType must be 1, 3, or 5" }, { status: 400 });
  }

  const days = PACK_DAYS[packType];
  const start = new Date(startDate);
  const end = addDays(start, days);

  const { data: newPack, error: insertError } = await adminSb
    .from("patient_packs")
    .insert({
      user_id: userId,
      pack_type: packType,
      sessions_total: packType,
      sessions_used: 0,
      start_date: start.toISOString().split("T")[0],
      end_date: end.toISOString().split("T")[0],
      price_paid: pricePaid ?? null,
      notes: notes ?? null,
      is_active: true,
      reminders_enabled: true,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Pack insert error:", insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Update patient status to active
  await adminSb
    .from("profiles")
    .update({ patient_status: "active" })
    .eq("id", userId);

  return NextResponse.json(newPack, { status: 201 });
}
