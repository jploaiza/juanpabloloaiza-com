"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import AcademyCard from "@/components/academy/AcademyCard";
import {
  ArrowLeft,
  FileText,
  Video,
  LayoutGrid,
  RefreshCw,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ArticleIdea {
  title: string;
  angle: string;
  keyPoints: string[];
  targetQuery: string;
  estimatedWords: number;
}

interface ReelIdea {
  title: string;
  hook: string;
  structure: string[];
  cta: string;
  angle: string;
}

interface CarouselSlide {
  number: number;
  headline: string;
  body: string;
}

interface CarouselIdea {
  title: string;
  slides: CarouselSlide[];
  caption: string;
}

interface FullArticle {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  imagePrompt: string;
}

interface TermIdeasData {
  keyword: string;
  geo: string;
  articleIdea: ArticleIdea | null;
  reelIdea: ReelIdea | null;
  carouselIdea: CarouselIdea | null;
  fullArticle: FullArticle | null;
}

const GEO_LABELS: Record<string, string> = {
  ES: "🇪🇸 España",
  US: "🇺🇸 EEUU",
  MX: "🇲🇽 México",
  CL: "🇨🇱 Chile",
  ALL: "🌎 LATAM",
};

function FormatBadge({ type }: { type: "article" | "reel" | "carousel" }) {
  const map = {
    article: {
      label: "Artículo SEO",
      color:
        "text-[#C5A059] bg-[#C5A059]/10 border-[#C5A059]/20",
    },
    reel: {
      label: "Reel / Short",
      color:
        "text-violet-400 bg-violet-500/10 border-violet-500/20",
    },
    carousel: {
      label: "Carrusel",
      color:
        "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
  };
  const { label, color } = map[type];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest border ${color}`}
    >
      {label}
    </span>
  );
}

function LoadingPulse() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-white/5 rounded w-3/4" />
      <div className="h-4 bg-white/5 rounded w-1/2" />
      <div className="h-4 bg-white/5 rounded w-2/3" />
    </div>
  );
}

export default function KeywordIdeasPanel({
  keyword,
  geo,
}: {
  keyword: string;
  geo: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<TermIdeasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articleExpanded, setArticleExpanded] = useState(false);

  const fetchIdeas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/term-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, geo }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al generar ideas"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [keyword, geo]); // eslint-disable-line

  const handleUseArticle = () => {
    if (!data?.fullArticle) return;
    const fa = data.fullArticle;
    const params = new URLSearchParams({
      from: "trend",
      keyword,
      geo,
      idea: "",
      prefillTitle: fa.title,
      prefillExcerpt: fa.excerpt,
      prefillContent: fa.content,
      prefillTags: fa.tags.join(","),
      prefillSeoTitle: fa.seoTitle,
      prefillSeoDesc: fa.seoDescription,
    });
    router.push(`/academy/admin/blog/nuevo?${params}`);
  };

  const handleCreateReel = () => {
    if (!data?.reelIdea) return;
    const params = new URLSearchParams({
      keyword,
      hook: data.reelIdea.hook,
      angle: data.reelIdea.angle,
    });
    router.push(`/academy/admin/blog/nuevo?${params}`);
  };

  return (
    <div className="min-h-screen bg-[#020617] p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Back + header */}
        <Link
          href="/academy/admin/trends"
          className="inline-flex items-center gap-2 font-cinzel text-[9px] uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition mb-8"
        >
          <ArrowLeft className="w-3 h-3" /> Volver a tendencias
        </Link>

        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">
              Ideas de contenido
            </p>
            <h1 className="font-cinzel text-2xl md:text-3xl text-white capitalize">
              {keyword}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500">
              {GEO_LABELS[geo] ?? geo}
            </span>
            {!loading && (
              <button
                onClick={fetchIdeas}
                className="flex items-center gap-1.5 px-3 py-1.5 font-cinzel text-[9px] uppercase tracking-widest text-gray-400 border border-white/10 hover:border-[#C5A059]/40 hover:text-[#C5A059] transition"
              >
                <RefreshCw className="w-3 h-3" /> Regenerar
              </button>
            )}
          </div>
        </div>

        <p className="font-crimson text-sm text-gray-600 mb-10">
          Generado con IA · 4 formatos de contenido basados en tendencias de búsqueda
        </p>

        {error && (
          <div className="bg-red-900/20 border border-red-500/20 p-4 mb-8 font-crimson text-sm text-red-400">
            {error} ·{" "}
            <button onClick={fetchIdeas} className="underline">
              Reintentar
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-20">
            <RefreshCw className="w-6 h-6 text-[#C5A059] animate-spin mx-auto mb-4" />
            <p className="font-cinzel text-[10px] uppercase tracking-widest text-gray-500">
              Generando ideas con IA — puede tomar 30–40 segundos
            </p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6">
            {/* Row 1: 3 idea cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Article idea */}
              <AcademyCard>
                <div className="relative h-full flex flex-col">
                  <ScrollworkCorners size={32} opacity={0.6} />
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-[#C5A059]" />
                    <FormatBadge type="article" />
                  </div>
                  {data.articleIdea ? (
                    <>
                      <h3 className="font-cinzel text-sm text-white mb-2 leading-snug">
                        {data.articleIdea.title}
                      </h3>
                      <p className="font-crimson text-sm text-gray-500 italic mb-3">
                        {data.articleIdea.angle}
                      </p>
                      <ul className="space-y-1 mb-4 flex-1">
                        {data.articleIdea.keyPoints.map((p, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 font-crimson text-xs text-gray-400"
                          >
                            <span className="text-[#C5A059] mt-0.5">·</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                      <p className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600 mb-4">
                        Query: {data.articleIdea.targetQuery}
                      </p>
                      <button
                        onClick={handleUseArticle}
                        disabled={!data.fullArticle}
                        className="flex items-center justify-center gap-1.5 w-full py-2 font-cinzel text-[9px] uppercase tracking-widest bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 hover:bg-[#C5A059]/20 transition disabled:opacity-40"
                      >
                        Usar artículo generado{" "}
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <LoadingPulse />
                  )}
                </div>
              </AcademyCard>

              {/* Reel idea */}
              <AcademyCard>
                <div className="relative h-full flex flex-col">
                  <ScrollworkCorners size={32} opacity={0.6} />
                  <div className="flex items-center gap-2 mb-4">
                    <Video className="w-4 h-4 text-violet-400" />
                    <FormatBadge type="reel" />
                  </div>
                  {data.reelIdea ? (
                    <>
                      <h3 className="font-cinzel text-sm text-white mb-2 leading-snug">
                        {data.reelIdea.title}
                      </h3>
                      <div className="bg-violet-500/5 border border-violet-500/10 p-3 mb-3">
                        <p className="font-cinzel text-[8px] uppercase tracking-widest text-violet-400 mb-1">
                          Hook (3 seg)
                        </p>
                        <p className="font-crimson text-sm text-gray-300 italic">
                          "{data.reelIdea.hook}"
                        </p>
                      </div>
                      <ul className="space-y-1 mb-4 flex-1">
                        {data.reelIdea.structure.map((s, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 font-crimson text-xs text-gray-400"
                          >
                            <span className="text-violet-400 mt-0.5">·</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                      <p className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600 mb-4">
                        CTA: {data.reelIdea.cta}
                      </p>
                      <button
                        onClick={handleCreateReel}
                        className="flex items-center justify-center gap-1.5 w-full py-2 font-cinzel text-[9px] uppercase tracking-widest bg-violet-500/10 text-violet-400 border border-violet-500/30 hover:bg-violet-500/20 transition"
                      >
                        Crear Reel <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <LoadingPulse />
                  )}
                </div>
              </AcademyCard>

              {/* Carousel idea */}
              <AcademyCard>
                <div className="relative h-full flex flex-col">
                  <ScrollworkCorners size={32} opacity={0.6} />
                  <div className="flex items-center gap-2 mb-4">
                    <LayoutGrid className="w-4 h-4 text-emerald-400" />
                    <FormatBadge type="carousel" />
                  </div>
                  {data.carouselIdea ? (
                    <>
                      <h3 className="font-cinzel text-sm text-white mb-3 leading-snug">
                        {data.carouselIdea.title}
                      </h3>
                      <div className="space-y-2 mb-4 flex-1">
                        {data.carouselIdea.slides.slice(0, 4).map((s) => (
                          <div key={s.number} className="flex gap-2">
                            <span className="font-cinzel text-[8px] text-emerald-400 w-5 shrink-0 pt-0.5">
                              #{s.number}
                            </span>
                            <div>
                              <p className="font-cinzel text-[9px] text-white mb-0.5">
                                {s.headline}
                              </p>
                              <p className="font-crimson text-xs text-gray-500">
                                {s.body}
                              </p>
                            </div>
                          </div>
                        ))}
                        {data.carouselIdea.slides.length > 4 && (
                          <p className="font-crimson text-xs text-gray-600 pl-7">
                            +{data.carouselIdea.slides.length - 4} slides más…
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard
                            .writeText(data.carouselIdea!.caption)
                            .catch(() => {});
                        }}
                        className="flex items-center justify-center gap-1.5 w-full py-2 font-cinzel text-[9px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition"
                      >
                        Copiar caption <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <LoadingPulse />
                  )}
                </div>
              </AcademyCard>
            </div>

            {/* Row 2: Full article preview */}
            {data.fullArticle && (
              <AcademyCard>
                <div className="relative">
                  <ScrollworkCorners size={36} opacity={0.7} />
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[#C5A059]" />
                      <span className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]">
                        Artículo completo generado
                      </span>
                    </div>
                    <button
                      onClick={() => setArticleExpanded((v) => !v)}
                      className="flex items-center gap-1 font-cinzel text-[9px] uppercase tracking-widest text-gray-500 hover:text-white transition"
                    >
                      {articleExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" /> Colapsar
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" /> Ver artículo
                        </>
                      )}
                    </button>
                  </div>

                  <h2 className="font-cinzel text-lg text-white mb-1">
                    {data.fullArticle.title}
                  </h2>
                  <p className="font-crimson text-sm text-gray-500 mb-4">
                    {data.fullArticle.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {data.fullArticle.tags.map((t) => (
                      <span
                        key={t}
                        className="font-cinzel text-[8px] uppercase tracking-widest text-gray-500 bg-white/5 px-2 py-0.5 border border-white/5"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs">
                    <div className="bg-white/[0.02] border border-white/5 p-3">
                      <p className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600 mb-1">
                        SEO Title
                      </p>
                      <p className="font-crimson text-gray-300">
                        {data.fullArticle.seoTitle}
                      </p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-3">
                      <p className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600 mb-1">
                        Meta Description
                      </p>
                      <p className="font-crimson text-gray-300">
                        {data.fullArticle.seoDescription}
                      </p>
                    </div>
                  </div>

                  {articleExpanded && (
                    <div className="bg-[#0a1628] border border-white/5 p-5 mb-4 font-crimson text-sm text-gray-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                      {data.fullArticle.content}
                    </div>
                  )}

                  <button
                    onClick={handleUseArticle}
                    className="flex items-center gap-2 px-5 py-2.5 font-cinzel text-[9px] uppercase tracking-widest bg-[#C5A059] text-[#020617] hover:bg-[#d4b06a] transition"
                  >
                    Abrir en editor de blog <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </AcademyCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
