/**
 * GET|POST /api/cron/booking-reminders
 *
 * Gated by CRON_SECRET (header `x-cron-secret` or `Authorization: Bearer`).
 * Meant to run every 1-5 minutes from an external scheduler (cron-job.org): Vercel's Hobby
 * plan only allows daily crons, so it is not in vercel.json.
 *
 * Sends the reminder_24h / reminder_1h (and, if enabled, followup_24h / followup_72h)
 * alerts for confirmed bookings, by email (Resend) and WhatsApp (TextMeBot).
 *
 * Both GET and POST are accepted: cron-job.org defaults to GET, and a redirect from the
 * apex domain (301) turns a POST into a GET.
 */
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { getCalendarConfig, getEventTypes, type EventType } from "@/lib/booking-config";
import { renderTemplate, renderTemplateHtml } from "@/lib/templates";
import { sendWhatsApp } from "@/lib/whatsapp";
import { buildBookingTimeVars } from "@/lib/booking-time";
import { isCronAuthorized } from "@/lib/cron-auth";
import { CHILE_TZ, zonedTimeToUtc } from "@/lib/tz";

export const maxDuration = 60;

type Trigger = "reminder_24h" | "reminder_1h" | "followup_24h" | "followup_72h";
type Row = Record<string, unknown>;

const SENT_COLUMN: Record<Trigger, string> = {
  reminder_24h: "reminder_24h_sent_at",
  reminder_1h: "reminder_1h_sent_at",
  followup_24h: "followup_24h_sent_at",
  followup_72h: "followup_72h_sent_at",
};

const DEFAULT_SUBJECT: Record<Trigger, string> = {
  reminder_24h: "Recordatorio",
  reminder_1h: "Recordatorio",
  followup_24h: "Seguimiento",
  followup_72h: "Seguimiento",
};

const DAY_MS = 86_400_000;
const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);

