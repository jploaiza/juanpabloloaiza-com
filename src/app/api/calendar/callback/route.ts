/**
 * GET /api/calendar/callback
 *
 * Maneja el retorno de Google OAuth2.
 * Intercambia el código por tokens y los guarda en Supabase.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, getRedirectUri } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  const returnFallback = "/admin/pacientes";

  // User denied access
  if (error) {
    return NextResponse.redirect(new URL(`${returnFallback}?gcal_error=${encodeURIComponent(error)}`, req.url));
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(new URL(`${returnFallback}?gcal_error=missing_params`, req.url));
  }

  // Verify CSRF state
  let returnTo = returnFallback;
  try {
    const decoded = JSON.parse(Buffer.from(stateParam, "base64url").toString());
    const storedCsrf = req.cookies.get("gcal_oauth_csrf")?.value;
    if (!storedCsrf || storedCsrf !== decoded.csrf) {
      return NextResponse.redirect(new URL(`${returnFallback}?gcal_error=state_mismatch`, req.url));
    }
    if (decoded.returnTo) returnTo = decoded.returnTo;
  } catch {
    return NextResponse.redirect(new URL(`${returnFallback}?gcal_error=invalid_state`, req.url));
  }

  // Verify admin session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL(`${returnFallback}?gcal_error=unauthenticated`, req.url));
  }

  // Exchange code for tokens
  const redirectUri = getRedirectUri(req.url);
  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code, redirectUri);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "exchange_failed";
    return NextResponse.redirect(new URL(`${returnTo}?gcal_error=${encodeURIComponent(msg)}`, req.url));
  }

  // Upsert tokens in Supabase
  const adminSb = await createAdminClient();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const { error: dbErr } = await adminSb
    .from("google_calendar_tokens")
    .upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
        calendar_id: "primary",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (dbErr) {
    return NextResponse.redirect(new URL(`${returnTo}?gcal_error=${encodeURIComponent(dbErr.message)}`, req.url));
  }

  // Clear CSRF cookie and redirect
  const res = NextResponse.redirect(new URL(`${returnTo}?gcal_connected=1`, req.url));
  res.cookies.delete("gcal_oauth_csrf");
  return res;
}
