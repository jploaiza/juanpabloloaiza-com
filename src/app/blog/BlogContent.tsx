"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Clock, ArrowRight, Search } from "lucide-react";
import { getAllBlogPosts, getPaginatedPosts } from "@/lib/blog-data";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const CATEGORIES = ["Todos", "Karma", "Relaciones", "Propósito", "Sanación", "Espíritus", "Ciencia"];

export default function BlogContent() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const allPosts = getAllBlogPosts();
  const { posts, totalPages } = getPaginatedPosts(page);
  const [activeCategory, setActiveCategory] = useState("Todos");

  const featuredPost = page === 1 ? allPosts[0] : null;
  const gridPosts = page === 1 ? posts.filter((p) => p.id !== allPosts[0].id) : posts;
  const filteredGrid =
    activeCategory === "Todos"
      ? gridPosts
      : gridPosts.filter((p) => p.category === activeCategory);

  return (
    <main className="min-h-screen bg-[#020617] pt-28">
      {/* ── Hero Header ── */}
      <div className="relative border-b border-[#C5A059]/10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1627]/70 to-[#020617] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 grid lg:grid-cols-2 gap-12 items-start">

          {/* Left: title + search + filters */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold font-cinzel">
              Sabiduría Compartida
            </span>
            <h1 className="text-5xl md:text-6xl text-white mt-3 mb-5 font-cinzel font-bold leading-tight">
              Blog
            </h1>
            <p className="font-crimson text-lg text-gray-400 mb-8 leading-relaxed max-w-md">
              Artículos sobre Regresión a Vidas Pasadas, Sanación Espiritual y Transformación Personal
            </p>

            {/* Search bar */}
            <div className="flex mb-6">
              <input
                type="text"
                placeholder="Buscar artículo..."
                className="flex-1 bg-[#0f172a] border border-[#C5A059]/20 text-gray-300 font-crimson px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059]/50 placeholder-gray-600"
              />
              <button className="bg-[#C5A059] hover:bg-[#d4b06a] px-4 py-2.5 transition text-[#020617]">
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`font-cinzel text-[10px] uppercase tracking-widest px-3 py-1.5 border transition ${
                    activeCategory === cat
                      ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/10"
                      : "border-[#C5A059]/20 text-gray-500 hover:border-[#C5A059]/50 hover:text-[#C5A059]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Right: Featured "Editor's Choice" post */}
          {featuredPost && (
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <Link href={`/blog/${featuredPost.slug}`} className="group block">
                <div className="relative overflow-hidden border border-[#C5A059]/20 hover:border-[#C5A059]/50 transition duration-300">
                  {/* Badge */}
                  <div className="absolute top-4 left-4 z-20 bg-[#C5A059] text-[#020617] font-cinzel text-[9px] uppercase tracking-widest px-3 py-1 font-bold">
                    Editor&apos;s Choice
                  </div>
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden bg-black">
                    {featuredPost.imageUrl ? (
                      <img
                        src={featuredPost.imageUrl}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                      />
                    ) : (
                      <div className={`${featuredPost.image} w-full h-full`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/80 via-transparent to-transparent" />
                  </div>
                  {/* Content */}
                  <div className="bg-[#0b1120] p-5">
                    <span className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]">
                      {featuredPost.category}
                    </span>
                    <h2 className="text-lg font-cinzel text-white mt-2 mb-2 leading-snug line-clamp-2 group-hover:text-[#C5A059] transition-colors">
                      {featuredPost.title}
                    </h2>
                    <p className="text-gray-400 font-crimson text-sm leading-relaxed line-clamp-2 mb-4">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center justify-between border-t border-[#C5A059]/10 pt-3">
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                        <Clock className="w-3 h-3" />
                        <span className="font-crimson">{featuredPost.readTime}</span>
                      </div>
                      <span className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] flex items-center gap-1 group-hover:gap-2 transition-all">
                        Leer más <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Posts Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGrid.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.06 }}
            >
              <Link href={`/blog/${post.slug}`} className="group block h-full">
                <div className="relative overflow-hidden h-full bg-[#0b1120] border border-[#C5A059]/10 hover:border-[#C5A059]/35 transition duration-300 flex flex-col">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden flex-shrink-0">
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "block";
                        }}
                      />
                    ) : null}
                    <div
                      className={`${post.image} w-full h-full`}
                      style={{ display: post.imageUrl ? "none" : "block" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-transparent opacity-70" />
                    {/* Overlaid meta */}
                    <div className="absolute bottom-3 left-3">
                      <span className="font-cinzel text-[9px] uppercase tracking-widest bg-[#C5A059] text-[#020617] px-2 py-0.5">
                        {post.category}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 text-white/60 text-xs">
                      <Clock className="w-3 h-3" />
                      <span className="font-crimson">{post.readTime}</span>
                    </div>
                  </div>
                  {/* Text */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-cinzel text-sm text-white leading-snug mb-2 line-clamp-2 group-hover:text-[#C5A059] transition-colors flex-1">
                      {post.title}
                    </h3>
                    <p className="text-gray-500 font-crimson text-sm leading-relaxed line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                    <div className="flex justify-end">
                      <span className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/50 group-hover:text-[#C5A059] transition flex items-center gap-1">
                        Leer <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-14">
            {page > 1 && (
              <Link
                href={`/blog?page=${page - 1}`}
                className="font-cinzel px-5 py-2.5 border border-[#C5A059]/30 hover:border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10 transition text-xs uppercase tracking-widest"
              >
                ← Anterior
              </Link>
            )}
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Link
                  key={pageNum}
                  href={`/blog?page=${pageNum}`}
                  className={`px-3 py-2 font-cinzel text-xs transition ${
                    pageNum === page
                      ? "bg-[#C5A059] text-[#020617]"
                      : "border border-[#C5A059]/30 text-[#C5A059] hover:border-[#C5A059]"
                  }`}
                >
                  {pageNum}
                </Link>
              ))}
            </div>
            {page < totalPages && (
              <Link
                href={`/blog?page=${page + 1}`}
                className="font-cinzel px-5 py-2.5 border border-[#C5A059]/30 hover:border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10 transition text-xs uppercase tracking-widest"
              >
                Siguiente →
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
