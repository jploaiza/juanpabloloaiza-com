import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/academy/dashboard";
  // Allow only safe relative paths — blocks //evil.com, control chars, and external URLs
  const next = /^\/[a-z0-9/_\-?=&#%.@!+]*$/i.test(rawNext) ? rawNext : "/academy/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Auto-enroll in the free course
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: course } = await supabase
          .from("courses")
          .select("id")
          .eq("slug", "hipnosis-regresiva-preparacion")
          .maybeSingle();

        if (course) {
          await supabase.from("enrollments").upsert(
            { user_id: user.id, course_id: course.id },
            { onConflict: "user_id,course_id", ignoreDuplicates: true }
          );
          void supabase.from("events").insert({
            event_name: "enrollment_started",
            user_id: user.id,
            props: { courseId: course.id },
          });
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/academy/login?error=auth`);
}
