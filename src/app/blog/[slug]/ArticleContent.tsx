"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Clock, ArrowLeft, Download, Loader2, X } from "lucide-react";
import type { BlogPost } from "@/lib/blog-data";
import ReactMarkdown from "react-markdown";
import { useState } from "react";

interface Props {
  post: BlogPost;
  previousPost: BlogPost | null;
  nextPost: BlogPost | null;
}

export default function ArticleContent({ post, previousPost, nextPost, relatedPosts }: Props & { relatedPosts: BlogPost[] }) {

  const shareUrl = `https://juanpabloloaiza.com/blog/${post.slug}`;
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyModal, setStoryModal] = useState(false);
  const [storyImageUrl, setStoryImageUrl] = useState("");

  const storyParams = new URLSearchParams({
    title: post.title,
    excerpt: post.excerpt ?? "",
    slug: post.slug,
    ...(post.imageUrl ? { imageUrl: post.imageUrl } : {}),
  });
  const storyApiUrl = `/api/og/story?${storyParams}`;

  const handleOpenStory = async () => {
    setStoryLoading(true);
    try {
      // Pre-load to verify it works, then show modal
      const res = await fetch(storyApiUrl);
      if (!res.ok) throw new Error("Error generando imagen");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setStoryImageUrl(objectUrl);
      setStoryModal(true);
    } catch {
      alert("Error generando la imagen. Intenta de nuevo.");
    } finally {
      setStoryLoading(false);
    }
  };

  const handleDownloadStory = () => {
    const a = document.createElement("a");
    a.href = storyImageUrl;
    a.download = `story-${post.slug}.png`;
    a.click();
  };

  return (
    <main className="min-h-screen bg-[#020617] pt-28">
      {/* ── Full-width hero image ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden"
      >
        {post.imageUrl ? (
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`${post.image} w-full h-full`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/10 to-[#020617]" />
      </motion.div>

      {/* ── Two-column layout ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:grid lg:grid-cols-3 lg:gap-14">

        {/* Main content */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-[#C5A059] hover:text-[#F3E5AB] transition mb-6 font-cinzel text-xs uppercase tracking-widest"
            >
              <ArrowLeft className="w-3 h-3" /> Volver al Blog
            </Link>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="font-cinzel text-[9px] uppercase tracking-widest text-[#020617] bg-[#C5A059] px-2.5 py-1 font-bold">
                {post.category}
              </span>
              <span className="text-gray-500 font-crimson text-sm">
                {new Date(post.date).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl text-white mb-5 font-cinzel font-bold leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#C5A059]/15 mb-8">
              <div className="flex items-center gap-4">
                <span className="text-gray-400 font-crimson text-sm">{post.author}</span>
                <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>{post.readTime} de lectura</span>
                </div>
              </div>
              {/* Share — top */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-cinzel text-[9px] uppercase tracking-widest text-gray-600 mr-1">Compartir</span>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-cinzel text-[9px] uppercase tracking-widest px-3 py-1.5 border border-[#C5A059]/20 text-gray-500 hover:text-[#C5A059] hover:border-[#C5A059]/50 transition"
                >
                  Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-cinzel text-[9px] uppercase tracking-widest px-3 py-1.5 border border-[#C5A059]/20 text-gray-500 hover:text-[#C5A059] hover:border-[#C5A059]/50 transition"
                >
                  X / Twitter
                </a>
                <button
                  onClick={handleOpenStory}
                  disabled={storyLoading}
                  className="flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-widest px-3 py-1.5 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10 transition disabled:opacity-60"
                >
                  {storyLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  {storyLoading ? "..." : "Historia IG"}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Article body */}
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="font-crimson text-lg text-gray-300 leading-relaxed"
          >
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-3xl font-cinzel text-white mt-10 mb-4 font-bold border-l-2 border-[#C5A059] pl-4">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-cinzel text-white mt-10 mb-4 font-bold border-l-2 border-[#C5A059] pl-4">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-cinzel text-[#C5A059] mt-8 mb-3">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-6 text-gray-300">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-none space-y-2 mb-6 pl-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-none space-y-2 mb-6 pl-2">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2 text-gray-300">
                    <span className="text-[#C5A059] mt-1.5 flex-shrink-0 text-xs">▸</span>
                    <span>{children}</span>
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="text-white font-semibold">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="text-gray-200 italic">{children}</em>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-[#C5A059]/50 pl-4 my-6 text-gray-400 italic">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-white/5 text-[#C5A059] px-1.5 py-0.5 text-sm font-mono">
                    {children}
                  </code>
                ),
                img: ({ src, alt }) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={alt ?? ""}
                    className="w-full my-8 object-cover border border-white/5"
                  />
                ),
                hr: () => (
                  <hr className="border-0 border-t border-[#C5A059]/20 my-10" />
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </motion.article>

          {/* Prev / Next navigation */}
          {(previousPost || nextPost) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28 }}
              className="mt-10 grid grid-cols-2 gap-4"
            >
              {previousPost ? (
                <Link
                  href={`/blog/${previousPost.slug}`}
                  className="group p-4 border border-[#C5A059]/15 hover:border-[#C5A059]/40 transition"
                >
                  <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/60 mb-1">
                    ← Anterior
                  </p>
                  <h4 className="font-cinzel text-xs text-white group-hover:text-[#C5A059] transition line-clamp-2">
                    {previousPost.title}
                  </h4>
                </Link>
              ) : (
                <div />
              )}
              {nextPost && (
                <Link
                  href={`/blog/${nextPost.slug}`}
                  className="group p-4 border border-[#C5A059]/15 hover:border-[#C5A059]/40 transition text-right"
                >
                  <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/60 mb-1">
                    Siguiente →
                  </p>
                  <h4 className="font-cinzel text-xs text-white group-hover:text-[#C5A059] transition line-clamp-2">
                    {nextPost.title}
                  </h4>
                </Link>
              )}
            </motion.div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.18 }}
          className="mt-14 lg:mt-0 lg:col-span-1"
        >
          <div className="sticky top-32 space-y-10">
            {/* Related Articles */}
            <div>
              <h3 className="font-cinzel text-xs uppercase tracking-widest text-[#C5A059] mb-5 pb-3 border-b border-[#C5A059]/15">
                Artículos Relacionados
              </h3>
              <div className="space-y-5">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.id}
                    href={`/blog/${related.slug}`}
                    className="group flex gap-3 items-start"
                  >
                    <div className="relative w-20 h-14 flex-shrink-0 overflow-hidden bg-[#0f172a]">
                      {related.imageUrl ? (
                        <img
                          src={related.imageUrl}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className={`${related.image} w-full h-full`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/70">
                        {related.category}
                      </span>
                      <h4 className="font-cinzel text-xs text-gray-300 group-hover:text-[#C5A059] transition leading-snug mt-0.5 line-clamp-2">
                        {related.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Share in sidebar */}
            <div className="pt-6 border-t border-[#C5A059]/10">
              <h3 className="font-cinzel text-xs uppercase tracking-widest text-[#C5A059] mb-4">
                Compartir
              </h3>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-cinzel text-[9px] uppercase tracking-widest px-3 py-1.5 border border-[#C5A059]/20 text-gray-500 hover:text-[#C5A059] hover:border-[#C5A059]/50 transition"
                >
                  Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-cinzel text-[9px] uppercase tracking-widest px-3 py-1.5 border border-[#C5A059]/20 text-gray-500 hover:text-[#C5A059] hover:border-[#C5A059]/50 transition"
                >
                  Twitter
                </a>
                <button
                  onClick={handleOpenStory}
                  disabled={storyLoading}
                  className="flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-widest px-3 py-1.5 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10 transition disabled:opacity-60"
                >
                  {storyLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  {storyLoading ? "..." : "Historia IG"}
                </button>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>

      {/* ── Story modal ── */}
      {storyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4" onClick={() => setStoryModal(false)}>
          <div className="relative bg-[#020d1f] border border-[#C5A059]/20 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <p className="font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059]">Historia para Instagram</p>
              <button onClick={() => setStoryModal(false)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview */}
            <div className="px-5 pt-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={storyImageUrl} alt="Story preview" className="w-full aspect-[9/16] object-cover border border-white/5" />
            </div>

            {/* Instructions */}
            <div className="px-5 py-5 space-y-4">
              <button
                onClick={handleDownloadStory}
                className="w-full flex items-center justify-center gap-2 bg-[#C5A059] hover:bg-[#d4b06a] text-[#020617] font-cinzel text-[10px] uppercase tracking-widest py-3 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Guardar imagen
              </button>

              <div className="border border-white/5 bg-white/3 px-4 py-3 space-y-2">
                <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]">Cómo compartir en Instagram</p>
                <ol className="font-crimson text-sm text-gray-400 space-y-1 list-none">
                  <li>1. Presiona <strong className="text-white">Guardar imagen</strong></li>
                  <li>2. Abre Instagram</li>
                  <li>3. Toca el ícono de <strong className="text-white">+</strong> → Historia</li>
                  <li>4. Selecciona la imagen guardada</li>
                  <li>5. Publica tu Historia</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
