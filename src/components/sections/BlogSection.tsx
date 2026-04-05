"use client";
import ScrollDivider from "@/components/ScrollDivider";

import { motion } from "framer-motion";
import { Clock, Tag, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getFeaturedPosts } from "@/lib/blog-data";

export default function BlogSection() {
  const allPosts = getFeaturedPosts(9);
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? allPosts.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === allPosts.length - 1 ? 0 : c + 1));

  const getVisible = () => {
    const indices = [
      current % allPosts.length,
      (current + 1) % allPosts.length,
      (current + 2) % allPosts.length,
    ];
    return indices.map((i) => allPosts[i]);
  };

  const visiblePosts = getVisible();

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
        <div className="relative">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {visiblePosts.map((post, idx) => (
              <Link key={`${post.id}-${idx}`} href={`/blog/${post.slug}`} className="group block">
                <div className="relative bg-[#0f172a] border border-[#C5A059]/20 hover:border-[#C5A059]/50 transition duration-300 overflow-hidden h-full">
                  {/* Corners */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#C5A059]/40 z-10" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#C5A059]/40 z-10" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#C5A059]/40 z-10" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#C5A059]/40 z-10" />

                  {/* Image */}
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

                  {/* Content */}
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

          {/* Navigation */}
          <div className="flex items-center justify-center gap-6 mt-10">
            <button
              onClick={prev}
              className="w-10 h-10 border border-[#C5A059]/30 hover:border-[#C5A059] text-[#C5A059] flex items-center justify-center transition"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-2">
              {allPosts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-4 rounded-full transition-all ${
                    i === current ? "bg-[#C5A059] w-6" : "bg-[#C5A059]/40 w-4"
                  }`}
                  aria-label={`Ir al artículo ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-10 h-10 border border-[#C5A059]/30 hover:border-[#C5A059] text-[#C5A059] flex items-center justify-center transition"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
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
