"use client";

import { motion } from "framer-motion";
import { Clock, Tag } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "Introducción a la Regresión a Vidas Pasadas",
    excerpt:
      "Descubre cómo la hipnoterapia de regresión puede revelar conexiones de tus vidas anteriores.",
    readTime: "5 min",
    category: "Regresión",
    image: "bg-gradient-to-br from-indigo-600 to-purple-900",
  },
  {
    id: 2,
    title: "Cómo la Hipnosis Transforma tu Vida",
    excerpt:
      "Explora los beneficios científicamente comprobados de la hipnoterapia para el bienestar.",
    readTime: "7 min",
    category: "Hipnosis",
    image: "bg-gradient-to-br from-purple-600 to-pink-900",
  },
  {
    id: 3,
    title: "El Viaje Espiritual Hacia tu Propósito",
    excerpt:
      "Cómo encontrar significado y dirección a través de la exploración espiritual.",
    readTime: "6 min",
    category: "Espiritualidad",
    image: "bg-gradient-to-br from-pink-600 to-rose-900",
  },
];

export default function BlogSection() {
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
    <section className="py-24 px-4 bg-[#110f1e]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="headline-lg mb-4">BLOG & ARTÍCULOS</h2>
          <div className="h-1 w-24 bg-[#d4a017] mx-auto"></div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {blogPosts.map((post) => (
            <motion.div
              key={post.id}
              variants={itemVariants}
              className="glass-card overflow-hidden hover:scale-105 transition-transform cursor-pointer"
            >
              <div className={`${post.image} h-48 w-full`}></div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-[#d4a017]" />
                  <span className="label text-xs">{post.category}</span>
                </div>
                <h3 className="headline-md mb-3">{post.title}</h3>
                <p className="body-text mb-4">{post.excerpt}</p>
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{post.readTime} lectura</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
