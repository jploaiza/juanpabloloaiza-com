import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const FROM_EMAIL = "JPL Academy <academy@juanpabloloaiza.com>";
const AGENDA_URL = "https://www.juanpabloloaiza.com/agenda";
const SITE_URL = "https://www.juanpabloloaiza.com";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const adminSb = await createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const mondayOfWeek = getMondayOfCurrentWeek(today);

  // Fetch all active packs that have reminders enabled and haven't expired.
  // We filter sessions_used < sessions_total in JS because Supabase PostgREST
  // doesn't support column-to-column comparisons in the filter API.
  const { data: activePacks, error: activePacksError } = await adminSb
    .from("patient_packs")
    .select("id, user_id, pack_type, sessions_total, sessions_used, end_date")
    .eq("is_active", true)
    .eq("reminders_enabled", true)
    .gt("end_date", todayStr);

  if (activePacksError) {
    return NextResponse.json({ error: activePacksError.message }, { status: 500 });
  }

  const eligiblePacks = (activePacks ?? []).filter(
    (pack) => pack.sessions_used < pack.sessions_total
  );

  let sent = 0;
  let skipped = 0;

  for (const pack of eligiblePacks) {
    // Fetch profile
    const { data: profile } = await adminSb
      .from("profiles")
      .select("email, full_name")
      .eq("id", pack.user_id)
      .maybeSingle();

    if (!profile?.email) {
      skipped++;
      continue;
    }

    // Skip if a weekly_reminder was already sent to this pack since Monday
    const { data: existingLog } = await adminSb
      .from("comms_log")
      .select("id")
      .eq("user_id", pack.user_id)
      .eq("pack_id", pack.id)
      .eq("type", "weekly_reminder")
      .gte("sent_at", mondayOfWeek.toISOString())
      .maybeSingle();

    if (existingLog) {
      skipped++;
      continue;
    }

    const sessionsRemaining = pack.sessions_total - pack.sessions_used;
    const firstName = profile.full_name?.split(" ")[0] ?? "paciente";
    const expiryDate = formatDateSpanish(new Date(pack.end_date));
    const subject = `Recuerda tomar tus sesiones — Te quedan ${sessionsRemaining} disponible${sessionsRemaining === 1 ? "" : "s"}`;

    const { error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: profile.email,
      subject,
      html: weeklyReminderEmail({ firstName, sessionsRemaining, expiryDate }),
    });

    if (sendError) {
      skipped++;
      continue;
    }

    await adminSb.from("comms_log").insert({
      user_id: pack.user_id,
      pack_id: pack.id,
      type: "weekly_reminder",
      subject,
      body_preview: `Quedan ${sessionsRemaining} sesiones. Vence ${expiryDate}.`,
      sent_at: new Date().toISOString(),
      status: "sent",
    });

    sent++;
  }

  return NextResponse.json({ sent, skipped });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getMondayOfCurrentWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function formatDateSpanish(date: Date): string {
  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  });
}

// ── Email template ─────────────────────────────────────────────────────────

function weeklyReminderEmail({
  firstName,
  sessionsRemaining,
  expiryDate,
}: {
  firstName: string;
  sessionsRemaining: number;
  expiryDate: string;
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Recuerda tus sesiones</title></head>
<body style="margin:0;padding:0;background:#020617;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#0a1628;border:1px solid #C5A059;max-width:560px;width:100%;">

      <tr><td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid rgba(197,160,89,0.2);">
        <img src="https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png" alt="Juan Pablo Loaiza" width="160" style="height:auto;margin-bottom:8px;"/>
        <p style="margin:0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(197,160,89,0.6);">Terapeuta Holístico</p>
      </td></tr>

      <tr><td style="padding:40px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C5A059;">Hola, ${firstName}</p>
        <h1 style="margin:0 0 24px;font-size:24px;color:#ffffff;font-weight:400;line-height:1.4;">Tienes sesiones disponibles</h1>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#020d1f;border:1px solid rgba(197,160,89,0.3);margin-bottom:32px;">
          <tr><td style="padding:24px;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#6b7280;">Sesiones disponibles</p>
            <p style="margin:0;font-size:48px;color:#C5A059;font-weight:400;line-height:1;">${sessionsRemaining}</p>
          </td></tr>
        </table>

        <p style="margin:0 0 24px;font-size:15px;color:#9ca3af;line-height:1.8;">
          Recuerda que tus sesiones vencen el <span style="color:#C5A059;">${expiryDate}</span>. No dejes pasar esta oportunidad de continuar tu proceso de sanación y transformación.
        </p>
        <p style="margin:0 0 32px;font-size:15px;color:#9ca3af;line-height:1.8;">
          Agenda con anticipación para asegurar el horario que mejor se adapte a ti.
        </p>

        <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
          <tr><td style="background:#C5A059;padding:16px 40px;">
            <a href="${AGENDA_URL}" style="color:#020617;text-decoration:none;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">
              Agenda tu sesión →
            </a>
          </td></tr>
        </table>

        <p style="margin:0;font-size:13px;color:#4b5563;line-height:1.8;text-align:center;">
          Si ya tienes una sesión agendada, puedes ignorar este mensaje.<br/>
          Estamos aquí para acompañarte en tu camino.
        </p>
      </td></tr>

      <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
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
