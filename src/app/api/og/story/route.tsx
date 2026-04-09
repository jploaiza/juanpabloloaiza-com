import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

async function toDataUrl(url: string, timeoutMs = 6000): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const mime = res.headers.get("content-type") ?? "image/jpeg";
    return `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const title = searchParams.get("title") ?? "Juan Pablo Loaiza";
  const excerpt = searchParams.get("excerpt") ?? "";
  const imageUrl = searchParams.get("imageUrl") ?? "";
  const slug = searchParams.get("slug") ?? "";
  const siteUrl = slug ? `juanpabloloaiza.com/blog/${slug}` : "juanpabloloaiza.com";

  const truncatedTitle = title.length > 80 ? title.slice(0, 77) + "..." : title;
  const truncatedExcerpt = excerpt.length > 150 ? excerpt.slice(0, 147) + "..." : excerpt;

  // Fetch logo + background in parallel
  const [logoDataUrl, bgDataUrl] = await Promise.all([
    toDataUrl(`${origin}/assets/logo.webp`),
    imageUrl ? toDataUrl(imageUrl) : Promise.resolve(null),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1920px",
          display: "flex",
          flexDirection: "column",
          background: "#020617",
          position: "relative",
          overflow: "hidden",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* ── Background image — more presence ── */}
        {bgDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bgDataUrl}
            alt=""
            style={{
              position: "absolute",
              inset: "0",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.45,
            }}
          />
        )}

        {/* Gradient: dark top (logo readable) + dark bottom (text readable) */}
        <div
          style={{
            position: "absolute",
            inset: "0",
            background:
              "linear-gradient(to bottom, #020617ee 0%, #02061788 18%, transparent 40%, transparent 50%, #02061799 70%, #020617f5 88%)",
          }}
        />

        {/* Top gold line */}
        <div style={{ position: "absolute", top: "0", left: "0", right: "0", height: "6px", background: "#C5A059" }} />

        {/* Corner decorations */}
        {([
          { top: "50px", left: "50px", borderTop: "2px solid #C5A059", borderLeft: "2px solid #C5A059" },
          { top: "50px", right: "50px", borderTop: "2px solid #C5A059", borderRight: "2px solid #C5A059" },
          { bottom: "50px", left: "50px", borderBottom: "2px solid #C5A059", borderLeft: "2px solid #C5A059" },
          { bottom: "50px", right: "50px", borderBottom: "2px solid #C5A059", borderRight: "2px solid #C5A059" },
        ] as React.CSSProperties[]).map((s, i) => (
          <div key={i} style={{ position: "absolute", width: "48px", height: "48px", ...s }} />
        ))}

        {/* ── Logo — top center ── */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            paddingTop: "100px",
          }}
        >
          {logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoDataUrl}
              alt="Juan Pablo Loaiza"
              style={{ height: "180px", objectFit: "contain" }}
            />
          ) : (
            <span style={{ fontSize: "36px", color: "#C5A059", letterSpacing: "0.2em" }}>
              JUAN PABLO LOAIZA
            </span>
          )}
        </div>

        {/* ── Article info — bottom ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "100px 90px",
            position: "absolute",
            inset: "0",
          }}
        >
          {/* Label */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "44px" }}>
            <div style={{ width: "40px", height: "2px", background: "#C5A059", marginRight: "20px" }} />
            <span style={{ fontSize: "22px", color: "#C5A059", letterSpacing: "0.35em", textTransform: "uppercase" }}>
              Artículo
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: truncatedTitle.length > 60 ? "62px" : "74px",
              color: "#ffffff",
              lineHeight: 1.15,
              marginBottom: "44px",
              fontWeight: "bold",
            }}
          >
            {truncatedTitle}
          </div>

          {/* Excerpt */}
          {truncatedExcerpt && (
            <div
              style={{
                fontSize: "34px",
                color: "#d1d5db",
                lineHeight: 1.6,
                marginBottom: "72px",
              }}
            >
              {truncatedExcerpt}
            </div>
          )}

          {/* Divider */}
          <div style={{ width: "80px", height: "2px", background: "#C5A059", marginBottom: "48px", opacity: 0.7 }} />

          {/* URL */}
          <span style={{ fontSize: "24px", color: "#6b7280", letterSpacing: "0.1em" }}>
            {siteUrl}
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  );
}
