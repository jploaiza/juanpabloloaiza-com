"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/track";

const SCROLL_THRESHOLDS = [50, 75, 100] as const;
const TIME_THRESHOLDS_MS = [30_000, 60_000, 180_000] as const;

export function useEngagement() {
  const pathname = usePathname();
  const scrollFired = useRef<Set<number>>(new Set());
  const timeFired = useRef<Set<number>>(new Set());

  const isPublic =
    !pathname.startsWith("/academy") && !pathname.startsWith("/admin");

  useEffect(() => {
    if (!isPublic) return;
    scrollFired.current = new Set();
    timeFired.current = new Set();

    function onScroll() {
      const el = document.documentElement;
      const scrolled = el.scrollTop + el.clientHeight;
      const total = el.scrollHeight;
      if (total <= el.clientHeight) return;
      const pct = Math.round((scrolled / total) * 100);
      for (const threshold of SCROLL_THRESHOLDS) {
        if (pct >= threshold && !scrollFired.current.has(threshold)) {
          scrollFired.current.add(threshold);
          const name =
            threshold === 50
              ? "scroll_50"
              : threshold === 75
              ? "scroll_75"
              : "scroll_100";
          trackEvent(name);
        }
      }
    }

    const timers = TIME_THRESHOLDS_MS.map((ms) =>
      setTimeout(() => {
        if (!timeFired.current.has(ms)) {
          timeFired.current.add(ms);
          const name =
            ms === 30_000 ? "time_30s" : ms === 60_000 ? "time_60s" : "time_180s";
          trackEvent(name);
        }
      }, ms)
    );

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      timers.forEach(clearTimeout);
    };
  }, [pathname, isPublic]);
}
