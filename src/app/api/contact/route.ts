import { Resend } from "resend";
import { NextResponse } from "next/server";

const LOGO_URL = "https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png";
const PHOTO_URL = "https://media.juanpabloloaiza.com/images/jpl-newwsp.jpeg";
const WHATSAPP_URL = "https://api.whatsapp.com/send?phone=56962081884";

// ── Reusable HTML fragments ─────────────────────────────────────────────────

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>Juan Pablo Loaiza</title>
</head>
<body style="margin:0;padding:0;background-color:#020617;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#020617;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!-- Outer container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#0a1628;">
          ${content}
        </table>
        <!-- Bottom space -->
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

const goldDivider = () => `
<tr>
  <td style="padding:0 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="width:40px;height:1px;background-color:transparent;border-bottom:1px solid #C5A059;"></td>
        <td style="height:1px;border-bottom:1px solid rgba(197,160,89,0.2);"></td>
        <td style="width:40px;height:1px;background-color:transparent;border-bottom:1px solid #C5A059;"></td>
      </tr>
    </table>
  </td>
</tr>`;

const headerBlock = () => `
<tr>
  <td style="background-color:#020d1f;padding:36px 32px 24px;text-align:center;border-bottom:1px solid rgba(197,160,89,0.3);">
    <img src="${LOGO_URL}" width="220" alt="Juan Pablo Loaiza" style="display:inline-block;max-width:220px;border:0;opacity:0.95;"/>
  </td>
</tr>`;

const socialFooter = () => `
<tr>
  <td style="padding:28px 32px 32px;text-align:center;background-color:#020d1f;">
    <p style="color:#C5A059;font-size:9px;letter-spacing:4px;text-transform:uppercase;font-family:Georgia,serif;margin:0 0 16px;">Sígueme en redes</p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td style="padding:0 6px;">
          <a href="https://www.instagram.com/jploaizao" style="display:inline-block;padding:8px 16px;border:1px solid rgba(197,160,89,0.4);color:#C5A059;text-decoration:none;font-size:9px;letter-spacing:3px;text-transform:uppercase;font-family:Georgia,serif;">Instagram</a>
        </td>
        <td style="padding:0 6px;">
          <a href="https://www.youtube.com/@jploaizao" style="display:inline-block;padding:8px 16px;border:1px solid rgba(197,160,89,0.4);color:#C5A059;text-decoration:none;font-size:9px;letter-spacing:3px;text-transform:uppercase;font-family:Georgia,serif;">YouTube</a>
        </td>
        <td style="padding:0 6px;">
          <a href="https://www.tiktok.com/@jploaizao" style="display:inline-block;padding:8px 16px;border:1px solid rgba(197,160,89,0.4);color:#C5A059;text-decoration:none;font-size:9px;letter-spacing:3px;text-transform:uppercase;font-family:Georgia,serif;">TikTok</a>
        </td>
      </tr>
    </table>
    <p style="color:#2d4a6e;font-size:11px;margin:20px 0 0;font-family:Georgia,serif;">
      <a href="mailto:contacto@juanpabloloaiza.com" style="color:#4a6a8a;text-decoration:none;">contacto@juanpabloloaiza.com</a>
      &nbsp;·&nbsp;
      <a href="${WHATSAPP_URL}" style="color:#4a6a8a;text-decoration:none;">+56 9 6208 1884</a>
    </p>
  </td>
</tr>`;

// ── Corner-decorated box ───────────────────────────────────────────────────

const decoratedBox = (innerHtml: string) => `
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td width="12" height="12" style="border-top:1px solid #C5A059;border-left:1px solid #C5A059;"></td>
    <td style="border-top:1px solid rgba(197,160,89,0.25);"></td>
    <td width="12" height="12" style="border-top:1px solid #C5A059;border-right:1px solid #C5A059;"></td>
  </tr>
  <tr>
    <td width="12" style="border-left:1px solid rgba(197,160,89,0.25);"></td>
    <td style="padding:24px;">${innerHtml}</td>
    <td width="12" style="border-right:1px solid rgba(197,160,89,0.25);"></td>
  </tr>
  <tr>
    <td width="12" height="12" style="border-bottom:1px solid #C5A059;border-left:1px solid #C5A059;"></td>
    <td style="border-bottom:1px solid rgba(197,160,89,0.25);"></td>
    <td width="12" height="12" style="border-bottom:1px solid #C5A059;border-right:1px solid #C5A059;"></td>
  </tr>
</table>`;

// ── Therapist email ────────────────────────────────────────────────────────

