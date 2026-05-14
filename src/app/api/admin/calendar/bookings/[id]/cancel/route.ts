/**
 * POST /api/admin/calendar/bookings/[id]/cancel
 * Admin-initiated cancellation: bypasses policy checks, deletes GCal + Zoom, notifies patient.
 */
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { assertAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getValidToken, deleteCalendarEvent, type GCalTokenData } from "@/lib/google-calendar";
import { deleteZoomMeeting } from "@/lib/zoom";
import { getCalendarConfig } from "@/lib/booking-config";
import { renderTemplate, renderTemplateHtml } from "@/lib/templates";
import { sendWhatsApp } from "@/lib/whatsapp";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  let body: { cancel_reason?: string } = {};
  try { body = await req.json(); } catch { /* optional body */ }

  const adminSb = createAdminClient();

  const { data: booking } = await adminSb
    .from("bookings")
    .select("id, status, type, date, time_slot, patient_name, patient_email, patient_phone, booking_code, google_event_id, zoom_meeting_id, zoom_join_url")
    .eq("id", id)
    .single();

  if (!booking) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  if (booking.status === "cancelled") return NextResponse.json({ error: "Ya está cancelada" }, { status: 409 });
  if (booking.status === "rejected") return NextResponse.json({ error: "Ya fue rechazada" }, { status: 409 });

  // Delete Google Calendar event
  try {
    const { data: stored } = await adminSb
      .from("google_calendar_tokens")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();
    if (stored && booking.google_event_id) {
      const { token, newExpiresAt } = await getValidToken(stored as GCalTokenData);
      if (newExpiresAt) {
        await adminSb.from("google_calendar_tokens")
          .update({ access_token: token, expires_at: newExpiresAt, updated_at: new Date().toISOString() })
          .eq("user_id", stored.user_id);
      }
      await deleteCalendarEvent(token, stored.calendar_id ?? "primary", booking.google_event_id as string);
    }
  } catch { /* non-critical */ }

  // Delete Zoom meeting
  const config = await getCalendarConfig();
  if (booking.zoom_meeting_id) {
    await deleteZoomMeeting(Number(booking.zoom_meeting_id), config.zoom_credentials);
  }

  // Update status
  const cancelReason = body.cancel_reason?.trim().slice(0, 500) ?? null;
  await adminSb.from("bookings").update({
    status: "cancelled",
    cancelled_at: new Date().toISOString(),
    cancel_reason: cancelReason,
  }).eq("id", id);

  // Send cancellation notifications (non-blocking)
  void (async () => {
    try {
      const { data: templates } = await adminSb
        .from("booking_alert_templates")
        .select("channel, subject, body")
        .eq("event_type_slug", booking.type as string)
        .eq("trigger", "cancellation")
        .eq("is_active", true);

      const dateLabel = new Date(`${booking.date}T12:00:00`).toLocaleDateString("es-CL", {
        timeZone: "America/Santiago",
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
      const typeLabel = booking.type === "session" ? "Sesión TRVP" : "Entrevista de Admisión";
      const firstName = (booking.patient_name as string).split(" ")[0];
      const vars: Record<string, string> = {
        name: booking.patient_name as string,
        first_name: firstName,
        email: booking.patient_email as string,
        type_label: typeLabel,
        date: booking.date as string,
        date_long: dateLabel,
        time: booking.time_slot as string,
        site_url: config.site_url,
        logo_url: config.logo_url,
        zoom_join_url: (booking.zoom_join_url as string) ?? "",
        cancel_reason: cancelReason ?? "",
        booking_code: booking.booking_code as string,
      };

      for (const tpl of templates ?? []) {
        if (tpl.channel === "email") {
          try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            const subject = tpl.subject
              ? renderTemplate(tpl.subject as string, vars)
              : `Tu ${typeLabel} ha sido cancelada`;
            await resend.emails.send({
              from: config.from_email,
              to: booking.patient_email as string,
              subject,
              html: renderTemplateHtml(tpl.body as string, vars),
            });
          } catch { /* non-critical */ }
        } else if (tpl.channel === "whatsapp" && booking.patient_phone) {
          await sendWhatsApp({ to: booking.patient_phone as string, body: renderTemplate(tpl.body as string, vars) });
        }
      }
    } catch { /* non-critical */ }
  })();

  return NextResponse.json({ ok: true });
}
