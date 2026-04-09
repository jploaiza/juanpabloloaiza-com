import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import CrmDashboard from "@/components/patients/CrmDashboard";
import type { Patient } from "@/lib/patients";

export const metadata: Metadata = { title: "CRM Pacientes — JPL" };
export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  const adminSb = await createAdminClient();

  const [{ data: patients }, { data: logs }] = await Promise.all([
    adminSb.from("patients").select("*").order("created_at", { ascending: false }),
    adminSb
      .from("patient_logs")
      .select("patient_id, created_at")
      .eq("type", "session_registered")
      .order("created_at", { ascending: false }),
  ]);

  // Build map: patient_id → last session date
  const lastSessions: Record<string, string | null> = {};
  for (const log of logs ?? []) {
    if (!lastSessions[log.patient_id]) {
      lastSessions[log.patient_id] = log.created_at;
    }
  }

  return (
    <CrmDashboard
      initialPatients={(patients ?? []) as Patient[]}
      lastSessions={lastSessions}
    />
  );
}
