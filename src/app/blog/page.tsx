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
                className="group relative overflow-hidden cursor-pointer"
              >
                <Link href={`/blog/${post.slug}`}>
                  {/* Card Container with ornate frame */}
                  <div className="relative bg-[#0f172a] border-2 border-[#C5A059]/30 hover:border-[#C5A059]/60 transition duration-300 overflow-hidden">
                    {/* Ornate gold corner frames - top corners */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C5A059] z-20"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#C5A059] z-20"></div>

                    {/* Ornate gold corner frames - bottom corners */}
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#C5A059] z-20"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C5A059] z-20"></div>

                    {/* Featured Image */}
                    <div className="relative h-56 overflow-hidden bg-black/20">
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className={`${post.image} w-full h-full group-hover:scale-105 transition duration-500`}></div>
                      )}
                      {/* Dark overlay */}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition duration-300"></div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6">
                      {/* Category Badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-[#C5A059]" />
                        <span className="text-[#C5A059] text-xs uppercase tracking-widest font-semibold">{post.category}</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-cinzel text-white mb-2 leading-tight group-hover:text-[#C5A059] transition-colors line-clamp-3">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-gray-300 text-sm leading-relaxed font-[Cormorant_Garamond] mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>

                      {/* Divider and Read More */}
                      <div className="flex items-center justify-between pt-4 border-t border-[#C5A059]/10">
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          <Clock className="w-4 h-4" />
                          <span>{post.readTime}</span>
                        </div>
                        <div className="text-[#C5A059] hover:text-[#F3E5AB] transition flex items-center gap-2 text-xs uppercase tracking-widest font-semibold group-hover:translate-x-1 transition-transform">
                          Leer <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
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
