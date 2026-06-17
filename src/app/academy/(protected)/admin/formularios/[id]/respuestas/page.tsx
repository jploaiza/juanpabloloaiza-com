import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ChevronLeft, Inbox } from "lucide-react";
import { answersToRows } from "@/lib/forms/format";
import type { FormSchema, Answers } from "@/lib/forms/types";

interface SubmissionRow {
  id: string;
  form_schema_snapshot: FormSchema;
  answers: Answers;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  notify_status: Record<string, string>;
  created_at: string;
}

export default async function RespuestasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  const sb = createAdminClient();
  const { data: form } = await sb.from("forms").select("id, title").eq("id", id).maybeSingle();
  if (!form) notFound();

  const { data: subs } = await sb
    .from("form_submissions")
    .select("id, form_schema_snapshot, answers, email, full_name, phone, notify_status, created_at")
    .eq("form_id", id)
    .order("created_at", { ascending: false });

  const submissions = (subs ?? []) as SubmissionRow[];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 lg:pl-56">
      <Link href="/academy/admin/formularios" className="inline-flex items-center gap-1 font-cinzel text-[10px] uppercase tracking-widest text-gray-400 hover:text-[#C5A059] transition mb-6">
        <ChevronLeft className="w-4 h-4" /> Formularios
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <Inbox className="w-5 h-5 text-[#C5A059]" />
        <h1 className="font-cinzel text-2xl text-white">Respuestas</h1>
      </div>
      <p className="font-crimson text-sm text-gray-500 mb-8">{form.title} · {submissions.length} respuesta{submissions.length === 1 ? "" : "s"}</p>

      {submissions.length === 0 ? (
        <div className="text-center py-20 border border-white/5 bg-[#16213e]">
          <p className="font-crimson text-lg text-gray-400">Aún no hay respuestas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => {
            const rows = answersToRows(s.form_schema_snapshot, s.answers);
            const when = new Date(s.created_at).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
            return (
              <details key={s.id} className="bg-[#16213e] border border-white/5 group">
                <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none">
                  <div className="flex-1 min-w-0">
                    <p className="font-crimson text-sm text-white truncate">{s.full_name || s.email || "Respuesta anónima"}</p>
                    <p className="font-crimson text-xs text-gray-500">{when}{s.email ? ` · ${s.email}` : ""}</p>
                  </div>
                  <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 group-open:text-[#C5A059]">Ver</span>
                </summary>
                <div className="border-t border-white/5 px-5 py-4 space-y-3">
                  {rows.map((r, i) => (
                    <div key={i}>
                      <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-0.5">{r.label}</p>
                      <p className="font-crimson text-sm text-gray-200 whitespace-pre-wrap">{r.value}</p>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
