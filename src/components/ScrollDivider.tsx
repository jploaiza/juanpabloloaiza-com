"use client";

/**
 * Ornamental gold scrollwork divider between sections.
 * Uses pure CSS/SVG so it renders instantly without image requests.
 */
export default function ScrollDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {/* Left scroll arm */}
      <svg width="120" height="20" viewBox="0 0 120 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M120 10 C100 10, 80 3, 60 10 C50 13, 35 16, 20 12 C12 10, 6 8, 2 10"
          stroke="#C5A059"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M118 10 C115 7, 112 5, 108 6 C104 7, 102 10, 105 13 C108 16, 113 15, 114 11"
          stroke="#C5A059"
          strokeWidth="0.8"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M20 12 C14 10, 8 8, 4 11 C1 13, 1 17, 4 18 C7 19, 10 16, 8 13"
          stroke="#C5A059"
          strokeWidth="0.8"
          fill="none"
          opacity="0.6"
        />
      </svg>

      {/* Central diamond jewel */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2 L20 12 L12 22 L4 12 Z" stroke="#C5A059" strokeWidth="1" fill="#C5A059" fillOpacity="0.15" />
        <path d="M12 5 L18 12 L12 19 L6 12 Z" stroke="#C5A059" strokeWidth="0.5" fill="#C5A059" fillOpacity="0.1" />
        <circle cx="12" cy="12" r="1.5" fill="#C5A059" opacity="0.8" />
      </svg>

      {/* Right scroll arm — mirrored */}
      <svg width="120" height="20" viewBox="0 0 120 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: "scaleX(-1)" }}>
        <path
          d="M120 10 C100 10, 80 3, 60 10 C50 13, 35 16, 20 12 C12 10, 6 8, 2 10"
          stroke="#C5A059"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M118 10 C115 7, 112 5, 108 6 C104 7, 102 10, 105 13 C108 16, 113 15, 114 11"
          stroke="#C5A059"
          strokeWidth="0.8"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M20 12 C14 10, 8 8, 4 11 C1 13, 1 17, 4 18 C7 19, 10 16, 8 13"
          stroke="#C5A059"
          strokeWidth="0.8"
          fill="none"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}
