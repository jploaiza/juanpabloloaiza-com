"use client";

import Image from "next/image";

interface HeraldFrameProps {
  children: React.ReactNode;
  variant?: "eagle" | "lion" | "mixed";
  size?: number;
  className?: string;
}

/**
 * Decorative heraldic corner ornaments.
 * variant="eagle"  → eagle/phoenix all corners
 * variant="lion"   → lion all corners
 * variant="mixed"  → eagle top, lion bottom (default)
 */
export default function HeraldFrame({
  children,
  variant = "mixed",
  size = 88,
  className = "",
}: HeraldFrameProps) {
  const eagle = "/assets/ornaments/corner-eagle.png";
  const lion = "/assets/ornaments/corner-lion.png";

  const topSrc    = variant === "lion" ? lion : eagle;
  const bottomSrc = variant === "eagle" ? eagle : lion;

  return (
    <div className={`relative ${className}`}>
      {/* Top-left */}
      <span className="absolute top-0 left-0 z-10 pointer-events-none block" style={{ width: size, height: size }}>
        <Image src={topSrc} alt="" fill className="object-contain" />
      </span>

      {/* Top-right — flipped horizontally */}
      <span className="absolute top-0 right-0 z-10 pointer-events-none block" style={{ width: size, height: size, transform: "scaleX(-1)" }}>
        <Image src={topSrc} alt="" fill className="object-contain" />
      </span>

      {/* Bottom-left — flipped vertically */}
      <span className="absolute bottom-0 left-0 z-10 pointer-events-none block" style={{ width: size, height: size, transform: "scaleY(-1)" }}>
        <Image src={bottomSrc} alt="" fill className="object-contain" />
      </span>

      {/* Bottom-right — flipped both axes */}
      <span className="absolute bottom-0 right-0 z-10 pointer-events-none block" style={{ width: size, height: size, transform: "scale(-1, -1)" }}>
        <Image src={bottomSrc} alt="" fill className="object-contain" />
      </span>

      {children}
    </div>
  );
}
