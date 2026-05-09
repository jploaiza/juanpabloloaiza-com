import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, courseId } = await req.json();
  if (!userId || !courseId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const adminSb = createAdminClient();

  const { data: lessons } = await adminSb
    .from("lessons")
    .select("id, duration_seconds")
    .eq("course_id", courseId)
    .eq("is_published", true);

  if (!lessons?.length) {
    return NextResponse.json({ error: "No lessons found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const progressRows = lessons.map((l) => ({
    user_id: userId,
    lesson_id: l.id,
    course_id: courseId,
    is_completed: true,
    completed_at: now,
    last_watched_at: now,
    watch_seconds: l.duration_seconds ?? 0,
    duration_seconds: l.duration_seconds ?? 0,
    real_play_seconds: l.duration_seconds ?? 0,
  }));

  const { error: progressError } = await adminSb
    .from("lesson_progress")
    .upsert(progressRows, { onConflict: "user_id,lesson_id" });

  if (progressError) {
    console.error("[force-complete] progress:", progressError.code);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const { error: enrollError } = await adminSb
    .from("enrollments")
    .update({ completed_at: now })
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .is("completed_at", null);

  if (enrollError) {
    console.error("[force-complete] enrollment:", enrollError.code);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const { data: existing, error: certFetchError } = await adminSb
    .from("certificates")
    .select("verify_token")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (certFetchError) {
    console.error("[force-complete] cert-fetch:", certFetchError.code);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  let certificateToken = existing?.verify_token ?? null;
  if (!existing) {
    const { data: cert, error: certInsertError } = await adminSb
      .from("certificates")
      .insert({ user_id: userId, course_id: courseId })
      .select("verify_token")
      .single();
    if (certInsertError) {
      console.error("[force-complete] cert-insert:", certInsertError.code);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    certificateToken = cert?.verify_token ?? null;
  }

  return NextResponse.json({ success: true, certificateToken });
}
