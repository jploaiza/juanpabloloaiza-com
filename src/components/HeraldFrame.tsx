interface HeraldFrameProps {
  children: React.ReactNode;
  size?: number;
  className?: string;
}

const CORNER = "/assets/ornaments/corner-scroll.png";

const CORNER_POSITIONS: React.CSSProperties[] = [
  { top: 0, left: 0 },
  { top: 0, right: 0, transform: "scaleX(-1)" },
  { bottom: 0, left: 0, transform: "scaleY(-1)" },
  { bottom: 0, right: 0, transform: "scale(-1, -1)" },
];

export default function HeraldFrame({
  children,
  size = 88,
  className = "",
}: HeraldFrameProps) {
  return (
    <div className={`relative ${className}`}>
      {CORNER_POSITIONS.map((position, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="absolute z-10 pointer-events-none block bg-contain bg-no-repeat"
          style={{
            width: size,
            height: size,
            backgroundImage: `url("${CORNER}")`,
            ...position,
          }}
        />
      ))}

      {children}
    </div>
  );
}
