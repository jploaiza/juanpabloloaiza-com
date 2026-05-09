import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { dbErr } from "@/lib/db-error";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adminSb = await createAdminClient();
  const { data, error } = await adminSb
    .from("reminder_run_logs")
    .select("*")
    .order("run_at", { ascending: false })
    .limit(50);

  if (error) return dbErr("patients:reminder-run-logs", error);
  return NextResponse.json({ logs: data ?? [] });
}
