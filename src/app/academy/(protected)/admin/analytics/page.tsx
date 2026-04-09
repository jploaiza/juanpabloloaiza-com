import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import AcademyCard from "@/components/academy/AcademyCard";
import SiteAnalyticsPanel from "@/components/SiteAnalyticsPanel";
import { Users, Award, TrendingUp, Clock, Activity, UserPlus, BookOpen, BarChart2, CheckCircle, Circle } from "lucide-react";

export const metadata: Metadata = { title: "Analytics — Admin" };

function formatMinutes(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function WatchIntegrityBadge({ ratio }: { ratio: number }) {
  if (ratio >= 0.8) return <span className="inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{Math.round(ratio * 100)}%</span>;
  if (ratio >= 0.65) return <span className="inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">{Math.round(ratio * 100)}%</span>;
  return <span className="inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">{Math.round(ratio * 100)}%</span>;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/login");

  const adminSb = await createAdminClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [
    { data: enrollments },
    { data: certificates },
    { data: progressAll },
    { data: newEnrollments },
    { data: allProfiles },
    { data: lessons },
  ] = await Promise.all([
    adminSb.from("enrollments").select("user_id, enrolled_at, completed_at"),
    adminSb.from("certificates").select("user_id, issued_at"),
    adminSb.from("lesson_progress").select("user_id, lesson_id, is_completed, watch_seconds, real_play_seconds, duration_seconds, last_watched_at"),
    adminSb.from("enrollments").select("user_id, enrolled_at").gte("enrolled_at", thirtyDaysAgo),
    adminSb.from("profiles").select("id, full_name, email, role"),
    adminSb.from("lessons").select("id, title, course_id").eq("is_published", true),
  ]);

  const totalEnrolled = enrollments?.length ?? 0;
  const completedCount = certificates?.length ?? 0;
  const completionRate = totalEnrolled > 0 ? Math.round((completedCount / totalEnrolled) * 100) : 0;
  const totalWatchSeconds = (progressAll ?? []).reduce((sum, p) => sum + (p.watch_seconds ?? 0), 0);
  const avgWatchSeconds = totalEnrolled > 0 ? totalWatchSeconds / totalEnrolled : 0;
  const newLast30d = newEnrollments?.length ?? 0;
  const totalLessonsCount = lessons?.length ?? 1;

  // Lesson stats
  const lessonMap: Record<string, { title: string; completions: number; realPlayTotal: number; durationTotal: number }> = {};
  for (const lesson of lessons ?? []) lessonMap[lesson.id] = { title: lesson.title, completions: 0, realPlayTotal: 0, durationTotal: 0 };
  for (const p of progressAll ?? []) {
    if (!p.lesson_id || !lessonMap[p.lesson_id]) continue;
    if (p.is_completed) lessonMap[p.lesson_id].completions++;
    if (p.duration_seconds && p.duration_seconds > 0) {
      lessonMap[p.lesson_id].realPlayTotal += p.real_play_seconds ?? 0;
      lessonMap[p.lesson_id].durationTotal += p.duration_seconds;
    }
  }
  const lessonStats = Object.entries(lessonMap).map(([id, data]) => ({ id, title: data.title, completions: data.completions, avgRealPlayRatio: data.durationTotal > 0 ? data.realPlayTotal / data.durationTotal : 0 }));

  // Student rows
  const enrolledUserIds = new Set((enrollments ?? []).map((e) => e.user_id));
  const certUserIds = new Set((certificates ?? []).map((c) => c.user_id));
  const progressByUser: Record<string, { completed: number; watchSeconds: number; lastActive: string | null }> = {};
  for (const p of progressAll ?? []) {
    if (!progressByUser[p.user_id]) progressByUser[p.user_id] = { completed: 0, watchSeconds: 0, lastActive: null };
    if (p.is_completed) progressByUser[p.user_id].completed++;
    progressByUser[p.user_id].watchSeconds += p.watch_seconds ?? 0;
    if (p.last_watched_at && (!progressByUser[p.user_id].lastActive || p.last_watched_at > progressByUser[p.user_id].lastActive!)) progressByUser[p.user_id].lastActive = p.last_watched_at;
  }
  const studentRows = (allProfiles ?? [])
    .filter((p) => enrolledUserIds.has(p.id) && p.role !== "admin")
    .map((p) => {
      const prog = progressByUser[p.id];
      const completedLessons = prog?.completed ?? 0;
      const progressPct = Math.round((completedLessons / totalLessonsCount) * 100);
      return { id: p.id, fullName: p.full_name ?? "—", email: p.email, progressPct, completedLessons, watchSeconds: prog?.watchSeconds ?? 0, lastActive: prog?.lastActive ?? null, hasCertificate: certUserIds.has(p.id) };
    })
    .sort((a, b) => b.progressPct - a.progressPct);

  const kpiCards = [
    { icon: Users, label: "Total alumnos", value: totalEnrolled.toString(), sub: "Inscritos al curso" },
    { icon: Award, label: "Completaron", value: completedCount.toString(), sub: "Con certificado emitido" },
    { icon: TrendingUp, label: "Tasa completación", value: `${completionRate}%`, sub: `${completedCount} de ${totalEnrolled}` },
    { icon: Clock, label: "Tiempo promedio", value: formatMinutes(avgWatchSeconds), sub: "Por estudiante inscripto" },
    { icon: UserPlus, label: "Nuevos (30d)", value: newLast30d.toString(), sub: "Inscripciones recientes" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-20">
      <div className="mb-8">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Admin</p>
        <h1 className="font-cinzel text-2xl text-white">Analytics</h1>
      </div>

      {/* Site analytics */}
      <div className="mb-12">
        <SiteAnalyticsPanel />
      </div>

      <div className="border-t border-white/5 mb-8 pt-10">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Academia</p>
        <h2 className="font-cinzel text-xl text-white">Analytics de Estudiantes</h2>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
        {kpiCards.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="relative bg-[#0a1628] border border-white/5 p-5 overflow-hidden">
            <ScrollworkCorners size={36} opacity={0.7} />
            <Icon className="w-4 h-4 text-[#C5A059] mb-3" />
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
            <p className="font-cinzel text-2xl text-white mb-1">{value}</p>
            <p className="font-crimson text-xs text-gray-600">{sub}</p>
          </div>
        ))}
      </div>

      {/* Watch integrity */}
      <div className="mb-10">
        <AcademyCard>
          <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-2">Integridad de visionado</h2>
          <p className="font-crimson text-sm text-gray-600 mb-6">Ratio de reproducción real vs. duración por lección.</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Lección", "Completaron", "Ratio real / duración"].map((h) => (
                    <th key={h} className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lessonStats.length === 0 ? (
                  <tr><td colSpan={3} className="py-8 text-center font-crimson text-sm text-gray-600">Sin datos de progreso aún.</td></tr>
                ) : lessonStats.map((ls) => (
                  <tr key={ls.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                    <td className="py-3 pr-4"><p className="font-crimson text-sm text-gray-200">{ls.title}</p></td>
                    <td className="py-3 pr-4"><span className="font-cinzel text-[10px] text-[#C5A059]">{ls.completions}</span><span className="font-cinzel text-[9px] text-gray-600 ml-1">/ {totalEnrolled}</span></td>
                    <td className="py-3">{ls.avgRealPlayRatio > 0 ? <WatchIntegrityBadge ratio={ls.avgRealPlayRatio} /> : <span className="font-cinzel text-[9px] text-gray-600">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AcademyCard>
      </div>

      {/* Student progress */}
      <div className="mb-10">
        <AcademyCard>
          <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-6">
            Progreso de estudiantes
            <span className="ml-3 font-crimson text-xs text-gray-500 normal-case">{studentRows.length} estudiantes</span>
          </h2>
          {studentRows.length === 0 ? (
            <p className="font-crimson text-gray-600 text-sm text-center py-8">Aún no hay estudiantes inscritos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Estudiante", "Progreso", "Tiempo", "Último acceso", "Certificado"].map((h) => (
                      <th key={h} className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentRows.map((s) => (
                    <tr key={s.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                      <td className="py-3 pr-4">
                        <p className="font-crimson text-sm text-gray-200 leading-tight">{s.fullName}</p>
                        <p className="font-cinzel text-[9px] text-gray-600 truncate max-w-[160px]">{s.email}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1 bg-[#0f172a] overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#C5A059] to-[#F3E5AB]" style={{ width: `${s.progressPct}%` }} />
                          </div>
                          <span className="font-cinzel text-[10px] text-[#C5A059]">{s.progressPct}%</span>
                        </div>
                        <p className="font-cinzel text-[9px] text-gray-600 mt-0.5">{s.completedLessons}/{totalLessonsCount} lecciones</p>
                      </td>
                      <td className="py-3 pr-4"><span className="font-crimson text-sm text-gray-400">{formatMinutes(s.watchSeconds)}</span></td>
                      <td className="py-3 pr-4">
                        <span className="font-crimson text-sm text-gray-500">
                          {s.lastActive ? new Date(s.lastActive).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "—"}
                        </span>
                      </td>
                      <td className="py-3">
                        {s.hasCertificate || s.progressPct >= 100 ? (
                          <span className="flex items-center gap-1 font-cinzel text-[9px] uppercase tracking-widest text-emerald-400"><CheckCircle className="w-3 h-3" /> Emitido</span>
                        ) : (
                          <span className="flex items-center gap-1 font-cinzel text-[9px] uppercase tracking-widest text-gray-600"><Circle className="w-3 h-3" /> —</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AcademyCard>
      </div>
    </div>
  );
}
