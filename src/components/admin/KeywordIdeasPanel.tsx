"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import AcademyCard from "@/components/academy/AcademyCard";
import { ArrowLeft, FileText, Video, LayoutGrid, RefreshCw, ChevronLeft, Sparkles, ChevronDown, ChevronUp, ArrowUpRight, Bookmark } from "lucide-react";

interface Angle { id: string; title: string; perspective: string; hook: string; formats: string[]; targetAudience: string; }
interface AnglesData { termContext: string; angles: Angle[]; }

interface Props {
  keyword: string;
  geo: string;
  initialAngle?: Angle | null;
}
interface DevelopData {
  articleIdea: { title: string; angle: string; keyPoints: string[]; targetQuery: string } | null;
  reelIdea: { title: string; hook: string; structure: string[]; cta: string; angle: string } | null;
  carouselIdea: { title: string; slides: { number: number; headline: string; body: string }[]; caption: string } | null;
  fullArticle: { title: string; excerpt: string; content: string; tags: string[]; seoTitle: string; seoDescription: string; imagePrompt?: string } | null;
}

const GEO_LABELS: Record<string, string> = { ES: "🇪🇸 España", US: "🇺🇸 EEUU", MX: "🇲🇽 México", CL: "🇨🇱 Chile", ALL: "🌎 LATAM" };

function FormatBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string }> = {
    article: { label: "Artículo", color: "text-[#C5A059] bg-[#C5A059]/10 border-[#C5A059]/20" },
    reel:    { label: "Reel",     color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    carousel:{ label: "Carrusel", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  };
  const { label, color } = map[type] ?? { label: type, color: "text-gray-400 bg-white/5 border-white/10" };
  return <span className={`inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest border ${color}`}>{label}</span>;
}

function CenteredLoader({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-4">
      <RefreshCw className="w-7 h-7 text-[#C5A059] animate-spin" />
      <p className="font-cinzel text-[10px] uppercase tracking-widest text-gray-500">{message}</p>
    </div>
  );
}

export default function KeywordIdeasPanel({ keyword, geo, initialAngle }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"angles" | "developing" | "results">("angles");
  const [selectedAngle, setSelectedAngle] = useState<Angle | null>(null);
  const [anglesData, setAnglesData] = useState<AnglesData | null>(null);
  const [developData, setDevelopData] = useState<DevelopData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [articleExpanded, setArticleExpanded] = useState(false);
  const [savingAngle, setSavingAngle] = useState<string | null>(null);
  const [savedAngles, setSavedAngles] = useState<Set<string>>(new Set());

  const fetchAngles = async () => {
    setLoading(true); setError(null); setAnglesData(null); setStep("angles");
    try {
      const res = await fetch("/api/admin/ai/term-ideas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword, geo, action: "angles" }) });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setAnglesData(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Error al analizar el término"); }
    finally { setLoading(false); }
  };

  const fetchDevelop = useCallback(async (angle: Angle) => {
    setStep("developing");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/term-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, geo, action: "develop", selectedAngle: angle }),
      });
      if (!res.ok) throw new Error("Error al desarrollar el ángulo");
      const json = await res.json();
      setDevelopData(json);
      setStep("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setStep("angles");
    } finally {
      setLoading(false);
    }
  }, [keyword, geo]);

  useEffect(() => {
    if (initialAngle) {
      setSelectedAngle(initialAngle);
      fetchDevelop(initialAngle);
    } else {
      fetchAngles();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDevelop = async (angle: Angle) => {
    setSelectedAngle(angle);
    setDevelopData(null);
    await fetchDevelop(angle);
  };

  const handleSaveAngle = async (angle: Angle) => {
    setSavingAngle(angle.id);
    try {
      await fetch("/api/admin/trends/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "angle",
          keyword,
          geo,
          title: angle.title,
          data: angle,
        }),
      });
      setSavedAngles((prev) => new Set([...prev, angle.id]));
    } catch { /* ignore */ }
    setSavingAngle(null);
  };

  const handleBackToAngles = () => { setStep("angles"); setSelectedAngle(null); setDevelopData(null); setError(null); };

  const handleUseArticle = () => {
    if (!developData?.fullArticle) return;
    const fa = developData.fullArticle;
    router.push(`/academy/admin/blog/nuevo?${new URLSearchParams({ from: "trend", keyword, geo, idea: "", prefillTitle: fa.title, prefillExcerpt: fa.excerpt, prefillContent: fa.content, prefillTags: fa.tags.join(","), prefillSeoTitle: fa.seoTitle, prefillSeoDesc: fa.seoDescription })}`);
  };

  return (
    <div className="min-h-screen bg-[#020617] p-6 md:p-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <Link href="/academy/admin/trends" className="inline-flex items-center gap-2 font-cinzel text-[9px] uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition mb-4">
              <ArrowLeft className="w-3 h-3" /> Volver a tendencias
            </Link>
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Ideas de contenido</p>
            <h1 className="font-cinzel text-2xl md:text-3xl text-white capitalize">{keyword}</h1>
          </div>
          <div className="flex items-center gap-3 pt-8">
            <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500">{GEO_LABELS[geo] ?? geo}</span>
            {!loading && step === "angles" && (
              <button onClick={fetchAngles} className="flex items-center gap-1.5 px-3 py-1.5 font-cinzel text-[9px] uppercase tracking-widest text-gray-400 border border-white/10 hover:border-[#C5A059]/40 hover:text-[#C5A059] transition">
                <RefreshCw className="w-3 h-3" /> Regenerar
              </button>
            )}
          </div>
        </div>

        <p className="font-crimson text-sm text-gray-600 mb-10">Generado con IA · Elige un ángulo para desarrollar el contenido completo</p>

        {error && (
          <div className="bg-red-900/20 border border-red-500/20 p-4 mb-8 font-crimson text-sm text-red-400">
            {error} · <button onClick={fetchAngles} className="underline">Reintentar</button>
          </div>
        )}

        {/* Step 1 — loading */}
        {step === "angles" && loading && <CenteredLoader message="Analizando el término…" />}

        {/* Step 1 — angles selection */}
        {step === "angles" && !loading && anglesData && (
          <div className="space-y-5">
            <div className="border-l-2 border-[#C5A059]/50 pl-4 py-2 bg-[#C5A059]/5">
              <p className="font-cinzel text-[8px] uppercase tracking-widest text-[#C5A059]/70 mb-1">Contexto del término</p>
              <p className="font-crimson text-sm text-gray-400 leading-relaxed">{anglesData.termContext}</p>
            </div>
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 pt-2">Elige un ángulo para desarrollar</p>
            {anglesData.angles.map((angle) => (
              <div key={angle.id} className="bg-[#16213e] border border-[#C5A059]/10 p-6 hover:border-[#C5A059]/25 transition">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <h2 className="font-cinzel text-base text-[#C5A059] leading-snug flex-1">{angle.title}</h2>
                  <span className="font-cinzel text-[8px] uppercase tracking-widest text-gray-500 bg-white/5 border border-white/10 px-2 py-1 whitespace-nowrap">{angle.targetAudience}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">{angle.formats.map((f) => <FormatBadge key={f} type={f} />)}</div>
                <p className="font-crimson text-sm text-gray-300 leading-relaxed mb-3">{angle.perspective}</p>
                <p className="font-crimson text-sm text-gray-500 italic mb-5">"{angle.hook}"</p>
                <button onClick={() => handleDevelop(angle)} className="w-full flex items-center justify-center gap-2 py-2.5 font-cinzel text-[9px] uppercase tracking-widest bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/20 transition">
                  <Sparkles className="w-3 h-3" /> Desarrollar esta idea →
                </button>
                <button
                  onClick={() => handleSaveAngle(angle)}
                  disabled={savingAngle === angle.id}
                  className="flex items-center gap-1.5 w-full justify-center px-4 py-2 font-cinzel text-[9px] uppercase tracking-widest text-gray-500 border border-white/10 hover:border-[#C5A059]/30 hover:text-[#C5A059] transition disabled:opacity-40 mt-2"
                >
                  <Bookmark className="w-3 h-3" />
                  {savedAngles.has(angle.id) ? "Guardada ✓" : savingAngle === angle.id ? "Guardando…" : "Guardar para después"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Step 2 — loading development */}
        {step === "developing" && loading && <CenteredLoader message="Generando contenido completo… (~30 segundos)" />}

        {/* Step 3 — results */}
        {step === "results" && !loading && developData && (
          <div className="space-y-6">
            <button onClick={handleBackToAngles} className="inline-flex items-center gap-2 font-cinzel text-[9px] uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition">
              <ChevronLeft className="w-3 h-3" /> Volver a ángulos
            </button>

            {selectedAngle && (
              <div className="border-l-2 border-[#C5A059]/40 pl-4 py-1">
                <p className="font-cinzel text-[8px] uppercase tracking-widest text-[#C5A059]/60 mb-0.5">Ángulo seleccionado</p>
                <p className="font-cinzel text-sm text-white">{selectedAngle.title}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Article idea */}
              <AcademyCard>
                <div className="relative h-full flex flex-col">
                  <ScrollworkCorners size={32} opacity={0.6} />
                  <div className="flex items-center gap-2 mb-4"><FileText className="w-4 h-4 text-[#C5A059]" /><FormatBadge type="article" /></div>
                  {developData.articleIdea ? (
                    <>
                      <h3 className="font-cinzel text-sm text-white mb-2 leading-snug">{developData.articleIdea.title}</h3>
                      <p className="font-crimson text-sm text-gray-500 italic mb-3">{developData.articleIdea.angle}</p>
                      <ul className="space-y-1 mb-4 flex-1">
                        {developData.articleIdea.keyPoints.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 font-crimson text-xs text-gray-400"><span className="text-[#C5A059] mt-0.5">·</span>{p}</li>
                        ))}
                      </ul>
                      <p className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600">Query: {developData.articleIdea.targetQuery}</p>
                    </>
                  ) : <p className="font-crimson text-sm text-gray-600 italic flex-1">No disponible</p>}
                </div>
              </AcademyCard>

              {/* Reel idea */}
              <AcademyCard>
                <div className="relative h-full flex flex-col">
                  <ScrollworkCorners size={32} opacity={0.6} />
                  <div className="flex items-center gap-2 mb-4"><Video className="w-4 h-4 text-violet-400" /><FormatBadge type="reel" /></div>
                  {developData.reelIdea ? (
                    <>
                      <h3 className="font-cinzel text-sm text-white mb-2 leading-snug">{developData.reelIdea.title}</h3>
                      <div className="bg-violet-500/5 border border-violet-500/10 p-3 mb-3">
                        <p className="font-cinzel text-[8px] uppercase tracking-widest text-violet-400 mb-1">Hook (3 seg)</p>
                        <p className="font-crimson text-sm text-gray-300 italic">"{developData.reelIdea.hook}"</p>
                      </div>
                      <ul className="space-y-1 mb-4 flex-1">
                        {developData.reelIdea.structure.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 font-crimson text-xs text-gray-400"><span className="text-violet-400 mt-0.5">·</span>{s}</li>
                        ))}
                      </ul>
                      <p className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600">CTA: {developData.reelIdea.cta}</p>
                    </>
                  ) : <p className="font-crimson text-sm text-gray-600 italic flex-1">No disponible</p>}
                </div>
              </AcademyCard>

              {/* Carousel idea */}
              <AcademyCard>
                <div className="relative h-full flex flex-col">
                  <ScrollworkCorners size={32} opacity={0.6} />
                  <div className="flex items-center gap-2 mb-4"><LayoutGrid className="w-4 h-4 text-emerald-400" /><FormatBadge type="carousel" /></div>
                  {developData.carouselIdea ? (
                    <>
                      <h3 className="font-cinzel text-sm text-white mb-3 leading-snug">{developData.carouselIdea.title}</h3>
                      <div className="space-y-2 mb-4 flex-1">
                        {developData.carouselIdea.slides.slice(0, 4).map((s) => (
                          <div key={s.number} className="flex gap-2">
                            <span className="font-cinzel text-[8px] text-emerald-400 w-5 shrink-0 pt-0.5">#{s.number}</span>
                            <div><p className="font-cinzel text-[9px] text-white mb-0.5">{s.headline}</p><p className="font-crimson text-xs text-gray-500">{s.body}</p></div>
                          </div>
                        ))}
                        {developData.carouselIdea.slides.length > 4 && <p className="font-crimson text-xs text-gray-600 pl-7">+{developData.carouselIdea.slides.length - 4} slides más…</p>}
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(developData.carouselIdea!.caption).catch(() => {}); }} className="flex items-center justify-center gap-1.5 w-full py-2 font-cinzel text-[9px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition">
                        Copiar caption <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </>
                  ) : <p className="font-crimson text-sm text-gray-600 italic flex-1">No disponible</p>}
                </div>
              </AcademyCard>
            </div>

            {/* Full article */}
            {developData.fullArticle && (
              <AcademyCard>
                <div className="relative">
                  <ScrollworkCorners size={36} opacity={0.7} />
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[#C5A059]" />
                      <span className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]">Artículo completo generado</span>
                    </div>
                    <button onClick={() => setArticleExpanded((v) => !v)} className="flex items-center gap-1 font-cinzel text-[9px] uppercase tracking-widest text-gray-500 hover:text-white transition">
                      {articleExpanded ? <><ChevronUp className="w-3 h-3" /> Colapsar</> : <><ChevronDown className="w-3 h-3" /> Ver artículo</>}
                    </button>
                  </div>
                  <h2 className="font-cinzel text-lg text-white mb-1">{developData.fullArticle.title}</h2>
                  <p className="font-crimson text-sm text-gray-500 mb-4">{developData.fullArticle.excerpt}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {developData.fullArticle.tags.map((t) => (
                      <span key={t} className="font-cinzel text-[8px] uppercase tracking-widest text-gray-500 bg-white/5 px-2 py-0.5 border border-white/5">#{t}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/[0.02] border border-white/5 p-3">
                      <p className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600 mb-1">SEO Title</p>
                      <p className="font-crimson text-sm text-gray-300">{developData.fullArticle.seoTitle}</p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-3">
                      <p className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600 mb-1">Meta Description</p>
                      <p className="font-crimson text-sm text-gray-300">{developData.fullArticle.seoDescription}</p>
                    </div>
                  </div>
                  {articleExpanded && (
                    <div className="bg-[#0a1628] border border-white/5 p-5 mb-4 font-crimson text-sm text-gray-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                      {developData.fullArticle.content}
                    </div>
                  )}
                  <button onClick={handleUseArticle} className="flex items-center gap-2 px-5 py-2.5 font-cinzel text-[9px] uppercase tracking-widest bg-[#C5A059] text-[#020617] hover:bg-[#d4b06a] transition">
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
