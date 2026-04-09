// ================================================================
// lib/google-calendar.ts — Integración con Google Calendar API v3
// ================================================================

export interface GCalTokenData {
  access_token: string;
  refresh_token: string | null;
  expires_at: string; // ISO string
  calendar_id: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: { email: string; displayName?: string; responseStatus?: string }[];
  organizer?: { email: string; displayName?: string };
  htmlLink?: string;
}

export interface PatientCalendarStatus {
  patient_id: string;
  scheduled: boolean;
  event_summary?: string;
  event_start?: string;
}

// ── OAuth URLs ───────────────────────────────────────────────────

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function getRedirectUri(reqUrl: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL
    ?? new URL(reqUrl).origin;
  return `${base}/api/calendar/callback`;
}

// ── Token Exchange & Refresh ─────────────────────────────────────

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description ?? data.error ?? "Token exchange failed");
  return data;
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description ?? data.error ?? "Token refresh failed");
  return data;
}

/**
 * Returns a valid access token, refreshing if it expires in < 5 minutes.
 * Returns { token, newExpiresAt } — newExpiresAt is set only if refreshed.
 */
export async function getValidToken(stored: GCalTokenData): Promise<{
  token: string;
  newExpiresAt?: string;
}> {
  const expiresAt = new Date(stored.expires_at).getTime();
  const soon = Date.now() + 5 * 60 * 1000;
  if (expiresAt > soon) return { token: stored.access_token };

  if (!stored.refresh_token) throw new Error("No refresh_token — please reconnect Google Calendar");
  const refreshed = await refreshAccessToken(stored.refresh_token);
  return {
    token: refreshed.access_token,
    newExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
  };
}

// ── Fetch Events ─────────────────────────────────────────────────

/**
 * Returns events for the current calendar week (Mon–Sun) in Chile time (UTC-4).
 */
export async function getWeekEvents(accessToken: string, calendarId = "primary"): Promise<CalendarEvent[]> {
  const nowChile = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const dow = nowChile.getUTCDay(); // 0=Sun
  const daysToMon = dow === 0 ? -6 : 1 - dow;

  const mon = new Date(nowChile);
  mon.setUTCDate(nowChile.getUTCDate() + daysToMon);
  mon.setUTCHours(0, 0, 0, 0);

  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);
  sun.setUTCHours(23, 59, 59, 999);

  // Convert Chile times back to UTC for the API call
  const timeMin = new Date(mon.getTime() + 4 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(sun.getTime() + 4 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "500",
  });

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Google Calendar fetch failed");
  return data.items ?? [];
}

// ── Cross-reference ──────────────────────────────────────────────

type PatientRef = { id: string; email: string; phone: string; full_name: string };

/**
 * Matches patients to calendar events by:
 *  1. Attendee email (exact, case-insensitive)
 *  2. Phone number found in event title or description
 */
export function matchPatientsWithEvents(
  patients: PatientRef[],
  events: CalendarEvent[],
): PatientCalendarStatus[] {
  // Build lookup structures from events
  const emailToEvent = new Map<string, { summary: string; start: string }>();
  const phoneToEvent = new Map<string, { summary: string; start: string }>();

  for (const ev of events) {
    const info = {
      summary: ev.summary ?? "Sesión",
      start: ev.start.dateTime ?? ev.start.date ?? "",
    };

    for (const att of ev.attendees ?? []) {
      const email = att.email.toLowerCase().trim();
      if (!emailToEvent.has(email)) emailToEvent.set(email, info);
    }

    // Also include organizer (relevant when the therapist is the organizer)
    if (ev.organizer?.email) {
      // skip organizer — it's usually the therapist themselves
    }

    // Extract phone numbers from title + description
    const text = `${ev.summary ?? ""} ${ev.description ?? ""}`;
    const phones = text.match(/\+?\d[\d\s\-().]{6,}/g) ?? [];
    for (const raw of phones) {
      const normalized = raw.replace(/[^\d+]/g, "");
      if (normalized.length >= 8 && !phoneToEvent.has(normalized)) {
        phoneToEvent.set(normalized, info);
      }
    }
  }

  return patients.map((patient) => {
    const email = patient.email.toLowerCase().trim();
    const phone = patient.phone.replace(/[^\d+]/g, "");

    // 1. Email match
    if (emailToEvent.has(email)) {
      const ev = emailToEvent.get(email)!;
      return { patient_id: patient.id, scheduled: true, event_summary: ev.summary, event_start: ev.start };
    }

    // 2. Phone match — try exact, then last 8 digits
    for (const [evPhone, ev] of phoneToEvent) {
      const tail = (s: string) => s.slice(-8);
      if (evPhone === phone || (phone.length >= 8 && tail(evPhone) === tail(phone))) {
        return { patient_id: patient.id, scheduled: true, event_summary: ev.summary, event_start: ev.start };
      }
    }

    return { patient_id: patient.id, scheduled: false };
  });
}
