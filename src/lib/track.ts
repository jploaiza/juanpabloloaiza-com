"use client";

const SESSION_KEY = "jpl_sid";
const UTM_KEY = "jpl_utm";

const ALLOWED_EVENTS = [
  "whatsapp_click",
  "agendar_click",
  "booking_confirmed",
  "enrollment_started",
  "lesson_completed",
  "course_completed",
  "scroll_50",
  "scroll_75",
  "scroll_100",
  "time_30s",
  "time_60s",
  "time_180s",
] as const;

export type EventName = (typeof ALLOWED_EVENTS)[number];

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export type UtmData = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

export function getUtmFromUrl(): UtmData {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const utm: UtmData = {};
  const s = p.get("utm_source"); if (s) utm.utm_source = s;
  const m = p.get("utm_medium"); if (m) utm.utm_medium = m;
  const c = p.get("utm_campaign"); if (c) utm.utm_campaign = c;
  const co = p.get("utm_content"); if (co) utm.utm_content = co;
  const t = p.get("utm_term"); if (t) utm.utm_term = t;
  return utm;
}

export function persistUtm(utm: UtmData): void {
  if (typeof window === "undefined" || !Object.keys(utm).length) return;
  sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
}

export function readPersistedUtm(): UtmData {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(UTM_KEY);
    return raw ? (JSON.parse(raw) as UtmData) : {};
  } catch {
    return {};
  }
}

export function getDeviceType(): "desktop" | "mobile" | "tablet" {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) return "mobile";
  return "desktop";
}

export async function trackEvent(
  name: EventName,
  props?: Record<string, unknown>
): Promise<void> {
  if (typeof window === "undefined") return;
  const utm = readPersistedUtm();
  try {
    await fetch("/api/track/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        path: window.location.pathname,
        sessionId: getSessionId(),
        props: props ?? {},
        utm,
      }),
    });
  } catch {
    // fire and forget
  }
}
