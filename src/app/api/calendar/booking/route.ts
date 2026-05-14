/**
 * GET /api/calendar/booking?code=XXXXXXXX
 * Returns booking details for cancel/reschedule flows.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { getEventTypes } from "@/lib/booking-config";

export async function GET(req: NextRequest) {
  const ip = getIp(req.headers);
  if (!rateLimit(`cal-booking:${ip}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase() ?? "";
  if (!code || code.length < 6) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  const sb = createAdminClient();
  const { data } = await sb
    .from("bookings")
    .select("id, booking_code, type, date, time_slot, patient_name, patient_email, status, zoom_join_url, google_event_link")
    .eq("booking_code", code)
    .single();

  if (!data) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });

  // Attach cancellation/reschedule policy from event type (defaults to allow both)
  const eventTypes = await getEventTypes(false);
  const eventType = eventTypes.find((e) => e.slug === data.type);

  return NextResponse.json({
    booking: {
      ...data,
      allow_cancellation: eventType?.allow_cancellation ?? true,
      allow_reschedule: eventType?.allow_reschedule ?? true,
    },
  });
}
