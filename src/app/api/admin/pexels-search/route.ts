import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return NextResponse.json({ error: "PEXELS_API_KEY no configurada" }, { status: 500 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "Parámetro q requerido" }, { status: 400 });

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=15&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: key } });

  if (!res.ok) return NextResponse.json({ error: "Error al consultar Pexels" }, { status: 502 });

  const data = await res.json();
  const photos = (data.photos ?? []).map((p: {
    id: number;
    src: { large2x: string; large: string; medium: string };
    alt: string;
    photographer: string;
    photographer_url: string;
    url: string;
  }) => ({
    id: p.id,
    src: p.src.large2x || p.src.large,
    preview: p.src.medium,
    alt: p.alt,
    photographer: p.photographer,
    photographer_url: p.photographer_url,
    page_url: p.url,
  }));

  return NextResponse.json({ photos });
}
