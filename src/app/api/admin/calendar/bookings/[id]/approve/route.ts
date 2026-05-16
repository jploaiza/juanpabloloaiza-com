/**
 * POST /api/admin/calendar/bookings/[id]/approve
 * Approves a pending booking: creates GCal event + Zoom meeting,
 * updates status to confirmed, sends confirmation notifications to patient.
 */
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { assertAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getValidToken,
  createCalendarEvent,
  type GCalTokenData,
} from "@/lib/google-calendar";
import { createZoomMeeting } from "@/lib/zoom";
import { BOOKING_TZ, getCalendarConfig, getEventTypes } from "@/lib/booking-config";
import { renderTemplate, renderTemplateHtml } from "@/lib/templates";
import { sendWhatsApp } from "@/lib/whatsapp";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function slotToDate(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const probe = new Date(`${dateStr}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TZ,
    hour: "numeric",
    hour12: false,
    timeZoneName: "shortOffset",
  }).formatToParts(probe);
  const offsetStr = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-4";
  const offsetMatch = offsetStr.match(/GMT([+-]\d+)/);
  const offsetH = offsetMatch ? parseInt(offsetMatch[1]) : -4;
  const midnightUtcMs = new Date(`${dateStr}T${String(-offsetH).padStart(2, "0")}:00:00Z`).getTime();
  return new Date(midnightUtcMs + (h * 60 + m) * 60000);
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const adminSb = createAdminClient();

  // Fetch booking
  const { data: booking, error: bookingError } = await adminSb
    .from("bookings")
    .select("id, type, date, time_slot, patient_name, patient_email, patient_phone, notes, status, zoom_join_url, zoom_start_url")
    .eq("id", id)
    .single();

  if (bookingError || !booking) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  if (booking.status !== "pending") {
    return NextResponse.json({ error: "Esta reserva no está pendiente de aprobación" }, { status: 409 });
  }

  const [config, eventTypes] = await Promise.all([getCalendarConfig(), getEventTypes(false)]);
  const eventType = eventTypes.find((e) => e.slug === booking.type);
  if (!eventType) return NextResponse.json({ error: "Tipo de evento inválido" }, { status: 400 });

  const { duration_min: durationMin, label } = eventType;
  const safeName = (booking.patient_name as string) ?? "";
  const safeNotes = (booking.notes as string) ?? "";

  const startDate = slotToDate(booking.date as string, booking.time_slot as string);
  const endDate = new Date(startDate.getTime() + durationMin * 60000);

  const dateLabel = startDate.toLocaleDateString("es-CL", {
    timeZone: BOOKING_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Load Google Calendar token
  const { data: stored } = await adminSb
    .from("google_calendar_tokens")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (!stored) {
    return NextResponse.json({ error: "El calendario no está disponible." }, { status: 503 });
  }

  let accessToken: string;
  try {
    const result = await getValidToken(stored as GCalTokenData);
    accessToken = result.token;
    if (result.newExpiresAt) {
      await adminSb
        .from("google_calendar_tokens")
        .update({ access_token: accessToken, expires_at: result.newExpiresAt, updated_at: new Date().toISOString() })
        .eq("user_id", stored.user_id);
    }
  } catch {
    return NextResponse.json({ error: "El calendario no está disponible." }, { status: 503 });
  }

  // Create Zoom meeting
  let zoomMeetingId: number | null = null;
  let zoomJoinUrl = "";
  let zoomStartUrl = "";
  try {
    const zoom = await createZoomMeeting({
      topic: `${label} — ${safeName}`,
      startIso: startDate.toISOString().replace(".000Z", "Z"),
      durationMin,
      timeZone: BOOKING_TZ,
      agenda: safeNotes || undefined,
      settings: config.zoom,
      credentials: config.zoom_credentials,
    });
    if (zoom) {
      zoomMeetingId = zoom.id;
      zoomJoinUrl = zoom.join_url;
      zoomStartUrl = zoom.start_url;
    }
  } catch { /* non-critical */ }

  const description = [
    `Paciente: ${safeName}`,
    `Email: ${booking.patient_email}`,
    `Teléfono: ${booking.patient_phone}`,
    zoomJoinUrl ? `Zoom: ${zoomJoinUrl}` : "",
    safeNotes ? `Notas: ${safeNotes}` : "",
  ].filter(Boolean).join("\n");

  // Create Google Calendar event
  let eventLink = "";
  let googleEventId = "";
  try {
    const created = await createCalendarEvent(accessToken, stored.calendar_id ?? "primary", {
      summary: `${label} — ${safeName}`,
      description,
      startIso: startDate.toISOString(),
      endIso: endDate.toISOString(),
      timeZone: BOOKING_TZ,
    });
    eventLink = created.htmlLink;
    googleEventId = created.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[approve] GCal event creation failed:", msg);
    return NextResponse.json({ error: "No se pudo crear el evento en el calendario." }, { status: 502 });
  }

  // Update booking to confirmed
  await adminSb
    .from("bookings")
    .update({
      status: "confirmed",
      google_event_id: googleEventId,
      google_event_link: eventLink,
      zoom_meeting_id: zoomMeetingId,
      zoom_join_url: zoomJoinUrl,
      zoom_start_url: zoomStartUrl,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  // Build template vars for confirmation notifications
  const { data: bookingFull } = await adminSb
    .from("bookings")
    .select("booking_code")
    .eq("id", id)
    .single();
  const bookingCode = bookingFull?.booking_code ?? "";
  const manageUrl = `${config.site_url}/agenda/gestionar?code=${bookingCode}`;
  const firstName = safeName.split(" ")[0];

  const templateVars: Record<string, string> = {
    name: safeName,
    first_name: firstName,
    email: (booking.patient_email as string).toLowerCase(),
    phone: (booking.patient_phone as string) ?? "",
    type_label: label,
    duration: String(durationMin),
    date: booking.date as string,
    date_long: dateLabel,
    time: booking.time_slot as string,
    booking_code: bookingCode,
    event_link: eventLink,
    zoom_join_url: zoomJoinUrl,
    manage_url: manageUrl,
    cancel_url: `${manageUrl}&action=cancel`,
    reschedule_url: `${manageUrl}&action=reschedule`,
    site_url: config.site_url,
    logo_url: config.logo_url,
    therapist_name: "Juan Pablo Loaiza",
  };

  // Load confirmation templates and notify patient
  const { data: templates } = await adminSb
    .from("booking_alert_templates")
    .select("channel, subject, body")
    .eq("event_type_slug", booking.type as string)
    .eq("trigger", "confirmation")
    .eq("is_active", true);

  const emailTpl = templates?.find((t) => t.channel === "email");
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject = emailTpl?.subject
      ? renderTemplate(emailTpl.subject as string, templateVars)
      : `Confirmación de ${label} — ${dateLabel} ${booking.time_slot}`;
    const html = emailTpl?.body
      ? renderTemplateHtml(emailTpl.body as string, templateVars)
      : `<p>Tu ${label} ha sido confirmada para el ${dateLabel} a las ${booking.time_slot}. Código: ${bookingCode}</p>`;
    await resend.emails.send({
      from: config.from_email,
      to: (booking.patient_email as string).toLowerCase(),
      subject,
      html,
    });
  } catch { /* non-critical */ }

  const waTpl = templates?.find((t) => t.channel === "whatsapp");
  if (waTpl && booking.patient_phone) {
    void sendWhatsApp({ to: booking.patient_phone as string, body: renderTemplate(waTpl.body as string, templateVars) });
  }

  return NextResponse.json({ ok: true });
}
