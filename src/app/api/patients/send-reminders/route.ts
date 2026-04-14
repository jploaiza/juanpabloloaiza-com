/**
 * GET /api/patients/send-reminders
 *
 * Cron job — runs every minute. Matches reminder_configs by current Chile
 * day + hour + minute and sends reminders per config settings.
 *
 * Auth: x-cron-secret header
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import {
  type Patient, sessionsLeft,
  DEFAULT_REMINDER_TEMPLATE, DEFAULT_REMINDER_TEMPLATE_SIN_SESIONES,
  DEFAULT_EMAIL_SUBJECT, DEFAULT_EMAIL_BODY,
  DEFAULT_EMAIL_SUBJECT_SIN_SESIONES, DEFAULT_EMAIL_BODY_SIN_SESIONES,
  REMINDER_TEMPLATE_KEY, REMINDER_TEMPLATE_SIN_SESIONES_KEY,
  REMINDER_EMAIL_SUBJECT_KEY, REMINDER_EMAIL_BODY_KEY,
  REMINDER_EMAIL_SUBJECT_SIN_SESIONES_KEY, REMINDER_EMAIL_BODY_SIN_SESIONES_KEY,
} from "@/lib/patients";
import {
  type GCalTokenData,
  getValidToken,
  getWeekEvents,
  matchPatientsWithEvents,
} from "@/lib/google-calendar";

const FROM_EMAIL = "Juan Pablo Loaiza <academy@juanpabloloaiza.com>";
const AGENDA_URL = "https://www.juanpabloloaiza.com/agenda";
const SITE_URL = "https://www.juanpabloloaiza.com";

const CALENDAR_FILTERS = [
  "without_appointment",
  "with_appointment",
  "without_appointment_next_week",
  "with_appointment_next_week",
];

function renderTemplate(tpl: string, patient: Patient): string {
  const sl = sessionsLeft(patient);
  const exp = new Date(patient.end_date + "T12:00:00").toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(patient.end_date + "T00:00:00");
  const dias = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return tpl
    .replace(/\{nombre\}/g, patient.first_name)
    .replace(/\{sesiones\}/g, String(sl))
    .replace(/\{vencimiento\}/g, exp)
    .replace(/\{dias\}/g, String(dias));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSb = await createAdminClient();

  // Current Chile time (UTC-4)
  const nowChile = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const chileDay = nowChile.getUTCDay();
  const chileHour = nowChile.getUTCHours();
  const chileMinute = nowChile.getUTCMinutes();
  const todayStr = nowChile.toISOString().split("T")[0];

  // Load saved templates from Supabase
  const { data: settingsRows } = await adminSb.from("crm_settings").select("key, value");
  const settings: Record<string, string> = {};
  for (const row of settingsRows ?? []) settings[row.key] = row.value;

  const globalTemplates = {
    wa:              settings[REMINDER_TEMPLATE_KEY]                      || DEFAULT_REMINDER_TEMPLATE,
    waSin:           settings[REMINDER_TEMPLATE_SIN_SESIONES_KEY]         || DEFAULT_REMINDER_TEMPLATE_SIN_SESIONES,
    emailSubject:    settings[REMINDER_EMAIL_SUBJECT_KEY]                 || DEFAULT_EMAIL_SUBJECT,
    emailBody:       settings[REMINDER_EMAIL_BODY_KEY]                    || DEFAULT_EMAIL_BODY,
    emailSubjectSin: settings[REMINDER_EMAIL_SUBJECT_SIN_SESIONES_KEY]   || DEFAULT_EMAIL_SUBJECT_SIN_SESIONES,
    emailBodySin:    settings[REMINDER_EMAIL_BODY_SIN_SESIONES_KEY]       || DEFAULT_EMAIL_BODY_SIN_SESIONES,
  };

  // Match configs for current Chile hour, PLUS catch-up: configs scheduled for
  // earlier today (up to 4 hours back) that haven't run today yet.
  // This ensures GitHub Actions skipping an hour doesn't silently miss a rule.
  const todayStartUtc = todayStr + "T00:00:00+00:00"; // midnight Chile as UTC ref
  const catchupFromHour = Math.max(0, chileHour - 4);

  const [currentRes, catchupRes] = await Promise.all([
    adminSb
      .from("reminder_configs")
      .select("*")
      .eq("is_active", true)
      .eq("day_of_week", chileDay)
      .eq("hour_chile", chileHour),
    adminSb
      .from("reminder_configs")
      .select("*")
      .eq("is_active", true)
      .eq("day_of_week", chileDay)
      .gte("hour_chile", catchupFromHour)
      .lt("hour_chile", chileHour)
      .or(`last_run_at.is.null,last_run_at.lt.${todayStartUtc}`),
  ]);

  const cfgErr = currentRes.error ?? catchupRes.error;
  if (cfgErr) {
    await adminSb.from("reminder_run_logs").insert({
      chile_day: chileDay, chile_hour: chileHour, chile_minute: chileMinute,
      configs_matched: 0, results: [], top_error: cfgErr.message,
    });
    return NextResponse.json({ error: cfgErr.message }, { status: 500 });
  }

  // Deduplicate: current hour takes priority; skip catchup if same id already present
  const seen = new Set<string>();
  const configs: typeof currentRes.data = [];
  for (const c of [...(currentRes.data ?? []), ...(catchupRes.data ?? [])]) {
    if (!seen.has(c.id)) { seen.add(c.id); configs.push(c); }
  }

  if (!configs.length) {
    await adminSb.from("reminder_run_logs").insert({
      chile_day: chileDay, chile_hour: chileHour, chile_minute: chileMinute,
      configs_matched: 0, results: [],
    });
    return NextResponse.json({ message: "No configs match", day: chileDay, hour: chileHour, minute: chileMinute });
  }

  // Fetch calendar events if any config needs them
  let thisWeekIds: Set<string> | null = null;
  let nextWeekIds: Set<string> | null = null;

  const needsCalendar = configs.some((c) => CALENDAR_FILTERS.includes(c.patient_filter));
  if (needsCalendar) {
    try {
      const { data: stored } = await adminSb
        .from("google_calendar_tokens")
        .select("*")
        .limit(1)
        .single();

      if (stored) {
        const { token, newExpiresAt } = await getValidToken(stored as GCalTokenData);
        if (newExpiresAt) {
          await adminSb
            .from("google_calendar_tokens")
            .update({ access_token: token, expires_at: newExpiresAt, updated_at: new Date().toISOString() })
            .eq("id", stored.id);
        }

        const calId = stored.calendar_id ?? "primary";
        const { data: allPatients } = await adminSb.from("patients").select("id, email, phone, first_name, last_name");
        const patients = (allPatients ?? []) as Pick<Patient, "id" | "email" | "phone" | "first_name" | "last_name">[];

        const needsThisWeek = configs.some((c) => c.patient_filter === "without_appointment" || c.patient_filter === "with_appointment");
        const needsNextWeek = configs.some((c) => c.patient_filter === "without_appointment_next_week" || c.patient_filter === "with_appointment_next_week");

        if (needsThisWeek) {
          const evs = await getWeekEvents(token, calId, 0);
          thisWeekIds = new Set(matchPatientsWithEvents(patients, evs).filter((s) => s.scheduled).map((s) => s.patient_id));
        }
        if (needsNextWeek) {
          const evs = await getWeekEvents(token, calId, 1);
          nextWeekIds = new Set(matchPatientsWithEvents(patients, evs).filter((s) => s.scheduled).map((s) => s.patient_id));
        }
      }
    } catch {
      // Calendar unavailable — calendar-filtered configs will get no patients
    }
  }

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const results = [];

  for (const config of configs) {
    // Dedup: skip if ran in last 30 min
    if (config.last_run_at && Date.now() - new Date(config.last_run_at).getTime() < 30 * 60 * 1000) {
      results.push({ config_id: config.id, skipped: true, reason: "recent_run" });
      continue;
    }

    let patients: Patient[] = [];

    if (config.patient_filter === "specific" && config.patient_ids?.length) {
      // Specific patient IDs override everything else
      const { data } = await adminSb.from("patients").select("*").in("id", config.patient_ids);
      patients = (data ?? []) as Patient[];
    } else if (CALENDAR_FILTERS.includes(config.patient_filter)) {
      // Calendar-aware: base = active patients with remaining days
      const { data } = await adminSb.from("patients").select("*").eq("status", "active").gt("end_date", todayStr);
      let base = (data ?? []) as Patient[];
      if (config.patient_filter === "without_appointment" && thisWeekIds) {
        base = base.filter((p) => !thisWeekIds!.has(p.id));
      } else if (config.patient_filter === "with_appointment" && thisWeekIds) {
        base = base.filter((p) => thisWeekIds!.has(p.id));
      } else if (config.patient_filter === "without_appointment_next_week" && nextWeekIds) {
        base = base.filter((p) => !nextWeekIds!.has(p.id));
      } else if (config.patient_filter === "with_appointment_next_week" && nextWeekIds) {
        base = base.filter((p) => nextWeekIds!.has(p.id));
      } else if (!thisWeekIds && !nextWeekIds) {
        // Calendar not available — skip this config
        results.push({ config_id: config.id, skipped: true, reason: "calendar_unavailable" });
        continue;
      }
      patients = base;
    } else {
      let query = adminSb.from("patients").select("*");
      if (config.patient_filter !== "all") {
        query = query.eq("status", config.patient_filter);
      }
      if (config.patient_filter === "active") {
        query = query.gt("end_date", todayStr);
      }
      const { data } = await query;
      patients = (data ?? []) as Patient[];
    }

    const conSesiones = patients.filter((p) => sessionsLeft(p) > 0);
    const sinSesiones = patients.filter((p) => sessionsLeft(p) === 0);
    const eligible = [...conSesiones, ...sinSesiones];

    const waTemplate = config.whatsapp_template || globalTemplates.wa;
    const channels: string[] = config.channels ?? ["whatsapp", "email"];
    const sendMode: string = config.send_mode ?? "human";
    const delayMin = (config.delay_min ?? 30) * 1000;
    const delayMax = (config.delay_max ?? 120) * 1000;

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < eligible.length; i++) {
      const patient = eligible[i];
      const sl = sessionsLeft(patient);
      const isSin = sl === 0;
      const name = patient.first_name;
      const expiryDate = new Date(patient.end_date + "T12:00:00").toLocaleDateString("es-CL", {
        day: "numeric", month: "long", year: "numeric",
      });

      const waText = renderTemplate(isSin ? globalTemplates.waSin : waTemplate, patient);
      const emailSubject = renderTemplate(isSin ? globalTemplates.emailSubjectSin : globalTemplates.emailSubject, patient);
      const emailBodyText = renderTemplate(isSin ? globalTemplates.emailBodySin : globalTemplates.emailBody, patient);

      const errors: string[] = [];
      let emailOk = false;
      let whatsappOk = false;

      if (channels.includes("email") && resend) {
        try {
          const { error: emailErr } = await resend.emails.send({
            from: FROM_EMAIL,
            to: patient.email,
            subject: emailSubject,
            html: reminderEmailHtml({ name, sl, expiryDate, bodyText: emailBodyText }),
          });
          if (emailErr) throw new Error(emailErr.message);
          emailOk = true;
        } catch (err) {
          errors.push(`Email: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      if (channels.includes("whatsapp") && process.env.TEXTMEBOT_API_KEY && patient.phone) {
        try {
          const phone = patient.phone.replace(/[^\d+]/g, "");
          const url = `https://api.textmebot.com/send.php?recipient=${encodeURIComponent(phone)}&apikey=${process.env.TEXTMEBOT_API_KEY}&text=${encodeURIComponent(waText)}&json=yes`;
          const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
          const body = await res.text();
          if (!res.ok) throw new Error(`TextMeBot HTTP ${res.status}: ${body}`);
          const lower = body.toLowerCase();
          if (lower.includes("error") || lower.includes("invalid") || lower.includes("failed")) {
            throw new Error(`TextMeBot: ${body}`);
          }
          whatsappOk = true;
        } catch (err) {
          errors.push(`WhatsApp: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      const ch = [emailOk && "Email", whatsappOk && "WhatsApp"].filter(Boolean).join(" + ");
      await adminSb.from("patient_logs").insert({
        patient_id: patient.id,
        type: "reminder_sent",
        content: errors.length
          ? `Recordatorio automático${isSin ? " (sin sesiones)" : ""}${ch ? ` por ${ch}` : ""}. Errores: ${errors.join("; ")}`
          : `Recordatorio automático${isSin ? " (sin sesiones)" : ""} enviado por ${ch}.`,
      });

      if (emailOk || whatsappOk) sent++; else failed++;

      if (sendMode === "human" && i < eligible.length - 1) {
        await sleep(delayMin + Math.random() * (delayMax - delayMin));
      }
    }

    await adminSb
      .from("reminder_configs")
      .update({ last_run_at: new Date().toISOString() })
      .eq("id", config.id);

    results.push({
      config_id: config.id,
      label: config.label,
      patients: eligible.length,
      con_sesiones: conSesiones.length,
      sin_sesiones: sinSesiones.length,
      sent,
      failed,
    });
  }

  await adminSb.from("reminder_run_logs").insert({
    chile_day: chileDay, chile_hour: chileHour, chile_minute: chileMinute,
    configs_matched: results.length,
    results,
  });

  return NextResponse.json({ day: chileDay, hour: chileHour, minute: chileMinute, processed: results.length, results });
}

function reminderEmailHtml({ name, sl, expiryDate, bodyText }: {
  name: string; sl: number; expiryDate: string; bodyText: string;
}) {
  const showCounter = sl > 0;
  const ctaLabel = sl > 0 ? "Agenda tu sesión →" : "Renovar sesiones →";
  const title = sl > 0 ? "Esta semana es tu sesión 🌟" : "Continúa tu proceso de sanación 🌟";

  const counterBlock = showCounter ? `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#020d1f;border:1px solid rgba(197,160,89,0.3);margin-bottom:24px;">
<tr><td style="padding:18px;text-align:center;">
<p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#6b7280;">Sesiones disponibles</p>
<p style="margin:0;font-size:40px;color:#C5A059;line-height:1;">${sl}</p>
</td></tr>
</table>` : "";

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#020617;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0a1628;border:1px solid #C5A059;max-width:560px;width:100%;">
<tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(197,160,89,0.2);">
<img src="https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png" alt="Juan Pablo Loaiza" width="160" style="height:auto;"/>
<p style="margin:8px 0 0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(197,160,89,0.6);">Terapeuta Holístico</p>
</td></tr>
<tr><td style="padding:32px 40px;">
<p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C5A059;">Hola, ${name}</p>
<h1 style="margin:0 0 20px;font-size:20px;color:#ffffff;font-weight:400;line-height:1.4;">${title}</h1>
${counterBlock}
<p style="margin:0 0 24px;font-size:15px;color:#9ca3af;line-height:1.8;">${bodyText.replace(/\n/g, "<br/>")}</p>
<table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
<tr><td style="background:#C5A059;padding:13px 32px;">
<a href="${AGENDA_URL}" style="color:#020617;text-decoration:none;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">${ctaLabel}</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
<p style="margin:0;font-size:12px;color:#4b5563;">Juan Pablo Loaiza · <a href="${SITE_URL}" style="color:#C5A059;text-decoration:none;">juanpabloloaiza.com</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}
