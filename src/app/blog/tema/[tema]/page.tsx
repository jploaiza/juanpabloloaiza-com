import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAllPublishedPosts } from "@/lib/supabase/blog";
import { getPostsForTopic, getTopics } from "@/lib/blog-topics";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

type Params = { tema: string };

async function load(tema: string) {
  const all = await getAllPublishedPosts();
  const topics = getTopics(all);
  const topic = topics.find((t) => t.slug === tema);
  return { all, topics, topic, posts: topic ? getPostsForTopic(all, tema) : [] };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { tema } = await params;
  const { topic } = await load(tema);
  if (!topic) return { robots: { index: false, follow: false } };
  const title = `${capitalize(topic.name)}: ${topic.count} artículos | Juan Pablo Loaiza`;
  const description = `Guía y artículos sobre ${topic.name}: explicaciones claras, procesos y casos de la práctica de regresión a vidas pasadas e hipnosis terapéutica de Juan Pablo Loaiza.`;
  const url = `${SITE_URL}/blog/tema/${topic.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Juan Pablo Loaiza", locale: "es_ES", type: "website" },
  };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function TopicPage({ params }: { params: Promise<Params> }) {
  const { tema } = await params;
  const { topics, topic, posts } = await load(tema);
  if (!topic) notFound();

  const others = topics.filter((t) => t.slug !== topic.slug).slice(0, 12);
  const url = `${SITE_URL}/blog/tema/${topic.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: capitalize(topic.name),
    url,
    inLanguage: "es",
    isPartOf: { "@type": "Blog", name: "Blog — Juan Pablo Loaiza", url: `${SITE_URL}/blog` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/blog/${p.slug}`,
        name: p.title,
      })),
    },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: capitalize(topic.name), item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Header />
      <main className="min-h-screen bg-[#0a1628] pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav aria-label="Migas de pan" className="font-crimson text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-[#C5A059]">Inicio</Link> ·{" "}
            <Link href="/blog" className="hover:text-[#C5A059]">Blog</Link> · <span className="text-gray-400">{capitalize(topic.name)}</span>
          </nav>
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold font-cinzel">Tema</span>
          <h1 className="text-3xl sm:text-4xl text-white mt-3 mb-4 font-cinzel font-bold leading-tight">{capitalize(topic.name)}</h1>
          <p className="font-crimson text-lg text-gray-300 leading-relaxed mb-10">
            {topic.count} artículos sobre {topic.name} escritos por Juan Pablo Loaiza, terapeuta de regresión a vidas pasadas e hipnosis
            terapéutica. Empieza por el que más se parezca a lo que estás viviendo.
          </p>

          <ul className="space-y-4">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="group block bg-[#16213e] border border-[#C5A059]/10 hover:border-[#C5A059]/40 transition p-5"
                >
                  <h2 className="font-cinzel text-base text-white group-hover:text-[#C5A059] transition leading-snug mb-2">{p.title}</h2>
                  <p className="font-crimson text-gray-400 text-base leading-relaxed line-clamp-2">{p.excerpt}</p>
                  <span className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/70 mt-3 inline-block">
                    {p.readTime} de lectura
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {others.length > 0 && (
            <nav aria-label="Otros temas" className="mt-14 pt-8 border-t border-[#C5A059]/15">
              <h2 className="font-cinzel text-xs uppercase tracking-widest text-[#C5A059] mb-4">Otros temas</h2>
              <div className="flex flex-wrap gap-2">
                {others.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/blog/tema/${t.slug}`}
                    className="font-crimson text-sm text-gray-300 border border-[#C5A059]/25 px-3 py-1 hover:border-[#C5A059] hover:text-[#C5A059] transition"
                  >
                    {t.name} <span className="text-gray-500">({t.count})</span>
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
