/**
 * Enlaces contextuales hacia el portal regresionvidaspasadas.com. Cuando un artículo del sitio
 * menciona de forma natural a un autor que el portal trata en profundidad (p. ej. "Brian Weiss"),
 * esa primera mención se convierte en enlace a su ficha. Es la misma técnica que internal-links.ts:
 * se aplica al renderizar, nunca se inventa texto (solo se envuelve una frase que ya existe) y no
 * se modifica la base de datos.
 *
 * Reglas: máximo MAX_PORTAL_LINKS por artículo, un enlace por destino, solo la primera mención,
 * sin tocar encabezados, citas, tablas, código, imágenes ni texto ya enlazado, y con separación
 * mínima entre enlaces.
 */

export const PORTAL_URL = "https://www.regresionvidaspasadas.com";
export const MAX_PORTAL_LINKS = 2;
const MIN_GAP = 400; // caracteres entre enlaces

interface PortalTarget {
  /** Frase tal como aparece en el texto (sin tildes ni mayúsculas). */
  phrase: string;
  /** Slug del artículo del portal. */
  slug: string;
}

// Orden = prioridad. Solo autores con ficha propia en el portal.
export const PORTAL_TARGETS: PortalTarget[] = [
  { phrase: "brian weiss", slug: "brian-weiss-quien-es" },
  { phrase: "michael newton", slug: "michael-newton-quien-es" },
  { phrase: "dolores cannon", slug: "dolores-cannon-quien-es" },
  { phrase: "ian stevenson", slug: "ian-stevenson-quien-es" },
];

export interface AppliedPortalLink {
  slug: string;
  anchor: string;
}

/** Minúsculas y sin tildes, carácter a carácter (conserva la longitud para mapear posiciones). */
function fold(s: string): string {
  let out = "";
  for (const ch of s) {
    const base = ch.normalize("NFD")[0] ?? ch;
    out += base.toLowerCase();
  }
  return out;
}

function phraseRegex(phrase: string): RegExp {
  const body = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(?<![a-z0-9])${body}(?![a-z0-9])`, "i");
}

/** Rangos de una línea que no se pueden enlazar: enlaces, URLs, código y HTML. */
function maskedRanges(line: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const re = /!?\[[^\]]*\]\([^)]*\)|`[^`]*`|<[^>]+>|https?:\/\/\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) ranges.push([m.index, m.index + m[0].length]);
  return ranges;
}

const overlaps = (a: number, b: number, ranges: Array<[number, number]>) =>
  ranges.some(([s, e]) => a < e && b > s);

export function autoLinkPortal(
  content: string,
  maxLinks = MAX_PORTAL_LINKS,
): { content: string; links: AppliedPortalLink[] } {
  // Si el artículo ya enlaza al portal a mano, no se añaden más.
  const existing = (content.match(/\]\(https?:\/\/(?:www\.)?regresionvidaspasadas\.com/g) ?? []).length;
  const budget = maxLinks - existing;
  if (budget <= 0) return { content, links: [] };

  const lines = content.split("\n");
  const links: AppliedPortalLink[] = [];
  const placedAt: number[] = [];

  for (const target of PORTAL_TARGETS) {
    if (links.length >= budget) break;
    const re = phraseRegex(target.phrase);

    let pos = 0;
    let inFence = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineStart = pos;
      pos += line.length + 1;

      if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue; }
      if (inFence || /^\s*(#{1,6}\s|>|\||!\[|<)/.test(line) || !line.trim()) continue;

      const m = re.exec(fold(line));
      if (!m) continue;
      const start = m.index;
      const end = m.index + m[0].length;
      if (overlaps(start, end, maskedRanges(line))) continue;
      if (placedAt.some((p) => Math.abs(p - (lineStart + start)) < MIN_GAP)) continue;

      const anchor = line.slice(start, end);
      lines[i] = `${line.slice(0, start)}[${anchor}](${PORTAL_URL}/blog/${target.slug}/)${line.slice(end)}`;
      links.push({ slug: target.slug, anchor });
      placedAt.push(lineStart + start);
      break;
    }
  }

  return { content: lines.join("\n"), links };
}
