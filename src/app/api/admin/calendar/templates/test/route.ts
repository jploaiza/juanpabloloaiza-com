/**
 * POST /api/admin/calendar/templates/test
 * Body: { template_id, recipient_email?, recipient_phone? }
 * Renders with example vars and sends test message.
 */
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCalendarConfig } from "@/lib/booking-config";
import { renderTemplate, renderTemplateHtml } from "@/lib/templates";
import { sendWhatsApp } from "@/lib/whatsapp";

async function assertAdminWithEmail() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sb: null, userEmail: null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { sb: null, userEmail: null };
  return { sb: createAdminClient(), userEmail: user.email ?? null };
}

const EXAMPLE_VARS: Record<string, string> = {
  name: "María García",
  first_name: "María",
  email: "maria@ejemplo.com",
  phone: "+57300123456",
  type_label: "Sesión TRVP",
  duration: "90",
  date: "2026-06-15",
  date_long: "lunes 15 de junio de 2026",
  time: "10:00",
  user_tz: "America/Bogota",
  booking_code: "TEST1234",
  event_link: "https://calendar.google.com/calendar/event",
  zoom_join_url: "https://zoom.us/j/123456789",
  manage_url: "https://juanpabloloaiza.com/agenda/gestionar?code=TEST1234",
  cancel_url: "https://juanpabloloaiza.com/agenda/gestionar?code=TEST1234&action=cancel",
  reschedule_url: "https://juanpabloloaiza.com/agenda/gestionar?code=TEST1234&action=reschedule",
  therapist_name: "Juan Pablo Loaiza",
  site_url: "https://juanpabloloaiza.com",
  logo_url: "https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png",
};

export async function POST(req: NextRequest) {
  const { sb, userEmail } = await assertAdminWithEmail();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { template_id?: string; recipient_email?: string; recipient_phone?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const { template_id, recipient_email, recipient_phone } = body;
  if (!template_id) return NextResponse.json({ error: "template_id requerido" }, { status: 400 });

  const { data: tpl } = await sb
    .from("booking_alert_templates")
    .select("channel, subject, body")
    .eq("id", template_id)
    .single();

  if (!tpl) return NextResponse.json({ error: "Template no encontrado" }, { status: 404 });

  const config = await getCalendarConfig();
  const vars = { ...EXAMPLE_VARS, site_url: config.site_url, logo_url: config.logo_url };

  if (tpl.channel === "email") {
    const to = recipient_email || userEmail;
    if (!to) return NextResponse.json({ error: "recipient_email requerido" }, { status: 400 });
    const rendered = renderTemplateHtml(tpl.body as string, vars);
    const subject = tpl.subject
      ? `[TEST] ${renderTemplate(tpl.subject as string, vars)}`
      : "[TEST] Alerta de calendario";
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({ from: config.from_email, to, subject, html: rendered });
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json({ ok: true, sent_to: to });
  }

  if (tpl.channel === "whatsapp") {
    const to = recipient_phone;
    if (!to) return NextResponse.json({ error: "recipient_phone requerido" }, { status: 400 });
    const rendered = renderTemplate(tpl.body as string, vars);
    const result = await sendWhatsApp({ to, body: rendered });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, sent_to: to });
  }

  return NextResponse.json({ error: "Canal desconocido" }, { status: 400 });
}
