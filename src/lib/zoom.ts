/**
 * Zoom Server-to-Server OAuth integration.
 * Requires env vars: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
 */

const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";

function hasZoomCredentials(): boolean {
  return !!(
    process.env.ZOOM_ACCOUNT_ID &&
    process.env.ZOOM_CLIENT_ID &&
    process.env.ZOOM_CLIENT_SECRET
  );
}

async function getZoomToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID!;
  const clientId = process.env.ZOOM_CLIENT_ID!;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET!;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(
    `${ZOOM_TOKEN_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      signal: AbortSignal.timeout(8000),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom OAuth error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export interface ZoomMeetingResult {
  id: number;
  join_url: string;
  start_url: string;
  password: string;
}

export interface CreateZoomMeetingOptions {
  topic: string;
  startIso: string;
  durationMin: number;
  timeZone: string;
  agenda?: string;
}

/**
 * Creates a scheduled Zoom meeting.
 * Returns null (does not throw) if ZOOM env vars are not set.
 */
export async function createZoomMeeting(
  opts: CreateZoomMeetingOptions
): Promise<ZoomMeetingResult | null> {
  if (!hasZoomCredentials()) return null;

  const token = await getZoomToken();

  const res = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: opts.topic,
      type: 2, // Scheduled
      start_time: opts.startIso,
      duration: opts.durationMin,
      timezone: opts.timeZone,
      agenda: opts.agenda ?? "",
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        auto_recording: "none",
      },
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom meeting creation failed ${res.status}: ${body}`);
  }

  return res.json() as Promise<ZoomMeetingResult>;
}

/**
 * Deletes a Zoom meeting. Silent if not found or no credentials.
 */
export async function deleteZoomMeeting(meetingId: number): Promise<void> {
  if (!hasZoomCredentials() || !meetingId) return;

  try {
    const token = await getZoomToken();
    await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // Non-critical — log silently
  }
}
