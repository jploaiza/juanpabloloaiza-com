import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { emailShell, esc } from "@/lib/email/shell";

export const dynamic = "force-dynamic";

// Simple in-process rate limiter: 5 requests per IP per minute
const rateMap = new Map<string, { count: number; reset: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

const GENERIC_RESPONSE = { success: true, message: "Si tu correo es nuevo, recibirás un enlace de confirmación." };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://juanpabloloaiza.com";

function buildConfirmEmail(name: string, confirmUrl: string): string {
  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:40px 32px 32px;">
          <p style="color:#C5A059;font-size:9px;letter-spacing:4px;text-transform:uppercase;font-family:Georgia,serif;margin:0 0 16px;">
            Confirma tu suscripción
          </p>
          <h1 style="color:#ffffff;font-size:22px;margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;line-height:1.4;">
            Hola ${esc(name)}, un paso más
          </h1>
          <p style="color:#8a9bb5;font-size:15px;line-height:1.7;margin:0 0 28px;font-family:Georgia,serif;">
            Para completar tu suscripción y empezar a recibir artículos sobre terapia de regresión,
            hipnoterapia y autoconocimiento, confirma tu correo haciendo click abajo.
          </p>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color:#C5A059;">
                <a href="${esc(confirmUrl)}"
                   style="display:inline-block;padding:14px 32px;color:#020617;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">
                  Confirmar suscripción
                </a>
              </td>
            </tr>
          </table>
          <p style="color:#4a6a8a;font-size:12px;margin:28px 0 0;font-family:Georgia,serif;line-height:1.6;">
            Si no solicitaste esta suscripción, ignora este correo.<br/>
            Este enlace expira en 48 horas.
          </p>
        </td>
      </tr>
    </table>`;
  return emailShell(`<tr><td style="padding:0;">${body}</td></tr>`);
}

function buildResubscribeEmail(name: string, confirmUrl: string): string {
  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:40px 32px 32px;">
          <p style="color:#C5A059;font-size:9px;letter-spacing:4px;text-transform:uppercase;font-family:Georgia,serif;margin:0 0 16px;">
            Reactivar suscripción
          </p>
          <h1 style="color:#ffffff;font-size:22px;margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;line-height:1.4;">
            Hola ${esc(name)}, vuelve cuando quieras
          </h1>
          <p style="color:#8a9bb5;font-size:15px;line-height:1.7;margin:0 0 28px;font-family:Georgia,serif;">
            Tu correo se había dado de baja antes. Si quieres reactivar tu suscripción, confirma aquí:
          </p>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color:#C5A059;">
                <a href="${esc(confirmUrl)}"
                   style="display:inline-block;padding:14px 32px;color:#020617;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">
                  Reactivar suscripción
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  return emailShell(`<tr><td style="padding:0;">${body}</td></tr>`);
}

export async function POST(req: NextRequest) {
  // x-real-ip is injected by Vercel's edge and cannot be spoofed; fall back to last XFF entry
  const ip = req.headers.get("x-real-ip")
    ?? req.headers.get("x-forwarded-for")?.split(",").pop()?.trim()
    ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Demasiados intentos. Espera un minuto." }, { status: 429 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { name, apellido, email } = await req.json();

    if (!name?.trim() || !apellido?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 });
    }

    if (name.trim().length > 100 || apellido.trim().length > 100) {
      return NextResponse.json({ error: "Nombre demasiado largo." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalEmail) || normalEmail.length > 254) {
      return NextResponse.json({ error: "Email no válido." }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Check if already exists
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, status, name, confirm_token")
      .eq("email", normalEmail)
      .maybeSingle();

    if (existing) {
      if (existing.status === "confirmed") {
        // Return generic response — don't reveal that this email is subscribed
        return NextResponse.json(GENERIC_RESPONSE);
      }

      if (existing.status === "pending") {
        const confirmUrl = `${SITE_URL}/newsletter/confirmar/${existing.confirm_token}`;
        await resend.emails.send({
          from: "Juan Pablo Loaiza <newsletter@juanpabloloaiza.com>",
          to: normalEmail,
          subject: "Confirma tu suscripción — Juan Pablo Loaiza",
          html: buildConfirmEmail(existing.name, confirmUrl),
        }).catch((e) => console.error("[subscribe] resend error", e));
        return NextResponse.json(GENERIC_RESPONSE);
      }

      if (existing.status === "unsubscribed") {
        const { data: updated } = await supabase
          .from("newsletter_subscribers")
          .update({
            name: name.trim(),
            apellido: apellido.trim(),
            status: "pending",
            confirm_token: crypto.randomUUID(),
            unsubscribe_token: crypto.randomUUID(),
            confirmed_at: null,
            unsubscribed_at: null,
          })
          .eq("id", existing.id)
          .select("confirm_token")
          .single();

        if (updated) {
          const confirmUrl = `${SITE_URL}/newsletter/confirmar/${updated.confirm_token}`;
          await resend.emails.send({
            from: "Juan Pablo Loaiza <newsletter@juanpabloloaiza.com>",
            to: normalEmail,
            subject: "Reactivar tu suscripción — Juan Pablo Loaiza",
            html: buildResubscribeEmail(name.trim(), confirmUrl),
          }).catch((e) => console.error("[subscribe] resend error", e));
        }
        return NextResponse.json(GENERIC_RESPONSE);
      }

      // bounced/complained — block silently, return generic
      return NextResponse.json(GENERIC_RESPONSE);
    }

    // New subscriber
    const { data: inserted, error } = await supabase
      .from("newsletter_subscribers")
      .insert({
        name: name.trim(),
        apellido: apellido.trim(),
        email: normalEmail,
        status: "pending",
        source: "web",
      })
      .select("confirm_token")
      .single();

    if (error) throw error;

    const confirmUrl = `${SITE_URL}/newsletter/confirmar/${inserted.confirm_token}`;
    await resend.emails.send({
      from: "Juan Pablo Loaiza <newsletter@juanpabloloaiza.com>",
      to: normalEmail,
      subject: "Confirma tu suscripción — Juan Pablo Loaiza",
      html: buildConfirmEmail(name.trim(), confirmUrl),
    }).catch((e) => console.error("[subscribe] resend error", e));

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (err) {
    console.error("[newsletter/subscribe]", err);
    return NextResponse.json({ error: "Error interno. Intenta de nuevo." }, { status: 500 });
  }
}
