"use client";

/**
 * Golden decorative dividers inspired by Hogwarts Legacy design
 */

interface GoldenDividerProps {
  variant?: "line" | "ornate" | "stars";
  className?: string;
}

export default function GoldenDivider({
  variant = "line",
  className = "",
}: GoldenDividerProps) {
  if (variant === "ornate") {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C5A059]/50 to-transparent"></div>
        <div className="w-2 h-2 bg-[#C5A059] rotate-45"></div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C5A059]/50 to-transparent"></div>
      </div>
    );
  }

  if (variant === "stars") {
    return (
      <div className={`flex items-center justify-center gap-3 ${className}`}>
        <div className="h-px flex-1 bg-[#C5A059]/20"></div>
        <span className="text-[#C5A059] text-sm">✦ ✦ ✦</span>
        <div className="h-px flex-1 bg-[#C5A059]/20"></div>
      </div>
    );
  }

  return <div className={`h-px bg-[#C5A059]/20 ${className}`}></div>;
}
