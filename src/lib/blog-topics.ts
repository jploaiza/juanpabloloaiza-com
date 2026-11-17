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
 * Artículos relacionados por etiquetas compartidas. Las etiquetas raras pesan más que las
 * genéricas ("hipnoterapia" está en más de la mitad de los artículos), y a igual puntaje
 * gana el más reciente. Si no alcanzan, se completa con los más recientes.
 */
export function getRelatedPosts(post: BlogPost, all: BlogPost[], limit = 6): BlogPost[] {
  const freq = new Map<string, number>();
  for (const p of all) for (const t of new Set(p.tags ?? [])) freq.set(t, (freq.get(t) ?? 0) + 1);

  const mine = new Set(post.tags ?? []);
  const scored = all
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      let score = 0;
      for (const t of new Set(p.tags ?? [])) if (mine.has(t)) score += 1 / (freq.get(t) ?? 1);
      return { p, score };
    });

  scored.sort((a, b) => b.score - a.score || b.p.date.localeCompare(a.p.date));
  return scored.slice(0, limit).map((s) => s.p);
}
