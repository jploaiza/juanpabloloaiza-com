import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import AcademyCard from "@/components/academy/AcademyCard";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import PackBadge from "@/components/admin/PackBadge";
import TherapistNotesForm from "@/components/admin/TherapistNotesForm";
import { ChevronLeft, CheckCircle, Clock, XCircle, AlertCircle, Plus, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Paciente ${id} — Admin JPL` };
}

function daysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
    scheduled: { label: "Programada", cls: "text-amber-400 border-amber-500/30 bg-amber-950/30", Icon: Clock },
    completed: { label: "Completada", cls: "text-emerald-400 border-emerald-500/30 bg-emerald-950/30", Icon: CheckCircle },
    cancelled: { label: "Cancelada", cls: "text-red-400 border-red-500/30 bg-red-950/30", Icon: XCircle },
    rescheduled: { label: "Reprogramada", cls: "text-blue-400 border-blue-500/30 bg-blue-950/30", Icon: AlertCircle },
  };
  const entry = map[status] ?? { label: status, cls: "text-gray-400 border-gray-700", Icon: Clock };
  const { label, cls, Icon } = entry;
  return (
    <span className={`inline-flex items-center gap-1 font-cinzel text-[9px] uppercase tracking-widest border px-2 py-0.5 ${cls}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

function PatientStatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Activo", cls: "text-emerald-400 border-emerald-500/30 bg-emerald-950/30" },
    inactive: { label: "Inactivo", cls: "text-gray-400 border-gray-700 bg-gray-900/30" },
    prospect: { label: "Prospecto", cls: "text-blue-400 border-blue-500/30 bg-blue-950/30" },
    completed: { label: "Completado", cls: "text-purple-400 border-purple-500/30 bg-purple-950/30" },
  };
  const s = status ?? "inactive";
  const { label, cls } = map[s] ?? { label: s, cls: "text-gray-400 border-gray-700" };
  return (
    <span className={`inline-flex font-cinzel text-[9px] uppercase tracking-widest border px-2.5 py-1 ${cls}`}>
      {label}
    </span>
  );
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const adminSb = await createAdminClient();

  const [
    { data: profile },
    { data: packs },
    { data: sessions },
    { data: commsLog },
    { data: enrollment },
    { data: certificate },
    { data: lessonProgress },
    { data: allLessons },
  ] = await Promise.all([
    adminSb.from("profiles").select("*").eq("id", id).single(),
    adminSb
      .from("patient_packs")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    adminSb
      .from("therapy_sessions")
      .select("*")
      .eq("user_id", id)
      .order("scheduled_at", { ascending: false }),
    adminSb
      .from("comms_log")
      .select("*")
      .eq("user_id", id)
      .order("sent_at", { ascending: false })
      .limit(10),
    adminSb.from("enrollments").select("*").eq("user_id", id).single(),
    adminSb.from("certificates").select("*").eq("user_id", id).single(),
    adminSb
      .from("lesson_progress")
      .select("is_completed, watch_seconds")
      .eq("user_id", id),
    adminSb.from("lessons").select("id").eq("is_published", true),
  ]);

  if (!profile) notFound();

  const activePack = (packs ?? []).find((p) => p.is_active) ?? null;
  const pastPacks = (packs ?? []).filter((p) => !p.is_active);

  const totalLessons = allLessons?.length ?? 1;
  const completedLessons = (lessonProgress ?? []).filter((l) => l.is_completed).length;
  const progressPct = Math.round((completedLessons / totalLessons) * 100);
  const totalWatchSeconds = (lessonProgress ?? []).reduce((acc, l) => acc + (l.watch_seconds ?? 0), 0);

  const activeDays = activePack ? daysLeft(activePack.end_date) : null;
  const activeSessionsLeft = activePack
    ? activePack.sessions_total - activePack.sessions_used
    : 0;
  const activeProgressPct = activePack
    ? Math.round((activePack.sessions_used / activePack.sessions_total) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      {/* Back */}
      <Link
        href="/admin/pacientes"
        className="inline-flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition mb-6"
      >
        <ChevronLeft className="w-3 h-3" /> Pacientes
      </Link>

      {/* Patient header */}
      <div className="mb-8 flex flex-wrap items-start gap-4 justify-between">
        <div>
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">
            Ficha de paciente
          </p>
          <h1 className="font-cinzel text-2xl sm:text-3xl text-white mb-2">
            {profile.full_name ?? "Sin nombre"}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <PatientStatusBadge status={profile.patient_status} />
            <span className="font-cinzel text-[9px] text-gray-500">{profile.email}</span>
            {profile.phone && (
              <span className="font-cinzel text-[9px] text-gray-500">{profile.phone}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/pacientes/${id}/pack`}
            className="flex items-center gap-1.5 font-cinzel text-[10px] uppercase tracking-widest bg-[#C5A059] text-[#020617] px-4 py-2 hover:bg-[#C5A059]/90 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            {activePack ? "Renovar pack" : "Asignar pack"}
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course progress */}
          <div className="relative bg-[#0a1628] border border-white/5 p-5 overflow-hidden">
            <ScrollworkCorners size={36} opacity={0.6} />
            <div className="flex items-center justify-between mb-3">
              <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500">
                Progreso del curso
              </p>
              <span className="font-cinzel text-[11px] text-[#C5A059]">{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#0f172a] overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-[#C5A059] to-[#F3E5AB] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex gap-6 mt-3">
              <span className="font-crimson text-xs text-gray-500">
                {completedLessons}/{totalLessons} lecciones completadas
              </span>
              <span className="font-crimson text-xs text-gray-500">
                {Math.round(totalWatchSeconds / 60)} min vistos
              </span>
              {certificate && (
                <span className="font-cinzel text-[9px] uppercase tracking-widest text-emerald-400 border border-emerald-500/30 px-2 py-0.5">
                  Certificado emitido
                </span>
              )}
            </div>
          </div>

          {/* Active pack card */}
          {activePack ? (
            <AcademyCard gold>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">
                    Pack activo · {activePack.pack_type} sesión{activePack.pack_type > 1 ? "es" : ""}
                  </p>
                  <PackBadge
                    sessionsUsed={activePack.sessions_used}
                    sessionsTotal={activePack.sessions_total}
                    endDate={activePack.end_date}
                    isActive={activePack.is_active}
                  />
                </div>
                <div className="text-right">
                  <p className="font-cinzel text-[9px] text-gray-500 mb-0.5">Vence</p>
                  <p className="font-cinzel text-sm text-gray-300">
                    {new Date(activePack.end_date).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {activeDays !== null && (
                    <p
                      className={`font-cinzel text-[10px] mt-0.5 ${
                        activeDays <= 7
                          ? "text-red-400"
                          : activeDays <= 14
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {activeDays <= 0 ? "Vencido" : `${activeDays} días restantes`}
                    </p>
                  )}
                </div>
              </div>

              {/* Sessions progress bar */}
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500">
                    Sesiones usadas
                  </span>
                  <span className="font-cinzel text-[9px] text-gray-400">
                    {activePack.sessions_used}/{activePack.sessions_total}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#0f172a] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C5A059] to-[#F3E5AB]"
                    style={{ width: `${activeProgressPct}%` }}
                  />
                </div>
              </div>

              {activePack.notes && (
                <p className="font-crimson text-xs text-gray-500 mt-2 italic">
                  {activePack.notes}
                </p>
              )}
            </AcademyCard>
          ) : (
            <div className="relative bg-[#0a1628] border border-dashed border-white/10 p-6 text-center">
              <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-600 mb-3">
                Sin pack activo
              </p>
              <Link
                href={`/admin/pacientes/${id}/pack`}
                className="font-cinzel text-[10px] uppercase tracking-widest bg-[#C5A059] text-[#020617] px-4 py-2 hover:bg-[#C5A059]/90 transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Asignar pack
              </Link>
            </div>
          )}

          {/* Session history */}
          <AcademyCard>
            <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-5">
              Historial de sesiones
              <span className="ml-3 font-crimson text-xs text-gray-500 normal-case">
                {sessions?.length ?? 0} sesiones
              </span>
            </h2>

            {(sessions ?? []).length === 0 ? (
              <p className="font-crimson text-gray-500 text-sm text-center py-6">
                No hay sesiones registradas.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Fecha", "Estado", "Tema", "Score", "Seguimiento"].map((h) => (
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
                    {(sessions ?? []).map((session) => (
                      <tr
                        key={session.id}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition"
                      >
                        <td className="py-3 pr-3">
                          <p className="font-cinzel text-[10px] text-gray-300">
                            {new Date(session.scheduled_at).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="font-cinzel text-[9px] text-gray-600">
                            {new Date(session.scheduled_at).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </td>
                        <td className="py-3 pr-3">
                          <StatusBadge status={session.status} />
                        </td>
                        <td className="py-3 pr-3">
                          <span className="font-crimson text-sm text-gray-400">
                            {session.topic ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          {session.progress_score != null ? (
                            <span className="font-cinzel text-[11px] text-[#C5A059]">
                              {session.progress_score}/10
                            </span>
                          ) : (
                            <span className="font-cinzel text-[11px] text-gray-600">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          {session.follow_up_required ? (
                            <span className="font-cinzel text-[9px] uppercase tracking-widest text-amber-400 border border-amber-500/30 px-2 py-0.5">
                              Sí
                            </span>
                          ) : (
                            <span className="font-cinzel text-[9px] text-gray-600">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AcademyCard>

          {/* Pack history */}
          {pastPacks.length > 0 && (
            <AcademyCard>
              <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-4">
                Historial de packs
              </h2>
              <div className="space-y-3">
                {pastPacks.map((pack) => (
                  <div
                    key={pack.id}
                    className="flex items-center justify-between py-2 border-b border-white/[0.03]"
                  >
                    <div>
                      <p className="font-cinzel text-[10px] text-gray-400">
                        Pack {pack.pack_type} · {pack.sessions_used}/{pack.sessions_total} sesiones
                      </p>
                      <p className="font-cinzel text-[9px] text-gray-600 mt-0.5">
                        {new Date(pack.start_date).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        →{" "}
                        {new Date(pack.end_date).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {pack.price_paid != null && (
                      <span className="font-cinzel text-[10px] text-gray-500">
                        ${pack.price_paid}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </AcademyCard>
          )}
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-6">
          {/* Therapist notes */}
          <AcademyCard gold>
            <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-4">
              Notas privadas
            </h2>
            <TherapistNotesForm userId={id} initialNotes={profile.therapist_notes ?? ""} />
          </AcademyCard>

          {/* Communication log */}
          <AcademyCard>
            <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#C5A059]" />
              Comunicaciones
            </h2>

            {(commsLog ?? []).length === 0 ? (
              <p className="font-crimson text-gray-600 text-xs text-center py-4">
                Sin comunicaciones registradas.
              </p>
            ) : (
              <div className="space-y-3">
                {(commsLog ?? []).map((comm) => (
                  <div key={comm.id} className="border-b border-white/[0.03] pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]">
                        {comm.type}
                      </span>
                      <span className="font-cinzel text-[9px] text-gray-600">
                        {new Date(comm.sent_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    {comm.subject && (
                      <p className="font-crimson text-xs text-gray-300">{comm.subject}</p>
                    )}
                    {comm.body_preview && (
                      <p className="font-crimson text-xs text-gray-600 truncate">
                        {comm.body_preview}
                      </p>
                    )}
                    <span
                      className={`font-cinzel text-[8px] uppercase tracking-widest ${
                        comm.status === "sent" ? "text-emerald-500" : "text-gray-500"
                      }`}
                    >
                      {comm.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </AcademyCard>

          {/* Quick actions */}
          <div className="relative bg-[#0a1628] border border-white/5 p-5 overflow-hidden">
            <ScrollworkCorners size={32} opacity={0.5} />
            <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-4">
              Acciones rápidas
            </h2>
            <div className="flex flex-col gap-2">
              <Link
                href={`/admin/pacientes/${id}/pack`}
                className="font-cinzel text-[10px] uppercase tracking-widest border border-[#C5A059]/40 text-[#C5A059] px-4 py-2.5 hover:bg-[#C5A059]/10 transition text-center"
              >
                {activePack ? "Renovar pack" : "Asignar pack"}
              </Link>
              {enrollment && (
                <Link
                  href="/admin/analytics"
                  className="font-cinzel text-[10px] uppercase tracking-widest border border-white/10 text-gray-400 px-4 py-2.5 hover:border-white/20 transition text-center"
                >
                  Ver progreso del curso
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
