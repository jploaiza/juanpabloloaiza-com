import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import TrackedLink from "@/components/TrackedLink";
import { createAdminClient } from "@/lib/supabase/server";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import { Award, Calendar, CheckCircle, ExternalLink } from "lucide-react";

export const metadata: Metadata = { title: "Certificado de Completación — JPL Academy" };

interface Props {
  params: Promise<{ token: string }>;
}

export default async function CertificatePage({ params }: Props) {
  const { token } = await params;
  const adminSb = createAdminClient();

  const { data: cert } = await adminSb
    .from("certificates")
    .select("issued_at, pdf_url, user_id, course_id")
    .eq("verify_token", token)
    .maybeSingle();

  if (!cert) notFound();

  const [{ data: profile }, { data: course }] = await Promise.all([
    adminSb.from("profiles").select("full_name").eq("id", cert.user_id).maybeSingle(),
    adminSb.from("courses").select("title").eq("id", cert.course_id).maybeSingle(),
  ]);

  const studentName = profile?.full_name ?? "Estudiante";
  const courseTitle = course?.title ?? "Curso JPL Academy";
  const issuedAt = cert.issued_at
    ? new Date(cert.issued_at).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://juanpabloloaiza.com";
  const verifyUrl = `${siteUrl}/academy/certificate/${token}`;

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(197,160,89,0.07),transparent)]" />

      <main className="max-w-2xl mx-auto px-4 pt-16 pb-20 flex flex-col items-center text-center">

        {/* Logo */}
        <Link href={siteUrl} className="mb-12 opacity-70 hover:opacity-100 transition">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png"
            alt="Juan Pablo Loaiza"
            className="h-10 w-auto"
          />
        </Link>

        {/* Diamond icon */}
        <div className="relative w-20 h-20 border border-[#C5A059]/30 flex items-center justify-center mb-8">
          <ScrollworkCorners size={28} opacity={0.7} />
          <Award className="w-8 h-8 text-[#C5A059]" />
        </div>

        {/* Label */}
        <p className="font-cinzel text-[10px] uppercase tracking-[0.25em] text-[#C5A059] mb-4">
          ✦ Certificado de Completación ✦
        </p>

        {/* Main certificate card */}
        <div className="relative w-full border border-[#C5A059]/30 bg-[#16213e] p-8 mb-8 overflow-hidden">
          <ScrollworkCorners size={40} opacity={0.5} />

          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/60 mb-6">
            JPL Academy certifica que
          </p>

          <h1 className="font-cinzel text-3xl sm:text-4xl text-white mb-4 leading-tight">
            {studentName}
          </h1>

          <p className="font-crimson text-gray-400 text-base mb-6">
            ha completado satisfactoriamente el curso
          </p>

          <p className="font-cinzel text-lg text-[#C5A059] mb-6 italic leading-snug">
            &ldquo;{courseTitle}&rdquo;
          </p>

          <div className="flex items-center gap-3 justify-center my-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#C5A059]/40" />
            <span className="text-[#C5A059]/60 text-xs">◆ ◇ ◆</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#C5A059]/40" />
          </div>

          {/* Checklist */}
          <div className="text-left space-y-2 mb-6">
            {[
              "Todos los módulos completados",
              "Comprensión profunda del proceso de regresión",
              "Preparación mental y emocional completa",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="font-crimson text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>

          {/* Signature area */}
          <div className="border-t border-[#C5A059]/15 pt-6 flex flex-col items-center gap-1">
            <p className="font-cinzel text-white text-sm">Juan Pablo Loaiza</p>
            <p className="font-crimson text-gray-500 text-xs italic">Terapeuta Holístico · TRVP</p>
            {issuedAt && (
              <p className="font-crimson text-gray-600 text-xs mt-1">Emitido el {issuedAt}</p>
            )}
          </div>
        </div>

        {/* Verification badge */}
        <div className="w-full flex items-center gap-3 border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 mb-8">
          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <div className="text-left">
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-emerald-500">
              Certificado verificado
            </p>
            <p className="font-crimson text-xs text-gray-500 mt-0.5 break-all">{verifyUrl}</p>
          </div>
        </div>

        {/* PDF download */}
        {cert.pdf_url && (
          <a
            href={cert.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 border border-[#C5A059]/40 text-[#C5A059] font-cinzel text-xs uppercase tracking-widest px-6 py-4 hover:bg-[#C5A059]/10 transition mb-4"
          >
            <ExternalLink className="w-4 h-4" />
            Descargar PDF
          </a>
        )}

        {/* CTA */}
        <TrackedLink
          href={`${siteUrl}/agenda`}
          className="w-full flex items-center justify-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-xs uppercase tracking-widest px-6 py-4 hover:bg-white transition"
          trackingEvent={{ name: "agendar_click", props: { source: "certificate" } }}
        >
          <Calendar className="w-4 h-4" />
          Agendar sesión con Juan Pablo
        </TrackedLink>

        <Link
          href={`${siteUrl}/academy`}
          className="mt-8 font-cinzel text-[10px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition"
        >
          ← JPL Academy
        </Link>
      </main>
    </div>
  );
}
