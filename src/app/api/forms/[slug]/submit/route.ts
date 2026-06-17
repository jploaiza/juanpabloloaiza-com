import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";
import { validateAnswers } from "@/lib/forms/schema";
import { answersToRows, resolveContact } from "@/lib/forms/format";
import { emailShell, esc } from "@/lib/email/shell";
import type { FormRow, Answers } from "@/lib/forms/types";

const THERAPIST_EMAIL = "contacto@juanpabloloaiza.com";

async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.warn("[forms-submit] TURNSTILE_SECRET_KEY no configurada — verificación omitida.");
    return true;
  }
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success: boolean };
    return data.success;
  } catch (err) {
    console.error("[forms-submit] Turnstile error:", err);
    return false;
  }
}

function therapistEmailHtml(form: FormRow, rows: { label: string; value: string }[]): string {
  const fields = rows
    .map(
      (r) => `
      <tr><td style="padding:0 0 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="3" style="background-color:#C5A059;">&nbsp;</td>
            <td style="padding:2px 0 2px 14px;">
              <p style="color:#C5A059;font-size:9px;text-transform:uppercase;letter-spacing:3px;margin:0 0 4px;font-family:Georgia,serif;">${esc(r.label)}</p>
              <p style="color:#e2e8f0;font-size:15px;line-height:1.6;margin:0;font-family:Georgia,serif;">${esc(r.value).replace(/\n/g, "<br/>")}</p>
            </td>
          </tr>
        </table>
      </td></tr>`,
    )
    .join("");

  const content = `
    <tr>
      <td style="padding:28px 32px 8px;text-align:center;">
        <p style="color:#C5A059;font-size:9px;letter-spacing:5px;text-transform:uppercase;margin:0 0 8px;font-family:Georgia,serif;">Nueva respuesta</p>
        <h1 style="color:#ffffff;font-size:22px;letter-spacing:2px;margin:0;font-family:Georgia,serif;font-weight:normal;">${esc(form.title)}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">${fields}</table>
      </td>
    </tr>`;

  return emailShell(content);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ip = getIp(req.headers);

  if (!rateLimit(`form-submit:${ip}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: "Demasiados envíos. Intenta en una hora." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.answers !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "Verificación de seguridad fallida. Intenta de nuevo." }, { status: 400 });
  }

  const sb = createAdminClient();
  const { data: form } = await sb.from("forms").select("*").eq("slug", slug).maybeSingle();
  if (!form || form.status !== "published") {
    return NextResponse.json({ error: "Formulario no disponible." }, { status: 404 });
  }
  const typedForm = form as FormRow;

  // Validación server-side. (Fase 1 lineal: aplican todas las preguntas.)
  const answers = body.answers as Answers;
  const applicable = typedForm.schema.questions;
  const { ok, errors, cleaned } = validateAnswers(applicable, answers);
  if (!ok) {
    return NextResponse.json({ error: "Revisa las respuestas marcadas.", fieldErrors: errors }, { status: 400 });
  }

  const contact = resolveContact(typedForm.schema, cleaned, typedForm.patient_mapping);
  const notifyStatus: Record<string, string> = {};

  const { data: submission, error: insErr } = await sb
    .from("form_submissions")
    .insert({
      form_id: typedForm.id,
      form_schema_snapshot: typedForm.schema,
      answers: cleaned,
      email: contact.email,
      full_name: contact.full_name,
      phone: contact.phone,
      ip,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
      notify_status: {},
    })
    .select("id")
    .single();

  if (insErr || !submission) {
    console.error("[forms-submit] insert", insErr?.code);
    return NextResponse.json({ error: "Error al guardar. Intenta de nuevo." }, { status: 500 });
  }

  // ── Notificación: email al terapeuta (best-effort) ────────────────────────
  if (typedForm.notify_email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const rows = answersToRows(typedForm.schema, cleaned);
      await resend.emails.send({
        from: "Formularios Web <contacto@juanpabloloaiza.com>",
        to: THERAPIST_EMAIL,
        subject: `Nueva respuesta — ${typedForm.title}${contact.full_name ? ` — ${contact.full_name}` : ""}`,
        html: therapistEmailHtml(typedForm, rows),
      });
      notifyStatus.email = "sent";
    } catch (err) {
      console.error("[forms-submit] email", err);
      notifyStatus.email = "failed";
    }
  }

  if (Object.keys(notifyStatus).length) {
    await sb.from("form_submissions").update({ notify_status: notifyStatus }).eq("id", submission.id);
  }

  return NextResponse.json({
    ok: true,
    thankYouTitle: typedForm.settings.thankYouTitle ?? null,
    thankYouMessage: typedForm.settings.thankYouMessage ?? null,
    redirectUrl: typedForm.settings.redirectUrl ?? null,
  });
}
