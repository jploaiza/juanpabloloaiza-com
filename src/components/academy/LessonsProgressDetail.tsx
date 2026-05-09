"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Circle, PlayCircle, ChevronDown, ChevronUp, List } from "lucide-react";

interface LessonData {
  id: string;
  slug: string;
  title: string;
  duration_seconds: number;
  order_index: number;
}

interface SectionData {
  id: string;
  title: string;
  order_index: number;
  lessons: LessonData[];
}

interface ProgressEntry {
  is_completed: boolean;
  watch_seconds: number;
  duration_seconds: number;
}

interface Props {
  sections: SectionData[];
  progressMap: Record<string, ProgressEntry>;
  totalLessons: number;
  completedCount: number;
}

export default function LessonsProgressDetail({ sections, progressMap, totalLessons, completedCount }: Props) {
  const [open, setOpen] = useState(false);

  const sortedSections = [...sections].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="mt-8">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 font-cinzel text-[10px] uppercase tracking-widest border border-[#C5A059]/40 text-[#C5A059] px-5 py-2.5 hover:bg-[#C5A059]/10 transition w-full sm:w-auto"
      >
        <List className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Detalle de lecciones</span>
        <span className="font-crimson text-xs text-gray-500 normal-case ml-1">
          {completedCount}/{totalLessons}
        </span>
        <span className="ml-auto sm:ml-2">
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {sortedSections.map((section) => {
            const sectionCompleted = section.lessons.filter(
              (l) => progressMap[l.id]?.is_completed
            ).length;
            const allDone = sectionCompleted === section.lessons.length;

            return (
              <div key={section.id} className="bg-[#16213e] border border-white/5 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-cinzel text-[10px] uppercase tracking-widest text-white">
                    {section.title}
                  </h3>
                  <span
                    className={`font-cinzel text-[9px] ${
                      allDone ? "text-emerald-500" : "text-gray-500"
                    }`}
                  >
                    {sectionCompleted}/{section.lessons.length}
                  </span>
                </div>

                <div className="divide-y divide-white/[0.03]">
                  {[...section.lessons]
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((lesson) => {
                      const prog = progressMap[lesson.id];
                      const isCompleted = prog?.is_completed ?? false;
                      const watchSeconds = prog?.watch_seconds ?? 0;
                      const duration =
                        lesson.duration_seconds || prog?.duration_seconds || 1;
                      const watchPct = Math.min(
                        100,
                        Math.round((watchSeconds / duration) * 100)
                      );
                      const inProgress = !isCompleted && watchPct > 0;

                      return (
                        <Link
                          key={lesson.id}
                          href={`/academy/lesson/${lesson.slug}`}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.025] transition group"
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : inProgress ? (
                            <PlayCircle className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-700 flex-shrink-0" />
                          )}

                          <span
                            className={`font-crimson text-sm flex-1 truncate transition ${
                              isCompleted
                                ? "text-gray-500"
                                : "text-gray-200 group-hover:text-white"
                            }`}
                          >
                            {lesson.title}
                          </span>

                          {inProgress && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="w-14 h-1 bg-[#0a1628] overflow-hidden">
                                <div
                                  className="h-full bg-[#C5A059]/60"
                                  style={{ width: `${watchPct}%` }}
                                />
                              </div>
                              <span className="font-cinzel text-[9px] text-gray-600 w-7 text-right">
                                {watchPct}%
                              </span>
                            </div>
                          )}

                          {isCompleted && (
                            <span className="font-cinzel text-[9px] text-emerald-500/60 flex-shrink-0">
                              ✓
                            </span>
                          )}
                        </Link>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
