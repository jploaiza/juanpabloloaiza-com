import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FormRenderer from "@/components/forms/FormRenderer";
import type { FormRow } from "@/lib/forms/types";

async function getForm(slug: string): Promise<FormRow | null> {
  const sb = await createClient();
  const { data } = await sb.from("forms").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  return (data as FormRow) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const form = await getForm(slug);
  return {
    title: form ? `${form.title} — Juan Pablo Loaiza` : "Formulario",
    robots: { index: false, follow: false },
  };
}

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await getForm(slug);
  if (!form) notFound();

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
