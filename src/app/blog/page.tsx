"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Header from "@/components/Header";
import { Clock, Tag, ArrowRight } from "lucide-react";
import { getPaginatedPosts } from "@/lib/blog-data";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BlogContent() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const { posts, totalPages } = getPaginatedPosts(page);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <main className="min-h-screen bg-[#020617] pt-32">
      {/* Header Section */}
      <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 mb-20"
        >
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold">Sabiduría Compartida</span>
          <h1 className="text-5xl md:text-6xl text-white mt-4 mb-6 font-cinzel font-bold">
            Blog
          </h1>
          <p className="font-[Cormorant_Garamond] text-xl text-gray-300 max-w-3xl leading-relaxed">
            Artículos sobre Regresión a Vidas Pasadas, Sanación Espiritual y Transformación Personal
          </p>
          <div className="w-16 h-[1px] bg-[#C5A059] mt-6"></div>
        </motion.div>

        {/* Blog Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto px-4 sm:px-6 mb-20"
        >
          <div className="grid md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                variants={itemVariants}
                className="group relative overflow-hidden bg-[#0f172a] border border-[#C5A059]/20 hover:border-[#C5A059]/40 transition duration-300"
              >
                {/* Ornate corner frames */}
                <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#C5A059]/30 z-20 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#C5A059]/30 z-20 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#C5A059]/30 z-20 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#C5A059]/30 z-20 opacity-0 group-hover:opacity-100 transition duration-300"></div>

                {/* Image overlay */}
                <div className="h-48 bg-black/40 group-hover:bg-black/20 transition duration-700 overflow-hidden">
                  <div className={`${post.image} absolute inset-0 w-full h-full group-hover:scale-110 transition duration-1000`}></div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-[#C5A059]" />
                    <span className="text-[#C5A059] text-xs uppercase tracking-widest font-semibold">{post.category}</span>
                  </div>
                  <h3 className="text-xl text-white mb-2 font-cinzel leading-tight group-hover:text-[#C5A059] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed font-[Cormorant_Garamond] mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-[#C5A059]/10">
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime} lectura</span>
                    </div>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-[#C5A059] hover:text-[#F3E5AB] transition flex items-center gap-2 text-xs uppercase tracking-widest font-semibold"
                    >
                      Leer <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pagination */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 mb-20"
        >
          <div className="flex items-center justify-center gap-4">
            {page > 1 && (
              <Link
                href={`/blog?page=${page - 1}`}
                className="px-4 py-2 border border-[#C5A059]/30 hover:border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10 transition uppercase text-xs tracking-widest font-semibold"
              >
                ← Anterior
              </Link>
            )}

            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Link
                  key={pageNum}
                  href={`/blog?page=${pageNum}`}
                  className={`px-3 py-2 text-xs font-semibold transition ${
                    pageNum === page
                      ? "bg-[#C5A059] text-[#020617]"
                      : "border border-[#C5A059]/30 text-[#C5A059] hover:border-[#C5A059] hover:bg-[#C5A059]/10"
                  }`}
                >
                  {pageNum}
                </Link>
              ))}
            </div>

            {page < totalPages && (
              <Link
                href={`/blog?page=${page + 1}`}
                className="px-4 py-2 border border-[#C5A059]/30 hover:border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10 transition uppercase text-xs tracking-widest font-semibold"
              >
                Siguiente →
              </Link>
            )}
          </div>
        </motion.div>
    </main>
  );
}

export default function BlogPage() {
  return (
    <>
      <Header />
      <Suspense>
        <BlogContent />
      </Suspense>
    </>
  );
}
