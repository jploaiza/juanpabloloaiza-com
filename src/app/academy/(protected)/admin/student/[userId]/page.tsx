import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AcademyCard from "@/components/academy/AcademyCard";
import ForceCompleteButton from "@/components/academy/ForceCompleteButton";
import { ArrowLeft, CheckCircle, Circle, PlayCircle, Award, Clock, BookOpen } from "lucide-react";
import { formatDuration } from "@/lib/academy-data";

interface Props {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const adminSb = await createAdminClient();
  const { data: profile } = await adminSb.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  return { title: `${profile?.full_name ?? "Estudiante"} — Admin JPL Academy` };
}

export default async function StudentDetailPage({ params }: Props) {
  const { userId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (adminProfile?.role !== "admin") redirect("/academy/dashboard");

  const adminSb = await createAdminClient();

  const [
    { data: profile },
    { data: enrollment },
    { data: progressRows },
    { data: sections },
    { data: certificate },
  ] = await Promise.all([
    adminSb.from("profiles").select("id, full_name, email, created_at").eq("id", userId).maybeSingle(),
    adminSb.from("enrollments").select("*, courses(id, title)").eq("user_id", userId).maybeSingle(),
    adminSb.from("lesson_progress")
      .select("lesson_id, is_completed, watch_seconds, real_play_seconds, completed_at, last_watched_at")
      .eq("user_id", userId),
    adminSb.from("sections")
      .select("id, title, order_index, lessons(id, slug, title, duration_seconds, order_index, is_published)")
      .order("order_index"),
    adminSb.from("certificates").select("verify_token, issued_at").eq("user_id", userId).maybeSingle(),
  ]);

  if (!profile) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courseId = (enrollment as any)?.courses?.id ?? enrollment?.course_id ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courseTitle = (enrollment as any)?.courses?.title ?? "Curso";

  const progressMap: Record<string, { is_completed: boolean; watch_seconds: number; real_play_seconds: number; completed_at: string | null; last_watched_at: string | null }> =
    Object.fromEntries((progressRows ?? []).map((p) => [p.lesson_id, p]));

  const sortedSections = (sections ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((s) => ({
      ...s,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lessons: ((s.lessons as any[]) ?? [])
        .filter((l) => l.is_published)
        .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index),
    }));

  const allLessons = sortedSections.flatMap((s) => s.lessons);
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter((l) => progressMap[l.id]?.is_completed).length;
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const totalWatchSeconds = (progressRows ?? []).reduce((a, r) => a + (r.watch_seconds ?? 0), 0);
  const isCompleted = !!enrollment?.completed_at;

  const lastActive = (progressRows ?? []).reduce((latest, r) => {
    if (!r.last_watched_at) return latest;
    return !latest || r.last_watched_at > latest ? r.last_watched_at : latest;
  }, null as string | null);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      {/* Back */}
      <Link
        href="/academy/admin"
        className="inline-flex items-center gap-2 font-cinzel text-[9px] uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition mb-8"
      >
        <ArrowLeft className="w-3 h-3" /> Volver al panel
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">
            Detalle de estudiante
          </p>
          <h1 className="font-cinzel text-2xl text-white">{profile.full_name ?? "—"}</h1>
          <p className="font-crimson text-gray-500 text-sm mt-1">{profile.email}</p>
          <p className="font-cinzel text-[9px] text-gray-700 mt-1">
            Inscrito: {enrollment?.enrolled_at
              ? new Date(enrollment.enrolled_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
              : "—"}
          </p>
        </div>

        {/* Force complete — prominente */}
        {!isCompleted && courseId && (
          <div className="sm:text-right">
            <ForceCompleteButton userId={userId} courseId={courseId} variant="prominent" />
          </div>
        )}
        {isCompleted && certificate && (
          <Link
            href={`/academy/certificate/${certificate.verify_token}`}
            target="_blank"
            className="inline-flex items-center gap-2 border border-emerald-500/40 text-emerald-400 font-cinzel text-[10px] uppercase tracking-widest px-4 py-2.5 hover:bg-emerald-500/10 transition"
          >
            <Award className="w-3.5 h-3.5" /> Ver certificado
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { icon: BookOpen, label: "Progreso", value: `${progressPct}%`, sub: `${completedLessons}/${totalLessons} lecciones` },
          { icon: Clock, label: "Tiempo visto", value: `${Math.round(totalWatchSeconds / 60)} min`, sub: formatDuration(totalWatchSeconds) },
          { icon: CheckCircle, label: "Estado", value: isCompleted ? "Completado" : completedLessons > 0 ? "En curso" : "Sin iniciar", sub: isCompleted ? "Certificado emitido" : "—" },
          { icon: Award, label: "Último acceso", value: lastActive ? new Date(lastActive).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "—", sub: lastActive ? new Date(lastActive).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "" },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="bg-[#16213e] border border-white/5 p-4">
            <Icon className="w-4 h-4 text-[#C5A059] mb-2" />
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
            <p className="font-crimson text-base text-gray-100">{value}</p>
            {sub && <p className="font-cinzel text-[9px] text-gray-600 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500">{courseTitle}</span>
          <span className="font-cinzel text-[10px] text-[#C5A059]">{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-[#0a1628] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C5A059] to-[#F3E5AB] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Per-section lesson breakdown */}
      <AcademyCard>
        <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-6">
          Progreso por lección
        </h2>

        <div className="space-y-6">
          {sortedSections.map((section) => {
            const sectionDone = section.lessons.filter((l) => progressMap[l.id]?.is_completed).length;
            const allDone = sectionDone === section.lessons.length;

            return (
              <div key={section.id}>
                {/* Section header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-1">
                  <h3 className="font-cinzel text-[10px] uppercase tracking-widest text-white">
                    {section.title}
                  </h3>
                  <span className={`font-cinzel text-[9px] ${allDone ? "text-emerald-500" : "text-gray-500"}`}>
                    {sectionDone}/{section.lessons.length}
                  </span>
                </div>

                {/* Lessons */}
                <div className="divide-y divide-white/[0.03]">
                  {section.lessons.map((lesson) => {
                    const prog = progressMap[lesson.id];
                    const isLessonComplete = prog?.is_completed ?? false;
                    const watchSec = prog?.watch_seconds ?? 0;
                    const duration = lesson.duration_seconds || 1;
                    const watchPct = Math.min(100, Math.round((watchSec / duration) * 100));
                    const inProgress = !isLessonComplete && watchPct > 0;

                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 py-2.5 px-1"
                      >
                        {isLessonComplete ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        ) : inProgress ? (
                          <PlayCircle className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-700 flex-shrink-0" />
                        )}

                        <span className={`font-crimson text-sm flex-1 ${isLessonComplete ? "text-gray-500" : "text-gray-200"}`}>
                          {lesson.title}
                        </span>

                        <span className="font-cinzel text-[9px] text-gray-600 flex-shrink-0">
                          {formatDuration(lesson.duration_seconds)}
                        </span>

                        {inProgress && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-14 h-1 bg-[#0a1628] overflow-hidden">
                              <div className="h-full bg-[#C5A059]/60" style={{ width: `${watchPct}%` }} />
                            </div>
                            <span className="font-cinzel text-[9px] text-[#C5A059] w-7 text-right">{watchPct}%</span>
                          </div>
                        )}

                        {isLessonComplete && prog?.completed_at && (
                          <span className="font-cinzel text-[9px] text-emerald-500/50 flex-shrink-0">
                            {new Date(prog.completed_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </AcademyCard>

      {/* Force complete — al pie, también prominente */}
      {!isCompleted && courseId && (
        <div className="mt-6 flex justify-center">
          <ForceCompleteButton userId={userId} courseId={courseId} variant="prominent" />
        </div>
      )}
    </main>
  );
}
