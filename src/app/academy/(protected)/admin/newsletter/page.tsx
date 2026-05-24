import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AcademyCard from "@/components/academy/AcademyCard";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import { Mail, Users } from "lucide-react";

export const metadata: Metadata = { title: "Newsletter — Admin" };
export const dynamic = "force-dynamic";

type Subscriber = {
  id: string;
  name: string;
  apellido: string;
  email: string;
  created_at: string;
};

export default async function NewsletterAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  const adminSb = await createAdminClient();
  const { data: subscribers } = await adminSb
    .from("newsletter_subscribers")
    .select("id, name, apellido, email, created_at")
    .order("created_at", { ascending: false });

  const all = (subscribers ?? []) as Subscriber[];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCount = all.filter((s) => new Date(s.created_at) > thirtyDaysAgo).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-20">
      <div className="mb-8">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">
          Administración
        </p>
        <h1 className="font-cinzel text-2xl text-white">Newsletter</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: "Total suscriptores", value: all.length, icon: Users },
          { label: "Últimos 30 días", value: recentCount, accent: "text-emerald-400" },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="relative bg-[#16213e] border border-white/5 p-5 overflow-hidden">
            <ScrollworkCorners size={36} opacity={0.7} />
            {Icon && <Icon className="w-4 h-4 text-[#C5A059] mb-3" />}
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
            <p className={`font-cinzel text-2xl ${accent ?? "text-white"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Subscribers table */}
      <AcademyCard>
        <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-6">
          Suscriptores
          <span className="ml-3 font-crimson text-xs text-gray-500 normal-case">{all.length} registros</span>
        </h2>

        {all.length === 0 ? (
          <div className="text-center py-16">
            <Mail className="w-10 h-10 text-[#C5A059]/20 mx-auto mb-4" />
            <p className="font-cinzel text-sm text-gray-600">No hay suscriptores aún</p>
            <p className="font-crimson text-sm text-gray-700 mt-2">
              Los formularios de newsletter en los artículos aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Nombre", "Apellido", "Email", "Fecha"].map((h) => (
                    <th key={h} className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4 last:pr-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {all.map((s) => (
                  <tr key={s.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                    <td className="py-3 pr-4">
                      <span className="font-crimson text-sm text-gray-200">{s.name}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-crimson text-sm text-gray-200">{s.apellido}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <a href={`mailto:${s.email}`} className="font-crimson text-sm text-[#C5A059]/70 hover:text-[#C5A059] transition">
                        {s.email}
                      </a>
                    </td>
                    <td className="py-3">
                      <span className="font-crimson text-xs text-gray-500 whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AcademyCard>
    </div>
  );
}
