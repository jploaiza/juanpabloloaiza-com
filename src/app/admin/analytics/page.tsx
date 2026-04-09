import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import AcademyCard from "@/components/academy/AcademyCard";
import { Users, Award, TrendingUp, Clock, Activity, UserPlus, BookOpen, BarChart2 } from "lucide-react";
import SiteAnalyticsPanel from "@/components/SiteAnalyticsPanel";

export const metadata: Metadata = { title: "Analytics — Admin" };

function formatMinutes(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function WatchIntegrityBadge({ ratio }: { ratio: number }) {
  if (ratio >= 0.8) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        {Math.round(ratio * 100)}%
      </span>
    );
  }
  if (ratio >= 0.65) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
        {Math.round(ratio * 100)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
      {Math.round(ratio * 100)}%
    </span>
  );
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/academy/login");

  const adminSb = await createAdminClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 86400000).toISOString();

  const [
    { data: enrollments },
    { data: certificates },
    { data: progressAll },
    { data: activePacksData },
    { data: newEnrollments },
    { data: allProfiles },
    { data: lessons },
    { data: recentEnrollments },
  ] = await Promise.all([
    adminSb.from("enrollments").select("user_id, enrolled_at, completed_at"),
    adminSb.from("certificates").select("user_id, issued_at"),
    adminSb
      .from("lesson_progress")
      .select(
        "user_id, lesson_id, is_completed, watch_seconds, real_play_seconds, duration_seconds, last_watched_at"
      ),
    adminSb
      .from("patient_packs")
      .select("user_id, pack_type, sessions_used, sessions_total, start_date, end_date, is_active")
      .eq("is_active", true),
    adminSb
      .from("enrollments")
      .select("user_id, enrolled_at")
      .gte("enrolled_at", thirtyDaysAgo),
    adminSb.from("profiles").select("id, full_name, email, role"),
    adminSb.from("lessons").select("id, title, course_id").eq("is_published", true),
    adminSb.from("enrollments").select("enrolled_at").gte("enrolled_at", sixMonthsAgo),
  ]);

  // ── KPI Calculations ──────────────────────────────────────────
  const totalEnrolled = enrollments?.length ?? 0;
  const completedCount = certificates?.length ?? 0;
  const completionRate =
    totalEnrolled > 0 ? Math.round((completedCount / totalEnrolled) * 100) : 0;

  const totalWatchSeconds = (progressAll ?? []).reduce(
    (sum, p) => sum + (p.watch_seconds ?? 0),
    0
  );
  const avgWatchSeconds = totalEnrolled > 0 ? totalWatchSeconds / totalEnrolled : 0;

  const activePacks = activePacksData?.length ?? 0;
  const newLast30d = newEnrollments?.length ?? 0;

  // ── Real play ratio per lesson ────────────────────────────────
  const lessonMap: Record<
    string,
    { title: string; completions: number; realPlayTotal: number; durationTotal: number; count: number }
  > = {};

  for (const lesson of lessons ?? []) {
    lessonMap[lesson.id] = {
      title: lesson.title,
      completions: 0,
      realPlayTotal: 0,
      durationTotal: 0,
      count: 0,
    };
  }

  for (const p of progressAll ?? []) {
    if (!p.lesson_id || !lessonMap[p.lesson_id]) continue;
    const entry = lessonMap[p.lesson_id];
    if (p.is_completed) entry.completions++;
    if (p.duration_seconds && p.duration_seconds > 0) {
      entry.realPlayTotal += p.real_play_seconds ?? 0;
      entry.durationTotal += p.duration_seconds;
      entry.count++;
    }
  }

  const lessonStats = Object.entries(lessonMap).map(([id, data]) => ({
    id,
    title: data.title,
    completions: data.completions,
    avgRealPlayRatio:
      data.durationTotal > 0 ? data.realPlayTotal / data.durationTotal : 0,
  }));

  // ── Per-student progress ──────────────────────────────────────
  const enrolledUserIds = new Set((enrollments ?? []).map((e) => e.user_id));
  const certUserIds = new Set((certificates ?? []).map((c) => c.user_id));
  const activePackUserIds = new Set((activePacksData ?? []).map((p) => p.user_id));

  const totalLessonsCount = lessons?.length ?? 1;

  const progressByUser: Record<
    string,
    { completed: number; watchSeconds: number; lastActive: string | null }
  > = {};

  for (const p of progressAll ?? []) {
    if (!progressByUser[p.user_id]) {
      progressByUser[p.user_id] = { completed: 0, watchSeconds: 0, lastActive: null };
    }
    if (p.is_completed) progressByUser[p.user_id].completed++;
    progressByUser[p.user_id].watchSeconds += p.watch_seconds ?? 0;
    if (
      p.last_watched_at &&
      (!progressByUser[p.user_id].lastActive ||
        p.last_watched_at > progressByUser[p.user_id].lastActive!)
    ) {
      progressByUser[p.user_id].lastActive = p.last_watched_at;
    }
  }

  const studentRows = (allProfiles ?? [])
    .filter((p) => enrolledUserIds.has(p.id) && p.role !== "admin")
    .map((p) => {
      const prog = progressByUser[p.id];
      const completedLessons = prog?.completed ?? 0;
      const progressPct = Math.round((completedLessons / totalLessonsCount) * 100);
      return {
        id: p.id,
        fullName: p.full_name ?? "—",
        email: p.email,
        progressPct,
        completedLessons,
        watchSeconds: prog?.watchSeconds ?? 0,
        lastActive: prog?.lastActive ?? null,
        hasCertificate: certUserIds.has(p.id),
        hasActivePack: activePackUserIds.has(p.id),
      };
    })
    .sort((a, b) => b.progressPct - a.progressPct);

  // ── Monthly enrollments (last 6 months) ──────────────────────
  function last6Months(): string[] {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return months;
  }
  const months6 = last6Months();
  const monthlyEnrollMap: Record<string, number> = Object.fromEntries(months6.map((m) => [m, 0]));
  for (const e of recentEnrollments ?? []) {
    const mk = e.enrolled_at?.slice(0, 7) ?? "";
    if (mk in monthlyEnrollMap) monthlyEnrollMap[mk]++;
  }
  const monthlyEnrollments = months6.map((m) => ({ month: m, count: monthlyEnrollMap[m] }));

  // ── Progress distribution buckets ─────────────────────────────
  const progBuckets = { "0%": 0, "1–25%": 0, "26–50%": 0, "51–75%": 0, "76–99%": 0, "100%": 0 };
  for (const s of studentRows) {
    if (s.progressPct === 0) progBuckets["0%"]++;
    else if (s.progressPct <= 25) progBuckets["1–25%"]++;
    else if (s.progressPct <= 50) progBuckets["26–50%"]++;
    else if (s.progressPct <= 75) progBuckets["51–75%"]++;
    else if (s.progressPct < 100) progBuckets["76–99%"]++;
    else progBuckets["100%"]++;
  }

  const kpiCards = [
    {
      icon: Users,
      label: "Total alumnos",
      value: totalEnrolled.toString(),
      sub: "Inscritos al curso",
    },
    {
      icon: Award,
      label: "Completaron",
      value: completedCount.toString(),
      sub: "Con certificado emitido",
    },
    {
      icon: TrendingUp,
      label: "Tasa completación",
      value: `${completionRate}%`,
      sub: `${completedCount} de ${totalEnrolled}`,
    },
    {
      icon: Clock,
      label: "Tiempo promedio",
      value: formatMinutes(avgWatchSeconds),
      sub: "Por estudiante inscripto",
    },
    {
      icon: Activity,
      label: "Packs activos",
      value: activePacks.toString(),
      sub: "Pacientes con pack vigente",
    },
    {
      icon: UserPlus,
      label: "Nuevos (30 días)",
      value: newLast30d.toString(),
      sub: "Inscripciones recientes",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-20">
      {/* Header */}
      <div className="mb-8">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">
          Panel de administración
        </p>
        <h1 className="font-cinzel text-2xl text-white">Analytics</h1>
      </div>

      {/* Site analytics */}
      <div className="mb-12">
        <SiteAnalyticsPanel />
      </div>

      <div className="border-t border-white/5 mb-10 pt-10">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Academia</p>
        <h2 className="font-cinzel text-xl text-white">Analytics de Estudiantes</h2>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
        {kpiCards.map(({ icon: Icon, label, value, sub }) => (
          <div
            key={label}
            className="relative bg-[#0a1628] border border-white/5 p-5 overflow-hidden"
          >
            <ScrollworkCorners size={36} opacity={0.7} />
            <Icon className="w-4 h-4 text-[#C5A059] mb-3" />
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">
              {label}
            </p>
            <p className="font-cinzel text-2xl text-white mb-1">{value}</p>
            <p className="font-crimson text-xs text-gray-600">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
        {/* Monthly enrollments bar chart */}
        <div className="bg-[#0a1628] border border-white/5 p-5 relative overflow-hidden">
          <ScrollworkCorners size={32} opacity={0.5} />
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="w-4 h-4 text-[#C5A059]" />
            <h2 className="font-cinzel text-xs uppercase tracking-widest text-white">Inscripciones por mes</h2>
          </div>
          <p className="font-crimson text-xs text-gray-600 mb-4">Últimos 6 meses</p>
          <div className="flex items-end gap-2 h-24">
            {(() => {
              const maxVal = Math.max(...monthlyEnrollments.map((d) => d.count), 1);
              return monthlyEnrollments.map((d) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: "64px" }}>
                    <div
                      style={{
                        width: "100%",
                        height: `${Math.max(2, Math.round((d.count / maxVal) * 64))}px`,
                        backgroundColor: "#C5A059",
                        opacity: d.count === 0 ? 0.12 : 0.85,
                      }}
                    />
                  </div>
                  <span className="font-cinzel text-[9px] text-gray-600">{d.month.slice(5)}</span>
                  <span className="font-cinzel text-[10px] text-gray-400">{d.count}</span>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Progress distribution */}
        <div className="bg-[#0a1628] border border-white/5 p-5 relative overflow-hidden">
          <ScrollworkCorners size={32} opacity={0.5} />
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-[#C5A059]" />
            <h2 className="font-cinzel text-xs uppercase tracking-widest text-white">Distribución de progreso</h2>
          </div>
          <p className="font-crimson text-xs text-gray-600 mb-4">Estudiantes por rango de avance</p>
          <div className="space-y-2">
            {Object.entries(progBuckets).map(([label, count]) => {
              const pct = studentRows.length > 0 ? Math.round((count / studentRows.length) * 100) : 0;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="font-cinzel text-[9px] text-gray-500 w-12 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-[#020617]">
                    <div
                      className="h-full bg-[#C5A059] transition-all duration-500"
                      style={{ width: `${pct}%`, opacity: count === 0 ? 0.1 : 0.8 }}
                    />
                  </div>
                  <span className="font-cinzel text-[10px] text-gray-400 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Watch integrity section */}
      <div className="mb-10">
        <AcademyCard>
          <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-2">
            Integridad de visionado
          </h2>
          <p className="font-crimson text-sm text-gray-600 mb-6">
            Ratio de reproducción real vs. duración por lección. Verde ≥ 80%, Ámbar 65–79%, Rojo
            &lt; 65%.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Lección", "Completaron", "Ratio real / duración"].map((h) => (
                    <th
                      key={h}
                      className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4 last:pr-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lessonStats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center font-crimson text-sm text-gray-600">
                      Sin datos de progreso aún.
                    </td>
                  </tr>
                ) : (
                  lessonStats.map((ls) => (
                    <tr
                      key={ls.id}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition"
                    >
                      <td className="py-3 pr-4">
                        <p className="font-crimson text-sm text-gray-200">{ls.title}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-cinzel text-[10px] text-[#C5A059]">
                          {ls.completions}
                        </span>
                        <span className="font-cinzel text-[9px] text-gray-600 ml-1">
                          / {totalEnrolled}
                        </span>
                      </td>
                      <td className="py-3">
                        {ls.avgRealPlayRatio > 0 ? (
                          <WatchIntegrityBadge ratio={ls.avgRealPlayRatio} />
                        ) : (
                          <span className="font-cinzel text-[9px] text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </AcademyCard>
      </div>

      {/* Student progress section */}
      <div className="mb-10">
        <AcademyCard>
          <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-6">
            Progreso de estudiantes
            <span className="ml-3 font-crimson text-xs text-gray-500 normal-case">
              {studentRows.length} estudiantes
            </span>
          </h2>

          {studentRows.length === 0 ? (
            <p className="font-crimson text-gray-600 text-sm text-center py-8">
              Aún no hay estudiantes inscritos.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {[
                      "Estudiante",
                      "Progreso",
                      "Sesiones",
                      "Último acceso",
                      "Certificado",
                      "Pack activo",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4 last:pr-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentRows.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition"
                    >
                      <td className="py-3 pr-4">
                        <p className="font-crimson text-sm text-gray-200 leading-tight">
                          {s.fullName}
                        </p>
                        <p className="font-cinzel text-[9px] text-gray-600 truncate max-w-[160px]">
                          {s.email}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1 bg-[#0f172a] overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#C5A059] to-[#F3E5AB]"
                              style={{ width: `${s.progressPct}%` }}
                            />
                          </div>
                          <span className="font-cinzel text-[10px] text-[#C5A059]">
                            {s.progressPct}%
                          </span>
                        </div>
                        <p className="font-cinzel text-[9px] text-gray-600 mt-0.5">
                          {s.completedLessons}/{totalLessonsCount} lecciones
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-crimson text-sm text-gray-400">
                          {formatMinutes(s.watchSeconds)}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-crimson text-sm text-gray-500">
                          {s.lastActive
                            ? new Date(s.lastActive).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                              })
                            : "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {s.hasCertificate ? (
                          <span className="font-cinzel text-[9px] uppercase tracking-widest text-emerald-400">
                            Emitido
                          </span>
                        ) : (
                          <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-600">
                            —
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {s.hasActivePack ? (
                          <span className="inline-flex px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest bg-[#C5A059]/10 text-[#C5A059]/80 border border-[#C5A059]/20">
                            Activo
                          </span>
                        ) : (
                          <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-600">
                            —
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

      {/* Export hint */}
      <div className="relative bg-[#0a1628] border border-white/5 p-5 overflow-hidden">
        <ScrollworkCorners size={32} opacity={0.5} />
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-600">
          Exportar datos
        </p>
        <p className="font-crimson text-sm text-gray-500 mt-1">
          Para exportar datos en CSV o hacer consultas avanzadas, usa el{" "}
          <span className="text-[#C5A059]/70">SQL Editor de Supabase</span> en el dashboard del
          proyecto.
        </p>
      </div>
    </div>
  );
}
