import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Clock, PlayCircle, ChevronDown, Star } from "lucide-react";
import AcademyHeader from "@/components/academy/AcademyHeader";
import { COURSE_SECTIONS, COURSE_META, TOTAL_LESSONS, formatDuration } from "@/lib/academy-data";
import AcademyLandingClient from "./LandingClient";

export const metadata: Metadata = {
  title: "Curso Gratuito — Preparación para tu Regresión a Vidas Pasadas",
  description: "Aprende sobre hipnosis terapéutica y regresión a vidas pasadas. Curso gratuito de preparación para pacientes de Juan Pablo Loaiza.",
  openGraph: {
    title: "Curso Gratuito — Preparación para tu Regresión | JPL Academy",
    description: "28 lecciones gratuitas para que llegues preparado a tu sesión de regresión.",
    images: [{ url: "https://media.juanpabloloaiza.com/images/jpl-newwsp.jpeg", width: 1200, height: 630 }],
  },
};

const WHAT_YOU_LEARN = [
  "Qué es la hipnosis y cómo funciona realmente",
  "Cómo preparar tu mente para una regresión profunda",
  "Entidades espirituales: qué son y cómo se liberan",
  "El rol del paciente durante una sesión de regresión",
  "Por qué confiar en las imágenes que recibes",
  "Cómo distinguir recuerdo de imaginación en la hipnosis",
  "Qué es la Telepatía y la función del Guía Espiritual",
  "Qué esperar antes, durante y después de tu sesión",
];

const totalSeconds = COURSE_SECTIONS.flatMap((s) => s.lessons).reduce((a, l) => a + l.duration_seconds, 0);
const totalMinutes = Math.round(totalSeconds / 60);

