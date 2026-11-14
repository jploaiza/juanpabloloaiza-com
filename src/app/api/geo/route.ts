import { NextRequest, NextResponse } from "next/server";
import { isValidTz } from "@/lib/tz";

export const dynamic = "force-dynamic";

/**
 * GET /api/geo
 * País y zona estimados por IP, solo como respaldo cuando el navegador no entrega
 * una zona horaria reconocible. Usa los encabezados que Vercel agrega en el borde;
 * no consulta servicios externos ni guarda nada.
 */
export function GET(req: NextRequest) {
  const country = req.headers.get("x-vercel-ip-country") ?? "";
  const tz = req.headers.get("x-vercel-ip-timezone") ?? "";
  return NextResponse.json(
    {
      country: /^[A-Z]{2}$/.test(country) ? country : null,
      tz: isValidTz(tz) ? tz : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
