import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const FROM_EMAIL = "JPL Academy <academy@juanpabloloaiza.com>";
const AGENDA_URL = "https://www.juanpabloloaiza.com/agenda";
const SITE_URL = "https://www.juanpabloloaiza.com";

type CommType = "expiry_7d" | "expiry_1d" | "expiry_final";

interface Pack {
  id: string;
  user_id: string;
  pack_type: string;
  sessions_total: number;
  sessions_used: number;
  end_date: string;
}

interface Profile {
  email: string;
  full_name: string | null;
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const adminSb = await createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const now = new Date();
  const todayStr = toDateString(now);
  const in7dStr = toDateString(addDays(now, 7));
  const in1dStr = toDateString(addDays(now, 1));

  // Track start of today for dedup checks
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  const summary = {
    expiry_7d: { sent: 0, skipped: 0 },
    expiry_1d: { sent: 0, skipped: 0 },
    expiry_final: { sent: 0, skipped: 0 },
    deactivated: 0,
    statusUpdated: 0,
  };

  // ── 1. 7-day warning ───────────────────────────────────────────────────────

  const { data: packs7d } = await adminSb
    .from("patient_packs")
    .select("id, user_id, pack_type, sessions_total, sessions_used, end_date")
    .eq("is_active", true)
    .eq("end_date", in7dStr);

  for (const pack of packs7d ?? []) {
    const alreadySent = await wasAlreadySentToday(adminSb, pack, "expiry_7d", todayStart);
    if (alreadySent) { summary.expiry_7d.skipped++; continue; }

    const profile = await fetchProfile(adminSb, pack.user_id);
    if (!profile) { summary.expiry_7d.skipped++; continue; }

    const sessionsRemaining = pack.sessions_total - pack.sessions_used;
    const firstName = profile.full_name?.split(" ")[0] ?? "paciente";
    const expiryDate = formatDateSpanish(new Date(pack.end_date));
    const subject = `Tus sesiones vencen en 7 días — Quedan ${sessionsRemaining}`;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: profile.email,
      subject,
      html: expiryWarningEmail({ firstName, sessionsRemaining, expiryDate, daysLeft: 7 }),
    });

    if (error) { summary.expiry_7d.skipped++; continue; }

    await logComm(adminSb, pack, "expiry_7d", subject, `Vence en 7 días. Quedan ${sessionsRemaining} sesiones.`);
    summary.expiry_7d.sent++;
  }

  // ── 2. 1-day warning ───────────────────────────────────────────────────────

  const { data: packs1d } = await adminSb
    .from("patient_packs")
    .select("id, user_id, pack_type, sessions_total, sessions_used, end_date")
    .eq("is_active", true)
    .eq("end_date", in1dStr);

  for (const pack of packs1d ?? []) {
    const alreadySent = await wasAlreadySentToday(adminSb, pack, "expiry_1d", todayStart);
    if (alreadySent) { summary.expiry_1d.skipped++; continue; }

    const profile = await fetchProfile(adminSb, pack.user_id);
    if (!profile) { summary.expiry_1d.skipped++; continue; }

    const sessionsRemaining = pack.sessions_total - pack.sessions_used;
    const firstName = profile.full_name?.split(" ")[0] ?? "paciente";
    const expiryDate = formatDateSpanish(new Date(pack.end_date));
    const subject = `Último aviso — Tus sesiones vencen mañana`;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: profile.email,
      subject,
      html: expiryWarningEmail({ firstName, sessionsRemaining, expiryDate, daysLeft: 1 }),
    });

    if (error) { summary.expiry_1d.skipped++; continue; }

    await logComm(adminSb, pack, "expiry_1d", subject, `Vence mañana. Quedan ${sessionsRemaining} sesiones.`);
    summary.expiry_1d.sent++;
  }

  // ── 3. Final expiry — pack expired today or before ────────────────────────

  const { data: expiredPacks } = await adminSb
    .from("patient_packs")
    .select("id, user_id, pack_type, sessions_total, sessions_used, end_date")
    .eq("is_active", true)
    .lte("end_date", todayStr);

  for (const pack of expiredPacks ?? []) {
    const alreadySent = await wasAlreadySentToday(adminSb, pack, "expiry_final", todayStart);

    if (!alreadySent) {
      const profile = await fetchProfile(adminSb, pack.user_id);

      if (profile) {
        const sessionsUnused = pack.sessions_total - pack.sessions_used;
        const firstName = profile.full_name?.split(" ")[0] ?? "paciente";
        const expiryDate = formatDateSpanish(new Date(pack.end_date));
        const subject = "Tu pack de sesiones ha vencido";

        const { error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: profile.email,
          subject,
          html: expiryFinalEmail({ firstName, sessionsUnused, expiryDate }),
        });

        if (!error) {
          await logComm(adminSb, pack, "expiry_final", subject, `Pack vencido. ${sessionsUnused} sesiones no usadas.`);
          summary.expiry_final.sent++;
        } else {
          summary.expiry_final.skipped++;
        }
      } else {
        summary.expiry_final.skipped++;
      }
    } else {
      summary.expiry_final.skipped++;
    }

    // Deactivate the pack regardless of email outcome
    await adminSb
      .from("patient_packs")
      .update({ is_active: false })
      .eq("id", pack.id);
    summary.deactivated++;

    // If the user has no other active packs, set patient_status to 'inactive'
    const { data: otherActivePacks } = await adminSb
      .from("patient_packs")
      .select("id")
      .eq("user_id", pack.user_id)
      .eq("is_active", true)
      .neq("id", pack.id);

    if (!otherActivePacks || otherActivePacks.length === 0) {
      await adminSb
        .from("profiles")
        .update({ patient_status: "inactive" })
        .eq("id", pack.user_id);
      summary.statusUpdated++;
    }
  }

  return NextResponse.json(summary);
}

