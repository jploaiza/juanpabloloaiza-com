"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  getSessionId,
  getUtmFromUrl,
  persistUtm,
  readPersistedUtm,
  getDeviceType,
} from "@/lib/track";
import { useEngagement } from "@/hooks/useEngagement";

export default function PageTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEngagement();

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    const urlUtm = getUtmFromUrl();
    if (Object.keys(urlUtm).length > 0) persistUtm(urlUtm);
    const utm = readPersistedUtm();

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
        sessionId: getSessionId(),
        deviceType: getDeviceType(),
        ...utm,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
