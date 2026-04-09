"use client";
import ScrollDivider from "@/components/ScrollDivider";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, Tag, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { getAllPublishedPosts } from "@/lib/supabase/blog";

const CARDS = 3;
const AUTO_INTERVAL = 5000;

export default function BlogSection() {
  const [allPosts, setAllPosts] = useState<Awaited<ReturnType<typeof getAllPublishedPosts>>>([]);

  useEffect(() => {
    getAllPublishedPosts().then(setAllPosts);
  }, []);

  // Latest post first, then up to 5 random from the rest — max 6 total
  const posts = useMemo(() => {
    if (allPosts.length === 0) return [];
    const latest = allPosts[0];
    const rest = [...allPosts.slice(1)].sort(() => Math.random() - 0.5).slice(0, 5);
    return [latest, ...rest];
  }, [allPosts]);

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const isAnimating = useRef(false);
  const hovered = useRef(false);

  const slide = useCallback((dir: 1 | -1) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    setDirection(dir);
    setCurrent((c) => (c + dir + posts.length) % posts.length);
    setTimeout(() => { isAnimating.current = false; }, 600);
  }, [posts.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!hovered.current) slide(1);
    }, AUTO_INTERVAL);
    return () => clearInterval(timer);
  }, [slide]);

  const goTo = (index: number) => {
    if (isAnimating.current || index === current) return;
    isAnimating.current = true;
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
    setTimeout(() => { isAnimating.current = false; }, 600);
  };

  const visiblePosts = Array.from({ length: CARDS }, (_, i) =>
    posts[(current + i) % posts.length]
  );

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  if (posts.length === 0) return null;

  return (
    <section id="blog" className="py-20 sm:py-28 bg-[#020617] relative border-y border-[#C5A059]/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold font-cinzel">Sabiduría Compartida</span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl text-white mt-4 mb-4 font-cinzel">Blog</h2>
          <p className="text-gray-300 font-crimson text-lg max-w-2xl mx-auto">
            Artículos sobre Regresión a Vidas Pasadas y Sanación
          </p>
          <ScrollDivider className="mt-6" />
        </motion.div>

        {/* Carousel */}
        <div
          className="relative overflow-hidden"
          onMouseEnter={() => { hovered.current = true; }}
          onMouseLeave={() => { hovered.current = false; }}
        >
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {visiblePosts.map((post, idx) => (
                <Link key={`${post.id}-${idx}`} href={`/blog/${post.slug}`} className={`group block${idx > 0 ? " hidden sm:block" : ""}`}>
                  <div className="relative bg-[#0f172a] border border-[#C5A059]/20 hover:border-[#C5A059]/50 transition duration-300 overflow-hidden h-full">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#C5A059]/40 z-10" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#C5A059]/40 z-10" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#C5A059]/40 z-10" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#C5A059]/40 z-10" />

                    <div className="relative h-44 overflow-hidden bg-black/20">
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className={`${post.image} w-full h-full`} />
                      )}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition duration-300" />
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="w-3 h-3 text-[#C5A059]" />
                        <span className="text-[#C5A059] text-xs uppercase tracking-widest font-semibold">{post.category}</span>
                      </div>
                      <h3 className="text-base font-cinzel text-white mb-2 leading-snug line-clamp-2 group-hover:text-[#C5A059] transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-400 text-base font-crimson leading-relaxed mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between border-t border-[#C5A059]/10 pt-3">
                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                          <Clock className="w-3 h-3" />
                          <span>{post.readTime}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-6 mt-10">
          <button
            onClick={() => slide(-1)}
            className="w-10 h-10 border border-[#C5A059]/30 hover:border-[#C5A059] text-[#C5A059] flex items-center justify-center transition"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-2">
            {posts.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? "bg-[#C5A059] w-6" : "bg-[#C5A059]/30 w-1.5 hover:bg-[#C5A059]/60"
                }`}
                aria-label={`Ir al artículo ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => slide(1)}
            className="w-10 h-10 border border-[#C5A059]/30 hover:border-[#C5A059] text-[#C5A059] flex items-center justify-center transition"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link href="/blog" className="btn-gold">
            Ver Todos los Artículos
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
