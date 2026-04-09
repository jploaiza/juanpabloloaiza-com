import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { calcEndDate, type PackSize } from "@/lib/patients";

interface ImportUser {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone: string;
  pack_size: PackSize;
  start_date: string;
  reminder_day: number;
}

// POST /api/patients/import — batch import LMS users as patients
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adminSb = await createAdminClient();
  const { users } = await req.json() as { users: ImportUser[] };

  if (!users?.length) return NextResponse.json({ error: "No users provided" }, { status: 400 });

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const u of users) {
    if (!u.email?.trim() || !u.pack_size || !u.start_date) {
      skipped++;
      continue;
    }

    const end_date = calcEndDate(u.start_date, u.pack_size);

    // Support both legacy full_name and new first_name/last_name
    const rawFirst = u.first_name?.trim() || u.full_name?.trim().split(" ")[0] || u.email;
    const rawLast = u.last_name?.trim() || (u.full_name?.trim().includes(" ") ? u.full_name.trim().substring(u.full_name.trim().indexOf(" ") + 1) : "");

    const { data: patient, error: insertErr } = await adminSb.from("patients").insert({
      first_name: rawFirst,
      last_name: rawLast,
      email: u.email.trim(),
      phone: u.phone?.trim() || "",
      pack_size: u.pack_size,
      sessions_used: 0,
      start_date: u.start_date,
      end_date,
      status: "active",
      notes: null,
      reminder_day: u.reminder_day ?? 1,
    }).select("id").single();

    if (insertErr) {
      errors.push(`${u.email}: ${insertErr.message}`);
      skipped++;
      continue;
    }

    await adminSb.from("patient_logs").insert({
      patient_id: patient.id,
      type: "status_changed",
      content: `Importado desde el LMS. Pack ${u.pack_size} sesiones. Vence el ${end_date}.`,
    });

    imported++;
  }

  return NextResponse.json({ imported, skipped, errors });
}
