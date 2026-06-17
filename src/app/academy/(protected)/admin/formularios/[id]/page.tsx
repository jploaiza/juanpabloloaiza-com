import { redirect, notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import FormBuilder from "@/components/admin/forms/FormBuilder";
import type { FormRow } from "@/lib/forms/types";

export default async function EditarFormularioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  const sb = createAdminClient();
  const { data: form } = await sb.from("forms").select("*").eq("id", id).maybeSingle();
  if (!form || form.status === "deleted") notFound();

  return <FormBuilder initial={form as FormRow} />;
}
