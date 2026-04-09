// ================================================================
// lib/patients.ts — Tipos y helpers para el CRM de pacientes
// ================================================================

export type PackSize = number;
export type PatientStatus = "active" | "paused" | "finished";
export type LogType = "reminder_sent" | "session_registered" | "note_added" | "status_changed";

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  pack_size: PackSize;
  sessions_used: number;
  total_sessions: number;
  start_date: string;
  end_date: string;
  status: PatientStatus;
  notes: string | null;
  reminder_day: number;
  created_at: string;
}

export interface PatientLog {
  id: string;
  patient_id: string;
  type: LogType;
  content: string;
  created_at: string;
}

export interface SessionPurchase {
  id: string;
  patient_id: string;
  quantity: number;
  notes: string | null;
  purchased_at: string;
}

// ── Nombre completo ─────────────────────────────────────────────
export function patientFullName(patient: Pick<Patient, "first_name" | "last_name">): string {
  return `${patient.first_name} ${patient.last_name}`.trim();
}

// ── Validez por pack ────────────────────────────────────────────
export const PACK_WEEKS: Record<number, number> = { 1: 2, 3: 4, 5: 7, 8: 11, 10: 14 };

export const REMINDER_DAYS = [
  "Domingo", "Lunes", "Martes", "Miércoles",
  "Jueves", "Viernes", "Sábado",
];

// ── Cálculo de fechas ───────────────────────────────────────────
export function calcEndDate(startDate: string, packSize: number): string {
  const d = new Date(startDate + "T12:00:00");
  const weeks = PACK_WEEKS[packSize] ?? Math.ceil(packSize * 1.5);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split("T")[0];
}

export function daysLeft(endDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate + "T00:00:00");
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function sessionsLeft(patient: Patient): number {
  return Math.max(0, patient.total_sessions - patient.sessions_used);
}

// ── Alertas ─────────────────────────────────────────────────────
export interface PatientAlert {
  type: "danger" | "warning" | "orange";
  message: string;
}

export function getAlerts(patient: Patient, lastSessionAt?: string | null): PatientAlert[] {
  const alerts: PatientAlert[] = [];
  if (patient.status !== "active") return alerts;

  const dl = daysLeft(patient.end_date);
  const sl = sessionsLeft(patient);

  // When no sessions left, skip expiry warnings (irrelevant)
  if (sl === 0) {
    alerts.push({ type: "warning", message: "Sin sesiones — registra una nueva compra" });
    return alerts;
  }

  if (dl < 0) alerts.push({ type: "danger", message: "Pack vencido — sesiones sin plazo" });
  else if (dl < 7) alerts.push({ type: "danger", message: `Pack vence en ${dl} día${dl === 1 ? "" : "s"}` });
  if (sl <= 2) alerts.push({ type: "warning", message: `Solo ${sl} sesión${sl === 1 ? "" : "es"} restante${sl === 1 ? "" : "s"}` });

  if (lastSessionAt) {
    const daysSinceLast = Math.floor(
      (Date.now() - new Date(lastSessionAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLast >= 7) {
      alerts.push({ type: "orange", message: `Sin sesión registrada hace ${daysSinceLast} días` });
    }
  }

  return alerts;
}

// ── URLs de contacto ────────────────────────────────────────────
export function buildWhatsappUrl(patient: Patient): string {
  const name = patient.first_name;
  const sl = sessionsLeft(patient);
  const expiry = new Date(patient.end_date + "T12:00:00").toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
  const msg = `Hola ${name} 👋 Te escribo para recordarte que tienes tu sesión disponible esta semana. Te quedan ${sl} sesiones y tu pack vence el ${expiry}. ¿Agendamos? 🌟`;
  const phone = patient.phone.replace(/[^\d+]/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

export function buildEmailUrl(patient: Patient): string {
  const name = patient.first_name;
  const sl = sessionsLeft(patient);
  const expiry = new Date(patient.end_date + "T12:00:00").toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
  const subject = `Recuerda tomar tus sesiones — Te quedan ${sl}`;
  const body = `Hola ${name},\n\nTe escribo para recordarte que tienes ${sl} sesión${sl === 1 ? "" : "es"} disponible${sl === 1 ? "" : "s"} y tu pack vence el ${expiry}.\n\nNo dejes pasar esta oportunidad de continuar tu proceso de sanación.\n\n¿Agendamos esta semana?\n\nUn abrazo,\nJuan Pablo Loaiza`;
  return `mailto:${patient.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ── Reminder templates (shared source of truth) ─────────────────
export const REMINDER_TEMPLATE_KEY = "crm_reminder_template";
export const REMINDER_TEMPLATE_SIN_SESIONES_KEY = "crm_reminder_template_sin_sesiones";

export const DEFAULT_REMINDER_TEMPLATE =
  "Hola {nombre} 👋 Te escribo para recordarte que tienes tu sesión disponible esta semana. Te quedan {sesiones} sesiones y tu pack vence el {vencimiento}. ¿Agendamos? 🌟";

export const DEFAULT_REMINDER_TEMPLATE_SIN_SESIONES =
  "Hola {nombre} 👋 Ha sido un honor acompañarte en tu proceso de sanación. Para seguir avanzando juntos, te invito a renovar tus sesiones y agendar cuando lo desees — cada paso cuenta en este camino. ¿Continuamos? 🌟";

// ── Reminder WhatsApp message (para cron) ───────────────────────
export function buildReminderText(patient: Patient): string {
  const name = patient.first_name;
  const sl = sessionsLeft(patient);
  const expiry = new Date(patient.end_date + "T12:00:00").toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
  return `Hola ${name} 👋 Te escribo para recordarte que tienes tu sesión disponible esta semana. Te quedan ${sl} sesiones y tu pack vence el ${expiry}. ¿Agendamos? 🌟`;
}

// ── Colores de estado ────────────────────────────────────────────
export function statusColor(status: PatientStatus) {
  return {
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    paused: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    finished: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  }[status];
}

export function statusLabel(status: PatientStatus) {
  return { active: "Activo", paused: "Pausado", finished: "Finalizado" }[status];
}

// ── Colores días restantes ───────────────────────────────────────
export function daysLeftColor(dl: number) {
  if (dl < 7) return "text-red-400";
  if (dl <= 14) return "text-yellow-400";
  return "text-emerald-400";
}
