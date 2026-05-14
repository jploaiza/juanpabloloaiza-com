/**
 * POST /api/admin/calendar/settings/test-zoom
 * Verifies Zoom Server-to-Server OAuth credentials by fetching an access token.
 */
import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { getCalendarConfig } from "@/lib/booking-config";

export async function POST() {
  const sb = await assertAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await getCalendarConfig();
  const creds = config.zoom_credentials;

  if (!creds?.account_id || !creds?.client_id || !creds?.client_secret) {
    return NextResponse.json({ ok: false, error: "Credenciales no configuradas" }, { status: 400 });
  }

  try {
    const basic = Buffer.from(`${creds.client_id}:${creds.client_secret}`).toString("base64");
    const res = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(creds.account_id)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({ ok: false, error: `Zoom respondió ${res.status}: ${body}` });
    }

    const data = await res.json() as { access_token?: string };
    if (!data.access_token) {
      return NextResponse.json({ ok: false, error: "No se recibió access_token" });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Error de conexión" });
  }
}
