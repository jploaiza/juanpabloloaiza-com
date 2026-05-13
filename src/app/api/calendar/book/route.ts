/**
 * POST /api/calendar/book
 *
 * Creates a Google Calendar event and sends a confirmation email.
 * Public endpoint — uses the admin's stored credentials.
 *
 * Body: { name, email, phone, date, time, type, notes? }
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getValidToken,
  getFreeBusy,
  createCalendarEvent,
  deleteCalendarEvent,
  type GCalTokenData,
  type BusySlot,
} from "@/lib/google-calendar";
import { createZoomMeeting, deleteZoomMeeting } from "@/lib/zoom";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { BOOKING_TZ, EVENT_CONFIGS, type BookingType } from "@/lib/booking-config";

const FROM_EMAIL = "Juan Pablo Loaiza <academy@juanpabloloaiza.com>";
const LOGO_URL = "https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png";
const SITE_URL = "https://www.juanpabloloaiza.com";

function slotsOverlap(start: Date, end: Date, busy: BusySlot[]): boolean {
  return busy.some((b) => {
    const bStart = new Date(b.start).getTime();
    const bEnd = new Date(b.end).getTime();
    return start.getTime() < bEnd && end.getTime() > bStart;
  });
}

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

function buildConfirmationHtml(params: {
  name: string;
  type: BookingType;
  dateLabel: string;
  timeStr: string;
  duration: number;
  notes?: string;
  bookingCode?: string;
  zoomJoinUrl?: string;
}): string {
  const { name, type, dateLabel, timeStr, duration, notes, bookingCode, zoomJoinUrl } = params;
  const typeLabel = type === "session" ? "Sesión TRVP" : "Entrevista de Admisión";
  const firstName = name.split(" ")[0];
  const manageUrl = bookingCode
    ? `${SITE_URL}/agenda/gestionar?code=${bookingCode}`
    : `${SITE_URL}/agenda`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020617;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#0a1628;border-top:3px solid #C5A059;padding:32px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="Juan Pablo Loaiza" height="48" style="height:48px;max-width:200px;">
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#0f1e35;padding:40px;">
            <p style="color:#C5A059;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Confirmación de ${typeLabel}</p>
            <h1 style="color:#ffffff;font-size:24px;margin:0 0 24px;line-height:1.3;">Hola ${firstName}, tu cita está confirmada</h1>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#16213e;border:1px solid rgba(197,160,89,0.2);margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                <p style="color:#9ca3af;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px;">Tipo</p>
                <p style="color:#ffffff;font-size:16px;margin:0 0 16px;">${typeLabel}</p>
                <p style="color:#9ca3af;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px;">Fecha y hora</p>
                <p style="color:#C5A059;font-size:18px;font-weight:bold;margin:0 0 16px;">${dateLabel} — ${timeStr}</p>
                <p style="color:#9ca3af;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px;">Duración</p>
                <p style="color:#ffffff;font-size:16px;margin:0 0 ${notes ? 16 : 0}px;">${duration} minutos</p>
                ${notes ? `<p style="color:#9ca3af;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px;">Notas</p><p style="color:#d1d5db;font-size:14px;margin:0 0 0px;">${notes}</p>` : ""}
                ${bookingCode ? `<p style="color:#9ca3af;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin:16px 0 4px;">Código de Reserva</p><p style="color:#C5A059;font-size:20px;font-weight:bold;letter-spacing:0.2em;margin:0;">${bookingCode}</p>` : ""}
              </td></tr>
            </table>

            ${zoomJoinUrl ? `
            <!-- Zoom link -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border:1px solid rgba(197,160,89,0.3);margin-bottom:24px;">
              <tr><td style="padding:20px 24px;text-align:center;">
                <p style="color:#9ca3af;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 12px;">Enlace de tu sesión Zoom</p>
                <a href="${zoomJoinUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;padding:12px 28px;text-decoration:none;font-weight:bold;border-radius:2px;">Unirse a Zoom</a>
                <p style="color:#6b7280;font-size:11px;margin:10px 0 0;">Guarda este enlace — es tu acceso a la sesión.</p>
              </td></tr>
            </table>` : `
            <p style="color:#d1d5db;font-size:15px;line-height:1.7;margin:0 0 24px;">La sesión se realizará <strong style="color:#ffffff;">vía Zoom</strong>. Recibirás el enlace poco antes de tu cita.</p>`}

            <!-- CTA buttons -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="padding-right:8px;">
                  <a href="${manageUrl}&action=reschedule" style="display:block;text-align:center;background:#C5A059;color:#020617;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;padding:12px 16px;text-decoration:none;font-weight:bold;">Reprogramar</a>
                </td>
                <td style="padding-left:8px;">
                  <a href="${manageUrl}&action=cancel" style="display:block;text-align:center;background:transparent;color:#9ca3af;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;padding:11px 16px;text-decoration:none;border:1px solid rgba(156,163,175,0.3);">Cancelar</a>
                </td>
              </tr>
            </table>

            <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">Guarda tu código <strong style="color:#C5A059;">${bookingCode ?? ""}</strong> — lo necesitarás para reprogramar o cancelar sin iniciar sesión.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0a1628;padding:24px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="color:#4b5563;font-size:12px;margin:0;">Juan Pablo Loaiza · Terapeuta TRVP · <a href="${SITE_URL}" style="color:#C5A059;text-decoration:none;">${SITE_URL.replace("https://", "")}</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const ip = getIp(req.headers);
  if (!rateLimit(`cal-book:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Intenta en unos minutos." }, { status: 429 });
  }

  let body: { name?: string; email?: string; phone?: string; date?: string; time?: string; type?: string; notes?: string; reschedule_code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { name, email, phone, date, time, type, notes, reschedule_code } = body;

  // Validate required fields
  if (!name?.trim() || name.trim().length < 2) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  if (!phone?.trim() || phone.replace(/\D/g, "").length < 8) return NextResponse.json({ error: "Teléfono inválido" }, { status: 400 });
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return NextResponse.json({ error: "Hora inválida" }, { status: 400 });
  if (!type || !(type in EVENT_CONFIGS)) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });

  const bookingType = type as BookingType;
  const { durationMin, label } = EVENT_CONFIGS[bookingType];

  // Sanitize name and notes
  const safeName = name.trim().slice(0, 100);
  const safeNotes = notes?.trim().slice(0, 500) ?? "";

  // Convert slot to UTC dates
  const startDate = slotToDate(date, time);
  const endDate = new Date(startDate.getTime() + durationMin * 60000);

  // Reject past bookings
  if (startDate.getTime() < Date.now() + 30 * 60000) {
    return NextResponse.json({ error: "Selecciona una cita con al menos 30 minutos de anticipación" }, { status: 400 });
  }

  // Get admin's calendar credentials
  const adminSb = createAdminClient();
  const { data: stored } = await adminSb
    .from("google_calendar_tokens")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (!stored) {
    return NextResponse.json({ error: "El calendario no está disponible. Inténtalo más tarde." }, { status: 503 });
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
    return NextResponse.json({ error: "El calendario no está disponible. Inténtalo más tarde." }, { status: 503 });
  }

  // Double-check availability (prevent race conditions)
  let busy: BusySlot[] = [];
  try {
    busy = await getFreeBusy(
      accessToken,
      stored.calendar_id ?? "primary",
      new Date(startDate.getTime() - 60000).toISOString(),
      new Date(endDate.getTime() + 60000).toISOString(),
    );
  } catch {
    return NextResponse.json({ error: "No se pudo verificar la disponibilidad" }, { status: 502 });
  }

  if (slotsOverlap(startDate, endDate, busy)) {
    return NextResponse.json({ error: "Este horario ya no está disponible. Elige otro." }, { status: 409 });
  }

  const dateLabel = startDate.toLocaleDateString("es-CL", {
    timeZone: BOOKING_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Create Zoom meeting (graceful — non-blocking if credentials missing)
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
    });
    if (zoom) {
      zoomMeetingId = zoom.id;
      zoomJoinUrl = zoom.join_url;
      zoomStartUrl = zoom.start_url;
    }
  } catch {
    // Non-critical — proceed without Zoom
  }

  // Build calendar event description
  const description = [
    `Paciente: ${safeName}`,
    `Email: ${email.trim().toLowerCase()}`,
    `Teléfono: ${phone.trim()}`,
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
      attendeeEmail: email.trim().toLowerCase(),
      attendeeName: safeName,
    });
    eventLink = created.htmlLink;
    googleEventId = created.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    // Clean up Zoom meeting if calendar event fails
    if (zoomMeetingId) void deleteZoomMeeting(zoomMeetingId);
    return NextResponse.json({ error: `No se pudo crear la cita: ${msg}` }, { status: 502 });
  }

  // If rescheduling: cancel the old booking
  if (reschedule_code?.trim()) {
    const oldCode = reschedule_code.trim().toUpperCase();
    const { data: oldBooking } = await adminSb
      .from("bookings")
      .select("id, google_event_id, zoom_meeting_id, status")
      .eq("booking_code", oldCode)
      .single();

    if (oldBooking && oldBooking.status === "confirmed") {
      // Delete old calendar event
      try {
        if (oldBooking.google_event_id) {
          await deleteCalendarEvent(accessToken, stored.calendar_id ?? "primary", oldBooking.google_event_id);
        }
      } catch { /* non-critical */ }
      // Delete old Zoom meeting
      if (oldBooking.zoom_meeting_id) {
        void deleteZoomMeeting(Number(oldBooking.zoom_meeting_id));
      }
      // Mark old booking as rescheduled
      await adminSb.from("bookings").update({ status: "rescheduled" }).eq("id", oldBooking.id);
    }
  }

  // Persist new booking
  const { data: bookingRow } = await adminSb
    .from("bookings")
    .insert({
      type: bookingType,
      date,
      time_slot: time,
      patient_name: safeName,
      patient_email: email.trim().toLowerCase(),
      patient_phone: phone.trim(),
      notes: safeNotes,
      status: "confirmed",
      google_event_id: googleEventId,
      google_event_link: eventLink,
      zoom_meeting_id: zoomMeetingId,
      zoom_join_url: zoomJoinUrl,
      zoom_start_url: zoomStartUrl,
    })
    .select("booking_code")
    .single();

  const bookingCode = bookingRow?.booking_code ?? "";

  // Send confirmation email (non-blocking)
  let emailSent = false;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: email.trim().toLowerCase(),
      subject: `Confirmación de ${label} — ${dateLabel} ${time}`,
      html: buildConfirmationHtml({
        name: safeName,
        type: bookingType,
        dateLabel,
        timeStr: time,
        duration: durationMin,
        notes: safeNotes || undefined,
        bookingCode,
        zoomJoinUrl: zoomJoinUrl || undefined,
      }),
    });
    emailSent = !emailResult.error;
    void adminSb.from("comms_log").insert({
      type: "booking_confirmation",
      subject: `Confirmación de ${label} — ${dateLabel} ${time}`,
      status: emailResult.error ? "error" : "sent",
      sent_at: new Date().toISOString(),
      body_preview: `gcal:${date}:${time}:${bookingType}:${email}`,
    });
  } catch {
    void adminSb.from("comms_log").insert({
      type: "booking_confirmation",
      subject: `Confirmación de ${label} — ${dateLabel} ${time}`,
      status: "error",
      sent_at: new Date().toISOString(),
      body_preview: `gcal:${date}:${time}:${bookingType}:${email}`,
    });
  }

  return NextResponse.json({
    ok: true,
    event_link: eventLink,
    booking_code: bookingCode,
    zoom_join_url: zoomJoinUrl || null,
    email_sent: emailSent,
  });
}