// ── Shared helpers ─────────────────────────────────────────────────────────

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchProfile(adminSb: any, userId: string): Promise<Profile | null> {
  const { data } = await adminSb
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .maybeSingle();
  return data ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function wasAlreadySentToday(adminSb: any, pack: Pack, type: CommType, todayStart: Date): Promise<boolean> {
  const { data } = await adminSb
    .from("comms_log")
    .select("id")
    .eq("user_id", pack.user_id)
    .eq("pack_id", pack.id)
    .eq("type", type)
    .gte("sent_at", todayStart.toISOString())
    .maybeSingle();
  return !!data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logComm(adminSb: any, pack: Pack, type: CommType, subject: string, bodyPreview: string): Promise<void> {
  await adminSb.from("comms_log").insert({
    user_id: pack.user_id,
    pack_id: pack.id,
    type,
    subject,
    body_preview: bodyPreview,
    sent_at: new Date().toISOString(),
    status: "sent",
  });
}

// ── Email templates ────────────────────────────────────────────────────────

function expiryWarningEmail({
  firstName,
  sessionsRemaining,
  expiryDate,
  daysLeft,
}: {
  firstName: string;
  sessionsRemaining: number;
  expiryDate: string;
  daysLeft: number;
}): string {
  const urgencyColor = daysLeft === 1 ? "#e53e3e" : "#C5A059";
  const urgencyLabel = daysLeft === 1
    ? "Tu pack vence <strong style=\"color:#e53e3e;\">mañana</strong>"
    : `Tu pack vence en <strong style="color:#C5A059;">${daysLeft} días</strong>`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Tus sesiones vencen pronto</title></head>
<body style="margin:0;padding:0;background:#0a1628;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#16213e;border:1px solid ${urgencyColor};max-width:560px;width:100%;">

      <tr><td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid rgba(197,160,89,0.2);">
        <img src="https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png" alt="Juan Pablo Loaiza" width="160" style="height:auto;margin-bottom:8px;"/>
        <p style="margin:0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(197,160,89,0.6);">Terapeuta Holístico</p>
      </td></tr>

      <tr><td style="padding:40px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C5A059;">Hola, ${firstName}</p>
        <h1 style="margin:0 0 24px;font-size:24px;color:#ffffff;font-weight:400;line-height:1.4;">${urgencyLabel}</h1>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e1b30;border:1px solid rgba(197,160,89,0.3);margin-bottom:32px;">
          <tr>
            <td style="padding:20px;text-align:center;border-right:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b7280;">Sesiones restantes</p>
              <p style="margin:0;font-size:36px;color:#C5A059;font-weight:400;line-height:1;">${sessionsRemaining}</p>
            </td>
            <td style="padding:20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b7280;">Fecha de vencimiento</p>
              <p style="margin:0;font-size:14px;color:#e5e7eb;line-height:1.4;">${expiryDate}</p>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 32px;font-size:15px;color:#9ca3af;line-height:1.8;">
          No pierdas tus sesiones. Agenda ahora y aprovecha al máximo tu proceso de sanación con Juan Pablo.
        </p>

        <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
          <tr><td style="background:#C5A059;padding:16px 40px;">
            <a href="${AGENDA_URL}" style="color:#0a1628;text-decoration:none;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">
              Agenda tu sesión →
            </a>
          </td></tr>
        </table>
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

function expiryFinalEmail({
  firstName,
  sessionsUnused,
  expiryDate,
}: {
  firstName: string;
  sessionsUnused: number;
  expiryDate: string;
}): string {
  const unusedNote = sessionsUnused > 0
    ? `<p style="margin:0 0 24px;font-size:15px;color:#9ca3af;line-height:1.8;">
        Lamentablemente, ${sessionsUnused} sesión${sessionsUnused === 1 ? "" : "es"} no ${sessionsUnused === 1 ? "fue utilizada" : "fueron utilizadas"} antes del vencimiento.
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Tu pack ha vencido</title></head>
<body style="margin:0;padding:0;background:#0a1628;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#16213e;border:1px solid rgba(197,160,89,0.4);max-width:560px;width:100%;">

      <tr><td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid rgba(197,160,89,0.2);">
        <img src="https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png" alt="Juan Pablo Loaiza" width="160" style="height:auto;margin-bottom:8px;"/>
        <p style="margin:0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(197,160,89,0.6);">Terapeuta Holístico</p>
      </td></tr>

      <tr><td style="padding:40px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C5A059;">Hola, ${firstName}</p>
        <h1 style="margin:0 0 24px;font-size:24px;color:#ffffff;font-weight:400;line-height:1.4;">Tu pack de sesiones ha vencido</h1>

        <p style="margin:0 0 16px;font-size:15px;color:#9ca3af;line-height:1.8;">
          Tu pack venció el <span style="color:#C5A059;">${expiryDate}</span>.
        </p>
        ${unusedNote}
        <p style="margin:0 0 32px;font-size:15px;color:#9ca3af;line-height:1.8;">
          Si deseas continuar tu proceso de sanación, puedes adquirir un nuevo pack de sesiones. Estaré encantado de acompañarte en el siguiente paso de tu camino.
        </p>

        <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
          <tr><td style="background:#C5A059;padding:16px 40px;">
            <a href="${AGENDA_URL}" style="color:#0a1628;text-decoration:none;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">
              Ver packs disponibles →
            </a>
          </td></tr>
        </table>
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
