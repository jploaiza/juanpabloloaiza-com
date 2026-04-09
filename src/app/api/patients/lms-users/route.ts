import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// GET /api/patients/lms-users
// Returns LMS profiles not yet imported as patients
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adminSb = await createAdminClient();

  // Fetch all existing patient emails to exclude them
  const { data: existing } = await adminSb.from("patients").select("email");
  const existingEmails = new Set((existing ?? []).map((p: { email: string }) => p.email.toLowerCase()));

  // Fetch all non-admin profiles
  const { data: profiles, error } = await adminSb
    .from("profiles")
    .select("id, email, full_name, phone, created_at")
    .neq("role", "admin")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const available = (profiles ?? []).filter(
    (p: { email: string }) => !existingEmails.has(p.email?.toLowerCase())
  );

  return NextResponse.json({ users: available });
}
