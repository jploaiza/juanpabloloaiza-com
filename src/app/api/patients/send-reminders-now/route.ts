/**
 * POST /api/patients/send-reminders-now
 *
 * Envía recordatorios (WhatsApp vía TextMeBot + Email vía Resend).
 * Autenticado como admin — no requiere CRON_SECRET.
 *
 * Body:
 *   patient_ids: string[]         — IDs de pacientes a notificar
 *   whatsapp_template?: string    — Template del WA. Variables disponibles:
 *                                   {nombre} {sesiones} {vencimiento} {dias}
 *   channels?: ("whatsapp"|"email")[]  — default: ["whatsapp","email"]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import {
  type Patient, sessionsLeft,
  DEFAULT_REMINDER_TEMPLATE, DEFAULT_EMAIL_SUBJECT, DEFAULT_EMAIL_BODY,
} from "@/lib/patients";

const FROM_EMAIL = "Juan Pablo Loaiza <academy@juanpabloloaiza.com>";
const AGENDA_URL = "https://www.juanpabloloaiza.com/agenda";
const SITE_URL = "https://www.juanpabloloaiza.com";

function renderTemplate(tpl: string, patient: Patient): string {
  const sl = sessionsLeft(patient);
  const exp = new Date(patient.end_date + "T12:00:00").toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(patient.end_date + "T00:00:00");
  const dias = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const nombre = patient.first_name;

  return tpl
    .replace(/\{nombre\}/g, nombre)
    .replace(/\{sesiones\}/g, String(sl))
    .replace(/\{vencimiento\}/g, exp)
    .replace(/\{dias\}/g, String(dias));
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adminSb = await createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY!);

  const body = await req.json().catch(() => ({}));
  const {
    patient_ids,
    whatsapp_template = DEFAULT_REMINDER_TEMPLATE,
    email_subject = DEFAULT_EMAIL_SUBJECT,
    email_body = DEFAULT_EMAIL_BODY,
    channels = ["whatsapp", "email"],
  } = body as {
    patient_ids: string[];
    whatsapp_template?: string;
    email_subject?: string;
    email_body?: string;
    channels?: string[];
  };

  if (!patient_ids?.length) {
    return NextResponse.json({ error: "patient_ids requerido" }, { status: 400 });
  }

  const { data: patients, error } = await adminSb
    .from("patients")
    .select("*")
    .in("id", patient_ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: {
    id: string; name: string; email: boolean; whatsapp: boolean; error?: string;
  }[] = [];

  for (const patient of (patients ?? []) as Patient[]) {
    const sl = sessionsLeft(patient);
    const waText = renderTemplate(whatsapp_template, patient);
    const name = patient.first_name;
    const expiry = new Date(patient.end_date + "T12:00:00").toLocaleDateString("es-CL", {
      day: "numeric", month: "long", year: "numeric",
    });

    let emailOk = false;
    let whatsappOk = false;
    const errors: string[] = [];

    // Email
    if (channels.includes("email") && process.env.RESEND_API_KEY) {
      try {
        const renderedSubject = renderTemplate(email_subject, patient);
        const renderedBody = renderTemplate(email_body, patient);
        const { error: emailErr } = await resend.emails.send({
          from: FROM_EMAIL,
          to: patient.email,
          subject: renderedSubject,
          html: reminderEmailHtml({ name, sl, expiryDate: expiry, bodyText: renderedBody }),
        });
        if (emailErr) throw new Error(emailErr.message);
        emailOk = true;
      } catch (err) {
        errors.push(`Email: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // WhatsApp via TextMeBot
    if (channels.includes("whatsapp")) {
      if (!process.env.TEXTMEBOT_API_KEY) {
        errors.push("WhatsApp: TEXTMEBOT_API_KEY no configurada");
      } else if (!patient.phone) {
        errors.push("WhatsApp: paciente sin teléfono");
      } else {
        try {
          const phone = patient.phone.replace(/[^\d+]/g, "");
          const url = `https://api.textmebot.com/send.php?recipient=${encodeURIComponent(phone)}&apikey=${process.env.TEXTMEBOT_API_KEY}&text=${encodeURIComponent(waText)}&json=yes`;
          const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
          const body = await res.text();
          if (!res.ok) throw new Error(`TextMeBot HTTP ${res.status}: ${body}`);
          // TextMeBot puede responder 200 con error en body
          const lower = body.toLowerCase();
          if (lower.includes("error") || lower.includes("invalid") || lower.includes("failed")) {
            throw new Error(`TextMeBot: ${body}`);
          }
          whatsappOk = true;
        } catch (err) {
          errors.push(`WhatsApp: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    // Log
    const ch = [emailOk && "Email", whatsappOk && "WhatsApp"].filter(Boolean).join(" + ");
    await adminSb.from("patient_logs").insert({
      patient_id: patient.id,
      type: "reminder_sent",
      content: errors.length
        ? `Recordatorio${ch ? ` por ${ch}` : ""}. Errores: ${errors.join("; ")}`
        : `Recordatorio enviado por ${ch}.`,
    });

    results.push({
      id: patient.id,
      name: `${patient.first_name} ${patient.last_name}`.trim(),
      email: emailOk,
      whatsapp: whatsappOk,
      error: errors.join("; ") || undefined,
    });
  }

  return NextResponse.json({ sent: results.length, results });
}

function reminderEmailHtml({ name, sl, expiryDate, bodyText }: {
  name: string; sl: number; expiryDate: string; bodyText: string;
}) {
  const showCounter = sl > 0;
  const ctaLabel = sl > 0 ? "Agenda tu sesión →" : "Renovar sesiones →";
  const title = sl > 0 ? "Esta semana es tu sesión 🌟" : "Continúa tu proceso de sanación 🌟";

  const counterBlock = showCounter ? `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0e1b30;border:1px solid rgba(197,160,89,0.3);margin-bottom:24px;">
<tr><td style="padding:18px;text-align:center;">
<p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#6b7280;">Sesiones disponibles</p>
<p style="margin:0;font-size:40px;color:#C5A059;line-height:1;">${sl}</p>
</td></tr>
</table>` : "";

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a1628;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#16213e;border:1px solid #C5A059;max-width:560px;width:100%;">
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
<a href="${AGENDA_URL}" style="color:#0a1628;text-decoration:none;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">${ctaLabel}</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
<p style="margin:0;font-size:12px;color:#4b5563;">Juan Pablo Loaiza · <a href="${SITE_URL}" style="color:#C5A059;text-decoration:none;">juanpabloloaiza.com</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}
