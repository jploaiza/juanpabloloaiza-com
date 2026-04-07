"use client";
import { motion } from "framer-motion";

interface Props {
  value: number; // 0–100
  showLabel?: boolean;
  size?: "thin" | "normal" | "thick";
  className?: string;
}

const heights = { thin: "h-0.5", normal: "h-1.5", thick: "h-2.5" };

export default function ProgressBar({ value, showLabel, size = "normal", className = "" }: Props) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex-1 bg-[#0f172a] ${heights[size]} overflow-hidden`}>
        <motion.div
          className="h-full bg-gradient-to-r from-[#C5A059] to-[#F3E5AB]"
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      {showLabel && (
        <span className="text-[#C5A059] font-cinzel text-xs min-w-[3rem] text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
}
