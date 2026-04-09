import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Juan Pablo Loaiza";
  const excerpt = searchParams.get("excerpt") ?? "";
  const imageUrl = searchParams.get("imageUrl") ?? "";
  const slug = searchParams.get("slug") ?? "";
  const siteUrl = slug ? `juanpabloloaiza.com/blog/${slug}` : "juanpabloloaiza.com";

  const truncatedTitle = title.length > 80 ? title.slice(0, 77) + "..." : title;
  const truncatedExcerpt = excerpt.length > 160 ? excerpt.slice(0, 157) + "..." : excerpt;

  // Try fetching the background image, fail gracefully
  let bgDataUrl: string | null = null;
  if (imageUrl) {
    try {
      const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(5000) });
      if (imgRes.ok) {
        const buf = await imgRes.arrayBuffer();
        const mime = imgRes.headers.get("content-type") ?? "image/jpeg";
        bgDataUrl = `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
      }
    } catch {
      // continue without background image
    }
  }

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
        {/* Background image */}
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
              opacity: 0.2,
            }}
          />
        )}

        {/* Dark gradient overlay bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "1100px",
            background: "linear-gradient(to top, #020617 55%, #020617aa 80%, transparent)",
          }}
        />

        {/* Top gold line */}
        <div style={{ position: "absolute", top: "0", left: "0", right: "0", height: "6px", background: "#C5A059" }} />

        {/* Corner decorations */}
        {[
          { top: "50px", left: "50px", borderTop: "2px solid #C5A059", borderLeft: "2px solid #C5A059" },
          { top: "50px", right: "50px", borderTop: "2px solid #C5A059", borderRight: "2px solid #C5A059" },
          { bottom: "50px", left: "50px", borderBottom: "2px solid #C5A059", borderLeft: "2px solid #C5A059" },
          { bottom: "50px", right: "50px", borderBottom: "2px solid #C5A059", borderRight: "2px solid #C5A059" },
        ].map((style, i) => (
          <div key={i} style={{ position: "absolute", width: "48px", height: "48px", ...style }} />
        ))}

        {/* Content */}
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
          <div style={{ display: "flex", alignItems: "center", marginBottom: "48px" }}>
            <div style={{ width: "40px", height: "2px", background: "#C5A059", marginRight: "20px" }} />
            <span style={{ fontSize: "24px", color: "#C5A059", letterSpacing: "0.35em", textTransform: "uppercase", fontFamily: "Georgia, serif" }}>
              Artículo
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: truncatedTitle.length > 60 ? "64px" : "76px",
              color: "#ffffff",
              lineHeight: 1.15,
              marginBottom: "52px",
              fontFamily: "Georgia, serif",
              fontWeight: "bold",
            }}
          >
            {truncatedTitle}
          </div>

          {/* Excerpt */}
          {truncatedExcerpt && (
            <div
              style={{
                fontSize: "36px",
                color: "#9ca3af",
                lineHeight: 1.6,
                marginBottom: "80px",
                fontFamily: "Georgia, serif",
              }}
            >
              {truncatedExcerpt}
            </div>
          )}

          {/* Divider */}
          <div style={{ width: "80px", height: "2px", background: "#C5A059", marginBottom: "52px", opacity: 0.6 }} />

          {/* Author */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{ fontSize: "30px", color: "#C5A059", letterSpacing: "0.12em", fontFamily: "Georgia, serif" }}>
              Juan Pablo Loaiza
            </span>
            <span style={{ fontSize: "22px", color: "#4b5563", letterSpacing: "0.08em", fontFamily: "Georgia, serif" }}>
              {siteUrl}
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  );
}
