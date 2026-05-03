import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import AcademyCard from "@/components/academy/AcademyCard";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import { Mail, Send } from "lucide-react";
import CommsManualSend from "./CommsManualSend";

export const metadata: Metadata = { title: "Comunicaciones — Admin" };

type CommLog = {
  id: string;
  sent_at: string;
  user_id: string;
  type: string;
  subject: string | null;
  status: "sent" | "failed";
};

type CommType =
  | "weekly_reminder"
  | "expiry_7d"
  | "expiry_1d"
  | "expiry_final"
  | "manual"
  | "new_patient";

const TYPE_LABELS: Record<string, string> = {
  weekly_reminder: "Recordatorio semanal",
  expiry_7d: "Vence en 7 días",
  expiry_1d: "Vence mañana",
  expiry_final: "Vencimiento final",
  manual: "Manual",
  new_patient: "Nuevo paciente",
};

function TypeBadge({ type }: { type: string }) {
  const configs: Record<string, string> = {
    weekly_reminder: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    expiry_7d: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    expiry_1d: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    expiry_final: "bg-red-500/10 text-red-400 border-red-500/20",
    manual: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    new_patient: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  const style =
    configs[type] ?? "bg-white/5 text-gray-400 border-white/10";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest border ${style}`}
    >
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

function StatusBadge({ status }: { status: "sent" | "failed" }) {
  return status === "sent" ? (
    <span className="font-cinzel text-[8px] uppercase tracking-widest text-emerald-400">
      Enviado
    </span>
  ) : (
    <span className="font-cinzel text-[8px] uppercase tracking-widest text-red-400">
      Fallido
    </span>
  );
}

export default async function ComunicacionesPage() {
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

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [{ data: commLogs }, { data: activePatients }] = await Promise.all([
    adminSb
      .from("comms_log")
      .select("id, sent_at, user_id, type, subject, status")
      .order("sent_at", { ascending: false })
      .limit(50),
    adminSb
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "patient")
      .order("full_name", { ascending: true }),
  ]);

  const logs = (commLogs ?? []) as CommLog[];
  const emailsThisWeek = logs.filter(
    (l) => new Date(l.sent_at) >= startOfWeek
  ).length;
  const emailsThisMonth = logs.filter(
    (l) => new Date(l.sent_at) >= startOfMonth
  ).length;

  // Map user_id to profile for display
  const profileMap: Record<string, { full_name: string | null; email: string }> = {};
  for (const p of activePatients ?? []) {
    profileMap[p.id] = { full_name: p.full_name, email: p.email };
  }

  // Also include any user_ids from comms logs not in activePatients
  // We'll fetch those separately to avoid N+1 pattern
  const unknownIds = [
    ...new Set(
      logs
        .map((l) => l.user_id)
        .filter((id) => id && !profileMap[id])
    ),
  ];

  if (unknownIds.length > 0) {
    const { data: extraProfiles } = await adminSb
      .from("profiles")
      .select("id, full_name, email")
      .in("id", unknownIds);

    for (const p of extraProfiles ?? []) {
      profileMap[p.id] = { full_name: p.full_name, email: p.email };
    }
  }

  const commTypes: CommType[] = [
    "weekly_reminder",
    "expiry_7d",
    "expiry_1d",
    "expiry_final",
    "manual",
    "new_patient",
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-20">
      {/* Header */}
      <div className="mb-8">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">
          Panel de administración
        </p>
        <h1 className="font-cinzel text-2xl text-white">Comunicaciones</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: "Emails esta semana", value: emailsThisWeek, icon: Mail },
          { label: "Emails este mes", value: emailsThisMonth, icon: Send },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="relative bg-[#16213e] border border-white/5 p-5 overflow-hidden"
          >
            <ScrollworkCorners size={36} opacity={0.7} />
            <Icon className="w-4 h-4 text-[#C5A059] mb-3" />
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">
              {label}
            </p>
            <p className="font-cinzel text-2xl text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Log table */}
        <div className="lg:col-span-2">
          <AcademyCard>
            <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-6">
              Historial de envíos
              <span className="ml-3 font-crimson text-xs text-gray-500 normal-case">
                Últimos {logs.length}
              </span>
            </h2>

            {logs.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-8 h-8 text-[#C5A059]/20 mx-auto mb-3" />
                <p className="font-crimson text-sm text-gray-600">
                  No hay emails enviados todavía.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Fecha", "Paciente", "Tipo", "Asunto", "Estado"].map((h) => (
                        <th
                          key={h}
                          className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-3 last:pr-0"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const patient = profileMap[log.user_id];
                      return (
                        <tr
                          key={log.id}
                          className="border-b border-white/[0.03] hover:bg-white/[0.02] transition"
                        >
                          <td className="py-3 pr-3">
                            <span className="font-crimson text-xs text-gray-500 whitespace-nowrap">
                              {new Date(log.sent_at).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>
                          <td className="py-3 pr-3">
                            <p className="font-crimson text-sm text-gray-300 leading-tight">
                              {patient?.full_name ?? "—"}
                            </p>
                            <p className="font-cinzel text-[8px] text-gray-600 truncate max-w-[130px]">
                              {patient?.email ?? log.user_id}
                            </p>
                          </td>
                          <td className="py-3 pr-3">
                            <TypeBadge type={log.type} />
                          </td>
                          <td className="py-3 pr-3">
                            <span className="font-crimson text-xs text-gray-500 truncate max-w-[150px] block">
                              {log.subject ?? "—"}
                            </span>
                          </td>
                          <td className="py-3">
                            <StatusBadge status={log.status} />
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

        {/* Manual send */}
        <div>
          <CommsManualSend
            patients={(activePatients ?? []).map((p) => ({
              id: p.id,
              full_name: p.full_name,
              email: p.email,
            }))}
            commTypes={commTypes}
            typeLabels={TYPE_LABELS}
          />
        </div>
      </div>
    </div>
  );
}
