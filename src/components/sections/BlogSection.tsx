"use client";

import { motion } from "framer-motion";
import { Clock, Tag, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getFeaturedPosts } from "@/lib/blog-data";

export default function BlogSection() {
  const featuredPosts = getFeaturedPosts(6);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className="py-28 bg-[#020617] relative border-y border-[#C5A059]/5">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold">Sabiduría Compartida</span>
          <h2 className="text-4xl md:text-5xl text-white mt-4 mb-4 font-cinzel">Blog</h2>
          <p className="text-gray-300 font-[Cormorant_Garamond] text-xl max-w-2xl mx-auto">Artículos sobre Regresión a Vidas Pasadas y Sanación</p>
          <div className="w-16 h-[1px] bg-[#C5A059] mx-auto mt-6"></div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
        >
          {featuredPosts.map((post) => (
            <motion.div
              key={post.id}
              variants={itemVariants}
              className="group relative overflow-hidden cursor-pointer"
            >
              <Link href={`/blog/${post.slug}`} className="block">
                {/* Card Container with ornate frame */}
                <div className="relative bg-[#0f172a] border-2 border-[#C5A059]/30 hover:border-[#C5A059]/60 transition duration-300 overflow-hidden">
                  {/* Ornate gold corner frames - top corners */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C5A059] z-20"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#C5A059] z-20"></div>

                  {/* Ornate gold corner frames - bottom corners */}
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#C5A059] z-20"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C5A059] z-20"></div>

                  {/* Featured Image - Fixed Height */}
                  <div className="relative h-48 overflow-hidden bg-black/20">
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

                  {/* Content Section - Always Visible */}
                  <div className="p-5">
                    {/* Category Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-3 h-3 text-[#C5A059]" />
                      <span className="text-[#C5A059] text-xs uppercase tracking-widest font-semibold">{post.category}</span>
                    </div>

                    {/* Title - Always Visible */}
                    <h3 className="text-lg font-cinzel text-white mb-2 leading-snug line-clamp-3 group-hover:text-[#C5A059] transition-colors">
                      {post.title}
                    </h3>

                    {/* Excerpt - Always Visible */}
                    <p className="text-gray-300 text-sm font-[Cormorant_Garamond] leading-relaxed mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>

                    {/* Divider */}
                    <div className="border-t border-[#C5A059]/20 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>{post.readTime}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/blog" className="btn-gold">
            Ver Todos los Artículos
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
