import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AcademyHeader from "@/components/academy/AcademyHeader";
import PatientDetail from "@/components/patients/PatientDetail";
import type { Patient, PatientLog } from "@/lib/patients";
import type { Profile } from "@/types/academy";

export const metadata: Metadata = { title: "Paciente — JPL CRM" };
export const dynamic = "force-dynamic";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  const adminSb = await createAdminClient();

  const [{ data: patient }, { data: logs }] = await Promise.all([
    adminSb.from("patients").select("*").eq("id", id).maybeSingle(),
    adminSb
      .from("patient_logs")
      .select("*")
      .eq("patient_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!patient) notFound();

  return (
    <div className="min-h-screen bg-[#020617]">
      <AcademyHeader user={profile as Profile} />
      <PatientDetail
        patient={patient as Patient}
        logs={(logs ?? []) as PatientLog[]}
      />
    </div>
  );
}
