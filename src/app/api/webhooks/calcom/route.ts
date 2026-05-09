import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";

const FROM_EMAIL = "Juan Pablo Loaiza <academy@juanpabloloaiza.com>";
const LOGO_URL =
  "https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png";
const WHATSAPP_URL = "https://api.whatsapp.com/send?phone=56962081884";
const SITE_URL = "https://www.juanpabloloaiza.com";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalAttendee {
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  timeZone?: string;
}

interface CalPayload {
  bookingId: number;
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  organizer: { name: string; email: string; timeZone: string };
  attendees: CalAttendee[];
  location?: string;
  metadata?: { videoCallUrl?: string };
  eventTypeId?: number;
  status?: string;
  rescheduleReason?: string;
  cancellationReason?: string;
}

interface CalWebhookBody {
  triggerEvent: "BOOKING_CREATED" | "BOOKING_CANCELLED" | "BOOKING_RESCHEDULED" | string;
  createdAt: string;
  payload: CalPayload;
}

// ── Signature verification ─────────────────────────────────────────────────────

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ── ICS generator ──────────────────────────────────────────────────────────────

function buildIcs(payload: CalPayload): string {
  const uid = `${payload.uid}@juanpabloloaiza.com`;
  const dtStamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const dtStart = new Date(payload.startTime).toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const dtEnd = new Date(payload.endTime).toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const location = payload.metadata?.videoCallUrl ?? payload.location ?? "";
  const attendee = payload.attendees[0];

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Juan Pablo Loaiza TRVP//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${payload.title}`,
    location ? `LOCATION:${location}` : "",
    `ORGANIZER;CN=Juan Pablo Loaiza:mailto:academy@juanpabloloaiza.com`,
    attendee ? `ATTENDEE;CN=${attendee.name};RSVP=TRUE:mailto:${attendee.email}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

// ── Date formatting ────────────────────────────────────────────────────────────

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago",
  });
}

// ── Email wrapper (matches project branding exactly) ──────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Juan Pablo Loaiza · TRVP</title>
</head>
<body style="margin:0;padding:0;background-color:#0a1628;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a1628;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;background-color:#16213e;border:1px solid rgba(197,160,89,0.25);">
          <tr>
            <td width="12" height="12" style="border-top:1px solid #C5A059;border-left:1px solid #C5A059;"></td>
            <td style="border-top:1px solid rgba(197,160,89,0.25);height:12px;"></td>
            <td width="12" height="12" style="border-top:1px solid #C5A059;border-right:1px solid #C5A059;"></td>
          </tr>
          <tr>
            <td width="12" style="border-left:1px solid rgba(197,160,89,0.15);"></td>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#0e1b30;padding:28px 32px 24px;text-align:center;border-bottom:1px solid rgba(197,160,89,0.2);">
                    <img src="${LOGO_URL}" width="180" alt="Juan Pablo Loaiza" style="display:inline-block;max-width:180px;border:0;opacity:0.9;"/>
                  </td>
                </tr>
              </table>
              ${content}
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:24px 32px 28px;text-align:center;background-color:#0e1b30;border-top:1px solid rgba(197,160,89,0.15);">
                    <p style="color:#C5A059;font-size:9px;letter-spacing:4px;text-transform:uppercase;font-family:Georgia,serif;margin:0 0 12px;">Terapia TRVP</p>
                    <p style="color:#2d4a6e;font-size:11px;margin:0;font-family:Georgia,serif;">
                      <a href="mailto:academy@juanpabloloaiza.com" style="color:#4a6a8a;text-decoration:none;">academy@juanpabloloaiza.com</a>
                      &nbsp;·&nbsp;
                      <a href="${WHATSAPP_URL}" style="color:#4a6a8a;text-decoration:none;">+56 9 6208 1884</a>
                      &nbsp;·&nbsp;
                      <a href="${SITE_URL}" style="color:#4a6a8a;text-decoration:none;">juanpabloloaiza.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
            <td width="12" style="border-right:1px solid rgba(197,160,89,0.15);"></td>
          </tr>
          <tr>
            <td width="12" height="12" style="border-bottom:1px solid #C5A059;border-left:1px solid #C5A059;"></td>
            <td style="border-bottom:1px solid rgba(197,160,89,0.25);height:12px;"></td>
            <td width="12" height="12" style="border-bottom:1px solid #C5A059;border-right:1px solid #C5A059;"></td>
          </tr>
        </table>
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          <tr><td style="padding:16px;text-align:center;">
            <p style="color:#2d4a6e;font-size:11px;margin:0;font-family:Georgia,serif;letter-spacing:1px;">
              © 2026 Juan Pablo Loaiza · Todos los derechos reservados
            </p>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Email templates ────────────────────────────────────────────────────────────

function buildConfirmationEmail(name: string, datetime: string, location: string): string {
  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:32px 32px 8px;text-align:center;">
          <p style="color:#C5A059;font-size:9px;letter-spacing:5px;text-transform:uppercase;margin:0 0 8px;font-family:Georgia,serif;">Confirmación de sesión</p>
          <h1 style="color:#ffffff;font-size:22px;letter-spacing:3px;text-transform:uppercase;margin:0;font-family:Georgia,serif;font-weight:normal;">Hola, ${name}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 8px;">
          <p style="color:#cbd5e1;font-size:16px;line-height:1.85;margin:0 0 16px;font-family:Georgia,serif;">
            Tu sesión ha sido <strong style="color:#C5A059;">confirmada</strong>. Estos son los detalles:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e1b30;border:1px solid rgba(197,160,89,0.3);margin-bottom:24px;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 8px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#C5A059;font-family:Georgia,serif;">Fecha y hora</p>
                <p style="margin:0;font-size:16px;color:#ffffff;font-family:Georgia,serif;">${datetime}</p>
              </td>
            </tr>
            ${location ? `<tr><td style="padding:0 24px 20px;border-top:1px solid rgba(197,160,89,0.1);">
                <p style="margin:8px 0 4px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#C5A059;font-family:Georgia,serif;">Enlace de sesión</p>
                <a href="${location}" style="color:#4a6a8a;font-size:14px;font-family:Georgia,serif;text-decoration:underline;word-break:break-all;">${location}</a>
              </td></tr>` : ""}
          </table>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.85;margin:0 0 8px;font-family:Georgia,serif;">
            Si necesitas reagendar o cancelar, hazme saber por WhatsApp con al menos 24 horas de anticipación.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${WHATSAPP_URL}" style="display:inline-block;background-color:#C5A059;color:#020617;padding:12px 36px;text-decoration:none;font-size:10px;text-transform:uppercase;letter-spacing:4px;font-family:Georgia,serif;font-weight:bold;">
            Escribir por WhatsApp
          </a>
        </td>
      </tr>
    </table>`;
  return emailWrapper(body);
}

