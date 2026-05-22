/**
 * GET /api/event-types
 * Public — returns active event types for the booking widget.
 */
import { NextResponse } from "next/server";
import { getEventTypes } from "@/lib/booking-config";

export async function GET() {
  const types = await getEventTypes(true);
  const safeTypes = types.map(({ slug, duration_min, label, description }) => ({
    slug,
    duration_min,
    label,
    description,
  }));
  return NextResponse.json({ types: safeTypes }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
