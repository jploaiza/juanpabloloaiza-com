// ── Academy domain types ───────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "student" | "admin";
  created_at: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  instructor_name: string;
  instructor_bio: string;
  instructor_photo_url: string | null;
  is_free: boolean;
  is_published: boolean;
  created_at: string;
}

export interface Section {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  section_id: string;
  course_id: string;
  slug: string;
  title: string;
  duration_seconds: number;
  video_url: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
  // Joined
  section?: Section;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  watch_seconds: number;
  duration_seconds: number;
  is_completed: boolean;
  completed_at: string | null;
  last_watched_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  lesson_id: string;
  content: string;
  updated_at: string;
}

export interface Question {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  content: string;
  answer: string | null;
  answered_by: string | null;
  answered_at: string | null;
  created_at: string;
  // Joined
  profile?: Pick<Profile, "full_name" | "avatar_url">;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  verify_token: string;
  issued_at: string;
  pdf_url: string | null;
  // Joined
  profile?: Pick<Profile, "full_name">;
  course?: Pick<Course, "title">;
}

// ── Derived view types ────────────────────────────────────────────────────

export interface LessonWithProgress extends Lesson {
  progress?: LessonProgress;
  is_locked: boolean;
}

export interface SectionWithLessons extends Section {
  lessons: LessonWithProgress[];
}

export interface CourseWithProgress extends Course {
  sections: SectionWithLessons[];
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number;
  last_lesson?: Lesson;
  enrollment?: Enrollment;
}
