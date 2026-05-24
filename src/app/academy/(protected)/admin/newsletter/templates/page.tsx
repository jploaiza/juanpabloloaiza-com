import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Mail, Megaphone, UserCheck, RefreshCcw } from "lucide-react";

export const metadata: Metadata = { title: "Plantillas — Newsletter" };
export const dynamic = "force-dynamic";

const TEMPLATES = [
  {
    kind: "editorial",
    icon: Mail,
    label: "Newsletter Editorial",
    desc: "El formato principal: artículo destacado (hero con imagen grande) + 2 artículos secundarios en grid. Se genera con IA desde artículos del blog.",
    fields: ["intro (IA)", "artículo principal", "artículo secundario 1", "artículo secundario 2", "CTA final"],
  },
  {
    kind: "announcement",
    icon: Megaphone,
    label: "Anuncio / Lanzamiento",
    desc: "Para cursos, talleres, retiros, eventos o cualquier lanzamiento. CTA único y prominente con imagen hero.",
    fields: ["imagen hero", "título", "cuerpo del mensaje", "CTA"],
  },
  {
    kind: "welcome",
    icon: UserCheck,
    label: "Bienvenida automática",
    desc: "Se envía automáticamente cuando un suscriptor confirma su email. Saludo personal, párrafo de Juan Pablo y CTA suave al blog.",
    fields: ["first_name (automático)", "enlace al blog"],
    auto: true,
  },
  {
    kind: "reengagement",
    icon: RefreshCcw,
    label: "Re-engagement",
    desc: "Para suscriptores que no abren emails hace 60+ días. Tono cercano, botón 'Sigo interesado' y enlace de baja explícito.",
    fields: ["first_name (automático)", "días de inactividad (automático)", "enlace de baja"],
    auto: true,
  },
];

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      <div className="mb-8">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Newsletter</p>
        <h1 className="font-cinzel text-2xl text-white">Plantillas</h1>
        <p className="font-crimson text-sm text-gray-500 mt-2">
          Plantillas disponibles. Las automáticas (bienvenida y re-engagement) se controlan desde Automatizaciones.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {TEMPLATES.map(({ kind, icon: Icon, label, desc, fields, auto }) => (
          <div key={kind} className="relative bg-[#16213e] border border-white/5 p-6">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#C5A059]" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#C5A059]" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#C5A059]" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#C5A059]" />

            <div className="flex items-start justify-between mb-3">
              <Icon className="w-5 h-5 text-[#C5A059]" />
              {auto && (
                <span className="font-cinzel text-[8px] uppercase tracking-widest px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Automática
                </span>
              )}
            </div>
            <h3 className="font-cinzel text-sm text-white mb-2">{label}</h3>
            <p className="font-crimson text-sm text-gray-400 leading-relaxed mb-4">{desc}</p>
            <div>
              <p className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600 mb-2">Variables</p>
              <div className="flex flex-wrap gap-1.5">
                {fields.map((f) => (
                  <span key={f} className="inline-block px-2 py-0.5 bg-[#0a1628] border border-white/10 font-mono text-[10px] text-gray-500">{f}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
