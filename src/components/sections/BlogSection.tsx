"use client";

import { motion } from "framer-motion";
import { Clock, Tag, ArrowRight } from "lucide-react";
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
              className="group relative h-[450px] overflow-hidden bg-[#0f172a] border border-[#C5A059]/20 hover:border-[#C5A059]/40 transition duration-300"
            >
              {/* Ornate corner frames */}
              <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#C5A059]/30 z-20 opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#C5A059]/30 z-20 opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#C5A059]/30 z-20 opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#C5A059]/30 z-20 opacity-0 group-hover:opacity-100 transition duration-300"></div>

              {/* Image overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition duration-700 z-10"></div>
              <div className={`${post.image} absolute inset-0 w-full h-full group-hover:scale-110 transition duration-1000`}></div>

              {/* Content */}
              <Link href={`/blog/${post.slug}`} className="absolute bottom-0 left-0 w-full p-6 z-20 bg-gradient-to-t from-black to-transparent h-full flex flex-col justify-end cursor-pointer">
                <div className="flex items-center gap-2 mb-3 opacity-0 group-hover:opacity-100 transition duration-300">
                  <Tag className="w-4 h-4 text-[#C5A059]" />
                  <span className="text-[#C5A059] text-xs uppercase tracking-widest font-semibold">{post.category}</span>
                </div>
                <h3 className="text-xl text-white mb-2 font-cinzel leading-tight group-hover:text-[#C5A059] transition-colors">{post.title}</h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-gray-300 text-sm leading-relaxed font-[Cormorant_Garamond] opacity-0 group-hover:opacity-100 transition duration-300 mb-3"
                >{post.excerpt}</motion.p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime} lectura</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#C5A059] opacity-0 group-hover:opacity-100 transition" />
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
