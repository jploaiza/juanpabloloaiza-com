import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

const FROM_EMAIL = "JPL Academy <academy@juanpabloloaiza.com>";
const LOGO_URL =
  "https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png";
const WHATSAPP_URL = "https://api.whatsapp.com/send?phone=56962081884";

// ── Email wrapper ────────────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>JPL Academy</title>
</head>
<body style="margin:0;padding:0;background-color:#020617;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#020617;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;background-color:#0a1628;border:1px solid rgba(197,160,89,0.25);">
          <!-- Gold corner top -->
          <tr>
            <td width="12" height="12" style="border-top:1px solid #C5A059;border-left:1px solid #C5A059;"></td>
            <td style="border-top:1px solid rgba(197,160,89,0.25);height:12px;"></td>
            <td width="12" height="12" style="border-top:1px solid #C5A059;border-right:1px solid #C5A059;"></td>
          </tr>
          <tr>
            <td width="12" style="border-left:1px solid rgba(197,160,89,0.15);"></td>
            <td>
              <!-- Header logo -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#020d1f;padding:28px 32px 24px;text-align:center;border-bottom:1px solid rgba(197,160,89,0.2);">
                    <img src="${LOGO_URL}" width="180" alt="JPL Academy" style="display:inline-block;max-width:180px;border:0;opacity:0.9;"/>
                  </td>
                </tr>
              </table>
              ${content}
              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:24px 32px 28px;text-align:center;background-color:#020d1f;border-top:1px solid rgba(197,160,89,0.15);">
                    <p style="color:#C5A059;font-size:9px;letter-spacing:4px;text-transform:uppercase;font-family:Georgia,serif;margin:0 0 12px;">JPL Academy</p>
                    <p style="color:#2d4a6e;font-size:11px;margin:0;font-family:Georgia,serif;">
                      <a href="mailto:academy@juanpabloloaiza.com" style="color:#4a6a8a;text-decoration:none;">academy@juanpabloloaiza.com</a>
                      &nbsp;·&nbsp;
                      <a href="${WHATSAPP_URL}" style="color:#4a6a8a;text-decoration:none;">+56 9 6208 1884</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
            <td width="12" style="border-right:1px solid rgba(197,160,89,0.15);"></td>
          </tr>
          <!-- Gold corner bottom -->
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

// ── Email templates ─────────────────────────────────────────────────────────

function buildManualHtml(name: string, sessionsLeft: number, endDate: string): string {
  const formattedDate = endDate
    ? new Date(endDate).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "fecha por confirmar";

  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:32px 32px 8px;text-align:center;">
          <p style="color:#C5A059;font-size:9px;letter-spacing:5px;text-transform:uppercase;margin:0 0 8px;font-family:Georgia,serif;">Recordatorio de sesiones</p>
          <h1 style="color:#ffffff;font-size:22px;letter-spacing:3px;text-transform:uppercase;margin:0;font-family:Georgia,serif;font-weight:normal;">Hola, ${name}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <p style="color:#cbd5e1;font-size:16px;line-height:1.85;margin:0 0 16px;font-family:Georgia,serif;">
            Quería recordarte que tienes <strong style="color:#C5A059;">${sessionsLeft} ${sessionsLeft === 1 ? "sesión disponible" : "sesiones disponibles"}</strong> hasta el <strong style="color:#C5A059;">${formattedDate}</strong>.
          </p>
          <p style="color:#cbd5e1;font-size:16px;line-height:1.85;margin:0;font-family:Georgia,serif;">
            Si deseas coordinar tu próxima sesión, contáctame directamente por WhatsApp o responde este correo.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${WHATSAPP_URL}" style="display:inline-block;background-color:#C5A059;color:#020617;padding:12px 36px;text-decoration:none;font-size:10px;text-transform:uppercase;letter-spacing:4px;font-family:Georgia,serif;font-weight:bold;">
            Coordinar sesión
          </a>
        </td>
      </tr>
    </table>`;

  return emailWrapper(body);
}

function buildExpiry7dHtml(name: string, sessionsLeft: number, endDate: string): string {
  const formattedDate = endDate
    ? new Date(endDate).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "en 7 días";

  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:32px 32px 8px;text-align:center;">
          <p style="color:#f59e0b;font-size:9px;letter-spacing:5px;text-transform:uppercase;margin:0 0 8px;font-family:Georgia,serif;">Aviso de vencimiento</p>
          <h1 style="color:#ffffff;font-size:22px;letter-spacing:3px;text-transform:uppercase;margin:0;font-family:Georgia,serif;font-weight:normal;">Hola, ${name}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <p style="color:#cbd5e1;font-size:16px;line-height:1.85;margin:0 0 16px;font-family:Georgia,serif;">
            Tu pack de sesiones <strong style="color:#f59e0b;">vence en 7 días</strong>, el <strong style="color:#f59e0b;">${formattedDate}</strong>.
          </p>
          <p style="color:#cbd5e1;font-size:16px;line-height:1.85;margin:0 0 16px;font-family:Georgia,serif;">
            Aún tienes <strong style="color:#C5A059;">${sessionsLeft} ${sessionsLeft === 1 ? "sesión" : "sesiones"}</strong> disponibles. ¡No dejes que venzan!
          </p>
          <p style="color:#cbd5e1;font-size:16px;line-height:1.85;margin:0;font-family:Georgia,serif;">
            Contáctame para coordinar tus sesiones restantes antes del vencimiento.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${WHATSAPP_URL}" style="display:inline-block;background-color:#f59e0b;color:#020617;padding:12px 36px;text-decoration:none;font-size:10px;text-transform:uppercase;letter-spacing:4px;font-family:Georgia,serif;font-weight:bold;">
            Agendar sesión ahora
          </a>
        </td>
      </tr>
    </table>`;

  return emailWrapper(body);
}