function buildCancellationEmail(name: string, datetime: string, reason?: string): string {
  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:32px 32px 8px;text-align:center;">
          <p style="color:#f59e0b;font-size:9px;letter-spacing:5px;text-transform:uppercase;margin:0 0 8px;font-family:Georgia,serif;">Sesión cancelada</p>
          <h1 style="color:#ffffff;font-size:22px;letter-spacing:3px;text-transform:uppercase;margin:0;font-family:Georgia,serif;font-weight:normal;">Hola, ${name}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <p style="color:#cbd5e1;font-size:16px;line-height:1.85;margin:0 0 16px;font-family:Georgia,serif;">
            Tu sesión del <strong style="color:#f59e0b;">${datetime}</strong> ha sido <strong style="color:#f59e0b;">cancelada</strong>.
          </p>
          ${reason ? `<p style="color:#9ca3af;font-size:14px;line-height:1.7;margin:0 0 16px;font-family:Georgia,serif;">Motivo: ${reason}</p>` : ""}
          <p style="color:#cbd5e1;font-size:15px;line-height:1.85;margin:0;font-family:Georgia,serif;">
            Si deseas agendar una nueva sesión, puedes hacerlo directamente por WhatsApp o visitando el sitio.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${WHATSAPP_URL}" style="display:inline-block;background-color:#f59e0b;color:#0a1628;padding:12px 36px;text-decoration:none;font-size:10px;text-transform:uppercase;letter-spacing:4px;font-family:Georgia,serif;font-weight:bold;">
            Reagendar por WhatsApp
          </a>
        </td>
      </tr>
    </table>`;
  return emailWrapper(body);
}

function buildRescheduleEmail(name: string, datetime: string, location: string): string {
  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:32px 32px 8px;text-align:center;">
          <p style="color:#C5A059;font-size:9px;letter-spacing:5px;text-transform:uppercase;margin:0 0 8px;font-family:Georgia,serif;">Sesión reagendada</p>
          <h1 style="color:#ffffff;font-size:22px;letter-spacing:3px;text-transform:uppercase;margin:0;font-family:Georgia,serif;font-weight:normal;">Hola, ${name}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 8px;">
          <p style="color:#cbd5e1;font-size:16px;line-height:1.85;margin:0 0 16px;font-family:Georgia,serif;">
            Tu sesión ha sido <strong style="color:#C5A059;">reagendada</strong>. La nueva fecha y hora son:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e1b30;border:1px solid rgba(197,160,89,0.3);margin-bottom:24px;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 8px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#C5A059;font-family:Georgia,serif;">Nueva fecha y hora</p>
                <p style="margin:0;font-size:16px;color:#ffffff;font-family:Georgia,serif;">${datetime}</p>
              </td>
            </tr>
            ${location ? `<tr><td style="padding:0 24px 20px;border-top:1px solid rgba(197,160,89,0.1);">
                <p style="margin:8px 0 4px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#C5A059;font-family:Georgia,serif;">Enlace de sesión</p>
                <a href="${location}" style="color:#4a6a8a;font-size:14px;font-family:Georgia,serif;text-decoration:underline;word-break:break-all;">${location}</a>
              </td></tr>` : ""}
          </table>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.85;margin:0 0 8px;font-family:Georgia,serif;">
            Si tienes alguna duda, escríbeme por WhatsApp.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${WHATSAPP_URL}" style="display:inline-block;background-color:#C5A059;color:#020617;padding:12px 36px;text-decoration:none;font-size:10px;text-transform:uppercase;letter-spacing:4px;font-family:Georgia,serif;font-weight:bold;">
            Escribir por WhatsApp
          </a>
        </td>
      </tr>
    </table>`;
  return emailWrapper(body);
}

