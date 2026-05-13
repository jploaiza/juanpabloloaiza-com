/**
 * POST /api/calendar/manage
 * Body: { code: string, action: "cancel" }
 */
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { getValidToken, deleteCalendarEvent, type GCalTokenData } from "@/lib/google-calendar";
import { deleteZoomMeeting } from "@/lib/zoom";
import { getCalendarConfig } from "@/lib/booking-config";
import { renderTemplate, renderTemplateHtml } from "@/lib/templates";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const ip = getIp(req.headers);
  if (!rateLimit(`cal-manage:${ip}`, 10, 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  let body: { code?: string; action?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const { code, action } = body;
  if (!code?.trim() || action !== "cancel") {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const sb = createAdminClient();

  const { data: booking } = await sb
    .from("bookings")
    .select("id, status, type, date, time_slot, patient_name, patient_email, patient_phone, google_event_id, zoom_meeting_id, zoom_join_url")
    .eq("booking_code", code.trim().toUpperCase())
    .single();

  if (!booking) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  if (booking.status === "cancelled") return NextResponse.json({ error: "Esta reserva ya fue cancelada" }, { status: 409 });

  // Delete Google Calendar event
  try {
    const { data: stored } = await sb
      .from("google_calendar_tokens")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();
    if (stored && booking.google_event_id) {
      const { token, newExpiresAt } = await getValidToken(stored as GCalTokenData);
      if (newExpiresAt) {
        await sb
          .from("google_calendar_tokens")
          .update({ access_token: token, expires_at: newExpiresAt, updated_at: new Date().toISOString() })
          .eq("user_id", stored.user_id);
      }
      await deleteCalendarEvent(token, stored.calendar_id ?? "primary", booking.google_event_id);
    }
  } catch { /* non-critical */ }

  // Delete Zoom meeting
  if (booking.zoom_meeting_id) {
    await deleteZoomMeeting(Number(booking.zoom_meeting_id));
  }

  // Mark as cancelled
  await sb.from("bookings").update({
    status: "cancelled",
    cancelled_at: new Date().toISOString(),
  }).eq("id", booking.id);

  // Fire cancellation alerts (non-blocking)
  void (async () => {
    try {
      const [config, { data: templates }] = await Promise.all([
        getCalendarConfig(),
        sb.from("booking_alert_templates")
          .select("channel, subject, body")
          .eq("event_type_slug", booking.type)
          .eq("trigger", "cancellation")
          .eq("is_active", true),
      ]);

      const dateLabel = new Date(`${booking.date}T12:00:00`).toLocaleDateString("es-CL", {
        timeZone: "America/Santiago",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const firstName = (booking.patient_name as string).split(" ")[0];
      const vars: Record<string, string> = {
        name: booking.patient_name as string,
        first_name: firstName,
        email: booking.patient_email as string,
        type_label: booking.type === "session" ? "Sesión TRVP" : "Entrevista de Admisión",
        date: booking.date as string,
        date_long: dateLabel,
        time: booking.time_slot as string,
        site_url: config.site_url,
        logo_url: config.logo_url,
        zoom_join_url: (booking.zoom_join_url as string) ?? "",
      };

      for (const tpl of templates ?? []) {
        if (tpl.channel === "email") {
          try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            const rendered = renderTemplateHtml(tpl.body as string, vars);
            const subject = tpl.subject ? renderTemplate(tpl.subject as string, vars) : `Tu ${vars.type_label} ha sido cancelada`;
            await resend.emails.send({ from: config.from_email, to: booking.patient_email as string, subject, html: rendered });
          } catch { /* log silently */ }
        } else if (tpl.channel === "whatsapp" && booking.patient_phone) {
          const rendered = renderTemplate(tpl.body as string, vars);
          await sendWhatsApp({ to: booking.patient_phone as string, body: rendered });
        }
      }
    } catch { /* non-critical */ }
  })();

  return NextResponse.json({ ok: true });
}
