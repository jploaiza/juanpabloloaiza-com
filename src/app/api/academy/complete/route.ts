import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { TOTAL_LESSONS } from "@/lib/academy-data";

const FROM_EMAIL = "JPL Academy <academy@juanpabloloaiza.com>";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId, courseId } = await req.json();
  if (!lessonId || !courseId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Mark lesson as completed
  const { error } = await supabase
    .from("lesson_progress")
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        course_id: courseId,
        is_completed: true,
        completed_at: new Date().toISOString(),
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check total completed lessons
  const { data: completedRows } = await supabase
    .from("lesson_progress")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("is_completed", true);

  const completedCount = completedRows?.length ?? 0;
  let certificateToken: string | null = null;

  if (completedCount < TOTAL_LESSONS) {
    return NextResponse.json({ success: true, certificateToken: null });
  }

  // ── Course completed ──────────────────────────────────────
  const adminSb = await createAdminClient();

  // 1. Mark enrollment completed
  await adminSb
    .from("enrollments")
    .update({ completed_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .is("completed_at", null);

  // 2. Issue certificate
  const { data: existing } = await adminSb
    .from("certificates")
    .select("verify_token")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .single();

  if (!existing) {
    const { data: cert } = await adminSb
      .from("certificates")
      .insert({ user_id: user.id, course_id: courseId })
      .select("verify_token")
      .single();
    certificateToken = cert?.verify_token ?? null;
  } else {
    certificateToken = existing.verify_token;
  }

  // 3. Fetch profile + course settings for emails
  const [{ data: profile }, { data: course }] = await Promise.all([
    adminSb.from("profiles").select("email, full_name").eq("id", user.id).single(),
    adminSb
      .from("courses")
      .select("title, notify_completion_user, notify_completion_admin, admin_notify_email")
      .eq("id", courseId)
      .single(),
  ]);

  if (!profile || !course) return NextResponse.json({ success: true, certificateToken });

  const firstName = profile.full_name?.split(" ")[0] ?? "estudiante";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.juanpabloloaiza.com";
  const certUrl = certificateToken
    ? `${siteUrl}/academy/certificate/${certificateToken}`
    : null;

  // 4. Send emails (fire & forget — don't block response)
  const resend = new Resend(process.env.RESEND_API_KEY);
  const emailPromises: Promise<unknown>[] = [];

  if (course.notify_completion_user && process.env.RESEND_API_KEY) {
    emailPromises.push(
      resend.emails.send({
        from: FROM_EMAIL,
        to: profile.email,
        subject: `🎓 ¡Completaste "${course.title}"!`,
        html: studentCompletionEmail({ firstName, courseTitle: course.title, certUrl, siteUrl }),
      })
    );
  }

  if (course.notify_completion_admin && course.admin_notify_email && process.env.RESEND_API_KEY) {
    emailPromises.push(
      resend.emails.send({
        from: FROM_EMAIL,
        to: course.admin_notify_email,
        subject: `📚 ${profile.full_name ?? profile.email} completó el curso`,
        html: adminNotificationEmail({
          studentName: profile.full_name ?? "N/A",
          studentEmail: profile.email,
          courseTitle: course.title,
          certUrl,
          adminUrl: `${siteUrl}/academy/admin`,
        }),
      })
    );
  }

  await Promise.allSettled(emailPromises);

  return NextResponse.json({ success: true, certificateToken });
}

// ── Email templates ────────────────────────────────────────────────────────

function studentCompletionEmail({
  firstName,
  courseTitle,
  certUrl,
  siteUrl,
}: {
  firstName: string;
  courseTitle: string;
  certUrl: string | null;
  siteUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>¡Curso completado!</title></head>
<body style="margin:0;padding:0;background:#020617;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#0a1628;border:1px solid #C5A059;max-width:560px;width:100%;">
      <tr><td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid rgba(197,160,89,0.2);">
        <img src="https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png" alt="JPL Academy" width="160" style="height:auto;margin-bottom:8px;"/>
        <p style="margin:0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(197,160,89,0.6);">Academy</p>
      </td></tr>
      <tr><td style="padding:40px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C5A059;">¡Felicitaciones, ${firstName}!</p>
        <h1 style="margin:0 0 24px;font-size:24px;color:#ffffff;font-weight:400;line-height:1.4;">Has completado el curso</h1>
        <p style="margin:0 0 32px;font-size:16px;color:rgba(197,160,89,0.9);line-height:1.6;">"${courseTitle}"</p>
        <p style="margin:0 0 32px;font-size:15px;color:#9ca3af;line-height:1.8;">
          Has recorrido un camino de preparación profunda. Ahora estás listo para tu sesión de regresión con toda la comprensión y apertura necesarias.<br/><br/>
          Juan Pablo estará encantado de acompañarte en el siguiente paso.
        </p>
        ${certUrl ? `
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
          <tr><td style="background:#C5A059;padding:14px 32px;">
            <a href="${certUrl}" style="color:#020617;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">
              Ver mi certificado →
            </a>
          </td></tr>
        </table>` : ""}
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr><td style="border:1px solid rgba(197,160,89,0.4);padding:12px 28px;">
            <a href="${siteUrl}/agenda" style="color:#C5A059;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;">
              Agendar mi sesión
            </a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
        <p style="margin:0;font-size:12px;color:#4b5563;">
          Juan Pablo Loaiza · Terapeuta Holístico<br/>
          <a href="${siteUrl}" style="color:#C5A059;text-decoration:none;">juanpabloloaiza.com</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function adminNotificationEmail({
  studentName,
  studentEmail,
  courseTitle,
  certUrl,
  adminUrl,
}: {
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  certUrl: string | null;
  adminUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Estudiante completó el curso</title></head>
<body style="margin:0;padding:0;background:#020617;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#0a1628;border:1px solid rgba(197,160,89,0.3);max-width:560px;width:100%;">
      <tr><td style="padding:32px 40px;border-bottom:1px solid rgba(197,160,89,0.2);">
        <p style="margin:0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#C5A059;">JPL Academy · Admin</p>
      </td></tr>
      <tr><td style="padding:40px;">
        <h1 style="margin:0 0 24px;font-size:20px;color:#ffffff;font-weight:400;">📚 Nuevo estudiante completó el curso</h1>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#020d1f;border:1px solid rgba(255,255,255,0.05);margin-bottom:32px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b7280;">Estudiante</p>
            <p style="margin:0 0 16px;font-size:16px;color:#e5e7eb;">${studentName}</p>
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b7280;">Email</p>
            <p style="margin:0 0 16px;font-size:15px;color:#9ca3af;">${studentEmail}</p>
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b7280;">Curso</p>
            <p style="margin:0;font-size:15px;color:#C5A059;">${courseTitle}</p>
          </td></tr>
        </table>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr><td style="background:#C5A059;padding:12px 28px;margin-right:12px;">
            <a href="${adminUrl}" style="color:#020617;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">
              Ver analytics →
            </a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
