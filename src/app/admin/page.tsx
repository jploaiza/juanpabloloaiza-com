import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import AcademyCard from "@/components/academy/AcademyCard";
import { Activity, Package, Clock, Star, AlertTriangle } from "lucide-react";

export const metadata: Metadata = { title: "Admin CRM — JPL" };

export const dynamic = "force-dynamic";

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function weekFromNow() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function weekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysLeft(endDate: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const adminSb = await createAdminClient();

  const { start: todayStart, end: todayEnd } = todayRange();
  const weekEnd = weekFromNow();
  const sevenDaysAgo = weekAgo();

  const [
    { data: activePacks },
    { data: todaySessions },
    { data: expiringPacks },
    { data: recentCompletions },
    { data: allProfiles },
    { data: activePack2 },
    { data: certificates },
  ] = await Promise.all([
    adminSb
      .from("patient_packs")
      .select("id")
      .eq("is_active", true),
    adminSb
      .from("therapy_sessions")
      .select("id, pack_id, user_id, scheduled_at, status, topic, therapist_notes")
      .eq("status", "scheduled")
      .gte("scheduled_at", todayStart)
      .lte("scheduled_at", todayEnd)
      .order("scheduled_at", { ascending: true }),
    adminSb
      .from("patient_packs")
      .select("id, user_id, pack_type, sessions_total, sessions_used, end_date, start_date")
      .eq("is_active", true)
      .lte("end_date", weekEnd)
      .gte("end_date", new Date().toISOString())
      .order("end_date", { ascending: true }),
    adminSb
      .from("enrollments")
      .select("user_id, completed_at")
      .not("completed_at", "is", null)
      .gte("completed_at", sevenDaysAgo),
    adminSb
      .from("profiles")
      .select("id, full_name, email, patient_status"),
    adminSb
      .from("patient_packs")
      .select("user_id")
      .eq("is_active", true),
    adminSb
      .from("certificates")
      .select("user_id, issued_at"),
  ]);

  // Profile lookup map
  const profileMap: Record<string, { full_name: string | null; email: string }> = {};
  for (const p of allProfiles ?? []) {
    profileMap[p.id] = { full_name: p.full_name, email: p.email };
  }

  // Users with active packs (set for O(1) lookup)
  const usersWithActivePack = new Set((activePack2 ?? []).map((p) => p.user_id));

  // Certificates map: userId → issued_at
  const certMap: Record<string, string> = {};
  for (const c of certificates ?? []) {
    certMap[c.user_id] = c.issued_at;
  }

  // New potential patients: has certificate but no active pack
  const potentialPatients = (allProfiles ?? []).filter(
    (p) => certMap[p.id] && !usersWithActivePack.has(p.id)
  );

  const activePacksCount = activePacks?.length ?? 0;
  const todaySessionsCount = todaySessions?.length ?? 0;
  const expiringPacksCount = expiringPacks?.length ?? 0;
  const newCompletionsCount = recentCompletions?.length ?? 0;

  const todayFormatted = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      {/* Date header */}
      <div className="mb-8">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">
          Panel de control
        </p>
        <h1 className="font-cinzel text-2xl sm:text-3xl text-white capitalize">
          {todayFormatted}
        </h1>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: Package,
            label: "Packs activos",
            value: activePacksCount.toString(),
            sub: "Pacientes en tratamiento",
          },
          {
            icon: Activity,
            label: "Sesiones hoy",
            value: todaySessionsCount.toString(),
            sub: "Programadas para hoy",
          },
          {
            icon: AlertTriangle,
            label: "Packs por vencer",
            value: expiringPacksCount.toString(),
            sub: "En los próximos 7 días",
          },
          {
            icon: Star,
            label: "Nuevas completaciones",
            value: newCompletionsCount.toString(),
            sub: "Esta semana",
          },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div
            key={label}
            className="relative bg-[#16213e] border border-white/5 p-5 overflow-hidden"
          >
            <ScrollworkCorners size={36} opacity={0.6} />
            <Icon className="w-5 h-5 text-[#C5A059] mb-3" />
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">
              {label}
            </p>
            <p className="font-cinzel text-2xl text-white mb-1">{value}</p>
            <p className="font-crimson text-xs text-gray-600">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Sesiones de hoy */}
        <AcademyCard>
          <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C5A059]" />
            Sesiones de hoy
            <span className="ml-auto font-crimson text-xs text-gray-500 normal-case">
              {todaySessionsCount} programadas
            </span>
          </h2>

          {(todaySessions ?? []).length === 0 ? (
            <p className="font-crimson text-gray-500 text-sm text-center py-6">
              No hay sesiones programadas para hoy.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Paciente", "Hora", "Tema", "Estado"].map((h) => (
                      <th
                        key={h}
                        className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(todaySessions ?? []).map((session) => {
                    const profile = profileMap[session.user_id];
                    const time = new Date(session.scheduled_at).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <tr
                        key={session.id}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition"
                      >
                        <td className="py-3 pr-3">
                          <p className="font-crimson text-sm text-gray-200">
                            {profile?.full_name ?? "—"}
                          </p>
                          <p className="font-cinzel text-[9px] text-gray-600 truncate max-w-[120px]">
                            {profile?.email}
                          </p>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="font-cinzel text-[11px] text-[#C5A059]">{time}</span>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="font-crimson text-sm text-gray-400">
                            {session.topic ?? "—"}
                          </span>
                        </td>
                        <td className="py-3">
                          <StatusBadge status={session.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AcademyCard>

        {/* Packs por vencer */}
        <AcademyCard>
          <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Packs por vencer
            <span className="ml-auto font-crimson text-xs text-gray-500 normal-case">
              ≤ 7 días
            </span>
          </h2>

          {(expiringPacks ?? []).length === 0 ? (
            <p className="font-crimson text-gray-500 text-sm text-center py-6">
              No hay packs próximos a vencer.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Paciente", "Días", "Sesiones", "Acción"].map((h) => (
                      <th
                        key={h}
                        className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(expiringPacks ?? []).map((pack) => {
                    const profile = profileMap[pack.user_id];
                    const days = daysLeft(pack.end_date);
                    const sessionsLeft = pack.sessions_total - pack.sessions_used;
                    return (
                      <tr
                        key={pack.id}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition"
                      >
                        <td className="py-3 pr-3">
                          <p className="font-crimson text-sm text-gray-200">
                            {profile?.full_name ?? "—"}
                          </p>
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={`font-cinzel text-[11px] ${
                              days <= 3 ? "text-red-400" : "text-amber-400"
                            }`}
                          >
                            {days}d
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="font-cinzel text-[11px] text-gray-400">
                            {sessionsLeft}/{pack.sessions_total}
                          </span>
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/admin/pacientes/${pack.user_id}`}
                            className="font-cinzel text-[9px] uppercase tracking-widest border border-[#C5A059]/40 text-[#C5A059] px-2.5 py-1 hover:bg-[#C5A059]/10 transition whitespace-nowrap"
                          >
                            Ver ficha
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AcademyCard>
      </div>

      {/* Nuevos pacientes potenciales */}
      <AcademyCard gold>
        <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-5 flex items-center gap-2">
          <Star className="w-4 h-4 text-[#C5A059]" />
          Nuevos pacientes potenciales
          <span className="ml-auto font-crimson text-xs text-gray-500 normal-case">
            Completaron el curso — sin pack activo
          </span>
        </h2>

        {potentialPatients.length === 0 ? (
          <p className="font-crimson text-gray-500 text-sm text-center py-6">
            No hay candidatos nuevos en este momento.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#C5A059]/10">
                  {["Nombre", "Email", "Completó el curso", "Acción"].map((h) => (
                    <th
                      key={h}
                      className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {potentialPatients.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition"
                  >
                    <td className="py-3 pr-4">
                      <p className="font-crimson text-sm text-gray-200">
                        {p.full_name ?? "—"}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-cinzel text-[9px] text-gray-500">{p.email}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-crimson text-sm text-emerald-400">
                        {certMap[p.id]
                          ? new Date(certMap[p.id]).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/admin/pacientes/${p.id}/pack`}
                        className="font-cinzel text-[9px] uppercase tracking-widest bg-[#C5A059] text-[#020617] px-3 py-1.5 hover:bg-[#C5A059]/90 transition"
                      >
                        Asignar pack
                      </Link>
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    scheduled: { label: "Programada", cls: "text-amber-400 border-amber-500/30 bg-amber-950/30" },
    completed: { label: "Completada", cls: "text-emerald-400 border-emerald-500/30 bg-emerald-950/30" },
    cancelled: { label: "Cancelada", cls: "text-red-400 border-red-500/30 bg-red-950/30" },
    rescheduled: { label: "Reprogramada", cls: "text-blue-400 border-blue-500/30 bg-blue-950/30" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "text-gray-400 border-gray-700 bg-gray-900/30" };
  return (
    <span className={`inline-flex font-cinzel text-[9px] uppercase tracking-widest border px-2 py-0.5 ${cls}`}>
      {label}
    </span>
  );
}
