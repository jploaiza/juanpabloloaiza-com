import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId, watchSeconds, courseId } = await req.json();
  if (!lessonId || !courseId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { error } = await supabase
    .from("lesson_progress")
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        course_id: courseId,
        watch_seconds: watchSeconds,
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
