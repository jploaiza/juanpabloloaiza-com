interface FlagProps {
  /** Código ISO 3166-1 alfa-2 (cualquier capitalización). */
  code: string;
  className?: string;
}

/**
 * Bandera como SVG (public/assets/flags). Los emojis de bandera no se ven en Chrome/Edge
 * de Windows (aparecen como letras), por eso se usan imágenes.
 */
export default function Flag({ code, className = "w-6 h-4" }: FlagProps) {
  if (!/^[A-Za-z]{2}$/.test(code)) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/assets/flags/${code.toLowerCase()}.svg`}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={`inline-block object-cover rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.12)] shrink-0 ${className}`}
    />
  );
}