function therapistHtml(name: string, email: string, phone: string, reason: string) {
  const field = (label: string, value: string) => `
    <tr>
      <td style="padding:0 0 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="3" style="background-color:#C5A059;">&nbsp;</td>
            <td style="padding:4px 0 4px 14px;">
              <p style="color:#C5A059;font-size:9px;text-transform:uppercase;letter-spacing:3px;margin:0 0 4px;font-family:Georgia,serif;">${label}</p>
              <p style="color:#e2e8f0;font-size:15px;line-height:1.6;margin:0;font-family:Georgia,serif;">${value}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;

  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${headerBlock()}

      <!-- Title bar -->
      <tr>
        <td style="padding:28px 32px 8px;text-align:center;">
          <p style="color:#C5A059;font-size:9px;letter-spacing:5px;text-transform:uppercase;margin:0 0 8px;font-family:Georgia,serif;">Nuevo primer contacto</p>
          <h1 style="color:#ffffff;font-size:22px;letter-spacing:3px;text-transform:uppercase;margin:0;font-family:Georgia,serif;font-weight:normal;">${name}</h1>
        </td>
      </tr>

      ${goldDivider()}

      <!-- Fields -->
      <tr>
        <td style="padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${field("Nombre completo", name)}
            ${field("Correo electrónico", `<a href="mailto:${email}" style="color:#C5A059;text-decoration:none;">${email}</a>`)}
            ${field("Teléfono / WhatsApp", phone || "No indicado")}
            ${field("Motivo de consulta", reason.replace(/\n/g, "<br/>"))}
          </table>
        </td>
      </tr>

      ${goldDivider()}

      <!-- Quick reply -->
      <tr>
        <td style="padding:24px 32px 32px;text-align:center;">
          <a href="${WHATSAPP_URL}" style="display:inline-block;background-color:#C5A059;color:#020617;padding:12px 36px;text-decoration:none;font-size:10px;text-transform:uppercase;letter-spacing:4px;font-family:Georgia,serif;font-weight:bold;">
            Responder por WhatsApp
          </a>
        </td>
      </tr>

      ${socialFooter()}
    </table>`;

  return emailWrapper(body);
}

// ── Client confirmation email ─────────────────────────────────────────────

function clientHtml(name: string) {
  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${headerBlock()}

      <!-- Greeting title -->
      <tr>
        <td style="padding:32px 32px 8px;text-align:center;">
          <p style="color:#C5A059;font-size:9px;letter-spacing:5px;text-transform:uppercase;margin:0 0 10px;font-family:Georgia,serif;">Tu mensaje ha sido recibido</p>
          <h1 style="color:#ffffff;font-size:24px;letter-spacing:3px;text-transform:uppercase;margin:0;font-family:Georgia,serif;font-weight:normal;">Hola, ${name}</h1>
        </td>
      </tr>

      ${goldDivider()}

      <!-- Main message -->
      <tr>
        <td style="padding:28px 32px 0;">
          <p style="color:#cbd5e1;font-size:16px;line-height:1.85;margin:0;font-family:Georgia,serif;">
            He recibido tu mensaje y me alegra mucho que hayas dado este primer paso.
          </p>
          <p style="color:#cbd5e1;font-size:16px;line-height:1.85;margin:16px 0 0;font-family:Georgia,serif;">
            Me pondré en contacto contigo a la brevedad para contarte personalmente todo sobre el proceso, las sesiones y lo que implica este camino de transformación.
          </p>
        </td>
      </tr>

      <!-- Decorated note box -->
      <tr>
        <td style="padding:24px 32px;">
          ${decoratedBox(`<p style="color:#94a3b8;font-size:14px;line-height:1.75;margin:0;font-family:Georgia,serif;font-style:italic;">
            Una vez que conversemos y decidas continuar, te haré llegar el formulario de admisión completo para que podamos comenzar a conocernos en profundidad.
          </p>`)}
        </td>
      </tr>

      ${goldDivider()}

      <!-- Bio card: photo + text -->
      <tr>
        <td style="padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <!-- Photo -->
              <td width="160" valign="top" style="padding-right:20px;">
                <img src="${PHOTO_URL}" width="150" alt="Juan Pablo Loaiza" style="display:block;width:150px;height:150px;object-fit:cover;border:1px solid rgba(197,160,89,0.3);"/>
              </td>
              <!-- Text -->
              <td valign="top">
                <p style="color:#C5A059;font-size:9px;letter-spacing:3px;text-transform:uppercase;margin:0 0 6px;font-family:Georgia,serif;">Tu terapeuta</p>
                <p style="color:#ffffff;font-size:16px;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;font-family:Georgia,serif;font-weight:normal;">Juan Pablo Loaiza</p>
                <p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 14px;font-family:Georgia,serif;">
                  Terapeuta Holístico Certificado Internacionalmente en Hipnosis Clínica con Técnicas Regresivas y Liberación de Entidades Espirituales, con más de 18 años de experiencia.
                </p>
                <p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 16px;font-family:Georgia,serif;">
                  Si tienes dudas sobre tu sesión o tu proceso, contáctame directamente. Tu compromiso te llevará a la meta.
                </p>
                <a href="${WHATSAPP_URL}" style="display:inline-block;background-color:#C5A059;color:#020617;padding:10px 22px;text-decoration:none;font-size:9px;text-transform:uppercase;letter-spacing:3px;font-family:Georgia,serif;font-weight:bold;">
                  Contactar por WhatsApp
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      ${goldDivider()}

      ${socialFooter()}
    </table>`;

  return emailWrapper(body);
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { name, email, phone, reason } = await request.json();

  if (!name || !email || !reason) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: "Formulario Web <contacto@juanpabloloaiza.com>",
      to: "contacto@juanpabloloaiza.com",
      subject: `Nuevo primer contacto — ${name}`,
      html: therapistHtml(name, email, phone, reason),
    });

    await resend.emails.send({
      from: "Juan Pablo Loaiza <contacto@juanpabloloaiza.com>",
      to: email,
      subject: "Tu mensaje ha sido recibido — Juan Pablo Loaiza",
      html: clientHtml(name),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Error al enviar el correo" }, { status: 500 });
  }
}
