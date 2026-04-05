"use client";

import { motion } from "framer-motion";
import { Clock, Tag } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "Sanación Kármica: Liberándote de Contratos Antiguos para Vivir en Plenitud",
    excerpt:
      "Descubre cómo los contratos kármicos del pasado pueden estar limitando tu presente y cómo liberarte de ellos.",
    readTime: "8 min",
    category: "Karma",
    image: "bg-gradient-to-br from-indigo-600 to-purple-900",
    url: "https://www.juanpabloloaiza.com/2024/10/12/sanacion-karmica-liberandote-de-contratos-antiguos-para-vivir-en-plenitud/",
  },
  {
    id: 2,
    title: "Cómo la Regresión a Vidas Pasadas Puede Transformar tus Relaciones Actuales",
    excerpt:
      "Explora cómo patrones de vidas pasadas impactan tus relaciones presentes y cómo sanarlos.",
    readTime: "7 min",
    category: "Relaciones",
    image: "bg-gradient-to-br from-purple-600 to-pink-900",
    url: "https://www.juanpabloloaiza.com/2024/10/12/como-la-regresion-a-vidas-pasadas-puede-transformar-tus-relaciones-actuales/",
  },
  {
    id: 3,
    title: "Descubriendo tu Propósito de Vida a través de la Regresión a Vidas Pasadas",
    excerpt:
      "Encuentra tu verdadero propósito accediendo a la sabiduría de tus vidas anteriores.",
    readTime: "10 min",
    category: "Propósito",
    image: "bg-gradient-to-br from-pink-600 to-rose-900",
    url: "https://www.juanpabloloaiza.com/2024/10/12/descubriendo-tu-proposito-de-vida-a-traves-de-la-regresion-a-vidas-pasadas/",
  },
  {
    id: 4,
    title: "Rompiendo Ciclos de Adicción a través de la Sanación de Vidas Pasadas",
    excerpt:
      "Comprende cómo las adiciones pueden tener raíces en traumas de vidas anteriores.",
    readTime: "9 min",
    category: "Sanación",
    image: "bg-gradient-to-br from-blue-600 to-indigo-900",
    url: "https://www.juanpabloloaiza.com/2024/10/10/rompiendo-ciclos-de-adiccion-a-traves-de-la-sanacion-de-vidas-pasadas/",
  },
  {
    id: 5,
    title: "Entendiendo y Liberando Posesiones Espirituales",
    excerpt:
      "Descubre cómo identificar y liberar entidades espirituales que pueden estar afectando tu vida.",
    readTime: "11 min",
    category: "Espíritus",
    image: "bg-gradient-to-br from-amber-600 to-orange-900",
    url: "https://www.juanpabloloaiza.com/2024/10/10/entendiendo-y-liberando-posesiones-espirituales-hacia-la-sanacion-y-la-libertad-del-ser/",
  },
  {
    id: 6,
    title: "Sanación de Traumas a través de la Regresión",
    excerpt:
      "Explora cómo acceder a traumas originales y sanarlos en su raíz.",
    readTime: "9 min",
    category: "Traumas",
    image: "bg-gradient-to-br from-red-600 to-pink-900",
    url: "https://www.juanpabloloaiza.com/2024/10/10/sanacion-de-traumas-a-traves-de-la-regresion-descubriendo-el-poder-curativo-de-las-vidas-pasadas/",
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
          {blogPosts.map((post) => (
            <motion.a
              key={post.id}
              variants={itemVariants}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative h-[450px] overflow-hidden bg-[#0f172a] border border-[#C5A059]/20 hover:border-[#C5A059]/40 transition duration-300 cursor-pointer"
            >
              {/* Image overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition duration-700 z-10"></div>
              <div className={`${post.image} absolute inset-0 w-full h-full group-hover:scale-110 transition duration-1000`}></div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 w-full p-6 z-20 bg-gradient-to-t from-black to-transparent">
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
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Clock className="w-4 h-4" />
                  <span>{post.readTime} lectura</span>
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <a
            href="https://www.juanpabloloaiza.com/blog/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
          >
            Ver Todos los Artículos
          </a>
        </motion.div>
      </div>
    </section>
  );
}
