import type { Metadata } from "next";
import FormularioContent from "./FormularioContent";
import FormRenderer from "@/components/forms/FormRenderer";
import { createClient } from "@/lib/supabase/server";
import type { FormRow } from "@/lib/forms/types";

export const metadata: Metadata = {
  title: "Formulario de Admisión — Juan Pablo Loaiza",
  robots: { index: false, follow: false },
};

export default async function FormularioPage() {
  // Cut-over automático: si existe un formulario nativo publicado y marcado
  // como admisión, se renderiza ese. Si no, cae al embed de JotForm (fallback).
  const sb = await createClient();
  const { data } = await sb
    .from("forms")
    .select("*")
    .eq("is_admission", true)
    .eq("status", "published")
    .maybeSingle();

  const form = data as FormRow | null;
  if (form) {
    return (
      <FormRenderer
        slug={form.slug}
        title={form.title}
        description={form.description}
        schema={form.schema}
        settings={form.settings ?? {}}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY}
      />
    );
  }

  return <FormularioContent />;
}
