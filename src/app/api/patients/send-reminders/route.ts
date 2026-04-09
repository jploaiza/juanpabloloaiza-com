/**
 * POST /api/patients/send-reminders
 *
 * Envía recordatorios (Email + WhatsApp) a todos los pacientes activos
 * cuyo reminder_day coincide con el día actual (hora Chile, UTC-4).
 *
 * Variables de entorno requeridas:
 *   CRON_SECRET         — Secret para proteger este endpoint.
 *                         Configúralo en Vercel: Settings → Environment Variables → CRON_SECRET
 *   TEXTMEBOT_API_KEY   — API key de TextMeBot (textmebot.com).
 *                         Configúralo en Vercel: Settings → Environment Variables → TEXTMEBOT_API_KEY
 *   RESEND_API_KEY      — Ya configurado en el proyecto.
 *
 * Este endpoint es llamado automáticamente por Vercel Cron.
 * También puedes dispararlo manualmente:
 *   curl -X GET https://tudominio.com/api/patients/send-reminders \
 *        -H "x-cron-secret: TU_CRON_SECRET"
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { type Patient, sessionsLeft, buildReminderText } from "@/lib/patients";

const FROM_EMAIL = "Juan Pablo Loaiza <academy@juanpabloloaiza.com>";
const AGENDA_URL = "https://www.juanpabloloaiza.com/agenda";
const SITE_URL = "https://www.juanpabloloaiza.com";

export async function GET(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────
  const secret = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY no configurada" }, { status: 500 });
  }

  const adminSb = await createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);

  // ── Día actual en hora Chile (UTC-4) ─────────────────────────
  const nowChile = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const todayDayOfWeek = nowChile.getUTCDay(); // 0=Sunday … 6=Saturday
  const todayStr = nowChile.toISOString().split("T")[0];

  // ── Buscar pacientes activos con reminder_day = hoy ──────────
  const { data: patients, error } = await adminSb
    .from("patients")
    .select("*")
    .eq("status", "active")
    .eq("reminder_day", todayDayOfWeek)
    .gt("end_date", todayStr);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let emailSent = 0;
  let whatsappSent = 0;
  let failed = 0;

  for (const patient of (patients ?? []) as Patient[]) {
    const sl = sessionsLeft(patient);
    if (sl <= 0) continue;

    const name = patient.full_name.split(" ")[0];
    const expiryDate = new Date(patient.end_date + "T12:00:00").toLocaleDateString("es-CL", {
      day: "numeric", month: "long", year: "numeric",
    });
    const subject = `Recuerda tus sesiones — Te quedan ${sl}`;
    const whatsappText = buildReminderText(patient);

    let emailOk = false;
    let whatsappOk = false;
    const errors: string[] = [];

    // ── Email ──────────────────────────────────────────────────
    try {
      const { error: emailErr } = await resend.emails.send({
        from: FROM_EMAIL,
        to: patient.email,
        subject,
        html: reminderEmailHtml({ name, sl, expiryDate }),
      });
      if (emailErr) throw new Error(emailErr.message);
      emailOk = true;
      emailSent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Email: ${msg}`);
      failed++;
    }

    // ── WhatsApp vía TextMeBot ─────────────────────────────────
    if (process.env.TEXTMEBOT_API_KEY && patient.phone) {
      try {
        const phone = patient.phone.replace(/[^\d+]/g, "");
        const url = `https://api.textmebot.com/send.php?recipient=${encodeURIComponent(phone)}&apikey=${process.env.TEXTMEBOT_API_KEY}&text=${encodeURIComponent(whatsappText)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        whatsappOk = true;
        whatsappSent++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`WhatsApp: ${msg}`);
        // fail silently — no increment to failed (email may have succeeded)
      }
    }

    // ── Log ────────────────────────────────────────────────────
    const channels = [emailOk && "Email", whatsappOk && "WhatsApp"].filter(Boolean).join(" + ");
    const logContent = errors.length
      ? `Recordatorio enviado${channels ? ` por ${channels}` : ""}. Errores: ${errors.join("; ")}`
      : `Recordatorio enviado por ${channels}.`;

    await adminSb.from("patient_logs").insert({
      patient_id: patient.id,
      type: "reminder_sent",
      content: logContent,
    });
  }

  return NextResponse.json({
    processed: patients?.length ?? 0,
    emailSent,
    whatsappSent,
    failed,
    day: todayDayOfWeek,
    date: todayStr,
  });
}

// ── Email HTML ─────────────────────────────────────────────────

function reminderEmailHtml({
  name,
  sl,
  expiryDate,
}: {
  name: string;
  sl: number;
  expiryDate: string;
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#020617;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#0a1628;border:1px solid #C5A059;max-width:560px;width:100%;">

      <tr><td style="padding:36px 40px 28px;text-align:center;border-bottom:1px solid rgba(197,160,89,0.2);">
        <img src="https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png" alt="Juan Pablo Loaiza" width="160" style="height:auto;"/>
        <p style="margin:8px 0 0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(197,160,89,0.6);">Terapeuta Holístico</p>
      </td></tr>

      <tr><td style="padding:36px 40px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C5A059;">Hola, ${name}</p>
        <h1 style="margin:0 0 24px;font-size:22px;color:#ffffff;font-weight:400;line-height:1.4;">Esta semana es tu sesión 🌟</h1>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#020d1f;border:1px solid rgba(197,160,89,0.3);margin-bottom:28px;">
          <tr><td style="padding:20px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#6b7280;">Sesiones disponibles</p>
            <p style="margin:0;font-size:44px;color:#C5A059;font-weight:400;line-height:1;">${sl}</p>
          </td></tr>
        </table>

        <p style="margin:0 0 20px;font-size:15px;color:#9ca3af;line-height:1.8;">
          Recuerda que tus sesiones vencen el <span style="color:#C5A059;">${expiryDate}</span>.
          No dejes pasar esta oportunidad de continuar tu proceso de sanación y transformación.
        </p>

        <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
          <tr><td style="background:#C5A059;padding:14px 36px;">
            <a href="${AGENDA_URL}" style="color:#020617;text-decoration:none;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">
              Agenda tu sesión →
            </a>
          </td></tr>
        </table>

        <p style="margin:0;font-size:13px;color:#4b5563;line-height:1.8;text-align:center;">
          Si ya tienes sesión agendada, puedes ignorar este mensaje.
        </p>
      </td></tr>

      <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
        <p style="margin:0;font-size:12px;color:#4b5563;">
          Juan Pablo Loaiza · Terapeuta Holístico<br/>
          <a href="${SITE_URL}" style="color:#C5A059;text-decoration:none;">juanpabloloaiza.com</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}
