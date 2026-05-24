import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { emailShell, esc } from "@/lib/email/shell";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.juanpabloloaiza.com";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildWelcomeEmail(name: string): string {
  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:40px 32px 32px;">
          <p style="color:#C5A059;font-size:9px;letter-spacing:4px;text-transform:uppercase;font-family:Georgia,serif;margin:0 0 16px;">
            Bienvenido
          </p>
          <h1 style="color:#ffffff;font-size:22px;margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;line-height:1.4;">
            Hola ${esc(name)}, ya eres parte de esto
          </h1>
          <p style="color:#8a9bb5;font-size:15px;line-height:1.7;margin:0 0 16px;font-family:Georgia,serif;">
            Me alegra que estés aquí. Recibirás artículos sobre terapia de regresión, hipnoterapia
            y el trabajo profundo de conocerse a uno mismo — sin spam, solo lo que vale la pena leer.
          </p>
          <p style="color:#8a9bb5;font-size:15px;line-height:1.7;margin:0 0 28px;font-family:Georgia,serif;">
            Mientras tanto, puedes explorar los artículos del blog o escribirme directamente
            si algo resuena contigo.
          </p>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color:#C5A059;">
                <a href="${SITE_URL}/blog"
                   style="display:inline-block;padding:14px 32px;color:#020617;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">
                  Explorar el blog
                </a>
              </td>
            </tr>
          </table>
          <p style="color:#4a6a8a;font-size:12px;margin:28px 0 0;font-family:Georgia,serif;line-height:1.6;">
            Juan Pablo Loaiza<br/>
            Psicoterapeuta · Terapia de Regresión y Vida entre Vidas (TRVP)
          </p>
        </td>
      </tr>
    </table>`;
  return emailShell(body);
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
      .select("id, name, email, unsubscribe_token")
      .maybeSingle();

    if (error) throw error;

    if (!subscriber) {
      // Token not found or already confirmed — redirect gracefully
      return NextResponse.redirect(`${SITE_URL}/newsletter/gracias?already=1`);
    }

    // Check if welcome automation is enabled
    const { data: automation } = await supabase
      .from("newsletter_automations")
      .select("enabled, config")
      .eq("kind", "welcome")
      .maybeSingle();

    if (automation?.enabled) {
      const delayMs = (automation.config?.delay_minutes ?? 0) * 60 * 1000;
      if (delayMs === 0) {
        // Send immediately
        await resend.emails.send({
          from: "Juan Pablo Loaiza <newsletter@juanpabloloaiza.com>",
          to: subscriber.email,
          subject: "Bienvenido — Juan Pablo Loaiza",
          html: buildWelcomeEmail(subscriber.name),
          headers: {
            "List-Unsubscribe": `<${SITE_URL}/newsletter/baja/${subscriber.unsubscribe_token}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
      }
      // For delayed welcome, a future cron could handle queued sends
    }

    return NextResponse.redirect(`${SITE_URL}/newsletter/gracias`);
  } catch (err) {
    console.error("[newsletter/confirm]", err);
    return NextResponse.redirect(`${SITE_URL}/newsletter/confirmar/invalido`);
  }
}
