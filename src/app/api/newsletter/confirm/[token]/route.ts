import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { emailShell, esc } from "@/lib/email/shell";
import { brandFrom, brandFromSource, type Brand } from "@/lib/newsletter/brands";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.juanpabloloaiza.com";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildWelcomeEmail(name: string, unsubToken: string, brand: Brand): string {
  const isMain = brand.key === "jpl";
  const intro = isMain
    ? "Me alegra que estés aquí. Recibirás artículos sobre terapia de regresión, hipnoterapia y el trabajo profundo de conocerse a uno mismo — sin spam, solo lo que vale la pena leer."
    : "Me alegra que estés aquí. Recibirás artículos sobre regresión a vidas pasadas, hipnosis y liberación espiritual — sin spam, solo lo que vale la pena leer.";
  const explore = isMain
    ? "Mientras tanto, puedes explorar los artículos del blog o escribirme directamente si algo resuena contigo."
    : "Mientras tanto, puedes explorar los artículos del portal o escribirme directamente si algo resuena contigo.";
  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:40px 32px 32px;">
          <p style="color:#C5A059;font-size:9px;letter-spacing:4px;text-transform:uppercase;font-family:Georgia,serif;margin:0 0 16px;">
            Bienvenido
          </p>
          <h1 style="color:#ffffff;font-size:22px;margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;line-height:1.4;">
            ${name ? `Hola ${esc(name)}, ya eres parte de esto` : "Hola, ya eres parte de esto"}
          </h1>
          <p style="color:#8a9bb5;font-size:15px;line-height:1.7;margin:0 0 16px;font-family:Georgia,serif;">
            ${esc(intro)}
          </p>
          <p style="color:#8a9bb5;font-size:15px;line-height:1.7;margin:0 0 28px;font-family:Georgia,serif;">
            ${esc(explore)}
          </p>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color:#C5A059;">
                <a href="${esc(isMain ? `${SITE_URL}/blog` : brand.blogUrl)}"
                   style="display:inline-block;padding:14px 32px;color:#020617;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">
                  ${isMain ? "Explorar el blog" : "Explorar los artículos"}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  const footer = `
    <p style="color:#2d4a6e;font-size:11px;margin:0 0 6px;font-family:Georgia,serif;">
      Recibes este correo porque te suscribiste en ${esc(brand.siteDomain)}
    </p>
    <p style="color:#2d4a6e;font-size:11px;margin:0;font-family:Georgia,serif;">
      <a href="${SITE_URL}/newsletter/baja/${unsubToken}" style="color:#4a6a8a;text-decoration:underline;">Darse de baja</a>
      &nbsp;·&nbsp;
      <a href="mailto:${esc(brand.supportEmail)}" style="color:#4a6a8a;text-decoration:none;">${esc(brand.supportEmail)}</a>
    </p>`;
  return emailShell(`<tr><td style="padding:0;">${body}</td></tr>`, footer, brand);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { token } = await params;

  if (!token || !UUID_RE.test(token)) {
    return NextResponse.redirect(`${SITE_URL}/newsletter/confirmar/invalido`);
  }

  try {
    const supabase = await createAdminClient();

    const { data: subscriber, error } = await supabase
      .from("newsletter_subscribers")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("confirm_token", token)
      .in("status", ["pending"])
      .select("id, name, email, unsubscribe_token, source")
      .maybeSingle();

    if (error) throw error;

    if (!subscriber) {
      // Token not found or already confirmed — redirect gracefully
      return NextResponse.redirect(`${SITE_URL}/newsletter/gracias?already=1`);
    }

    // La marca sale del origen de la suscripción: los del portal vuelven al portal
    const brand = brandFromSource(subscriber.source);
    const thanksUrl = brand.key === "jpl" ? `${SITE_URL}/newsletter/gracias` : `${brand.siteUrl}/newsletter/gracias/`;

    // Check if welcome automation is enabled
    const { data: automation } = await supabase
      .from("newsletter_automations")
      .select("enabled, config")
      .eq("kind", "welcome")
      .maybeSingle();

    if (automation?.enabled && subscriber.unsubscribe_token) {
      const delayMs = (automation.config?.delay_minutes ?? 0) * 60 * 1000;
      if (delayMs === 0) {
        await resend.emails.send({
          from: brandFrom(brand),
          to: subscriber.email,
          subject: `Bienvenido — ${brand.name}`,
          html: buildWelcomeEmail(subscriber.name, subscriber.unsubscribe_token, brand),
          headers: {
            "List-Unsubscribe": `<${SITE_URL}/api/newsletter/unsubscribe/${subscriber.unsubscribe_token}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }).catch((e) => console.error("[newsletter/confirm] welcome email failed", e));
      }
      // For delayed welcome, a future cron could handle queued sends
    }

    return NextResponse.redirect(thanksUrl);
  } catch (err) {
    console.error("[newsletter/confirm]", err);
    return NextResponse.redirect(`${SITE_URL}/newsletter/confirmar/invalido`);
  }
}
