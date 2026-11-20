/**
 * Enlazado interno contextual. Solo 7 de 99 artículos enlazaban a otros dentro del texto, y en
 * GSC 67 URLs figuran como "Descubierta: sin indexar" (Google nunca las rastreó) porque casi no
 * reciben enlaces internos. En lugar de editar 99 artículos en la base de datos, se enlaza al
 * renderizar: si en el texto aparece de forma natural el tema de otro artículo (derivado de su
 * slug, p. ej. "hipnosis para el duelo"), esa primera mención se convierte en enlace.
 *
 * Reglas: nunca se inventa texto (solo se envuelven frases que ya existen), máximo
 * MAX_LINKS por artículo, un enlace por destino, sin tocar encabezados, citas, tablas, código,
 * imágenes ni texto ya enlazado, y con separación mínima entre enlaces.
 */

export interface LinkablePost {
  slug: string;
  title: string;
  tags?: string[];
  content: string;
}

export interface AppliedLink {
  slug: string;
  anchor: string;
}

export const MAX_LINKS = 3;
const MIN_GAP = 400; // caracteres entre enlaces automáticos
const SKIP_IF_ALREADY_LINKED = 3; // si el artículo ya tiene estos enlaces internos, no se toca
/** Una frase que aparece en más de esta fracción de artículos es genérica: no sirve de ancla. */
const MAX_DOC_FREQUENCY = 0.2;

// Solo se quitan palabras de pregunta que no cambian el tema ("qué es X" -> "X"). Slugs como
// "cuanto-cuesta-una-regresion..." o "es-peligrosa-la-hipnosis..." NO se reducen: su ancla
// genérica ("regresión a vidas pasadas") apuntaría a una página que trata de otra cosa.
const LEADING = /^(que-es-la|que-es-el|que-es)-/;
const TRAILING = /-(que-es-y-como-sanarla|y-como-sanarla|que-es|como-sanarla|como-sanar|como-conectar)$/;

/** Minúsculas y sin tildes, carácter a carácter (conserva la longitud para mapear posiciones). */
function fold(s: string): string {
  let out = "";
  for (const ch of s) {
    const base = ch.normalize("NFD")[0] ?? ch;
    out += base.toLowerCase();
  }
  return out;
}

/** "hipnosis-para-el-duelo" -> ["hipnosis","para","el","duelo"]; null si queda demasiado genérico. */
export function anchorTokens(slug: string): string[] | null {
  const core = slug.replace(LEADING, "").replace(TRAILING, "");
  const tokens = core.split("-").filter(Boolean);
  if (tokens.length < 2 || tokens.length > 6) return null;
  return tokens;
}

const ARTICLES = new Set(["el", "la", "los", "las", "un", "una"]);

function anchorRegex(tokens: string[]): RegExp {
  // Los artículos son opcionales en ambos lados: "terapia para la ansiedad" == "terapia para ansiedad".
  const body = tokens
    .filter((t) => !ARTICLES.has(t))
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+(?:(?:el|la|los|las|un|una)\\s+)?");
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

export function countInternalLinks(content: string): number {
  return (content.match(/\]\((?:https?:\/\/(?:www\.)?juanpabloloaiza\.com)?\/blog\//g) ?? []).length;
}

// Frecuencia de documento de cada ancla, calculada una vez por conjunto de artículos.
let dfKey = "";
let dfCache = new Map<string, number>();

function genericSlugs(all: LinkablePost[]): Map<string, number> {
  const key = `${all.length}:${all.reduce((n, p) => n + p.content.length, 0)}`;
  if (key === dfKey) return dfCache;
  const folded = all.map((p) => fold(p.content));
  const df = new Map<string, number>();
  for (const t of all) {
    const tokens = anchorTokens(t.slug);
    if (!tokens) continue;
    const re = anchorRegex(tokens.map(fold));
    df.set(t.slug, folded.filter((c) => re.test(c)).length / all.length);
  }
  dfKey = key;
  dfCache = df;
  return df;
}

export function autoLinkContent(
  post: LinkablePost,
  all: LinkablePost[],
  maxLinks = MAX_LINKS,
): { content: string; links: AppliedLink[] } {
  if (countInternalLinks(post.content) >= SKIP_IF_ALREADY_LINKED) return { content: post.content, links: [] };
  const df = genericSlugs(all);

  const already = new Set(
    Array.from(post.content.matchAll(/\]\((?:https?:\/\/(?:www\.)?juanpabloloaiza\.com)?\/blog\/([^)#?\s]+)/g)).map((m) => m[1]),
  );
  const mine = new Set(post.tags ?? []);

  const targets = all
    .filter((t) => t.slug !== post.slug && !already.has(t.slug) && (df.get(t.slug) ?? 1) <= MAX_DOC_FREQUENCY)
    .map((t) => ({ t, tokens: anchorTokens(t.slug) }))
    .filter((x): x is { t: (typeof all)[number]; tokens: string[] } => x.tokens !== null)
    .map(({ t, tokens }) => ({
      slug: t.slug,
      re: anchorRegex(tokens.map(fold)),
      shared: (t.tags ?? []).filter((g) => mine.has(g)).length,
      len: tokens.join(" ").length,
    }))
    // Más etiquetas compartidas primero; a igualdad, la frase más específica (más larga).
    .sort((a, b) => b.shared - a.shared || b.len - a.len);

  const lines = post.content.split("\n");
  const used = new Set<string>();
  const links: AppliedLink[] = [];
  let inFence = false;
  const placedAt: number[] = [];

  // Una pasada por destino, en orden de prioridad, buscando su primera mención válida.
  for (const target of targets) {
    if (links.length >= maxLinks) break;
    if (used.has(target.slug)) continue;

    let pos = 0;
    inFence = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineStart = pos;
      pos += line.length + 1;

      if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue; }
      if (inFence || /^\s*(#{1,6}\s|>|\||!\[|<)/.test(line) || !line.trim()) continue;

      const folded = fold(line);
      const m = target.re.exec(folded);
      if (!m) continue;
      const start = m.index;
      const end = m.index + m[0].length;
      if (overlaps(start, end, maskedRanges(line))) continue;
      if (placedAt.some((p) => Math.abs(p - (lineStart + start)) < MIN_GAP)) continue;

      const anchor = line.slice(start, end);
      lines[i] = `${line.slice(0, start)}[${anchor}](/blog/${target.slug})${line.slice(end)}`;
      used.add(target.slug);
      links.push({ slug: target.slug, anchor });
      placedAt.push(lineStart + start);
      break;
    }
  }

  return { content: lines.join("\n"), links };
}
