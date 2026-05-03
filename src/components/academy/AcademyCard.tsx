import ScrollworkCorners from "./ScrollworkCorners";

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
        relative bg-[#16213e] border overflow-hidden
        ${gold ? "border-[#C5A059]/40" : "border-white/5"}
        ${hover ? "hover:border-[#C5A059]/30 transition-colors duration-200 cursor-pointer" : ""}
        p-6
        ${className}
      `}
    >
      <ScrollworkCorners size={44} opacity={0.85} />
      {children}
    </div>
  );
}
