import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import AcademyCard from "@/components/academy/AcademyCard";
import PackBadge from "@/components/admin/PackBadge";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Pacientes — Admin JPL" };
export const dynamic = "force-dynamic";

type FilterType = "all" | "active" | "noPack" | "expired";

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

function daysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function patientStatusBadge(status: string | null) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Activo", cls: "text-emerald-400 border-emerald-500/30 bg-emerald-950/30" },
    inactive: { label: "Inactivo", cls: "text-gray-400 border-gray-700 bg-gray-900/30" },
    prospect: { label: "Prospecto", cls: "text-blue-400 border-blue-500/30 bg-blue-950/30" },
    completed: { label: "Completado", cls: "text-purple-400 border-purple-500/30 bg-purple-950/30" },
  };
  const s = status ?? "inactive";
  const { label, cls } = map[s] ?? { label: s, cls: "text-gray-400 border-gray-700" };
  return (
    <span className={`inline-flex font-cinzel text-[9px] uppercase tracking-widest border px-2 py-0.5 ${cls}`}>
      {label}
    </span>
  );
}

export default async function PacientesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filter = (sp.filter as FilterType) ?? "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const adminSb = await createAdminClient();

  const [
    { data: profiles },
    { data: activePacks },
    { data: allSessions },
    { data: enrollments },
  ] = await Promise.all([
    adminSb
      .from("profiles")
      .select("id, full_name, email, patient_status, created_at")
      .neq("role", "admin")
      .order("created_at", { ascending: false }),
    adminSb
      .from("patient_packs")
      .select("id, user_id, pack_type, sessions_total, sessions_used, end_date, is_active, start_date")
      .eq("is_active", true),
    adminSb
      .from("therapy_sessions")
      .select("user_id, scheduled_at, status")
      .order("scheduled_at", { ascending: false }),
    adminSb
      .from("enrollments")
      .select("user_id"),
  ]);

  // Build pack lookup: userId → active pack
  const activePackMap: Record<string, typeof activePacks extends (infer T)[] | null ? T : never> = {};
  for (const pack of activePacks ?? []) {
    activePackMap[pack.user_id] = pack;
  }

  // Build last session lookup: userId → last session date
  const lastSessionMap: Record<string, string> = {};
  for (const session of allSessions ?? []) {
    if (!lastSessionMap[session.user_id]) {
      lastSessionMap[session.user_id] = session.scheduled_at;
    }
  }

  // Only enrolled students
  const enrolledSet = new Set((enrollments ?? []).map((e) => e.user_id));

  // Build rows
  const rows = (profiles ?? [])
    .filter((p) => enrolledSet.has(p.id))
    .map((p) => {
      const pack = activePackMap[p.id] ?? null;
      const days = pack ? daysLeft(pack.end_date) : null;
      return { ...p, pack, days, lastSession: lastSessionMap[p.id] ?? null };
    });

  // Apply filter
  const filtered = rows.filter((r) => {
    if (filter === "active") return r.pack !== null;
    if (filter === "noPack") return r.pack === null;
    if (filter === "expired") return r.pack !== null && (r.days !== null && r.days <= 0);
    return true;
  });

  const tabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Activos" },
    { key: "noPack", label: "Sin pack" },
    { key: "expired", label: "Expirados" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      <div className="mb-8">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">
          CRM
        </p>
        <h1 className="font-cinzel text-2xl sm:text-3xl text-white">Pacientes</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/5 pb-0">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/pacientes?filter=${tab.key}`}
            className={`font-cinzel text-[10px] uppercase tracking-widest px-4 py-2.5 transition border-b-2 -mb-px ${
              filter === tab.key
                ? "border-[#C5A059] text-[#C5A059]"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <AcademyCard>
        <p className="font-crimson text-xs text-gray-500 mb-4">
          {filtered.length} paciente{filtered.length !== 1 ? "s" : ""}
        </p>

        {filtered.length === 0 ? (
          <p className="font-crimson text-gray-500 text-sm text-center py-8">
            No hay pacientes en esta categoría.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {[
                    "Nombre",
                    "Email",
                    "Estado",
                    "Pack activo",
                    "Días al vencimiento",
                    "Última sesión",
                    "",
                  ].map((h) => (
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
                {filtered.map((row) => {
                  const days = row.days;
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition"
                    >
                      <td className="py-3 pr-4">
                        <p className="font-crimson text-sm text-gray-200">
                          {row.full_name ?? "—"}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-cinzel text-[9px] text-gray-500 truncate max-w-[150px]">
                          {row.email}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        {patientStatusBadge(row.patient_status)}
                      </td>
                      <td className="py-3 pr-4">
                        {row.pack ? (
                          <PackBadge
                            sessionsUsed={row.pack.sessions_used}
                            sessionsTotal={row.pack.sessions_total}
                            endDate={row.pack.end_date}
                            isActive={row.pack.is_active}
                          />
                        ) : (
                          <span className="font-cinzel text-[9px] text-gray-600">Sin pack</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {days !== null ? (
                          <span
                            className={`font-cinzel text-[11px] ${
                              days <= 0
                                ? "text-red-400"
                                : days <= 7
                                ? "text-amber-400"
                                : "text-gray-400"
                            }`}
                          >
                            {days <= 0 ? "Vencido" : `${days}d`}
                          </span>
                        ) : (
                          <span className="font-cinzel text-[11px] text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-crimson text-sm text-gray-500">
                          {row.lastSession
                            ? new Date(row.lastSession).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                              })
                            : "—"}
                        </span>
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/admin/pacientes/${row.id}`}
                          className="flex items-center gap-1 font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] hover:text-[#C5A059]/80 transition"
                        >
                          Ver ficha <ChevronRight className="w-3 h-3" />
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
  );
}
