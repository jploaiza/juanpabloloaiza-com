import { Resend } from "resend";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { name, email, phone, reason } = await request.json();

  if (!name || !email || !reason) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  try {
    // Email al terapeuta
    await resend.emails.send({
      from: "Formulario Web <onboarding@resend.dev>",
      to: "contacto@juanpabloloaiza.com",
      subject: `Nueva solicitud de admisión — ${name}`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Georgia, serif; background: #020617; color: #e2e8f0; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #0f172a; }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 40px 32px; border-bottom: 2px solid #C5A059; text-align: center; }
            .header h1 { color: #C5A059; font-size: 22px; letter-spacing: 4px; text-transform: uppercase; margin: 0 0 8px; }
            .header p { color: #94a3b8; font-size: 13px; margin: 0; }
            .body { padding: 32px; }
            .field { margin-bottom: 24px; border-left: 3px solid #C5A059; padding-left: 16px; }
            .field-label { color: #C5A059; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 6px; }
            .field-value { color: #e2e8f0; font-size: 16px; line-height: 1.6; }
            .footer { background: #020617; padding: 24px 32px; text-align: center; border-top: 1px solid #C5A059/20; }
            .footer p { color: #64748b; font-size: 12px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nueva Solicitud de Admisión</h1>
              <p>Terapia de Regresión a Vidas Pasadas</p>
            </div>
            <div class="body">
              <div class="field">
                <div class="field-label">Nombre</div>
                <div class="field-value">${name}</div>
              </div>
              <div class="field">
                <div class="field-label">Correo Electrónico</div>
                <div class="field-value">${email}</div>
              </div>
              <div class="field">
                <div class="field-label">Teléfono / WhatsApp</div>
                <div class="field-value">${phone || "No indicado"}</div>
              </div>
              <div class="field">
                <div class="field-label">Motivo de Consulta</div>
                <div class="field-value">${reason.replace(/\n/g, "<br/>")}</div>
              </div>
            </div>
            <div class="footer">
              <p>Enviado desde juanpabloloaiza.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Confirmación al cliente
    await resend.emails.send({
      from: "Juan Pablo Loaiza <onboarding@resend.dev>",
      to: email,
      subject: "Tu solicitud ha sido recibida — Juan Pablo Loaiza",
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Georgia, serif; background: #020617; color: #e2e8f0; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #0f172a; }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 48px 32px; border-bottom: 2px solid #C5A059; text-align: center; }
            .header h1 { color: #C5A059; font-size: 24px; letter-spacing: 4px; text-transform: uppercase; margin: 0 0 12px; }
            .header p { color: #94a3b8; font-size: 15px; margin: 0; font-style: italic; }
            .body { padding: 40px 32px; }
            .greeting { color: #e2e8f0; font-size: 18px; line-height: 1.8; margin-bottom: 24px; }
            .steps { background: #020617; border: 1px solid rgba(197,160,89,0.2); padding: 24px; margin: 24px 0; }
            .steps h2 { color: #C5A059; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 16px; }
            .step { display: flex; gap: 12px; margin-bottom: 12px; color: #cbd5e1; font-size: 15px; }
            .step-num { color: #C5A059; font-weight: bold; min-width: 20px; }
            .cta { text-align: center; margin-top: 32px; }
            .btn { background: #C5A059; color: #020617; padding: 12px 32px; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; display: inline-block; }
            .footer { background: #020617; padding: 24px 32px; text-align: center; border-top: 1px solid rgba(197,160,89,0.1); }
            .footer p { color: #64748b; font-size: 12px; margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Solicitud Recibida</h1>
              <p>Regresión a Vidas Pasadas · Juan Pablo Loaiza</p>
            </div>
            <div class="body">
              <p class="greeting">
                Hola ${name},<br/><br/>
                He recibido tu solicitud de admisión y me alegra mucho que hayas dado este primer paso hacia tu proceso de sanación.<br/><br/>
                Revisaré tu información con atención y me pondré en contacto contigo a la brevedad para coordinar nuestra entrevista preliminar gratuita.
              </p>
              <div class="steps">
                <h2>Próximos pasos</h2>
                <div class="step"><span class="step-num">I.</span> Revisión de tu formulario</div>
                <div class="step"><span class="step-num">II.</span> Entrevista gratuita vía Zoom para conocernos</div>
                <div class="step"><span class="step-num">III.</span> Diseño de tu proceso terapéutico personalizado</div>
                <div class="step"><span class="step-num">IV.</span> Primera sesión</div>
              </div>
              <p style="color:#94a3b8; font-size:14px; font-style:italic;">
                Si tienes alguna pregunta urgente, puedes escribirme directamente por WhatsApp.
              </p>
              <div class="cta">
                <a href="https://api.whatsapp.com/send?phone=56962081884" class="btn">Escribir por WhatsApp</a>
              </div>
            </div>
            <div class="footer">
              <p>Juan Pablo Loaiza — Terapeuta Holístico</p>
              <p>contacto@juanpabloloaiza.com · +56 9 6208 1884</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Error al enviar el correo" }, { status: 500 });
  }
}
