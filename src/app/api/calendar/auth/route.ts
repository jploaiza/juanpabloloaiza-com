/**
 * GET /api/calendar/auth
 *
 * Inicia el flujo OAuth2 con Google Calendar.
 * Requiere admin autenticado.
 * Redirige al consentimiento de Google.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildGoogleAuthUrl, getRedirectUri } from "@/lib/google-calendar";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET no están configurados en .env.local" },
      { status: 500 },
    );
  }

  // CSRF state: encode csrf token + return URL
  const csrf = randomBytes(16).toString("hex");
  const returnTo = req.nextUrl.searchParams.get("returnTo") ?? "/admin/pacientes";
  const state = Buffer.from(JSON.stringify({ csrf, returnTo })).toString("base64url");

  const redirectUri = getRedirectUri(req.url);
  const authUrl = buildGoogleAuthUrl(redirectUri, state);

  const res = NextResponse.redirect(authUrl);
  // Store csrf in HttpOnly cookie (30 min expiry)
  res.cookies.set("gcal_oauth_csrf", csrf, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 60,
    path: "/",
  });

  return res;
}