function buildExpiry1dHtml(name: string, sessionsLeft: number, endDate: string): string {
  const formattedDate = endDate
    ? new Date(endDate).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "mañana";

  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:32px 32px 8px;text-align:center;">
          <p style="color:#ef4444;font-size:9px;letter-spacing:5px;text-transform:uppercase;margin:0 0 8px;font-family:Georgia,serif;">Ultimo aviso</p>
          <h1 style="color:#ffffff;font-size:22px;letter-spacing:3px;text-transform:uppercase;margin:0;font-family:Georgia,serif;font-weight:normal;">Hola, ${name}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <p style="color:#cbd5e1;font-size:16px;line-height:1.85;margin:0 0 16px;font-family:Georgia,serif;">
            <strong style="color:#ef4444;">¡Último aviso!</strong> Tu pack de sesiones <strong style="color:#ef4444;">vence mañana</strong>, el <strong style="color:#ef4444;">${formattedDate}</strong>.
          </p>
          <p style="color:#cbd5e1;font-size:16px;line-height:1.85;margin:0;font-family:Georgia,serif;">
            Tienes <strong style="color:#C5A059;">${sessionsLeft} ${sessionsLeft === 1 ? "sesión" : "sesiones"}</strong> que vencen. Contáctame de inmediato para no perderlas.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${WHATSAPP_URL}" style="display:inline-block;background-color:#ef4444;color:#ffffff;padding:12px 36px;text-decoration:none;font-size:10px;text-transform:uppercase;letter-spacing:4px;font-family:Georgia,serif;font-weight:bold;">
            Contactar ahora
          </a>
        </td>
      </tr>
    </table>`;

  return emailWrapper(body);
}

// ── Subject lines ─────────────────────────────────────────────────────────────

function getSubjectAndHtml(
  type: string,
  name: string,
  sessionsLeft: number,
  endDate: string
): { subject: string; html: string } {
  switch (type) {
    case "manual":
      return {
        subject: `Recordatorio de sesiones — JPL Academy`,
        html: buildManualHtml(name, sessionsLeft, endDate),
      };
    case "weekly_reminder":
      return {
        subject: `Recordatorio semanal — Tu proceso en JPL Academy`,
        html: buildManualHtml(name, sessionsLeft, endDate),
      };
    case "expiry_7d":
      return {
        subject: `Tu pack de sesiones vence en 7 días`,
        html: buildExpiry7dHtml(name, sessionsLeft, endDate),
      };
    case "expiry_1d":
      return {
        subject: `¡Último aviso! Tu pack vence mañana`,
        html: buildExpiry1dHtml(name, sessionsLeft, endDate),
      };
    case "expiry_final":
      return {
        subject: `Tu pack de sesiones ha vencido — JPL Academy`,
        html: buildExpiry1dHtml(name, sessionsLeft, endDate),
      };
    case "new_patient":
      return {
        subject: `Bienvenido a JPL Academy — Tu proceso comienza ahora`,
        html: buildManualHtml(name, sessionsLeft, endDate),
      };
    default:
      return {
        subject: `Mensaje de JPL Academy`,
        html: buildManualHtml(name, sessionsLeft, endDate),
      };
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, type } = body;

  if (!userId || !type) {
    return NextResponse.json({ error: "Faltan campos: userId y type." }, { status: 400 });
  }

  const adminSb = await createAdminClient();

  // Fetch patient profile
  const { data: patientProfile } = await adminSb
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();

  if (!patientProfile) {
    return NextResponse.json({ error: "Paciente no encontrado." }, { status: 404 });
  }

  // Fetch active pack
  const { data: activePack } = await adminSb
    .from("patient_packs")
    .select("sessions_used, sessions_total, end_date")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const sessionsLeft = activePack
    ? (activePack.sessions_total ?? 0) - (activePack.sessions_used ?? 0)
    : 0;
  const endDate = activePack?.end_date ?? "";
  const recipientName = patientProfile.full_name?.split(" ")[0] ?? "Paciente";

  const { subject, html } = getSubjectAndHtml(type, recipientName, sessionsLeft, endDate);

  const resend = new Resend(process.env.RESEND_API_KEY);
  let emailStatus: "sent" | "failed" = "sent";
  let sendError = "";

  try {
    const { error: resendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: patientProfile.email,
      subject,
      html,
    });

    if (resendError) {
      emailStatus = "failed";
      sendError = resendError.message;
    }
  } catch (err) {
    emailStatus = "failed";
    sendError = err instanceof Error ? err.message : "Unknown error";
  }

  // Log to comms_log regardless of send status
  const now = new Date().toISOString();
  await adminSb.from("comms_log").insert({
    user_id: userId,
    type,
    subject,
    status: emailStatus,
    sent_at: now,
    sent_by: user.id,
  });

  if (emailStatus === "failed") {
    return NextResponse.json(
      { error: `Email fallido: ${sendError}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
