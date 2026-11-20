import type { BlogPost } from "@/lib/blog-data";

/** Mínimo de artículos para que una etiqueta tenga página de tema propia (evita páginas delgadas). */
export const MIN_POSTS_PER_TOPIC = 3;

/**
 * Mínimo para que la página de tema se indexe y entre al sitemap. Con 3 o 4 artículos la página
 * es casi un listado delgado: sigue existiendo y enlazando (noindex, follow) pero no compite ni
 * gasta rastreo, que en este sitio es de ~15 solicitudes al día.
 */
export const MIN_POSTS_TO_INDEX = 5;

export interface Topic {
  slug: string;
  name: string;
  count: number;
}

/** "Regresión a vidas pasadas" -> "regresion-a-vidas-pasadas" */
export function topicSlug(tag: string): string {
  return tag
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Etiquetas con suficientes artículos, de más a menos frecuentes. */
export function getTopics(posts: BlogPost[]): Topic[] {
  const byslug = new Map<string, Topic>();
  for (const p of posts) {
    for (const tag of new Set(p.tags ?? [])) {
      const slug = topicSlug(tag);
      if (!slug) continue;
      const t = byslug.get(slug);
      if (t) t.count++;
      else byslug.set(slug, { slug, name: tag, count: 1 });
    }
  }
  return Array.from(byslug.values())
    .filter((t) => t.count >= MIN_POSTS_PER_TOPIC)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"));
}

export function getPostsForTopic(posts: BlogPost[], slug: string): BlogPost[] {
  return posts.filter((p) => (p.tags ?? []).some((t) => topicSlug(t) === slug));
}

/**
 * Artículos relacionados por etiquetas compartidas, repartidos de forma global. Las etiquetas
 * raras pesan más que las genéricas ("hipnoterapia" está en más de la mitad de los artículos).
 * Antes cada artículo elegía por separado los 6 mejores, y unos pocos recibían 40-60 enlaces
 * mientras que 13 no recibían ninguno (justo los que Google nunca llegó a rastrear). Ahora los
 * enlaces se asignan en rondas penalizando a los destinos que ya reciben muchos, de modo que
 * todos los artículos reciben enlaces entrantes sin perder la afinidad temática.
 */
const BALANCE_POWER = 1.5;
const SCORE_FLOOR = 0.02;

let relatedKey = "";
let relatedCache = new Map<string, BlogPost[]>();

function buildRelatedPlan(all: BlogPost[], limit: number): Map<string, BlogPost[]> {
  const freq = new Map<string, number>();
  for (const p of all) for (const t of new Set(p.tags ?? [])) freq.set(t, (freq.get(t) ?? 0) + 1);

  const score = (a: BlogPost, b: BlogPost) => {
    const mine = new Set(a.tags ?? []);
    let s = 0;
    for (const t of new Set(b.tags ?? [])) if (mine.has(t)) s += 1 / (freq.get(t) ?? 1);
    return s;
  };

  const chosen = new Map<string, BlogPost[]>(all.map((p) => [p.slug, []]));
  const inbound = new Map<string, number>(all.map((p) => [p.slug, 0]));
  const rounds = Math.min(limit, Math.max(0, all.length - 1));

  for (let round = 0; round < rounds; round++) {
    // Se alterna el orden de recorrido para que ningún artículo elija siempre primero.
    const order = round % 2 === 0 ? all : [...all].reverse();
    for (const post of order) {
      const mine = chosen.get(post.slug)!;
      let best: BlogPost | null = null;
      let bestValue = -1;
      for (const c of all) {
        if (c.slug === post.slug || mine.includes(c)) continue;
        const value = (score(post, c) + SCORE_FLOOR) / Math.pow(1 + (inbound.get(c.slug) ?? 0), BALANCE_POWER);
        if (value > bestValue || (value === bestValue && best && c.date.localeCompare(best.date) > 0)) {
          best = c;
          bestValue = value;
        }
      }
      if (best) {
        mine.push(best);
        inbound.set(best.slug, (inbound.get(best.slug) ?? 0) + 1);
      }
    }
  }

  // Dentro de cada artículo, los más afines primero.
  for (const post of all) chosen.get(post.slug)!.sort((a, b) => score(post, b) - score(post, a) || b.date.localeCompare(a.date));
  return chosen;
}

export function getRelatedPosts(post: BlogPost, all: BlogPost[], limit = 6): BlogPost[] {
  const key = `${limit}|${all.map((p) => `${p.slug}:${(p.tags ?? []).join(",")}`).join(";")}`;
  if (key !== relatedKey) {
    relatedCache = buildRelatedPlan(all, limit);
    relatedKey = key;
  }
  return relatedCache.get(post.slug) ?? [];
}
