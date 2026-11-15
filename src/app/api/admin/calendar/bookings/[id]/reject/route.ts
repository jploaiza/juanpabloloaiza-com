/**
 * POST /api/admin/calendar/bookings/[id]/reject
 * Rejects a pending booking: updates status, sends rejection notification to patient.
 * Body: { reason?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppAfter } from "@/lib/whatsapp-after";
import { Resend } from "resend";
import { assertAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getCalendarConfig } from "@/lib/booking-config";
import { renderTemplate, renderTemplateHtml } from "@/lib/templates";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
import { buildBookingTimeVars } from "@/lib/booking-time";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  let body: { reason?: string } = {};
  try { body = await req.json(); } catch { /* reason is optional */ }

  const adminSb = createAdminClient();

  // Fetch booking
  const { data: booking, error: bookingError } = await adminSb
    .from("bookings")
    .select("*") // includes user_tz once migration 018 is applied
    .eq("id", id)
    .single();

  if (bookingError || !booking) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  if (booking.status !== "pending") {
    return NextResponse.json({ error: "Esta reserva no está pendiente de aprobación" }, { status: 409 });
  }

  const reason = body.reason?.trim() ?? "";

  // Update booking to rejected
  await adminSb
    .from("bookings")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", id);

  // Build template vars
  const config = await getCalendarConfig();
  const safeName = (booking.patient_name as string) ?? "";
  const firstName = safeName.split(" ")[0];

  const templateVars: Record<string, string> = {
    name: safeName,
    first_name: firstName,
    email: (booking.patient_email as string).toLowerCase(),
    phone: (booking.patient_phone as string) ?? "",
    type_label: booking.type as string,
    date: booking.date as string,
    ...buildBookingTimeVars(booking.date as string, booking.time_slot as string, booking.user_tz as string | null | undefined),
    reason,
    site_url: config.site_url,
    logo_url: config.logo_url,
    therapist_name: "Juan Pablo Loaiza",
  };

  // Load rejection templates
  const { data: templates } = await adminSb
    .from("booking_alert_templates")
    .select("channel, subject, body")
    .eq("event_type_slug", booking.type as string)
    .eq("trigger", "rejection")
    .eq("is_active", true);

  const emailTpl = templates?.find((t) => t.channel === "email");
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject = emailTpl?.subject
      ? renderTemplate(emailTpl.subject as string, templateVars)
      : `Solicitud no aprobada — ${booking.type} ${templateVars.date_long} ${templateVars.time}`;
    const html = emailTpl?.body
      ? renderTemplateHtml(emailTpl.body as string, templateVars)
      : `<p>Lo sentimos, ${escapeHtml(firstName)}. Tu solicitud para el ${escapeHtml(templateVars.date_long)} a las ${escapeHtml(templateVars.time)} no pudo ser aprobada.${reason ? ` Motivo: ${escapeHtml(reason)}` : ""}</p><p>Si tienes preguntas, contáctanos en <a href="${escapeHtml(config.site_url)}">${escapeHtml(config.site_url)}</a>.</p>`;
    await resend.emails.send({
      from: config.from_email,
      to: (booking.patient_email as string).toLowerCase(),
      subject,
      html,
    });
  } catch { /* non-critical */ }

  const waTpl = templates?.find((t) => t.channel === "whatsapp");
  if (waTpl && booking.patient_phone) {
    sendWhatsAppAfter({ to: booking.patient_phone as string, body: renderTemplate(waTpl.body as string, templateVars), context: "booking_rejected" });
  }

  return NextResponse.json({ ok: true });
}
