import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { emailShell, esc } from "@/lib/email/shell";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.juanpabloloaiza.com";

function buildReengagementEmail(name: string, days: number, unsubToken: string): string {
  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:40px 32px 32px;">
          <p style="color:#C5A059;font-size:9px;letter-spacing:4px;text-transform:uppercase;font-family:Georgia,serif;margin:0 0 16px;">
            ¿Sigues aquí?
          </p>
          <h1 style="color:#ffffff;font-size:22px;margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;line-height:1.4;">
            Hola ${esc(name)}, hace tiempo que no nos vemos
          </h1>
          <p style="color:#8a9bb5;font-size:15px;line-height:1.7;margin:0 0 16px;font-family:Georgia,serif;">
            Han pasado ${days} días desde la última vez que abriste un correo mío.
            Está bien, la vida se pone ocupada.
          </p>
          <p style="color:#8a9bb5;font-size:15px;line-height:1.7;margin:0 0 28px;font-family:Georgia,serif;">
            Si quieres seguir recibiendo artículos sobre terapia de regresión y autoconocimiento,
            solo haz click abajo. Si no, no pasa nada.
          </p>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color:#C5A059;">
                <a href="${SITE_URL}/blog"
                   style="display:inline-block;padding:14px 32px;color:#020617;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">
                  Sigo interesado
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  const footer = `
    <p style="color:#2d4a6e;font-size:11px;margin:0 0 6px;font-family:Georgia,serif;">
      Recibes este correo porque te suscribiste en juanpabloloaiza.com
    </p>
    <p style="color:#2d4a6e;font-size:11px;margin:0;font-family:Georgia,serif;">
      <a href="${SITE_URL}/newsletter/baja/${unsubToken}" style="color:#4a6a8a;text-decoration:underline;">Darse de baja</a>
      &nbsp;·&nbsp;
      <a href="mailto:newsletter@juanpabloloaiza.com" style="color:#4a6a8a;text-decoration:none;">newsletter@juanpabloloaiza.com</a>
    </p>`;
  return emailShell(`<tr><td style="padding:0;">${body}</td></tr>`, footer);
}

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET}`);
  const provided = Buffer.from(req.headers.get("authorization") ?? "");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = await createAdminClient();

  try {
    const { data: automation } = await supabase
      .from("newsletter_automations")
      .select("enabled, config")
      .eq("kind", "reengagement")
      .maybeSingle();

    if (!automation?.enabled) {
      return NextResponse.json({ ok: true, skipped: "automation disabled" });
    }

    const inactiveDays = automation.config?.inactive_days ?? 60;
    const autoUnsubDays = automation.config?.auto_unsubscribe_days ?? 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);
    const autoUnsubCutoff = new Date();
    autoUnsubCutoff.setDate(autoUnsubCutoff.getDate() - autoUnsubDays);

    // Auto-unsubscribe very inactive subscribers first
    await supabase
      .from("newsletter_subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("status", "confirmed")
      .or(`last_engaged_at.lt.${autoUnsubCutoff.toISOString()},last_engaged_at.is.null`)
      .lt("confirmed_at", autoUnsubCutoff.toISOString());

    // Find subscribers inactive for inactiveDays but not yet auto-unsubscribed
    const { data: inactive } = await supabase
      .from("newsletter_subscribers")
      .select("id, name, email, last_engaged_at, confirmed_at, unsubscribe_token")
      .eq("status", "confirmed")
      .not("tags", "cs", '{"paused"}')
      .or(`last_engaged_at.lt.${cutoffDate.toISOString()},last_engaged_at.is.null`)
      .lt("confirmed_at", cutoffDate.toISOString())
      .limit(200);

    if (!inactive?.length) {
      return NextResponse.json({ ok: true, reengaged: 0 });
    }

    let sent = 0;
    for (const sub of inactive) {
      const lastDate = sub.last_engaged_at ?? sub.confirmed_at;
      const days = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
      try {
        await resend.emails.send({
          from: "Juan Pablo Loaiza <newsletter@juanpabloloaiza.com>",
          to: sub.email,
          subject: "¿Sigues por aquí? — Juan Pablo Loaiza",
          html: buildReengagementEmail(sub.name, days, sub.unsubscribe_token),
          headers: {
            "List-Unsubscribe": `<${SITE_URL}/api/newsletter/unsubscribe/${sub.unsubscribe_token}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
        sent++;
      } catch (e) {
        console.error("[reengagement] failed for", sub.email, e);
      }
    }

    return NextResponse.json({ ok: true, reengaged: sent });
  } catch (err) {
    console.error("[newsletter-reengagement]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
