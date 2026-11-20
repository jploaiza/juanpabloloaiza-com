import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { emailShell, esc } from "@/lib/email/shell";
import { brandFrom, getBrand, type Brand } from "@/lib/newsletter/brands";

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.juanpabloloaiza.com";

// Sitios externos autorizados a llamar a esta ruta desde el navegador (CORS).
const ALLOWED_ORIGINS = new Set(["https://www.regresionvidaspasadas.com"]);

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  if (!ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

/** Origen de la suscripción: `web` para la marca principal, `rvp-<lugar>` para el portal. */
function sourceFor(brand: Brand, raw: unknown): string {
  if (brand.key === "jpl") return "web";
  const place = String(raw ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
  return place ? `${brand.key}-${place}` : brand.key;
}

function greeting(name: string, tail: string): string {
  return name ? `Hola ${esc(name)}, ${tail}` : `Hola, ${tail}`;
}

function buildConfirmEmail(name: string, confirmUrl: string, brand: Brand): string {
  const topics = brand.key === "jpl"
    ? "terapia de regresión, hipnoterapia y autoconocimiento"
    : "regresión a vidas pasadas, hipnosis y liberación espiritual";
  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:40px 32px 32px;">
          <p style="color:#C5A059;font-size:9px;letter-spacing:4px;text-transform:uppercase;font-family:Georgia,serif;margin:0 0 16px;">
            Confirma tu suscripción
          </p>
          <h1 style="color:#ffffff;font-size:22px;margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;line-height:1.4;">
            ${greeting(name, "un paso más")}
          </h1>
          <p style="color:#8a9bb5;font-size:15px;line-height:1.7;margin:0 0 28px;font-family:Georgia,serif;">
            Para completar tu suscripción y empezar a recibir artículos sobre ${topics},
            confirma tu correo haciendo click abajo.
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
  return emailShell(`<tr><td style="padding:0;">${body}</td></tr>`, undefined, brand);
}

function buildResubscribeEmail(name: string, confirmUrl: string, brand: Brand): string {
  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:40px 32px 32px;">
          <p style="color:#C5A059;font-size:9px;letter-spacing:4px;text-transform:uppercase;font-family:Georgia,serif;margin:0 0 16px;">
            Reactivar suscripción
          </p>
          <h1 style="color:#ffffff;font-size:22px;margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;line-height:1.4;">
            ${greeting(name, "vuelve cuando quieras")}
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
  return emailShell(`<tr><td style="padding:0;">${body}</td></tr>`, undefined, brand);
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req);
  const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: cors });

  // x-real-ip is injected by Vercel's edge and cannot be spoofed; fall back to last XFF entry
  const ip = req.headers.get("x-real-ip")
    ?? req.headers.get("x-forwarded-for")?.split(",").pop()?.trim()
    ?? "unknown";
  if (isRateLimited(ip)) {
    return json({ error: "Demasiados intentos. Espera un minuto." }, 429);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const body = await req.json();
    const { name, apellido, email } = body;
    const brand = getBrand(body.brand);
    const isMain = brand.key === "jpl";
    const source = sourceFor(brand, body.source);

    // La marca principal exige nombre y apellido; el portal solo pide el correo.
    if (!email?.trim() || (isMain && (!name?.trim() || !apellido?.trim()))) {
      return json({ error: isMain ? "Todos los campos son obligatorios." : "Escribe tu correo electrónico." }, 400);
    }

    const cleanName = String(name ?? "").trim();
    const cleanApellido = String(apellido ?? "").trim();
    if (cleanName.length > 100 || cleanApellido.length > 100) {
      return json({ error: "Nombre demasiado largo." }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalEmail) || normalEmail.length > 254) {
      return json({ error: "Email no válido." }, 400);
    }

    const listTags = brand.listTag ? [brand.listTag] : [];
    const supabase = await createAdminClient();

    const send = (subject: string, html: string) =>
      resend.emails.send({ from: brandFrom(brand), to: normalEmail, subject, html })
        .catch((e) => console.error("[subscribe] resend error", e));

    // Check if already exists
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, status, name, confirm_token, tags, source")
      .eq("email", normalEmail)
      .maybeSingle();

    if (existing) {
      const currentTags: string[] = Array.isArray(existing.tags) ? existing.tags : [];
      const mergedTags = Array.from(new Set([...currentTags, ...listTags]));
      const tagsChanged = mergedTags.length !== currentTags.length;

      if (existing.status === "confirmed") {
        // Ya confirmado: solo se amplían sus listas (el correo ya está verificado)
        // y, si se suscribe a la marca principal, deja de ser "solo del portal".
        const patch: Record<string, unknown> = {};
        if (tagsChanged) patch.tags = mergedTags;
        if (isMain && String(existing.source ?? "").startsWith("rvp")) patch.source = "web";
        if (Object.keys(patch).length) {
          await supabase.from("newsletter_subscribers").update(patch).eq("id", existing.id);
        }
        // Return generic response — don't reveal that this email is subscribed
        return json(GENERIC_RESPONSE);
      }

      if (existing.status === "pending") {
        if (tagsChanged) {
          await supabase.from("newsletter_subscribers").update({ tags: mergedTags }).eq("id", existing.id);
        }
        const confirmUrl = `${SITE_URL}/newsletter/confirmar/${existing.confirm_token}`;
        await send(`Confirma tu suscripción — ${brand.name}`, buildConfirmEmail(existing.name, confirmUrl, brand));
        return json(GENERIC_RESPONSE);
      }

      if (existing.status === "unsubscribed") {
        const { data: updated } = await supabase
          .from("newsletter_subscribers")
          .update({
            name: cleanName || existing.name || "",
            apellido: cleanApellido,
            status: "pending",
            tags: mergedTags,
            ...(isMain ? {} : { source }),
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
          await send(`Reactivar tu suscripción — ${brand.name}`, buildResubscribeEmail(cleanName, confirmUrl, brand));
        }
        return json(GENERIC_RESPONSE);
      }

      // bounced/complained — block silently, return generic
      return json(GENERIC_RESPONSE);
    }

    // New subscriber
    const { data: inserted, error } = await supabase
      .from("newsletter_subscribers")
      .insert({
        name: cleanName,
        apellido: cleanApellido,
        email: normalEmail,
        status: "pending",
        source,
        tags: listTags,
      })
      .select("confirm_token")
      .single();

    if (error) throw error;

    const confirmUrl = `${SITE_URL}/newsletter/confirmar/${inserted.confirm_token}`;
    await send(`Confirma tu suscripción — ${brand.name}`, buildConfirmEmail(cleanName, confirmUrl, brand));

    return json(GENERIC_RESPONSE);
  } catch (err) {
    console.error("[newsletter/subscribe]", err);
    return json({ error: "Error interno. Intenta de nuevo." }, 500);
  }
}