export default function AcademyLandingPage() {
  return (
    <div className="min-h-screen bg-[#020617]">
      <AcademyHeader />

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(197,160,89,0.08),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_80%_50%,rgba(49,46,129,0.12),transparent)]" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/30 px-3 py-1.5 mb-6">
              Curso Gratuito · {TOTAL_LESSONS} Lecciones
            </span>
            <h1 className="font-cinzel text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-6">
              Preparación para tu<br />
              <span className="text-[#C5A059]">Regresión a Vidas Pasadas</span>
            </h1>
            <p className="font-crimson text-lg text-gray-300 leading-relaxed mb-8 max-w-lg">
              Antes de tu primera sesión, es fundamental que comprendas cómo funciona la hipnosis, qué esperar de una regresión y cómo preparar tu mente para recibir la experiencia. Este curso es ese puente.
            </p>

            <div className="flex flex-wrap gap-6 mb-10 text-sm">
              {[
                { icon: PlayCircle, label: `${TOTAL_LESSONS} lecciones` },
                { icon: Clock, label: `${totalMinutes} minutos` },
                { icon: Star, label: "100% gratuito" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-gray-400 font-crimson">
                  <Icon className="w-4 h-4 text-[#C5A059]" />
                  {label}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/academy/register"
                className="inline-flex items-center justify-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-xs uppercase tracking-widest px-8 py-4 hover:bg-[#d4b06a] transition shadow-[0_0_30px_rgba(197,160,89,0.25)]"
              >
                Inscribirme gratis
              </Link>
              <Link
                href="/academy/login"
                className="inline-flex items-center justify-center font-cinzel text-xs uppercase tracking-widest border border-white/10 text-gray-400 px-8 py-4 hover:border-[#C5A059]/40 hover:text-[#C5A059] transition"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>

          {/* Instructor card */}
          <div className="relative">
            <div className="relative bg-[#0a1628] border border-[#C5A059]/20 overflow-hidden">
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#C5A059]/60" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#C5A059]/60" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#C5A059]/60" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#C5A059]/60" />
              <div className="relative h-64 overflow-hidden">
                <img
                  src="https://media.juanpabloloaiza.com/images/jpl-newwsp.jpeg"
                  alt="Juan Pablo Loaiza"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent" />
              </div>
              <div className="p-6">
                <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Tu instructor</p>
                <h3 className="font-cinzel text-lg text-white mb-2">Juan Pablo Loaiza</h3>
                <p className="font-crimson text-gray-400 text-sm leading-relaxed">
                  Terapeuta Holístico con más de 18 años de experiencia en Hipnosis Clínica y Regresión a Vidas Pasadas. Ha acompañado a miles de personas en su proceso de sanación espiritual en todo el mundo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-px bg-[#C5A059]" />
          <div className="flex-1 h-px bg-[#C5A059]/10" />
          <div className="w-8 h-px bg-[#C5A059]" />
        </div>
      </div>

      {/* ── What you'll learn ── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]">Contenido del curso</span>
            <h2 className="font-cinzel text-2xl sm:text-3xl text-white mt-3">¿Qué aprenderás?</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {WHAT_YOU_LEARN.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-[#0a1628] border border-white/5">
                <CheckCircle className="w-4 h-4 text-[#C5A059] mt-0.5 flex-shrink-0" />
                <span className="font-crimson text-gray-300 text-base leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Curriculum ── */}
      <section className="py-20 border-t border-[#C5A059]/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]">Programa</span>
            <h2 className="font-cinzel text-2xl sm:text-3xl text-white mt-3 mb-2">Curriculum completo</h2>
            <p className="font-crimson text-gray-400">{TOTAL_LESSONS} lecciones · ~{totalMinutes} min en total</p>
          </div>

          <AcademyLandingClient sections={COURSE_SECTIONS} />
        </div>
      </section>

      {/* ── Instructor full bio ── */}
      <section className="py-20 border-t border-[#C5A059]/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid md:grid-cols-3 gap-12 items-start">
          <div className="md:col-span-1">
            <div className="relative overflow-hidden border border-[#C5A059]/20">
              <img
                src="https://media.juanpabloloaiza.com/images/jpl-newwsp.jpeg"
                alt="Juan Pablo Loaiza"
                className="w-full aspect-square object-cover object-top"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <span className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]">Instructor</span>
            <h2 className="font-cinzel text-2xl text-white mt-2 mb-4">Juan Pablo Loaiza</h2>
            <div className="w-12 h-px bg-[#C5A059] mb-6" />
            <p className="font-crimson text-gray-300 text-base leading-relaxed mb-4">
              {COURSE_META.instructor_bio}
            </p>
            <p className="font-crimson text-gray-400 text-base leading-relaxed mb-6">
              Este curso gratuito es el punto de partida para todos sus pacientes, diseñado para eliminar el miedo, responder las preguntas más frecuentes y preparar la mente y el espíritu para una experiencia de regresión profunda y transformadora.
            </p>
            <Link
              href="https://www.juanpabloloaiza.com"
              target="_blank"
              className="font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/30 px-4 py-2 hover:bg-[#C5A059]/10 transition"
            >
              Ver sitio oficial
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 border-t border-[#C5A059]/10 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(197,160,89,0.06),transparent)]" />
        <div className="max-w-xl mx-auto px-4 sm:px-6 relative">
          <Image
            src="https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png"
            alt="JPL Academy"
            width={160}
            height={54}
            className="h-10 w-auto mx-auto mb-8 opacity-80"
          />
          <h2 className="font-cinzel text-2xl sm:text-3xl text-white mb-4">
            Comienza tu preparación hoy
          </h2>
          <p className="font-crimson text-gray-400 text-lg mb-8 leading-relaxed">
            Acceso inmediato a las 28 lecciones. Completamente gratuito. Sin tarjeta de crédito.
          </p>
          <Link
            href="/academy/register"
            className="inline-flex items-center justify-center bg-[#C5A059] text-[#020617] font-cinzel text-xs uppercase tracking-widest px-10 py-4 hover:bg-[#d4b06a] transition shadow-[0_0_40px_rgba(197,160,89,0.3)]"
          >
            Inscribirme gratis →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#C5A059]/10 py-8 text-center">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-600">
          © 2026 Juan Pablo Loaiza · Academy ·{" "}
          <Link href="https://www.juanpabloloaiza.com" className="hover:text-[#C5A059] transition">
            juanpabloloaiza.com
          </Link>
        </p>
      </footer>
    </div>
  );
}
