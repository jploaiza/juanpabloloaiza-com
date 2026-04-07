interface Props {
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
  hover?: boolean;
}

export default function AcademyCard({ children, className = "", gold, hover }: Props) {
  return (
    <div
      className={`
        relative bg-[#0a1628] border
        ${gold ? "border-[#C5A059]/40" : "border-white/5"}
        ${hover ? "hover:border-[#C5A059]/30 transition-colors duration-200 cursor-pointer" : ""}
        p-6
        ${className}
      `}
    >
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#C5A059]/50" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#C5A059]/50" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#C5A059]/50" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#C5A059]/50" />
      {children}
    </div>
  );
}
