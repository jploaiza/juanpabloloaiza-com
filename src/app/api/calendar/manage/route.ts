/**
 * POST /api/calendar/manage
 * Body: { code: string, action: "cancel" }
 * Cancels a booking: deletes Google Calendar event, deletes Zoom meeting,
 * marks booking as cancelled.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { getValidToken, deleteCalendarEvent, type GCalTokenData } from "@/lib/google-calendar";
import { deleteZoomMeeting } from "@/lib/zoom";

export async function POST(req: NextRequest) {
  const ip = getIp(req.headers);
  if (!rateLimit(`cal-manage:${ip}`, 10, 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  let body: { code?: string; action?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const { code, action } = body;
  if (!code?.trim() || action !== "cancel") {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const sb = createAdminClient();

  // Fetch booking
  const { data: booking } = await sb
    .from("bookings")
    .select("id, status, google_event_id, zoom_meeting_id")
    .eq("booking_code", code.trim().toUpperCase())
    .single();

  if (!booking) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  if (booking.status === "cancelled") return NextResponse.json({ error: "Esta reserva ya fue cancelada" }, { status: 409 });

  // Delete Google Calendar event
  try {
    const { data: stored } = await sb
      .from("google_calendar_tokens")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (stored && booking.google_event_id) {
      const { token, newExpiresAt } = await getValidToken(stored as GCalTokenData);
      if (newExpiresAt) {
        await sb
          .from("google_calendar_tokens")
          .update({ access_token: token, expires_at: newExpiresAt, updated_at: new Date().toISOString() })
          .eq("user_id", stored.user_id);
      }
      await deleteCalendarEvent(token, stored.calendar_id ?? "primary", booking.google_event_id);
    }
  } catch {
    // Non-critical — continue with cancellation
  }

  // Delete Zoom meeting
  if (booking.zoom_meeting_id) {
    await deleteZoomMeeting(Number(booking.zoom_meeting_id));
  }

  // Mark as cancelled
  await sb.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);

  return NextResponse.json({ ok: true });
}
