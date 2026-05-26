import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@uiw/react-md-editor", "@uiw/react-codemirror"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.juanpabloloaiza.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      // WordPress date-based post URLs → /blog/:slug
      {
        source: "/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug*",
        destination: "/blog/:slug",
        permanent: true,
      },
      // WordPress tag pages
      {
        source: "/tag/:slug*",
        destination: "/blog",
        permanent: true,
      },
      // WordPress category pages
      {
        source: "/category/:slug*",
        destination: "/blog",
        permanent: true,
      },
      // WordPress RSS feeds (any path ending in /feed or /feed/)
      {
        source: "/:slug*/feed",
        destination: "/blog",
        permanent: true,
      },
      // WordPress pagination (/slug/page/N or /slug/page/N/)
      {
        source: "/:slug*/page/:page(\\d+){/}?",
        destination: "/blog",
        permanent: true,
      },
      // WordPress template pages
      {
        source: "/template/:slug*",
        destination: "/blog",
        permanent: true,
      },
      // Old WordPress slugs at root (no date prefix) discovered in GSC
      {
        source: "/sanacion-karmica-liberandote-de-contratos-antiguos-para-vivir-en-plenitud",
        destination: "/blog/sanacion-karmica-liberandote-de-contratos-antiguos-para-vivir-en-plenitud",
        permanent: true,
      },
      {
        source: "/la-ciencia-detras-de-la-regresion-a-vidas-pasadas-explorando-evidencias-y-estudios",
        destination: "/blog/la-ciencia-detras-de-la-regresion-a-vidas-pasadas-explorando-evidencias-y-estudios",
        permanent: true,
      },
      {
        source: "/rompiendo-ciclos-de-adiccion-a-traves-de-la-sanacion-de-vidas-pasadas",
        destination: "/blog/rompiendo-ciclos-de-adiccion-a-traves-de-la-sanacion-de-vidas-pasadas",
        permanent: true,
      },
      {
        source: "/la-conexion-entre-miedos-actuales-y-vidas-pasadas-un-viaje-al-origen-de-tus-temores",
        destination: "/blog/la-conexion-entre-miedos-actuales-y-vidas-pasadas-un-viaje-al-origen-de-tus-temores",
        permanent: true,
      },
      {
        source: "/sanacion-de-traumas",
        destination: "/blog/sanacion-de-traumas",
        permanent: true,
      },
      {
        source: "/entendiendo-y-liberando-posesiones-espirituales-hacia-la-sanacion-y-la-libertad-del-ser",
        destination: "/blog/entendiendo-y-liberando-posesiones-espirituales-hacia-la-sanacion-y-la-libertad-del-ser",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://media.juanpabloloaiza.com https://res.cloudinary.com https://image.pollinations.ai https://images.pexels.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://api.deepseek.com https://image.pollinations.ai https://challenges.cloudflare.com https://ipapi.co",
              "font-src 'self' https://fonts.gstatic.com",
              "media-src 'self' https://media.juanpabloloaiza.com blob:",
              "frame-src https://challenges.cloudflare.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/(entrevista|agenda)(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "https://juanpabloloaiza.com" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/assets/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
