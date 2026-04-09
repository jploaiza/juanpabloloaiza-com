import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Juan Pablo Loaiza";
  const excerpt = searchParams.get("excerpt") ?? "";
  const imageUrl = searchParams.get("imageUrl") ?? "";
  const slug = searchParams.get("slug") ?? "";
  const url = slug ? `juanpabloloaiza.com/blog/${slug}` : "juanpabloloaiza.com";

  // Fetch fonts from Google Fonts
  const [cinzelFont, crimsonFont] = await Promise.all([
    fetch("https://fonts.gstatic.com/s/cinzel/v23/8vIU7ww63mVu7gtR-kwKxNvkNOjw-tbnTYrvDE5ZdqU.woff").then((r) => r.arrayBuffer()),
    fetch("https://fonts.gstatic.com/s/crimsonpro/v24/q5uUsoa5M_tv7IihmnkabC5XiXCAlXGks1WZTm18OJE.woff").then((r) => r.arrayBuffer()),
  ]).catch(() => [null, null]);

  type FontDef = { name: string; data: ArrayBuffer; style: "normal"; weight: 400 };
  const fonts: FontDef[] = [];
  if (cinzelFont) fonts.push({ name: "Cinzel", data: cinzelFont, style: "normal", weight: 400 });
  if (crimsonFont) fonts.push({ name: "Crimson", data: crimsonFont, style: "normal", weight: 400 });

  const truncatedTitle = title.length > 80 ? title.slice(0, 77) + "..." : title;
  const truncatedExcerpt = excerpt.length > 160 ? excerpt.slice(0, 157) + "..." : excerpt;

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
        }}
      >
        {/* Background image with overlay */}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.18,
            }}
          />
        )}

        {/* Gradient overlay bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "900px",
            background: "linear-gradient(to top, #020617 60%, transparent)",
          }}
        />

        {/* Gold top border */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "#C5A059" }} />

        {/* Corner decorations */}
        <div style={{ position: "absolute", top: "48px", left: "48px", width: "40px", height: "40px", borderTop: "2px solid #C5A059", borderLeft: "2px solid #C5A059" }} />
        <div style={{ position: "absolute", top: "48px", right: "48px", width: "40px", height: "40px", borderTop: "2px solid #C5A059", borderRight: "2px solid #C5A059" }} />
        <div style={{ position: "absolute", bottom: "48px", left: "48px", width: "40px", height: "40px", borderBottom: "2px solid #C5A059", borderLeft: "2px solid #C5A059" }} />
        <div style={{ position: "absolute", bottom: "48px", right: "48px", width: "40px", height: "40px", borderBottom: "2px solid #C5A059", borderRight: "2px solid #C5A059" }} />

        {/* Content wrapper */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "120px 80px 100px", justifyContent: "flex-end", position: "relative" }}>

          {/* Label */}
          <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "40px",
          }}>
            <div style={{ width: "32px", height: "1px", background: "#C5A059", marginRight: "16px" }} />
            <span style={{ fontFamily: "Cinzel, serif", fontSize: "22px", color: "#C5A059", letterSpacing: "0.3em", textTransform: "uppercase" }}>
              Artículo
            </span>
          </div>

          {/* Title */}
          <div style={{
            fontFamily: "Cinzel, serif",
            fontSize: truncatedTitle.length > 50 ? "62px" : "74px",
            color: "#ffffff",
            lineHeight: 1.15,
            marginBottom: "48px",
            letterSpacing: "-0.01em",
          }}>
            {truncatedTitle}
          </div>

          {/* Excerpt */}
          {truncatedExcerpt && (
            <div style={{
              fontFamily: "Crimson, Georgia, serif",
              fontSize: "38px",
              color: "#9ca3af",
              lineHeight: 1.5,
              marginBottom: "80px",
            }}>
              {truncatedExcerpt}
            </div>
          )}

          {/* Divider */}
          <div style={{ width: "80px", height: "1px", background: "#C5A059", marginBottom: "48px", opacity: 0.5 }} />

          {/* Author + URL */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontFamily: "Cinzel, serif", fontSize: "28px", color: "#C5A059", letterSpacing: "0.15em" }}>
              Juan Pablo Loaiza
            </span>
            <span style={{ fontFamily: "Cinzel, serif", fontSize: "22px", color: "#4b5563", letterSpacing: "0.1em" }}>
              {url}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts,
    }
  );
}
