/**
 * POST /api/cron/booking-reminders
 * Gated by CRON_SECRET. Runs every minute.
 * Sends reminder_24h and reminder_1h alerts for upcoming confirmed bookings.
 */
import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { getCalendarConfig } from "@/lib/booking-config";
import { renderTemplate, renderTemplateHtml } from "@/lib/templates";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const secret = Buffer.from(req.headers.get("x-cron-secret") ?? "");
  const expected = Buffer.from(process.env.CRON_SECRET ?? "");
  if (secret.length === 0 || secret.length !== expected.length || !timingSafeEqual(secret, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createAdminClient();
  const config = await getCalendarConfig();
  const now = new Date();
  const BOOKING_TZ = "America/Santiago";

  function slotToUtcMs(dateStr: string, timeStr: string): number {
    const [h, m] = timeStr.split(":").map(Number);
    const probe = new Date(`${dateStr}T12:00:00Z`);
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: BOOKING_TZ, hour: "numeric", hour12: false, timeZoneName: "shortOffset",
    }).formatToParts(probe);
    const offsetStr = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-4";
    const offsetH = parseInt(offsetStr.match(/GMT([+-]\d+)/)?.[1] ?? "-4");
    const midnightUtcMs = new Date(`${dateStr}T${String(-offsetH).padStart(2, "0")}:00:00Z`).getTime();
    return midnightUtcMs + (h * 60 + m) * 60_000;
  }

  async function sendReminders(trigger: "reminder_24h" | "reminder_1h", windowMinStart: number, windowMinEnd: number) {
    const sentCol = trigger === "reminder_24h" ? "reminder_24h_sent_at" : "reminder_1h_sent_at";
    const windowStart = new Date(now.getTime() + windowMinStart * 60_000);
    const windowEnd = new Date(now.getTime() + windowMinEnd * 60_000);

    // Fetch bookings in date range (rough filter — refine by UTC time below)
    const { data: bookings } = await sb
      .from("bookings")
      .select("id, type, date, time_slot, patient_name, patient_email, patient_phone, zoom_join_url, zoom_meeting_id")
      .eq("status", "confirmed")
      .is(sentCol, null)
      .gte("date", windowStart.toISOString().slice(0, 10))
      .lte("date", windowEnd.toISOString().slice(0, 10));

    if (!bookings?.length) return 0;

    let sent = 0;
    const resend = new Resend(process.env.RESEND_API_KEY);

    for (const booking of bookings) {
      const slotMs = slotToUtcMs(booking.date, booking.time_slot);
      if (slotMs < windowStart.getTime() || slotMs > windowEnd.getTime()) continue;

      const { data: templates } = await sb
        .from("booking_alert_templates")
        .select("channel, subject, body")
        .eq("event_type_slug", booking.type)
        .eq("trigger", trigger)
        .eq("is_active", true);

      if (!templates?.length) continue;

      const dateLabel = new Date(`${booking.date}T12:00:00`).toLocaleDateString("es-CL", {
        timeZone: BOOKING_TZ, weekday: "long", day: "numeric", month: "long", year: "numeric",
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
        duration: booking.type === "session" ? "90" : "45",
        zoom_join_url: (booking.zoom_join_url as string) ?? "",
        manage_url: `${config.site_url}/agenda/gestionar`,
        site_url: config.site_url,
        logo_url: config.logo_url,
        therapist_name: "Juan Pablo Loaiza",
      };

      for (const tpl of templates) {
        if (tpl.channel === "email") {
          try {
            const rendered = renderTemplateHtml(tpl.body as string, vars);
            const subject = tpl.subject ? renderTemplate(tpl.subject as string, vars) : `Recordatorio: ${vars.type_label}`;
            await resend.emails.send({ from: config.from_email, to: booking.patient_email as string, subject, html: rendered });
          } catch { /* continue */ }
        } else if (tpl.channel === "whatsapp" && booking.patient_phone) {
          const rendered = renderTemplate(tpl.body as string, vars);
          await sendWhatsApp({ to: booking.patient_phone as string, body: rendered });
        }
      }

      await sb.from("bookings").update({ [sentCol]: now.toISOString() }).eq("id", booking.id);
      void sb.from("comms_log").insert({
        type: trigger,
        subject: `${trigger} booking ${booking.id}`,
        status: "sent",
        sent_at: now.toISOString(),
        body_preview: `${booking.date}:${booking.time_slot}:${booking.type}:${booking.patient_email}`,
      });
      sent++;
    }
    return sent;
  }

  async function sendFollowups(trigger: "followup_24h" | "followup_72h", windowMinPast: number) {
    const sentCol = trigger === "followup_24h" ? "followup_24h_sent_at" : "followup_72h_sent_at";
    const windowStart = new Date(now.getTime() - (windowMinPast + 120) * 60_000);
    const windowEnd = new Date(now.getTime() - (windowMinPast - 120) * 60_000);

    const { data: bookings } = await sb
      .from("bookings")
      .select("id, type, date, time_slot, patient_name, patient_email, patient_phone, zoom_join_url")
      .eq("status", "confirmed")
      .is(sentCol, null)
      .gte("date", windowStart.toISOString().slice(0, 10))
      .lte("date", windowEnd.toISOString().slice(0, 10));

    if (!bookings?.length) return 0;
    let sent = 0;
    const resend = new Resend(process.env.RESEND_API_KEY);

    for (const booking of bookings) {
      const slotMs = slotToUtcMs(booking.date, booking.time_slot);
      if (slotMs < windowStart.getTime() || slotMs > windowEnd.getTime()) continue;

      const { data: templates } = await sb
        .from("booking_alert_templates")
        .select("channel, subject, body")
        .eq("event_type_slug", booking.type)
        .eq("trigger", trigger)
        .eq("is_active", true);

      if (!templates?.length) continue;

      const dateLabel = new Date(`${booking.date}T12:00:00`).toLocaleDateString("es-CL", {
        timeZone: BOOKING_TZ, weekday: "long", day: "numeric", month: "long", year: "numeric",
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
        zoom_join_url: (booking.zoom_join_url as string) ?? "",
        site_url: config.site_url,
        logo_url: config.logo_url,
        therapist_name: "Juan Pablo Loaiza",
      };

      for (const tpl of templates) {
        if (tpl.channel === "email") {
          try {
            const rendered = renderTemplateHtml(tpl.body as string, vars);
            const subject = tpl.subject ? renderTemplate(tpl.subject as string, vars) : `Seguimiento: ${vars.type_label}`;
            await resend.emails.send({ from: config.from_email, to: booking.patient_email as string, subject, html: rendered });
          } catch { /* continue */ }
        } else if (tpl.channel === "whatsapp" && booking.patient_phone) {
          await sendWhatsApp({ to: booking.patient_phone as string, body: renderTemplate(tpl.body as string, vars) });
        }
      }

      await sb.from("bookings").update({ [sentCol]: now.toISOString() }).eq("id", booking.id);
      sent++;
    }
    return sent;
  }

  const [sent24h, sent1h] = await Promise.all([
    sendReminders("reminder_24h", 23 * 60, 25 * 60),
    sendReminders("reminder_1h", 50, 70),
  ]);

  const [sentFollowup24h, sentFollowup72h] = await Promise.all([
    sendFollowups("followup_24h", 24 * 60),
    sendFollowups("followup_72h", 72 * 60),
  ]);

  return NextResponse.json({ ok: true, sent_24h: sent24h, sent_1h: sent1h, followup_24h: sentFollowup24h, followup_72h: sentFollowup72h });
}