// ── Email builder ──────────────────────────────────────────────────────────────

function buildEmail(
  trigger: string,
  firstName: string,
  datetime: string,
  location: string,
  cancellationReason?: string
): { subject: string; html: string } | null {
  switch (trigger) {
    case "BOOKING_CREATED":
      return {
        subject: "Tu sesión ha sido confirmada — Juan Pablo Loaiza TRVP",
        html: buildConfirmationEmail(firstName, datetime, location),
      };
    case "BOOKING_CANCELLED":
      return {
        subject: "Tu sesión ha sido cancelada — Juan Pablo Loaiza TRVP",
        html: buildCancellationEmail(firstName, datetime, cancellationReason),
      };
    case "BOOKING_RESCHEDULED":
      return {
        subject: "Tu sesión ha sido reagendada — Juan Pablo Loaiza TRVP",
        html: buildRescheduleEmail(firstName, datetime, location),
      };
    default:
      return null;
  }
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = process.env.CALCOM_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[calcom-webhook] CALCOM_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-cal-signature-256");

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: CalWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { triggerEvent, payload } = body;

  // Only handle booking lifecycle events
  const handled = ["BOOKING_CREATED", "BOOKING_CANCELLED", "BOOKING_RESCHEDULED"];
  if (!handled.includes(triggerEvent)) {
    return NextResponse.json({ skipped: true });
  }

  const attendee = payload.attendees?.[0];
  if (!attendee?.email) {
    return NextResponse.json({ skipped: true, reason: "no attendee email" });
  }

  const firstName = attendee.firstName ?? attendee.name.split(" ")[0];
  const datetime = formatDatetime(payload.startTime);
  const location = payload.metadata?.videoCallUrl ?? payload.location ?? "";

  const email = buildEmail(
    triggerEvent,
    firstName,
    datetime,
    location,
    payload.cancellationReason
  );

  if (!email) {
    return NextResponse.json({ skipped: true });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const icsContent = triggerEvent !== "BOOKING_CANCELLED" ? buildIcs(payload) : undefined;

  let emailStatus: "sent" | "failed" = "sent";

  try {
    const sendResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: attendee.email,
      subject: email.subject,
      html: email.html,
      ...(icsContent
        ? {
            attachments: [
              {
                filename: "sesion.ics",
                content: Buffer.from(icsContent),
                contentType: "text/calendar; charset=utf-8; method=REQUEST",
              },
            ],
          }
        : {}),
    });

    if (sendResult.error) {
      console.error("[calcom-webhook] Resend error:", sendResult.error);
      emailStatus = "failed";
    }
  } catch (err) {
    console.error("[calcom-webhook] Send failed:", err);
    emailStatus = "failed";
  }

  // Log the send + track booking event — non-blocking
  try {
    const adminSb = createAdminClient();
    await adminSb.from("comms_log").insert({
      type: triggerEventToType(triggerEvent),
      subject: email.subject,
      status: emailStatus,
      sent_at: new Date().toISOString(),
      body_preview: `cal:${payload.uid}:${triggerEvent}`,
    });
    if (triggerEvent === "BOOKING_CREATED") {
      await adminSb.from("events").insert({
        event_name: "booking_confirmed",
        props: {
          calUid: payload.uid,
          attendeeEmail: attendee.email,
          eventTypeId: payload.eventTypeId ?? null,
        },
      });
    }
  } catch (logErr) {
    console.error("[calcom-webhook] Log failed:", logErr);
  }

  return NextResponse.json({ ok: true, status: emailStatus });
}

function triggerEventToType(trigger: string): string {
  switch (trigger) {
    case "BOOKING_CREATED": return "booking_confirmation";
    case "BOOKING_CANCELLED": return "booking_cancellation";
    case "BOOKING_RESCHEDULED": return "booking_reschedule";
    default: return "booking_other";
  }
}
