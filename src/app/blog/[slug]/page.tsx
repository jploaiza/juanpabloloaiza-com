"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Header from "@/components/Header";
import { Clock, Tag, ArrowLeft, Share2 } from "lucide-react";
import { getBlogPostBySlug, getAllBlogPosts } from "@/lib/blog-data";
import { notFound } from "next/navigation";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const allPosts = getAllBlogPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const previousPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#020617] pt-32">
        {/* Article Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 mb-12"
        >
          <Link
            href="/blog"
            className="flex items-center gap-2 text-[#C5A059] hover:text-[#F3E5AB] transition mb-8 uppercase text-xs tracking-widest font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Blog
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <Tag className="w-4 h-4 text-[#C5A059]" />
            <span className="text-[#C5A059] text-xs uppercase tracking-widest font-semibold">{post.category}</span>
          </div>

          <h1 className="text-5xl md:text-6xl text-white mb-6 font-cinzel font-bold leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 border-b border-[#C5A059]/20 pb-6">
            <div className="flex items-center gap-2">
              <span className="text-[#C5A059]">{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readTime} lectura</span>
            </div>
            <div>
              {new Date(post.date).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </motion.div>

        {/* Featured Image */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 mb-12"
        >
          <div className="relative h-96 bg-[#0f172a] border border-[#C5A059]/20 overflow-hidden">
            {/* Ornate corner frames */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#C5A059]/50 z-20"></div>
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#C5A059]/50 z-20"></div>
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#C5A059]/50 z-20"></div>
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#C5A059]/50 z-20"></div>

            <div className={`${post.image} absolute inset-0 w-full h-full`}></div>
          </div>
        </motion.div>

        {/* Article Content */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 mb-20"
        >
          <div className="prose prose-invert max-w-none font-[Cormorant_Garamond] text-lg text-gray-300 leading-relaxed">
            {post.content.split("\n\n").map((paragraph, index) => {
              if (paragraph.startsWith("##")) {
                return (
                  <h2 key={index} className="text-3xl font-cinzel text-white mt-10 mb-4 font-bold">
                    {paragraph.replace("## ", "")}
                  </h2>
                );
              }
              if (paragraph.startsWith("-")) {
                return (
                  <ul key={index} className="list-disc list-inside space-y-2 mb-6">
                    {paragraph
                      .split("\n")
                      .filter((line) => line.startsWith("-"))
                      .map((line, i) => (
                        <li key={i} className="text-gray-300">
                          {line.replace("- ", "")}
                        </li>
                      ))}
                  </ul>
                );
              }
              return (
                <p key={index} className="mb-6">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </motion.article>

        {/* Share Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 mb-20"
        >
          <div className="border-t border-[#C5A059]/20 pt-8">
            <p className="text-gray-400 mb-4 text-sm uppercase tracking-widest">Compartir este artículo</p>
            <div className="flex gap-4">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://juanpabloloaiza.com/blog/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 border border-[#C5A059]/30 hover:border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10 transition"
              >
                <Share2 className="w-4 h-4" />
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://juanpabloloaiza.com/blog/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 border border-[#C5A059]/30 hover:border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10 transition"
              >
                <Share2 className="w-4 h-4" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Navigation to other articles */}
        {(previousPost || nextPost) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="max-w-6xl mx-auto px-4 sm:px-6 mb-20"
          >
            <div className="grid md:grid-cols-2 gap-8">
              {previousPost && (
                <Link href={`/blog/${previousPost.slug}`}>
                  <div className="group p-6 border border-[#C5A059]/20 hover:border-[#C5A059]/40 transition cursor-pointer">
                    <p className="text-[#C5A059] text-xs uppercase tracking-widest mb-2">Artículo Anterior</p>
                    <h3 className="text-lg text-white font-cinzel group-hover:text-[#C5A059] transition line-clamp-2">
                      {previousPost.title}
                    </h3>
                  </div>
                </Link>
              )}
              {nextPost && (
                <Link href={`/blog/${nextPost.slug}`}>
                  <div className="group p-6 border border-[#C5A059]/20 hover:border-[#C5A059]/40 transition cursor-pointer">
                    <p className="text-[#C5A059] text-xs uppercase tracking-widest mb-2">Próximo Artículo</p>
                    <h3 className="text-lg text-white font-cinzel group-hover:text-[#C5A059] transition line-clamp-2">
                      {nextPost.title}
                    </h3>
                  </div>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </>
  );
}
