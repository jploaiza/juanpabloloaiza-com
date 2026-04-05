"use client";

import Image from "next/image";

interface HeraldFrameProps {
  children: React.ReactNode;
  size?: number;
  className?: string;
}

const CORNER = "/assets/ornaments/corner-scroll.png";

export default function HeraldFrame({
  children,
  size = 88,
  className = "",
}: HeraldFrameProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Top-left — original */}
      <span className="absolute top-0 left-0 z-10 pointer-events-none block" style={{ width: size, height: size }}>
        <Image src={CORNER} alt="" fill className="object-contain" />
      </span>

      {/* Top-right — mirrored horizontally */}
      <span className="absolute top-0 right-0 z-10 pointer-events-none block" style={{ width: size, height: size, transform: "scaleX(-1)" }}>
        <Image src={CORNER} alt="" fill className="object-contain" />
      </span>

      {/* Bottom-left — mirrored vertically */}
      <span className="absolute bottom-0 left-0 z-10 pointer-events-none block" style={{ width: size, height: size, transform: "scaleY(-1)" }}>
        <Image src={CORNER} alt="" fill className="object-contain" />
      </span>

      {/* Bottom-right — mirrored both axes */}
      <span className="absolute bottom-0 right-0 z-10 pointer-events-none block" style={{ width: size, height: size, transform: "scale(-1, -1)" }}>
        <Image src={CORNER} alt="" fill className="object-contain" />
      </span>

      {children}
    </div>
  );
}