async function handler(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createAdminClient();
  const [config, eventTypes] = await Promise.all([getCalendarConfig(), getEventTypes(false)]);
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const now = new Date();

  const eventTypeOf = (slug: string): EventType | undefined => eventTypes.find((e) => e.slug === slug);

  /**
   * Sends one alert (all channels with an active template) for one booking.
   * Returns the per-channel outcome so the caller can decide whether to mark it as sent.
   */
  async function dispatch(trigger: Trigger, booking: Row): Promise<"sent" | "failed" | "skipped"> {
    const type = booking.type as string;
    const { data: templates } = await sb
      .from("booking_alert_templates")
      .select("channel, subject, body")
      .eq("event_type_slug", type)
      .eq("trigger", trigger)
      .eq("is_active", true);

    if (!templates?.length) return "skipped";

    const eventType = eventTypeOf(type);
    const typeLabel = eventType?.label ?? (type === "session" ? "Sesión TRVP" : "Entrevista de Admisión");
    const email = booking.patient_email as string;
    const phone = (booking.patient_phone as string | null) ?? "";
    const code = (booking.booking_code as string | null) ?? "";
    const manageUrl = `${config.site_url}/agenda/gestionar${code ? `?code=${code}` : ""}`;

    const vars: Record<string, string> = {
      name: booking.patient_name as string,
      first_name: (booking.patient_name as string).split(" ")[0],
      email,
      type_label: typeLabel,
      date: booking.date as string,
      // date_long / time (+ time_patient, time_chile, timezone…) in the patient's own timezone
      ...buildBookingTimeVars(booking.date as string, booking.time_slot as string, booking.user_tz as string | null | undefined),
      duration: String(eventType?.duration_min ?? 120),
      booking_code: code,
      zoom_join_url: (booking.zoom_join_url as string | null) ?? "",
      manage_url: manageUrl,
      cancel_url: code ? `${manageUrl}&action=cancel` : manageUrl,
      reschedule_url: code ? `${manageUrl}&action=reschedule` : manageUrl,
      site_url: config.site_url,
      logo_url: config.logo_url,
      therapist_name: "Juan Pablo Loaiza",
    };

    const outcomes: { channel: string; ok: boolean; error?: string }[] = [];

    for (const tpl of templates) {
      if (tpl.channel === "email") {
        if (!resend) {
          outcomes.push({ channel: "email", ok: false, error: "RESEND_API_KEY no configurada" });
          continue;
        }
        try {
          const subject = tpl.subject
            ? renderTemplate(tpl.subject as string, vars)
            : `${DEFAULT_SUBJECT[trigger]}: ${typeLabel}`;
          const html = renderTemplateHtml(tpl.body as string, vars);
          const res = await resend.emails.send({ from: config.from_email, to: email, subject, html });
          outcomes.push(res.error ? { channel: "email", ok: false, error: res.error.message } : { channel: "email", ok: true });
        } catch (err) {
          outcomes.push({ channel: "email", ok: false, error: err instanceof Error ? err.message : String(err) });
        }
      } else if (tpl.channel === "whatsapp") {
        if (!phone) {
          outcomes.push({ channel: "whatsapp", ok: false, error: "El paciente no tiene teléfono" });
          continue;
        }
        const res = await sendWhatsApp({ to: phone, body: renderTemplate(tpl.body as string, vars) });
        outcomes.push({ channel: "whatsapp", ok: res.ok, error: res.error });
      }
    }

    const anyOk = outcomes.some((o) => o.ok);
    const errors = outcomes.filter((o) => !o.ok).map((o) => `${o.channel}: ${o.error ?? "error"}`);

    // Awaited on purpose: a Supabase query builder does nothing until it is awaited, so the old
    // `void sb.from(...).insert(...)` never wrote a row to comms_log.
    await sb.from("comms_log").insert({
      type: trigger,
      subject: `${trigger} booking ${booking.id}`,
      status: anyOk ? "sent" : "error", // only the two values already used elsewhere in comms_log
      sent_at: now.toISOString(),
      body_preview: `${booking.date}:${booking.time_slot}:${type}:${email}${errors.length ? ` | ${errors.join("; ").slice(0, 300)}` : ""}`,
    });

    if (!anyOk) {
      console.error(`[booking-reminders] ${trigger} falló para ${email}: ${errors.join("; ")}`);
      return "failed";
    }
    return "sent";
  }

  /** Alerts whose slot falls inside [now + startMin, now + endMin] (negative = in the past). */
  async function run(trigger: Trigger, startMin: number, endMin: number) {
    const sentCol = SENT_COLUMN[trigger];
    const windowStart = now.getTime() + startMin * 60_000;
    const windowEnd = now.getTime() + endMin * 60_000;
    const lo = Math.min(windowStart, windowEnd);
    const hi = Math.max(windowStart, windowEnd);

    // `date` is a Chile calendar date while the window is computed in UTC, so widen the date
    // filter by a day on each side; the exact check against the slot's UTC time follows.
    const { data: bookings, error } = await sb
      .from("bookings")
      .select("*")
      .eq("status", "confirmed")
      .is(sentCol, null)
      .gte("date", ymd(lo - DAY_MS))
      .lte("date", ymd(hi + DAY_MS));

    if (error) {
      console.error(`[booking-reminders] consulta ${trigger} falló: ${error.message}`);
      return { sent: 0, failed: 0, error: error.message };
    }

    let sent = 0;
    let failed = 0;
    for (const booking of bookings ?? []) {
      const slotMs = zonedTimeToUtc(booking.date as string, booking.time_slot as string, CHILE_TZ);
      if (slotMs < lo || slotMs > hi) continue;

      const outcome = await dispatch(trigger, booking);
      if (outcome === "sent") {
        // Only mark as sent when at least one channel really went out; otherwise the next
        // run (still inside the window) retries.
        await sb.from("bookings").update({ [sentCol]: now.toISOString() }).eq("id", booking.id);
        sent++;
      } else if (outcome === "failed") {
        failed++;
      }
    }
    return { sent, failed };
  }

  const r24 = await run("reminder_24h", 23 * 60, 25 * 60);
  const r1 = await run("reminder_1h", 50, 70);
  const f24 = await run("followup_24h", -(24 * 60 + 120), -(24 * 60 - 120));
  const f72 = await run("followup_72h", -(72 * 60 + 120), -(72 * 60 - 120));

  const errors = [r24, r1, f24, f72].map((r) => ("error" in r ? r.error : null)).filter(Boolean);
  return NextResponse.json({
    ok: errors.length === 0,
    sent_24h: r24.sent,
    sent_1h: r1.sent,
    followup_24h: f24.sent,
    followup_72h: f72.sent,
    failed: r24.failed + r1.failed + f24.failed + f72.failed,
    ...(errors.length ? { errors } : {}),
  });
}

export const GET = handler;
export const POST = handler;
