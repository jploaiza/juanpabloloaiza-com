/**
 * Zoom Server-to-Server OAuth integration.
 * Credentials can come from DB (zoom_credentials in calendar_config) or env vars as fallback.
 */

const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";

export interface ZoomCredentials {
  account_id: string;
  client_id: string;
  client_secret: string;
}

function resolveCredentials(creds?: ZoomCredentials | null): ZoomCredentials | null {
  if (creds?.account_id && creds?.client_id && creds?.client_secret) return creds;
  if (process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET) {
    return {
      account_id: process.env.ZOOM_ACCOUNT_ID,
      client_id: process.env.ZOOM_CLIENT_ID,
      client_secret: process.env.ZOOM_CLIENT_SECRET,
    };
  }
  return null;
}

function hasZoomCredentials(creds?: ZoomCredentials | null): boolean {
  return resolveCredentials(creds) !== null;
}

async function getZoomToken(creds?: ZoomCredentials | null): Promise<string> {
  const resolved = resolveCredentials(creds);
  if (!resolved) throw new Error("Zoom credentials not configured");
  const { account_id: accountId, client_id: clientId, client_secret: clientSecret } = resolved;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(
    `${ZOOM_TOKEN_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(accountId!)}`,
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

export interface ZoomMeetingSettings {
  host_video?: boolean;
  participant_video?: boolean;
  join_before_host?: boolean;
  mute_upon_entry?: boolean;
  waiting_room?: boolean;
  auto_recording?: string;
}

export interface CreateZoomMeetingOptions {
  topic: string;
  startIso: string;
  durationMin: number;
  timeZone: string;
  agenda?: string;
  settings?: ZoomMeetingSettings;
  credentials?: ZoomCredentials | null;
}

/**
 * Creates a scheduled Zoom meeting.
 * Returns null (does not throw) if no credentials are available.
 */
export async function createZoomMeeting(
  opts: CreateZoomMeetingOptions
): Promise<ZoomMeetingResult | null> {
  if (!hasZoomCredentials(opts.credentials)) return null;

  const token = await getZoomToken(opts.credentials);

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
        ...opts.settings,
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
export async function deleteZoomMeeting(meetingId: number, credentials?: ZoomCredentials | null): Promise<void> {
  if (!hasZoomCredentials(credentials) || !meetingId) return;

  try {
    const token = await getZoomToken(credentials);
    await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // Non-critical — log silently
  }
}
