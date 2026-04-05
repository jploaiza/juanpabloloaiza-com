"use client";

/**
 * Ornate decorative frame component for Hogwarts Legacy inspired luxury design
 * Creates elegant gold corner elements similar to Hogwarts Legacy website
 */

interface OrnateFrameProps {
  children: React.ReactNode;
  variant?: "heavy" | "light" | "delicate";
  className?: string;
}

export default function OrnateFrame({
  children,
  variant = "light",
  className = "",
}: OrnateFrameProps) {
  const cornerClasses = {
    heavy: "w-8 h-8 border-[3px] border-[#C5A059]",
    light: "w-6 h-6 border-2 border-[#C5A059]",
    delicate: "w-5 h-5 border border-[#C5A059]/70",
  };

  const selectedCorner = cornerClasses[variant];

  return (
    <div className={`relative ${className}`}>
      {/* Top-left corner */}
      <div className={`absolute top-0 left-0 ${selectedCorner} border-t border-l z-20`}></div>

      {/* Top-right corner */}
      <div className={`absolute top-0 right-0 ${selectedCorner} border-t border-r z-20`}></div>

      {/* Bottom-left corner */}
      <div className={`absolute bottom-0 left-0 ${selectedCorner} border-b border-l z-20`}></div>

      {/* Bottom-right corner */}
      <div className={`absolute bottom-0 right-0 ${selectedCorner} border-b border-r z-20`}></div>

      {/* Content */}
      {children}
    </div>
  );
}
