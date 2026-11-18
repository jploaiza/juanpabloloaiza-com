/**
 * ScrollworkCorners
 * Decorative corner image placed at all 4 corners of the parent (must be `relative`).
 * Top-left is the original; the other three are flipped with CSS transforms.
 * Rendered as CSS backgrounds so decorative art is not exposed to image crawlers.
 */
const SRC = "https://media.juanpabloloaiza.com/images/esq-izq-decoracion.png";

interface Props {
  /** Side length in pixels. Default 48. */
  size?: number;
  /** Opacity 0–1. Default 1. */
  opacity?: number;
}

export default function ScrollworkCorners({ size = 48, opacity = 1 }: Props) {
  const base: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    pointerEvents: "none",
    userSelect: "none",
    opacity,
    backgroundImage: `url("${SRC}")`,
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
  };

  return (
    <>
      <span aria-hidden="true" style={{ ...base, top: 0, left: 0 }} />
      <span aria-hidden="true" style={{ ...base, top: 0, right: 0, transform: "scaleX(-1)" }} />
      <span aria-hidden="true" style={{ ...base, bottom: 0, left: 0, transform: "scaleY(-1)" }} />
      <span aria-hidden="true" style={{ ...base, bottom: 0, right: 0, transform: "scale(-1,-1)" }} />
    </>
  );
}
