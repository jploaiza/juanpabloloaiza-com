import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AcademyHeader from "@/components/academy/AcademyHeader";
import ProgressBar from "@/components/academy/ProgressBar";
import AcademyCard from "@/components/academy/AcademyCard";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import { BookOpen, Clock, CheckCircle, Award, MessageCircle, Calendar } from "lucide-react";
import { TOTAL_LESSONS } from "@/lib/academy-data";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const [{ data: profile }, { data: enrollment }, { data: progressRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("enrollments").select("*, courses(*)").eq("user_id", user.id).maybeSingle(),
    supabase.from("lesson_progress").select("*, lessons(slug,title,order_index,duration_seconds,section_id,sections(order_index))").eq("user_id", user.id).eq("is_completed", true),
  ]);

  let activeEnrollment = enrollment;
  if (!activeEnrollment) {
    const { data: course } = await supabase.from("courses").select("id").eq("slug", "hipnosis-regresiva-preparacion").maybeSingle();
    if (course) {
      await supabase.from("enrollments").upsert(
        { user_id: user.id, course_id: course.id },
        { onConflict: "user_id,course_id", ignoreDuplicates: true }
      );
      const { data: refreshed } = await supabase
        .from("enrollments").select("*, courses(*)").eq("user_id", user.id).maybeSingle();
      activeEnrollment = refreshed;
    }
  }

  const completedCount = progressRows?.length ?? 0;
  const progressPercent = Math.round((completedCount / TOTAL_LESSONS) * 100);
  const isCompleted = completedCount >= TOTAL_LESSONS;

  // Find last watched lesson
  const { data: lastProgress } = await supabase
    .from("lesson_progress")
    .select("lessons(slug,title)")
    .eq("user_id", user.id)
    .order("last_watched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Certificate
  const { data: certificate } = await supabase
    .from("certificates")
    .select("verify_token")
    .eq("user_id", user.id)
    .maybeSingle();

  const totalWatchSeconds = (await supabase
    .from("lesson_progress")
    .select("watch_seconds")
    .eq("user_id", user.id)).data?.reduce((a, r) => a + (r.watch_seconds ?? 0), 0) ?? 0;

  const enrolledDate = activeEnrollment?.enrolled_at
    ? new Date(activeEnrollment.enrolled_at).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
    : "—";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastLesson = (lastProgress?.lessons as any);

  return (
    <div className="min-h-screen bg-[#020617]">
      <AcademyHeader user={profile} />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_0%,rgba(197,160,89,0.05),transparent)]" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        {/* Welcome */}
        <div className="mb-10">
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Dashboard</p>
          <h1 className="font-cinzel text-2xl sm:text-3xl text-white">
            Hola, {profile?.full_name?.split(" ")[0] ?? "estudiante"}
          </h1>
        </div>

        {/* Main progress card */}
        <AcademyCard gold className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            {/* Circle progress */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(197,160,89,0.1)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="#C5A059" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressPercent / 100)}`}
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-cinzel text-2xl text-white">{progressPercent}%</span>
                  <span className="font-crimson text-xs text-gray-500">completado</span>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="font-cinzel text-lg text-white mb-1">Preparación para tu Regresión a Vidas Pasadas</h2>
              <p className="font-crimson text-gray-400 text-sm mb-4">{completedCount} de {TOTAL_LESSONS} lecciones completadas</p>
              <ProgressBar value={progressPercent} showLabel size="thick" className="mb-6" />

              <div className="flex flex-wrap gap-3">
                {lastLesson ? (
                  <Link
                    href={`/academy/lesson/${lastLesson.slug}`}
                    className="inline-flex items-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-[#d4b06a] transition"
                  >
                    Continuar →
                  </Link>
                ) : (
                  <Link
                    href="/academy/lesson/introduccion"
                    className="inline-flex items-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-[#d4b06a] transition"
                  >
                    Comenzar →
                  </Link>
                )}
                {isCompleted && certificate && (
                  <Link
                    href={`/academy/certificate/${certificate.verify_token}`}
                    className="inline-flex items-center gap-2 border border-[#C5A059]/40 text-[#C5A059] font-cinzel text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-[#C5A059]/10 transition"
                  >
                    <Award className="w-3.5 h-3.5" /> Ver certificado
                  </Link>
                )}
              </div>
            </div>
          </div>
        </AcademyCard>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: CheckCircle, label: "Lecciones completadas", value: `${completedCount}/${TOTAL_LESSONS}` },
            { icon: Clock, label: "Tiempo visto", value: `${Math.round(totalWatchSeconds / 60)} min` },
            { icon: BookOpen, label: "Inscrito el", value: enrolledDate },
            { icon: Award, label: "Certificado", value: isCompleted ? "Disponible" : `Falta ${TOTAL_LESSONS - completedCount}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="relative bg-[#0a1628] border border-white/5 p-4 overflow-hidden">
              <ScrollworkCorners size={36} opacity={0.7} />
              <Icon className="w-4 h-4 text-[#C5A059] mb-2" />
              <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
              <p className="font-crimson text-base text-gray-200">{value}</p>
            </div>
          ))}
        </div>

        {/* Contact CTAs */}
        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href="https://api.whatsapp.com/send?phone=56962081884"
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center gap-4 p-5 bg-[#0a1628] border border-white/5 hover:border-[#C5A059]/20 transition group overflow-hidden"
          >
            <ScrollworkCorners size={40} opacity={0.65} />
            <MessageCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
            <div>
              <p className="font-cinzel text-xs uppercase tracking-widest text-white mb-0.5">¿Tienes dudas?</p>
              <p className="font-crimson text-gray-400 text-sm">Escríbeme por WhatsApp</p>
            </div>
          </a>
          <Link
            href="https://www.juanpabloloaiza.com/agenda"
            className="relative flex items-center gap-4 p-5 bg-[#0a1628] border border-white/5 hover:border-[#C5A059]/20 transition group overflow-hidden"
          >
            <ScrollworkCorners size={40} opacity={0.65} />
            <Calendar className="w-8 h-8 text-[#C5A059] flex-shrink-0" />
            <div>
              <p className="font-cinzel text-xs uppercase tracking-widest text-white mb-0.5">¿Listo para tu sesión?</p>
              <p className="font-crimson text-gray-400 text-sm">Agenda tu primera sesión</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
