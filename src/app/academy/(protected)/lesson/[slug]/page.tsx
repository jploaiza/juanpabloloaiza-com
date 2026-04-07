import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AcademyHeader from "@/components/academy/AcademyHeader";
import LessonPlayer from "@/components/academy/LessonPlayer";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("title")
    .eq("slug", slug)
    .maybeSingle();
  return { title: lesson?.title ?? "Lección" };
}

export default async function LessonPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/academy/login?redirect=/academy/lesson/${slug}`);

  // Fetch profile + lesson concurrently
  const [{ data: profile }, { data: lesson, error: lessonError }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("lessons")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle(),
  ]);

  if (lessonError) console.error("[lesson] query error:", lessonError);
  if (!lesson) notFound();

  // Verify enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", lesson.course_id)
    .maybeSingle();

  if (!enrollment) redirect("/academy/dashboard");

  // Fetch course outline + progress + note concurrently
  const [{ data: sections }, { data: progressRows }, { data: noteRow }] =
    await Promise.all([
      supabase
        .from("sections")
        .select(
          "id, title, order_index, lessons(id, slug, title, duration_seconds, order_index, is_published, video_url)"
        )
        .eq("course_id", lesson.course_id)
        .order("order_index"),
      supabase
        .from("lesson_progress")
        .select("lesson_id, watch_seconds, duration_seconds, is_completed")
        .eq("user_id", user.id)
        .eq("course_id", lesson.course_id),
      supabase
        .from("notes")
        .select("content")
        .eq("user_id", user.id)
        .eq("lesson_id", lesson.id)
        .maybeSingle(),
    ]);

  // Derive the lesson's section from already-fetched sections data
  const lessonWithSection = {
    ...lesson,
    section: (sections ?? []).find((s) => s.id === lesson.section_id) ?? null,
  };

  // Build flat ordered lesson list for prev/next navigation
  const sortedSections = (sections ?? []).sort(
    (a, b) => a.order_index - b.order_index
  );
  const allLessons = sortedSections.flatMap((s) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((s.lessons as any[]) ?? [])
      .filter((l) => l.is_published)
      .sort(
        (a: { order_index: number }, b: { order_index: number }) =>
          a.order_index - b.order_index
      )
  );

  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const progressMap = Object.fromEntries(
    (progressRows ?? []).map((p) => [p.lesson_id, p])
  );

  return (
    <div className="min-h-screen bg-[#020617]">
      <AcademyHeader user={profile} />
      <LessonPlayer
        lesson={lessonWithSection}
        sections={sortedSections}
        progressMap={progressMap}
        prevLesson={prevLesson}
        nextLesson={nextLesson}
        userId={user.id}
        initialNote={noteRow?.content ?? ""}
      />
    </div>
  );
}
