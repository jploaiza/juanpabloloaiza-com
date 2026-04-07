"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  PlayCircle,
  LayoutList,
  X,
  BookOpen,
  MessageCircle,
  Check,
  LayoutDashboard,
  Loader2,
  SkipForward,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDuration } from "@/lib/academy-data";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LessonRow {
  id: string;
  slug: string;
  title: string;
  duration_seconds: number;
  video_url: string | null;
  order_index: number;
  is_published: boolean;
}

interface SectionRow {
  id: string;
  title: string;
  order_index: number;
  lessons: LessonRow[];
}

interface ProgressEntry {
  lesson_id: string;
  watch_seconds: number;
  duration_seconds: number;
  is_completed: boolean;
  real_play_seconds?: number;
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lesson: any;
  sections: SectionRow[];
  progressMap: Record<string, ProgressEntry>;
  prevLesson: LessonRow | null;
  nextLesson: LessonRow | null;
  userId: string;
  initialNote: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SAVE_INTERVAL_MS = 5000;
const COMPLETE_THRESHOLD = 0.9; // 90% watched → auto-complete

// ── Component ─────────────────────────────────────────────────────────────────

export default function LessonPlayer({
  lesson,
  sections,
  progressMap,
  prevLesson,
  nextLesson,
  userId,
  initialNote,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement>(null);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"notes" | "qa">("notes");

  // Progress state
  const [isCompleted, setIsCompleted] = useState(
    progressMap[lesson.id]?.is_completed ?? false
  );
  const [markingComplete, setMarkingComplete] = useState(false);

  // Notes state
  const [note, setNote] = useState(initialNote);
  const [noteSaved, setNoteSaved] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Progress save ref (avoid stale closure)
  const saveProgressRef = useRef({ watchSeconds: 0, saved: false });

  // ── Auto-advance + autoplay state ─────────────────────────────────────────
  const [autoAdvance, setAutoAdvance] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("academy_autoadvance");
    return stored === null ? true : stored === "true";
  });
  const [autoPlay, setAutoPlay] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("academy_autoplay");
    return stored === null ? true : stored === "true";
  });
  const autoPlayRef = useRef(autoPlay);
  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs so video event handlers always see latest values
  const autoAdvanceRef = useRef(autoAdvance);
  const nextLessonRef = useRef(nextLesson);
  useEffect(() => { autoAdvanceRef.current = autoAdvance; }, [autoAdvance]);
  useEffect(() => { nextLessonRef.current = nextLesson; }, [nextLesson]);

  // ── Watch integrity refs ───────────────────────────────────────────────────
  // Tracks real accumulated play time (not seeked position) to detect skipping
  const playStartTimeRef = useRef<number | null>(null);
  const realPlaySecondsRef = useRef<number>(progressMap[lesson.id]?.real_play_seconds ?? 0);

  // ── Autoplay on arrival (from autonext navigation) ────────────────────────
  useEffect(() => {
    if (searchParams.get("autoplay") !== "1") return;
    const video = videoRef.current;
    if (!video) return;
    // Wait for enough metadata to be loaded before playing
    const tryPlay = () => {
      video.play().catch(() => {
        // Browser still blocked — user will need to press play manually
      });
    };
    if (video.readyState >= 1) {
      tryPlay();
    } else {
      video.addEventListener("loadedmetadata", tryPlay, { once: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Trigger course completion (email + certificate) ────────────────────────

  const triggerCourseComplete = useCallback(async () => {
    if (!nextLesson) {
      // This is the last lesson — fire completion
      const res = await fetch("/api/academy/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, courseId: lesson.course_id }),
      });
      const data = await res.json();
      if (data.success) {
        setCourseCompleted(true);
        const dest = data.certificateToken
          ? `/academy/completado?token=${data.certificateToken}`
          : "/academy/completado";
        setTimeout(() => router.push(dest), 2500);
      }
    }
  }, [lesson.id, lesson.course_id, nextLesson, router]);

  // ── Auto-advance helpers ───────────────────────────────────────────────────

  const cancelCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  }, []);

  const startCountdown = useCallback(() => {
    if (!nextLessonRef.current) return;
    setCountdown(5);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = null;
          if (autoAdvanceRef.current && nextLessonRef.current) {
            const url = `/academy/lesson/${nextLessonRef.current.slug}${autoPlayRef.current ? "?autoplay=1" : ""}`;
            router.push(url);
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [router]);

  const toggleAutoAdvance = useCallback(() => {
    setAutoAdvance((prev) => {
      const next = !prev;
      localStorage.setItem("academy_autoadvance", String(next));
      if (!next) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(null);
      }
      return next;
    });
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setAutoPlay((prev) => {
      const next = !prev;
      localStorage.setItem("academy_autoplay", String(next));
      return next;
    });
  }, []);

  // ── Save video progress ────────────────────────────────────────────────────

  const saveProgress = useCallback(
    async (watchSeconds: number, completed: boolean) => {
      await supabase.from("lesson_progress").upsert(
        {
          user_id: userId,
          lesson_id: lesson.id,
          course_id: lesson.course_id,
          watch_seconds: watchSeconds,
          duration_seconds: lesson.duration_seconds,
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
          last_watched_at: new Date().toISOString(),
          real_play_seconds: Math.round(realPlaySecondsRef.current),
        },
        { onConflict: "user_id,lesson_id" }
      );
    },
    [supabase, userId, lesson.id, lesson.course_id, lesson.duration_seconds]
  );

  // ── Video event handlers ───────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Restore last position
    const lastSeconds = progressMap[lesson.id]?.watch_seconds ?? 0;
    if (lastSeconds > 5) {
      video.currentTime = lastSeconds;
    }

    let saveTimer: ReturnType<typeof setInterval>;

    // ── Real play time accumulation ──────────────────────────────────────────
    const WATCH_INTEGRITY = 0.65; // 65% real watch time required for auto-complete

    const accumulatePlay = () => {
      if (playStartTimeRef.current !== null) {
        realPlaySecondsRef.current += (Date.now() - playStartTimeRef.current) / 1000;
        playStartTimeRef.current = null;
      }
    };

    const onPlay = () => {
      playStartTimeRef.current = Date.now();
    };

    const onSeeking = () => {
      // Pause accumulation when user seeks (may be skipping)
      accumulatePlay();
    };

    const onTimeUpdate = () => {
      saveProgressRef.current.watchSeconds = Math.floor(video.currentTime);
      // Auto-complete only if enough real watch time (not just seeked)
      if (
        !isCompleted &&
        video.duration > 0 &&
        video.currentTime / video.duration >= COMPLETE_THRESHOLD &&
        realPlaySecondsRef.current / video.duration >= WATCH_INTEGRITY
      ) {
        setIsCompleted(true);
        saveProgress(Math.floor(video.currentTime), true);
      }
    };

    const onPause = () => {
      accumulatePlay();
      saveProgress(Math.floor(video.currentTime), isCompleted);
    };

    const onEnded = () => {
      accumulatePlay(); // capture final segment
      setIsCompleted(true);
      saveProgress(Math.floor(video.duration), true);
      triggerCourseComplete();
      // Auto-advance to next lesson if enabled
      if (autoAdvanceRef.current && nextLessonRef.current) {
        startCountdown();
      }
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    // Periodic save every 5s during playback
    saveTimer = setInterval(() => {
      if (!video.paused && !video.ended) {
        saveProgress(Math.floor(video.currentTime), isCompleted);
      }
    }, SAVE_INTERVAL_MS);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      clearInterval(saveTimer);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, isCompleted]);

  // ── Manual mark complete ───────────────────────────────────────────────────

  const handleMarkComplete = async () => {
    setMarkingComplete(true);
    const watchSeconds = videoRef.current
      ? Math.floor(videoRef.current.currentTime)
      : lesson.duration_seconds;
    await saveProgress(watchSeconds, true);
    setIsCompleted(true);
    await triggerCourseComplete();
    setMarkingComplete(false);
  };

  // ── Notes auto-save ────────────────────────────────────────────────────────

  const handleNoteChange = (value: string) => {
    setNote(value);
    setNoteSaved(false);
    if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
    noteTimerRef.current = setTimeout(async () => {
      setSavingNote(true);
      await supabase.from("notes").upsert(
        { user_id: userId, lesson_id: lesson.id, content: value, updated_at: new Date().toISOString() },
        { onConflict: "user_id,lesson_id" }
      );
      setSavingNote(false);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    }, 1200);
  };

  // ── Navigate to next lesson ────────────────────────────────────────────────

  const goToNext = () => {
    if (nextLesson) router.push(`/academy/lesson/${nextLesson.slug}`);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="pt-16 h-screen flex flex-col overflow-hidden">
        {/* ── Top breadcrumb bar ── */}
        <div className="border-b border-white/5 bg-[#020617]/80 backdrop-blur-sm">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/academy/dashboard"
                className="text-gray-500 hover:text-[#C5A059] transition flex-shrink-0"
                aria-label="Dashboard"
              >
                <LayoutDashboard className="w-4 h-4" />
              </Link>
              <span className="text-gray-600 text-xs">/</span>
              <span className="font-cinzel text-[10px] uppercase tracking-widest text-gray-400 truncate">
                {lesson.title}
              </span>
            </div>
            {/* Mobile sidebar toggle */}
            <button
              className="lg:hidden flex items-center gap-1.5 border border-[#C5A059]/30 text-[#C5A059] px-2.5 py-1 hover:bg-[#C5A059]/10 transition"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ver lecciones"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="font-cinzel text-[9px] uppercase tracking-widest">Lecciones</span>
            </button>
          </div>
        </div>

        {/* ── Main layout: video + sidebar ── */}
        <div className="flex flex-1 max-w-[1400px] mx-auto w-full overflow-hidden">
          {/* ── Left: video column ── */}
          <div className="flex-1 min-w-0 flex flex-col overflow-y-auto scrollbar-gold">
            {/* Video */}
            <div className="relative w-full bg-black aspect-video">
              {lesson.video_url ? (
                <video
                  ref={videoRef}
                  src={lesson.video_url}
                  controls
                  playsInline
                  className="w-full h-full"
                  preload="metadata"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <PlayCircle className="w-16 h-16 text-[#C5A059]/30" />
                  <p className="font-cinzel text-xs uppercase tracking-widest text-gray-600">
                    Video próximamente
                  </p>
                </div>
              )}

              {/* ── Course completed overlay ── */}
              {courseCompleted && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm z-10 gap-4">
                  <div className="w-16 h-16 border border-[#C5A059]/40 flex items-center justify-center mb-2">
                    <span className="text-[#C5A059] text-2xl">✦</span>
                  </div>
                  <p className="font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059]">¡Curso completado!</p>
                  <p className="font-crimson text-gray-400 text-sm">Preparando tu certificado...</p>
                  <div className="flex gap-1 mt-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-[#C5A059]/40 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Auto-advance countdown overlay ── */}
              {countdown !== null && nextLesson && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                  {/* Countdown ring */}
                  <div className="relative w-24 h-24 mb-6">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                      {/* Track */}
                      <circle
                        cx="48" cy="48" r="42"
                        fill="none"
                        stroke="rgba(197,160,89,0.15)"
                        strokeWidth="4"
                      />
                      {/* Progress — animates from full to empty over the second */}
                      <circle
                        cx="48" cy="48" r="42"
                        fill="none"
                        stroke="#C5A059"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - countdown / 5)}`}
                        style={{ transition: "stroke-dashoffset 0.9s linear" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-cinzel text-3xl text-white">{countdown}</span>
                    </div>
                  </div>

                  {/* Labels */}
                  <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-2">
                    Siguiente lección
                  </p>
                  <p className="font-crimson text-white text-lg text-center max-w-xs px-4 mb-8 leading-tight">
                    {nextLesson.title}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        cancelCountdown();
                        router.push(`/academy/lesson/${nextLesson.slug}${autoPlay ? "?autoplay=1" : ""}`);
                      }}
                      className="flex items-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-6 py-3 hover:bg-[#d4b06a] transition"
                    >
                      <SkipForward className="w-4 h-4" />
                      Continuar ahora
                    </button>
                    <button
                      onClick={cancelCountdown}
                      className="font-cinzel text-[10px] uppercase tracking-widest text-gray-400 hover:text-white transition px-4 py-3 border border-white/10 hover:border-white/30"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Lesson info + navigation ── */}
            <div className="relative px-4 sm:px-6 py-5 border-b border-white/5 overflow-hidden">
              <ScrollworkCorners size={40} opacity={0.6} />
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  {/* Section label */}
                  {lesson.section && (
                    <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/70 mb-1">
                      {lesson.section.title}
                    </p>
                  )}
                  <h1 className="font-cinzel text-lg sm:text-xl text-white leading-snug">
                    {lesson.title}
                  </h1>
                  <p className="font-crimson text-sm text-gray-500 mt-1">
                    {formatDuration(lesson.duration_seconds)} min
                  </p>
                </div>

                {/* Completion badge + button */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {isCompleted ? (
                    <span className="flex items-center gap-2 font-cinzel text-[10px] uppercase tracking-widest text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      Completada
                    </span>
                  ) : (
                    <button
                      onClick={handleMarkComplete}
                      disabled={markingComplete}
                      className="flex items-center gap-2 font-cinzel text-[10px] uppercase tracking-widest border border-[#C5A059]/40 text-[#C5A059] px-4 py-2 hover:bg-[#C5A059]/10 transition disabled:opacity-50"
                    >
                      {markingComplete ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Marcar completa
                    </button>
                  )}
                </div>
              </div>

              {/* Prev / Next navigation + auto-advance toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-5 pt-4 border-t border-white/5">
                {/* Prev */}
                <div className="flex-1">
                  {prevLesson ? (
                    <Link
                      href={`/academy/lesson/${prevLesson.slug}`}
                      className="flex items-center gap-2 font-cinzel text-[10px] uppercase tracking-widest text-gray-400 hover:text-[#C5A059] transition group"
                    >
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                      <span className="hidden sm:block max-w-[160px] truncate">
                        {prevLesson.title}
                      </span>
                      <span className="sm:hidden">Anterior</span>
                    </Link>
                  ) : (
                    <div />
                  )}
                </div>

                {/* Toggles: Autonext + Autoplay */}
                {nextLesson && (
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Autonext */}
                    <button
                      onClick={toggleAutoAdvance}
                      className="flex items-center gap-1.5 group"
                      title={autoAdvance ? "Siguiente automático: activado" : "Siguiente automático: desactivado"}
                    >
                      <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition">
                        Autonext
                      </span>
                      <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${autoAdvance ? "bg-[#C5A059]" : "bg-white/10"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${autoAdvance ? "translate-x-4" : "translate-x-0.5"}`} />
                      </div>
                    </button>

                    {/* Autoplay — solo relevante si autonext está activo */}
                    <button
                      onClick={toggleAutoPlay}
                      disabled={!autoAdvance}
                      className="flex items-center gap-1.5 group disabled:opacity-30"
                      title={autoPlay ? "Autoplay: activado" : "Autoplay: desactivado"}
                    >
                      <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition">
                        Autoplay
                      </span>
                      <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${autoPlay && autoAdvance ? "bg-[#C5A059]" : "bg-white/10"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${autoPlay && autoAdvance ? "translate-x-4" : "translate-x-0.5"}`} />
                      </div>
                    </button>
                  </div>
                )}

                {/* Next / Finish */}
                {nextLesson ? (
                  <button
                    onClick={goToNext}
                    className="flex items-center gap-2 font-cinzel text-[10px] uppercase tracking-widest bg-[#C5A059] text-[#020617] px-5 py-2.5 hover:bg-[#d4b06a] transition group flex-shrink-0"
                  >
                    <span className="hidden sm:block max-w-[160px] truncate">
                      {nextLesson.title}
                    </span>
                    <span className="sm:hidden">Siguiente</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : (
                  <Link
                    href="/academy/dashboard"
                    className="flex items-center gap-2 font-cinzel text-[10px] uppercase tracking-widest bg-[#C5A059] text-[#020617] px-5 py-2.5 hover:bg-[#d4b06a] transition flex-shrink-0"
                  >
                    Finalizar curso →
                  </Link>
                )}
              </div>
            </div>

            {/* ── Tabs: Notes & Q&A ── */}
            <div className="flex-1 px-4 sm:px-6 py-5">
              <div className="flex gap-6 mb-5 border-b border-white/5">
                {(["notes", "qa"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2 font-cinzel text-[10px] uppercase tracking-widest pb-3 border-b-2 transition -mb-px ${
                      activeTab === tab
                        ? "border-[#C5A059] text-[#C5A059]"
                        : "border-transparent text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {tab === "notes" ? (
                      <>
                        <BookOpen className="w-3.5 h-3.5" /> Mis notas
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-3.5 h-3.5" /> Preguntas
                      </>
                    )}
                  </button>
                ))}
              </div>

              {activeTab === "notes" && (
                <div className="relative">
                  <textarea
                    value={note}
                    onChange={(e) => handleNoteChange(e.target.value)}
                    placeholder="Escribe tus notas sobre esta lección..."
                    rows={8}
                    className="w-full bg-[#0a1628] border border-white/5 focus:border-[#C5A059]/30 text-gray-300 font-crimson text-sm p-4 resize-none outline-none transition placeholder:text-gray-600"
                  />
                  <div className="flex justify-end mt-2 h-4">
                    {savingNote && (
                      <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
                      </span>
                    )}
                    {noteSaved && (
                      <span className="font-cinzel text-[9px] uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Guardado
                      </span>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "qa" && (
                <QAPanel
                  supabase={supabase}
                  userId={userId}
                  lessonId={lesson.id}
                  courseId={lesson.course_id}
                />
              )}
            </div>
          </div>

          {/* ── Right: sidebar (desktop) ── */}
          <aside className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-white/5 bg-[#020617] overflow-y-auto scrollbar-gold">
            <CourseSidebar
              sections={sections}
              currentLessonId={lesson.id}
              progressMap={progressMap}
              onClose={() => setSidebarOpen(false)}
            />
          </aside>
        </div>
      </main>

      {/* ── Mobile sidebar drawer ── */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-[#020617] border-l border-white/5 z-50 overflow-y-auto transition-transform duration-300 lg:hidden scrollbar-gold ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex items-center justify-between p-4 border-b border-white/5 overflow-hidden">
          <ScrollworkCorners size={36} opacity={0.6} />
          <span className="font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059]">
            Contenido del curso
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <CourseSidebar
          sections={sections}
          currentLessonId={lesson.id}
          progressMap={progressMap}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    </>
  );
}

// ── Course Sidebar ─────────────────────────────────────────────────────────────

function CourseSidebar({
  sections,
  currentLessonId,
  progressMap,
  onClose,
}: {
  sections: SectionRow[];
  currentLessonId: string;
  progressMap: Record<string, ProgressEntry>;
  onClose: () => void;
}) {
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentLessonId]);

  return (
    <div className="py-4 pb-[45vh]">
      {sections.map((section) => {
        const lessons = [...(section.lessons ?? [])]
          .filter((l) => l.is_published)
          .sort((a, b) => a.order_index - b.order_index);
        const sectionCompleted = lessons.filter(
          (l) => progressMap[l.id]?.is_completed
        ).length;

        return (
          <div key={section.id} className="mb-2">
            {/* Section header */}
            <div className="px-5 py-2.5 flex items-center justify-between">
              <h3 className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/80 leading-tight">
                {section.title}
              </h3>
              <span className="font-crimson text-[10px] text-gray-600 flex-shrink-0 ml-2">
                {sectionCompleted}/{lessons.length}
              </span>
            </div>

            {/* Lessons */}
            {lessons.map((lesson) => {
              const progress = progressMap[lesson.id];
              const completed = progress?.is_completed ?? false;
              const isCurrent = lesson.id === currentLessonId;

              return (
                <Link
                  key={lesson.id}
                  ref={isCurrent ? activeRef : undefined}
                  href={`/academy/lesson/${lesson.slug}`}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-5 py-3 text-left transition border-l-2 ${
                    isCurrent
                      ? "border-[#C5A059] bg-[#C5A059]/5"
                      : "border-transparent hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Status icon */}
                  <span className="flex-shrink-0 mt-0.5">
                    {completed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : isCurrent ? (
                      <PlayCircle className="w-4 h-4 text-[#C5A059]" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-700" />
                    )}
                  </span>
                  {/* Title + duration */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-crimson text-sm leading-tight ${
                        isCurrent
                          ? "text-white"
                          : completed
                          ? "text-gray-400"
                          : "text-gray-300"
                      }`}
                    >
                      {lesson.title}
                    </p>
                    <p className="font-cinzel text-[9px] text-gray-600 mt-0.5">
                      {formatDuration(lesson.duration_seconds)} min
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Q&A Panel ─────────────────────────────────────────────────────────────────

function QAPanel({
  supabase,
  userId,
  lessonId,
  courseId,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  userId: string;
  lessonId: string;
  courseId: string;
}) {
  const [questions, setQuestions] = useState<
    { id: string; content: string; answer: string | null; created_at: string }[]
  >([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("questions")
      .select("id, content, answer, created_at")
      .eq("lesson_id", lessonId)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: typeof questions | null }) => {
        setQuestions(data ?? []);
        setLoaded(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const handleSubmit = async () => {
    const trimmed = newQuestion.trim();
    if (!trimmed) return;
    setSending(true);
    const { data, error } = await supabase
      .from("questions")
      .insert({ user_id: userId, lesson_id: lessonId, course_id: courseId, content: trimmed })
      .select("id, content, answer, created_at")
      .single();
    if (!error && data) {
      setQuestions((prev) => [data, ...prev]);
      setNewQuestion("");
    }
    setSending(false);
  };

  return (
    <div className="space-y-5">
      {/* Submit question */}
      <div>
        <textarea
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Escribe tu pregunta sobre esta lección..."
          rows={3}
          className="w-full bg-[#0a1628] border border-white/5 focus:border-[#C5A059]/30 text-gray-300 font-crimson text-sm p-4 resize-none outline-none transition placeholder:text-gray-600"
        />
        <button
          onClick={handleSubmit}
          disabled={sending || !newQuestion.trim()}
          className="mt-2 font-cinzel text-[10px] uppercase tracking-widest bg-[#C5A059] text-[#020617] px-5 py-2 hover:bg-[#d4b06a] transition disabled:opacity-40"
        >
          {sending ? "Enviando..." : "Enviar pregunta"}
        </button>
      </div>

      {/* Questions list */}
      {!loaded ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-[#C5A059]/40" />
        </div>
      ) : questions.length === 0 ? (
        <p className="font-crimson text-gray-600 text-sm text-center py-8">
          Sé el primero en hacer una pregunta sobre esta lección.
        </p>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="relative bg-[#0a1628] border border-white/5 p-4 overflow-hidden">
              <ScrollworkCorners size={28} opacity={0.55} />
              <p className="font-crimson text-sm text-gray-300">{q.content}</p>
              {q.answer && (
                <div className="mt-3 pt-3 border-t border-[#C5A059]/10">
                  <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">
                    Respuesta
                  </p>
                  <p className="font-crimson text-sm text-gray-400">{q.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
