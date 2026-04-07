import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import AcademyHeader from "@/components/academy/AcademyHeader";
import AcademyCard from "@/components/academy/AcademyCard";
import AdminNotifyToggle from "@/components/academy/AdminNotifyToggle";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  CheckCircle,
  Clock,
  Circle,
} from "lucide-react";
import { formatDuration } from "@/lib/academy-data";

export const metadata: Metadata = { title: "Admin — JPL Academy" };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/academy/dashboard");

  const adminSb = await createAdminClient();

  // ── Parallel data fetch ──────────────────────────────────────
  const [
    { data: allProfiles, count: totalUsers },
    { data: enrollments },
    { data: completions },
    { data: recentUsers },
    { data: progressAll },
    { data: courses },
    { data: allLessons },
  ] = await Promise.all([
    adminSb.from("profiles").select("id, email, full_name, created_at, role", { count: "exact" }).order("created_at", { ascending: false }),
    adminSb.from("enrollments").select("user_id, course_id, enrolled_at, completed_at"),
    adminSb.from("enrollments").select("user_id, completed_at").not("completed_at", "is", null),
    adminSb.from("profiles").select("id, email, full_name, created_at").gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()).order("created_at", { ascending: false }),
    adminSb.from("lesson_progress").select("user_id, course_id, is_completed, watch_seconds, last_watched_at"),
    adminSb.from("courses").select("id, slug, title, notify_completion_user, notify_completion_admin, admin_notify_email"),
    adminSb.from("lessons").select("id, course_id").eq("is_published", true),
  ]);

  // ── Compute stats ────────────────────────────────────────────
  const totalEnrollments = enrollments?.length ?? 0;
  const totalCompletions = completions?.length ?? 0;
  const completionRate = totalEnrollments > 0
    ? Math.round((totalCompletions / totalEnrollments) * 100)
    : 0;
  const recentCount = recentUsers?.length ?? 0;

  const totalLessonsCount = allLessons?.length ?? 1;

  // Build per-user progress map
  const progressByUser: Record<string, { completed: number; watchSeconds: number; lastActive: string }> = {};
  for (const p of progressAll ?? []) {
    if (!progressByUser[p.user_id]) {
      progressByUser[p.user_id] = { completed: 0, watchSeconds: 0, lastActive: "" };
    }
    if (p.is_completed) progressByUser[p.user_id].completed++;
    progressByUser[p.user_id].watchSeconds += p.watch_seconds ?? 0;
    if (!progressByUser[p.user_id].lastActive || p.last_watched_at > progressByUser[p.user_id].lastActive) {
      progressByUser[p.user_id].lastActive = p.last_watched_at;
    }
  }

  // Enrollment map
  const enrolledSet = new Set(enrollments?.map((e) => e.user_id));
  const completedSet = new Set(completions?.map((e) => e.user_id));

  // Build user rows (only enrolled students, exclude admins)
  const userRows = (allProfiles ?? [])
    .filter((p) => enrolledSet.has(p.id) && p.role !== "admin")
    .map((p) => {
      const prog = progressByUser[p.id];
      const progressPct = Math.round(((prog?.completed ?? 0) / totalLessonsCount) * 100);
      return {
        ...p,
        progressPct,
        completedLessons: prog?.completed ?? 0,
        watchSeconds: prog?.watchSeconds ?? 0,
        lastActive: prog?.lastActive ?? null,
        isCompleted: completedSet.has(p.id),
      };
    })
    .sort((a, b) => b.progressPct - a.progressPct);

  return (
    <div className="min-h-screen bg-[#020617]">
      <AcademyHeader user={profile} />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_0%,rgba(197,160,89,0.04),transparent)]" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-10">
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Panel de administración</p>
          <h1 className="font-cinzel text-2xl sm:text-3xl text-white">Analytics & Estudiantes</h1>
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            {
              icon: Users,
              label: "Usuarios registrados",
              value: totalUsers?.toString() ?? "0",
              sub: `+${recentCount} esta semana`,
            },
            {
              icon: BookOpen,
              label: "Inscriptos al curso",
              value: totalEnrollments.toString(),
              sub: "Hipnosis Regresiva",
            },
            {
              icon: Award,
              label: "Completaron el curso",
              value: totalCompletions.toString(),
              sub: `${completionRate}% tasa de finalización`,
            },
            {
              icon: TrendingUp,
              label: "Nuevos (7 días)",
              value: recentCount.toString(),
              sub: recentUsers?.[0]
                ? `Último: ${recentUsers[0].full_name ?? recentUsers[0].email}`
                : "Sin nuevos",
            },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="relative bg-[#0a1628] border border-white/5 p-5 overflow-hidden">
              <ScrollworkCorners size={40} opacity={0.75} />
              <Icon className="w-5 h-5 text-[#C5A059] mb-3" />
              <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
              <p className="font-cinzel text-2xl text-white mb-1">{value}</p>
              <p className="font-crimson text-xs text-gray-600">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Users table ── */}
          <div className="lg:col-span-2">
            <AcademyCard>
              <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-6">
                Estudiantes inscritos
                <span className="ml-3 font-crimson text-xs text-gray-500 normal-case">
                  {userRows.length} estudiantes
                </span>
              </h2>

              {userRows.length === 0 ? (
                <p className="font-crimson text-gray-600 text-sm text-center py-8">
                  Aún no hay estudiantes inscritos.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {["Estudiante", "Progreso", "Tiempo visto", "Último acceso", "Estado"].map((h) => (
                          <th key={h} className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {userRows.map((u) => (
                        <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                          <td className="py-3 pr-4">
                            <p className="font-crimson text-sm text-gray-200 leading-tight">
                              {u.full_name ?? "—"}
                            </p>
                            <p className="font-cinzel text-[9px] text-gray-600 truncate max-w-[140px]">
                              {u.email}
                            </p>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1 bg-[#0f172a] overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#C5A059] to-[#F3E5AB]"
                                  style={{ width: `${u.progressPct}%` }}
                                />
                              </div>
                              <span className="font-cinzel text-[10px] text-[#C5A059]">
                                {u.progressPct}%
                              </span>
                            </div>
                            <p className="font-cinzel text-[9px] text-gray-600 mt-0.5">
                              {u.completedLessons}/{totalLessonsCount} lecciones
                            </p>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="font-crimson text-sm text-gray-400">
                              {Math.round(u.watchSeconds / 60)} min
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="font-crimson text-sm text-gray-500">
                              {u.lastActive
                                ? new Date(u.lastActive).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
                                : "—"}
                            </span>
                          </td>
                          <td className="py-3">
                            {u.isCompleted ? (
                              <span className="flex items-center gap-1 font-cinzel text-[9px] uppercase tracking-widest text-emerald-500">
                                <CheckCircle className="w-3 h-3" /> Completo
                              </span>
                            ) : u.progressPct > 0 ? (
                              <span className="flex items-center gap-1 font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]">
                                <Clock className="w-3 h-3" /> En curso
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 font-cinzel text-[9px] uppercase tracking-widest text-gray-600">
                                <Circle className="w-3 h-3" /> Sin iniciar
                              </span>
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

          {/* ── Right column: Course settings + Recent ── */}
          <div className="space-y-6">
            {/* Course notification settings */}
            {(courses ?? []).map((course) => (
              <AcademyCard key={course.id} gold>
                <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-1">
                  Notificaciones
                </h2>
                <p className="font-crimson text-xs text-gray-500 mb-6 leading-snug">
                  {course.title}
                </p>

                <div className="space-y-5">
                  <AdminNotifyToggle
                    courseId={course.id}
                    field="notify_completion_user"
                    value={course.notify_completion_user}
                    label="Email al estudiante al completar"
                  />
                  <AdminNotifyToggle
                    courseId={course.id}
                    field="notify_completion_admin"
                    value={course.notify_completion_admin}
                    label="Notificarme cuando alguien complete"
                  />
                  <div className="pt-2 border-t border-white/5">
                    <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-600 mb-2">
                      Email de notificación admin
                    </p>
                    <AdminNotifyToggle
                      courseId={course.id}
                      field="admin_notify_email"
                      value={course.admin_notify_email}
                      label="Email admin"
                    />
                  </div>
                </div>
              </AcademyCard>
            ))}

            {/* Recent signups */}
            <AcademyCard>
              <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-4">
                Últimos registros
              </h2>
              {(recentUsers ?? []).length === 0 ? (
                <p className="font-crimson text-gray-600 text-sm">Sin registros esta semana.</p>
              ) : (
                <div className="space-y-3">
                  {(recentUsers ?? []).slice(0, 8).map((u) => (
                    <div key={u.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-[#C5A059]/15 border border-[#C5A059]/20 flex items-center justify-center flex-shrink-0">
                        <span className="font-cinzel text-[10px] text-[#C5A059]">
                          {(u.full_name ?? u.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-crimson text-sm text-gray-300 truncate">
                          {u.full_name ?? "—"}
                        </p>
                        <p className="font-cinzel text-[9px] text-gray-600 truncate">
                          {new Date(u.created_at).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AcademyCard>
          </div>
        </div>
      </main>
    </div>
  );
}
