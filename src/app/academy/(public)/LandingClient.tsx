"use client";
import { useState } from "react";
import { ChevronDown, PlayCircle, Lock } from "lucide-react";
import { formatDuration } from "@/lib/academy-data";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";

interface Lesson {
  title: string;
  duration_seconds: number;
  order_index: number;
}

interface Section {
  title: string;
  order_index: number;
  lessons: Lesson[];
}

export default function AcademyLandingClient({ sections }: { sections: Section[] }) {
  const [open, setOpen] = useState<number[]>([0]);

  const toggle = (i: number) =>
    setOpen((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  return (
    <div className="space-y-3">
      {sections.map((section, si) => {
        const isOpen = open.includes(si);
        const sectionTotal = section.lessons.reduce((a, l) => a + l.duration_seconds, 0);
        return (
          <div key={si} className="relative border border-[#C5A059]/15 overflow-hidden">
            <ScrollworkCorners size={36} opacity={0.65} />
            <button
              className="w-full flex items-center justify-between px-5 py-4 bg-[#0a1628] hover:bg-[#0d1f3a] transition text-left"
              onClick={() => toggle(si)}
            >
              <div>
                <span className="font-cinzel text-sm text-white uppercase tracking-widest">{section.title}</span>
                <span className="ml-3 font-crimson text-xs text-gray-500">
                  {section.lessons.length} lecciones · {formatDuration(sectionTotal)}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#C5A059] transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <div className="divide-y divide-white/5">
                {section.lessons.map((lesson, li) => (
                  <div key={li} className="flex items-center justify-between px-5 py-3 bg-[#060f1e]">
                    <div className="flex items-center gap-3">
                      <PlayCircle className="w-3.5 h-3.5 text-[#C5A059]/50 flex-shrink-0" />
                      <span className="font-crimson text-gray-300 text-sm">{lesson.title}</span>
                    </div>
                    <span className="font-crimson text-xs text-gray-600 ml-4 flex-shrink-0">
                      {formatDuration(lesson.duration_seconds)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
