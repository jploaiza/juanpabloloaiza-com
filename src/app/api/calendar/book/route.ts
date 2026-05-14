/**
 * POST /api/calendar/book
 *
 * Creates a Google Calendar event and sends a confirmation email + WhatsApp.
 * Public endpoint — uses the admin's stored credentials.
 *
 * Body: { name, email, phone, date, time, type, notes?, reschedule_code?, answers? }
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
import { BOOKING_TZ, getCalendarConfig, getEventTypes } from "@/lib/booking-config";
import { renderTemplate, renderTemplateHtml } from "@/lib/templates";
import { sendWhatsApp } from "@/lib/whatsapp";

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

export async function POST(req: NextRequest) {
  const ip = getIp(req.headers);
  if (!rateLimit(`cal-book:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Intenta en unos minutos." }, { status: 429 });
  }

  let body: {
    name?: string;
    email?: string;
    phone?: string;
    date?: string;
    time?: string;
    type?: string;
    notes?: string;
    reschedule_code?: string;
    answers?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { name, email, phone, date, time, type, notes, reschedule_code, answers = {} } = body;

  // Validate answers: must be a plain object, no nested objects, capped to prevent payload abuse
  if (typeof answers !== "object" || Array.isArray(answers) || answers === null) {
    return NextResponse.json({ error: "Formato de respuestas inválido" }, { status: 400 });
  }
  const answersEntries = Object.entries(answers);
  if (answersEntries.length > 20) {
    return NextResponse.json({ error: "Demasiadas respuestas" }, { status: 400 });
  }
  for (const [k, v] of answersEntries) {
    if (typeof k !== "string" || k.length > 100) {
      return NextResponse.json({ error: "Clave de respuesta inválida" }, { status: 400 });
    }
    if (typeof v !== "string" && typeof v !== "number" && typeof v !== "boolean") {
      return NextResponse.json({ error: "Valor de respuesta inválido" }, { status: 400 });
    }
    if (typeof v === "string" && v.length > 1000) {
      return NextResponse.json({ error: "Respuesta demasiado larga" }, { status: 400 });
    }
  }

  if (!name?.trim() || name.trim().length < 2) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  if (!phone?.trim() || phone.replace(/\D/g, "").length < 8) return NextResponse.json({ error: "Teléfono inválido" }, { status: 400 });
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return NextResponse.json({ error: "Hora inválida" }, { status: 400 });
  if (!type) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });

  // Load config + event types from DB
  const [config, eventTypes] = await Promise.all([getCalendarConfig(), getEventTypes(true)]);
  const eventType = eventTypes.find((e) => e.slug === type);
  if (!eventType) return NextResponse.json({ error: "Tipo de evento inválido" }, { status: 400 });

  const safeName = name.trim().slice(0, 100);
  const safeNotes = notes?.trim().slice(0, 500) ?? "";
  const { duration_min: durationMin, label } = eventType;

  const adminSb = createAdminClient();

  // Validate max active bookings per email
  if ((eventType.max_active_per_email ?? 0) > 0) {
    const { count } = await adminSb
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("patient_email", email.trim().toLowerCase())
      .eq("type", type)
      .in("status", ["confirmed", "pending"])
      .gte("date", new Date().toISOString().slice(0, 10));
    if ((count ?? 0) >= eventType.max_active_per_email!) {
      return NextResponse.json(
        { error: `Ya tienes ${eventType.max_active_per_email} reserva(s) activa(s) para este tipo de cita.` },
        { status: 409 }
      );
    }
  }

  const startDate = slotToDate(date, time);
  const endDate = new Date(startDate.getTime() + durationMin * 60000);

  if (startDate.getTime() < Date.now() + config.lead_time_min * 60000) {
    return NextResponse.json({ error: `Selecciona una cita con al menos ${config.lead_time_min} minutos de anticipación` }, { status: 400 });
  }

  const dateLabel = startDate.toLocaleDateString("es-CL", {
    timeZone: BOOKING_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const firstName = safeName.split(" ")[0];
  const templateVars: Record<string, string> = {
    name: safeName,
    first_name: firstName,
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    type_label: label,
    duration: String(durationMin),
    date,
    date_long: dateLabel,
    time,
    booking_code: "",
    event_link: "",
    zoom_join_url: "",
    manage_url: "",
    cancel_url: "",
    reschedule_url: "",
    site_url: config.site_url,
    logo_url: config.logo_url,
    therapist_name: "Juan Pablo Loaiza",
  };

  // --- PENDING flow (requires_confirmation) ---
  if (eventType.requires_confirmation === true) {
    const { data: bookingRow } = await adminSb
      .from("bookings")
      .insert({
        type,
        date,
        time_slot: time,
        patient_name: safeName,
        patient_email: email.trim().toLowerCase(),
        patient_phone: phone.trim(),
        notes: safeNotes,
        status: "pending",
        answers,
      })
      .select("booking_code")
      .single();

    const bookingCode = bookingRow?.booking_code ?? "";
    const manageUrl = `${config.site_url}/agenda/gestionar?code=${bookingCode}`;
    templateVars.booking_code = bookingCode;
    templateVars.manage_url = manageUrl;
    templateVars.cancel_url = `${manageUrl}&action=cancel`;
    templateVars.reschedule_url = `${manageUrl}&action=reschedule`;

    // Load pending templates for patient
    const { data: pendingTpls } = await adminSb
      .from("booking_alert_templates")
      .select("channel, subject, body")
      .eq("event_type_slug", type)
      .eq("trigger", "pending")
      .eq("is_active", true);

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send pending email to patient
    const pendingEmailTpl = pendingTpls?.find((t) => t.channel === "email");
    try {
      const subject = pendingEmailTpl?.subject
        ? renderTemplate(pendingEmailTpl.subject as string, templateVars)
        : `Solicitud recibida — ${label} ${dateLabel} ${time}`;
      const html = pendingEmailTpl?.body
        ? renderTemplateHtml(pendingEmailTpl.body as string, templateVars)
        : `<p>Hemos recibido tu solicitud para ${label} el ${dateLabel} a las ${time}. Te notificaremos cuando sea confirmada. Código: ${bookingCode}</p>`;
      await resend.emails.send({ from: config.from_email, to: email.trim().toLowerCase(), subject, html });
    } catch { /* non-critical */ }

    // Send pending WhatsApp to patient
    const pendingWaTpl = pendingTpls?.find((t) => t.channel === "whatsapp");
    if (pendingWaTpl && phone.trim()) {
      void sendWhatsApp({ to: phone.trim(), body: renderTemplate(pendingWaTpl.body as string, templateVars) });
    }

    // Load requires_approval template and notify therapist
    const { data: approvalTpls } = await adminSb
      .from("booking_alert_templates")
      .select("channel, subject, body")
      .eq("event_type_slug", type)
      .eq("trigger", "requires_approval")
      .eq("is_active", true);

    const approvalEmailTpl = approvalTpls?.find((t) => t.channel === "email");
    const therapistEmail = config.from_email.replace(/^.*</, "").replace(/>$/, "").trim() || config.from_email;
    const approveUrl = `${config.site_url}/academy/admin/calendar?tab=bookings`;
    const approvalVars = { ...templateVars, approve_url: approveUrl };

    try {
      const subject = approvalEmailTpl?.subject
        ? renderTemplate(approvalEmailTpl.subject as string, approvalVars)
        : `Nueva solicitud pendiente — ${label} ${dateLabel} ${time}`;
      const html = approvalEmailTpl?.body
        ? renderTemplateHtml(approvalEmailTpl.body as string, approvalVars)
        : `<p>Nueva solicitud de ${safeName} (${email.trim().toLowerCase()}) para ${label} el ${dateLabel} a las ${time}.</p><p><a href="${approveUrl}">Ver reservas pendientes</a></p>`;
      await resend.emails.send({ from: config.from_email, to: therapistEmail, subject, html });
    } catch { /* non-critical */ }

    return NextResponse.json({
      ok: true,
      booking_code: bookingCode,
      status: "pending",
      redirect_url: eventType.redirect_url ?? null,
    });
  }

  // --- CONFIRMED flow (normal) ---
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

  // Create Zoom meeting using config settings
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
    `Email: ${email.trim().toLowerCase()}`,
    `Teléfono: ${phone.trim()}`,
    zoomJoinUrl ? `Zoom: ${zoomJoinUrl}` : "",
    safeNotes ? `Notas: ${safeNotes}` : "",
  ].filter(Boolean).join("\n");

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
    console.error("[book] GCal event creation failed:", msg);
    if (zoomMeetingId) void deleteZoomMeeting(zoomMeetingId, config.zoom_credentials);
    return NextResponse.json({ error: "No se pudo crear el evento en el calendario. Intenta de nuevo." }, { status: 502 });
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
      try {
        if (oldBooking.google_event_id) {
          await deleteCalendarEvent(accessToken, stored.calendar_id ?? "primary", oldBooking.google_event_id);
        }
      } catch { /* non-critical */ }
      if (oldBooking.zoom_meeting_id) {
        void deleteZoomMeeting(Number(oldBooking.zoom_meeting_id), config.zoom_credentials);
      }
      await adminSb.from("bookings").update({ status: "rescheduled" }).eq("id", oldBooking.id);
    }
  }

  // Persist new booking
  const { data: bookingRow } = await adminSb
    .from("bookings")
    .insert({
      type,
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
      answers,
    })
    .select("booking_code")
    .single();

  const bookingCode = bookingRow?.booking_code ?? "";
  const manageUrl = `${config.site_url}/agenda/gestionar?code=${bookingCode}`;

  // Update template vars with confirmed booking info
  templateVars.booking_code = bookingCode;
  templateVars.event_link = eventLink;
  templateVars.zoom_join_url = zoomJoinUrl;
  templateVars.manage_url = manageUrl;
  templateVars.cancel_url = `${manageUrl}&action=cancel`;
  templateVars.reschedule_url = `${manageUrl}&action=reschedule`;

  // Load confirmation templates from DB
  const { data: templates } = await adminSb
    .from("booking_alert_templates")
    .select("channel, subject, body")
    .eq("event_type_slug", type)
    .eq("trigger", "confirmation")
    .eq("is_active", true);

  // Send email confirmation
  let emailSent = false;
  const emailTpl = templates?.find((t) => t.channel === "email");
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject = emailTpl?.subject
      ? renderTemplate(emailTpl.subject as string, templateVars)
      : `Confirmación de ${label} — ${dateLabel} ${time}`;
    const html = emailTpl?.body
      ? renderTemplateHtml(emailTpl.body as string, templateVars)
      : `<p>Tu ${label} está confirmada para el ${dateLabel} a las ${time}. Código: ${bookingCode}</p>`;
    const result = await resend.emails.send({ from: config.from_email, to: email.trim().toLowerCase(), subject, html });
    emailSent = !result.error;
    void adminSb.from("comms_log").insert({
      type: "booking_confirmation",
      subject,
      status: result.error ? "error" : "sent",
      sent_at: new Date().toISOString(),
      body_preview: `gcal:${date}:${time}:${type}:${email}`,
    });
  } catch {
    void adminSb.from("comms_log").insert({
      type: "booking_confirmation",
      subject: `Confirmación de ${label}`,
      status: "error",
      sent_at: new Date().toISOString(),
      body_preview: `gcal:${date}:${time}:${type}:${email}`,
    });
  }

  // Send WhatsApp confirmation (non-blocking)
  const waTpl = templates?.find((t) => t.channel === "whatsapp");
  if (waTpl && phone.trim()) {
    void sendWhatsApp({ to: phone.trim(), body: renderTemplate(waTpl.body as string, templateVars) });
  }

  return NextResponse.json({
    ok: true,
    event_link: eventLink,
    booking_code: bookingCode,
    zoom_join_url: zoomJoinUrl || null,
    email_sent: emailSent,
    redirect_url: eventType.redirect_url ?? null,
  });
}
