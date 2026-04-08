import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      {
        protocol: "https",
        hostname: "www.juanpabloloaiza.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
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
