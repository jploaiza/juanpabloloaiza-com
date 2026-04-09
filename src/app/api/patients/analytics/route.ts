import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sessionsLeft, type Patient } from "@/lib/patients";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return await createAdminClient();
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function last6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

// GET /api/patients/analytics
export async function GET() {
  const adminSb = await assertAdmin();
  if (!adminSb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];
  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 3600 * 1000).toISOString();

  const [
    { data: patients },
    { data: sessionLogs },
    { data: purchases },
  ] = await Promise.all([
    adminSb.from("patients").select("id, first_name, last_name, status, sessions_used, total_sessions, pack_size, start_date, end_date, created_at"),
    adminSb.from("patient_logs").select("created_at").eq("type", "session_registered").gte("created_at", sixMonthsAgo),
    adminSb.from("patient_session_purchases").select("patient_id, quantity, created_at").gte("created_at", sixMonthsAgo).order("created_at", { ascending: false }),
  ]);

  const allPatients = (patients ?? []) as (Patient & { created_at: string })[];

  // Status counts
  const byStatus = { active: 0, paused: 0, finished: 0 };
  for (const p of allPatients) {
    if (p.status in byStatus) byStatus[p.status as keyof typeof byStatus]++;
  }

  // Session totals
  let totalUsed = 0;
  let totalCapacity = 0;
  for (const p of allPatients) {
    const cap = p.total_sessions || p.pack_size;
    totalUsed += p.sessions_used;
    totalCapacity += cap;
  }
  const totalRemaining = Math.max(0, totalCapacity - totalUsed);

  // Expiring soon — active patients with valid end_date
  const activePatients = allPatients.filter((p) => p.status === "active");
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expiringSoon = activePatients
    .map((p) => {
      const end = new Date(p.end_date + "T00:00:00");
      const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { id: p.id, first_name: p.first_name, last_name: p.last_name, end_date: p.end_date, daysLeft };
    })
    .filter((p) => p.daysLeft <= 30 && p.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Active patients with no sessions left
  const noSessionsActive = activePatients.filter((p) => sessionsLeft(p) === 0).length;

  // Monthly new patients (last 6 months)
  const months = last6Months();
  const monthlyNewMap: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]));
  for (const p of allPatients) {
    const mk = monthKey(p.created_at ?? "");
    if (mk in monthlyNewMap) monthlyNewMap[mk]++;
  }
  const monthlyNewPatients = months.map((m) => ({ month: m, count: monthlyNewMap[m] }));

  // Monthly sessions registered (from logs)
  const monthlySessMap: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]));
  for (const log of sessionLogs ?? []) {
    const mk = monthKey(log.created_at ?? "");
    if (mk in monthlySessMap) monthlySessMap[mk]++;
  }
  const monthlySessions = months.map((m) => ({ month: m, count: monthlySessMap[m] }));

  // Average sessions used per patient (active only)
  const avgSessionsUsed =
    activePatients.length > 0
      ? Math.round((activePatients.reduce((s, p) => s + p.sessions_used, 0) / activePatients.length) * 10) / 10
      : 0;

  // Average completion rate (sessions_used / capacity, active only)
  const completionRates = activePatients.map((p) => {
    const cap = p.total_sessions || p.pack_size;
    return cap > 0 ? p.sessions_used / cap : 0;
  });
  const avgCompletionRate =
    completionRates.length > 0
      ? Math.round((completionRates.reduce((s, r) => s + r, 0) / completionRates.length) * 100)
      : 0;

  // Recent purchases (last 5)
  const recentPurchases = (purchases ?? []).slice(0, 5).map((pu) => {
    const patient = allPatients.find((p) => p.id === pu.patient_id);
    return {
      name: patient ? `${patient.first_name} ${patient.last_name}` : "—",
      quantity: pu.quantity,
      created_at: pu.created_at,
    };
  });

  // Monthly purchases volume
  const monthlyPurchasesMap: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]));
  for (const pu of purchases ?? []) {
    const mk = monthKey(pu.created_at ?? "");
    if (mk in monthlyPurchasesMap) monthlyPurchasesMap[mk] += pu.quantity;
  }
  const monthlyPurchases = months.map((m) => ({ month: m, count: monthlyPurchasesMap[m] }));

  return NextResponse.json({
    byStatus,
    sessions: { totalUsed, totalRemaining, totalCapacity },
    expiringSoon,
    noSessionsActive,
    monthlyNewPatients,
    monthlySessions,
    monthlyPurchases,
    avgSessionsUsed,
    avgCompletionRate,
    recentPurchases,
    totalPatients: allPatients.length,
  });
}
