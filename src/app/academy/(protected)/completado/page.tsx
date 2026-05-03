import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AcademyHeader from "@/components/academy/AcademyHeader";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import { TOTAL_LESSONS } from "@/lib/academy-data";
import { Award, Calendar, CheckCircle } from "lucide-react";

export const metadata: Metadata = { title: "¡Curso completado! — JPL Academy" };

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function CompletadoPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const [{ data: profile }, { data: progressRows }, { data: certificate }, { data: enrollment }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("lesson_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_completed", true),
      supabase
        .from("certificates")
        .select("verify_token, issued_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("enrollments")
        .select("completed_at, courses(title)")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const completedCount = progressRows?.length ?? 0;
  if (completedCount < TOTAL_LESSONS) redirect("/academy/dashboard");

  const firstName = profile?.full_name?.split(" ")[0] ?? "estudiante";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courseTitle = (enrollment?.courses as any)?.title ?? "Hipnosis Regresiva — Preparación";
  const certToken = token ?? certificate?.verify_token;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.juanpabloloaiza.com";
  const certUrl = certToken ? `${siteUrl}/academy/certificate/${certToken}` : null;

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <AcademyHeader user={profile} />

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(197,160,89,0.07),transparent)]" />

      <main className="max-w-2xl mx-auto px-4 pt-28 pb-20 flex flex-col items-center text-center">

        {/* ── Diamond icon ── */}
        <div className="relative w-20 h-20 border border-[#C5A059]/30 flex items-center justify-center mb-8">
          <ScrollworkCorners size={28} opacity={0.7} />
          <Award className="w-8 h-8 text-[#C5A059]" />
        </div>

        {/* ── Label ── */}
        <p className="font-cinzel text-[10px] uppercase tracking-[0.25em] text-[#C5A059] mb-4">
          ✦ Certificado de completación ✦
        </p>

        {/* ── Headline ── */}
        <h1 className="font-cinzel text-3xl sm:text-4xl text-white mb-3 leading-tight">
          ¡Lo lograste, {firstName}!
        </h1>
        <p className="font-crimson text-lg text-gray-400 mb-2 italic">
          "{courseTitle}"
        </p>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 my-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C5A059]/40" />
          <span className="text-[#C5A059]/60 text-xs">◆ ◇ ◆</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C5A059]/40" />
        </div>

        {/* ── Message ── */}
        <p className="font-crimson text-gray-300 text-base leading-relaxed mb-10 max-w-lg">
          Has completado todos los módulos de preparación. Ahora tienes la comprensión
          y la apertura necesarias para vivir una experiencia de regresión profunda y
          transformadora con Juan Pablo.
        </p>

        {/* ── Completion checklist ── */}
        <div className="relative w-full border border-[#C5A059]/15 bg-[#16213e] p-6 mb-8 text-left overflow-hidden">
          <ScrollworkCorners size={32} opacity={0.6} />
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-4">
            Lo que lograste
          </p>
          <div className="space-y-2">
            {[
              `${TOTAL_LESSONS} lecciones completadas`,
              "Comprensión profunda del proceso de regresión",
              "Preparación mental y emocional completa",
              "Certificado de finalización emitido",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="font-crimson text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTAs ── */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          {/* Primary: Schedule session */}
          <Link
            href="/agenda"
            className="flex-1 flex items-center justify-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-xs uppercase tracking-widest px-6 py-4 hover:bg-white transition"
          >
            <Calendar className="w-4 h-4" />
            Agendar mi sesión
          </Link>

          {/* Secondary: View certificate */}
          {certUrl && (
            <Link
              href={certUrl}
              className="flex-1 flex items-center justify-center gap-2 border border-[#C5A059]/40 text-[#C5A059] font-cinzel text-xs uppercase tracking-widest px-6 py-4 hover:bg-[#C5A059]/10 transition"
            >
              <Award className="w-4 h-4" />
              Ver certificado
            </Link>
          )}
        </div>

        {/* ── Footer link ── */}
        <Link
          href="/academy/dashboard"
          className="mt-8 font-cinzel text-[10px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition"
        >
          ← Volver al dashboard
        </Link>
      </main>
    </div>
  );
}
