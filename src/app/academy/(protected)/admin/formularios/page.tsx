import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { FileText, Plus, Pencil, Inbox, Star } from "lucide-react";

export const metadata: Metadata = { title: "Formularios — JPL Academy" };

function StatusBadge({ status }: { status: string }) {
  if (status === "published")
    return <span className="inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Publicado</span>;
  return <span className="inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest bg-white/5 text-gray-500 border border-white/10">Borrador</span>;
}

export default async function FormulariosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  const sb = createAdminClient();
  const { data: forms } = await sb
    .from("forms")
    .select("id, slug, title, status, is_admission, updated_at")
    .neq("status", "deleted")
    .order("updated_at", { ascending: false });

  // Conteo de respuestas
  const ids = (forms ?? []).map((f) => f.id);
  const counts: Record<string, number> = {};
  if (ids.length) {
    const { data: subs } = await sb.from("form_submissions").select("form_id").in("form_id", ids);
    for (const s of subs ?? []) counts[s.form_id] = (counts[s.form_id] ?? 0) + 1;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:pl-56">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-[#C5A059]" />
          <h1 className="font-cinzel text-2xl text-white">Formularios</h1>
        </div>
        <Link
          href="/academy/admin/formularios/nuevo"
          className="inline-flex items-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-xs uppercase tracking-widest px-5 py-2.5 hover:bg-[#d4b06a] transition"
        >
          <Plus className="w-4 h-4" /> Nuevo
        </Link>
      </div>

      {(forms ?? []).length === 0 ? (
        <div className="text-center py-20 border border-white/5 bg-[#16213e]">
          <Inbox className="w-8 h-8 text-gray-600 mx-auto mb-4" />
          <p className="font-crimson text-lg text-gray-400">Aún no hay formularios.</p>
          <p className="font-crimson text-sm text-gray-500 mt-1">Crea el primero con el botón “Nuevo”.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(forms ?? []).map((f) => (
            <div key={f.id} className="flex items-center gap-4 bg-[#16213e] border border-white/5 hover:border-[#C5A059]/30 transition px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/academy/admin/formularios/${f.id}`} className="font-cinzel text-base text-white hover:text-[#C5A059] transition truncate">
                    {f.title}
                  </Link>
                  {f.is_admission && <Star className="w-3.5 h-3.5 text-[#C5A059]" aria-label="Formulario de admisión" />}
                  <StatusBadge status={f.status} />
                </div>
                <p className="font-crimson text-xs text-gray-500">
                  /f/{f.slug} · {counts[f.id] ?? 0} respuesta{(counts[f.id] ?? 0) === 1 ? "" : "s"}
                </p>
              </div>
              <Link href={`/academy/admin/formularios/${f.id}/respuestas`} className="font-cinzel text-[10px] uppercase tracking-widest text-gray-400 hover:text-[#C5A059] transition flex items-center gap-1">
                <Inbox className="w-3.5 h-3.5" /> Respuestas
              </Link>
              <Link href={`/academy/admin/formularios/${f.id}`} className="font-cinzel text-[10px] uppercase tracking-widest text-gray-400 hover:text-[#C5A059] transition flex items-center gap-1">
                <Pencil className="w-3.5 h-3.5" /> Editar
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
