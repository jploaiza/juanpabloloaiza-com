"use client";

import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Play } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string;
  cloudinaryId?: string; // Para integración con Cloudinary
  duration?: string;
  category: "liberation" | "qa";
}

const videos: Video[] = [
  // Sección: Liberación de Entidades
  {
    id: "liberation-1",
    title: "Liberación de Entidades Espirituales",
    description:
      "Descubre el proceso completo de liberación de entidades espirituales y cómo esta práctica ancestral puede transformar tu vida.",
    category: "liberation",
    duration: "12:45",
    cloudinaryId: "", // Se llenará cuando subas a Cloudinary
  },

  // Sección: Preguntas Frecuentes
  {
    id: "qa-3",
    title: "¿Existen contraindicaciones?",
    description: "Conoce si hay contraindicaciones para la regresión a vidas pasadas.",
    category: "qa",
    duration: "4:32",
    cloudinaryId: "", // QA3
  },
  {
    id: "qa-4",
    title: "¿Podré entrar en hipnosis?",
    description: "Descubre si tienes la capacidad de entrar en estado hipnótico.",
    category: "qa",
    duration: "5:18",
    cloudinaryId: "", // QA4
  },
  {
    id: "qa-5",
    title: "¿Qué pasa si se corta la llamada?",
    description: "Conoce qué ocurre si pierdes conexión durante una sesión.",
    category: "qa",
    duration: "3:45",
    cloudinaryId: "", // QA5
  },
  {
    id: "qa-6",
    title: "¿Qué pasa si no veo nada?",
    description: "Entiende qué hacer si no experimentas visualizaciones en la sesión.",
    category: "qa",
    duration: "6:12",
    cloudinaryId: "", // QA6
  },
  {
    id: "qa-7",
    title: "¿Y si me lo estuviera imaginando todo?",
    description: "Explora la diferencia entre imaginación y memoria de vidas pasadas.",
    category: "qa",
    duration: "7:03",
    cloudinaryId: "", // QA7
  },
  {
    id: "qa-8",
    title: "¿Voy a estar consciente durante la hipnosis?",
    description: "Conoce el estado de consciencia durante la regresión.",
    category: "qa",
    duration: "5:54",
    cloudinaryId: "", // QA8
  },
  {
    id: "qa-9",
    title: "¿Me acordaré de lo que viví en hipnosis?",
    description: "Descubre si recordarás los detalles de tu experiencia de regresión.",
    category: "qa",
    duration: "4:28",
    cloudinaryId: "", // QA9
  },
  {
    id: "qa-10",
    title: "Las sesiones son grabadas",
    description: "Información sobre la grabación de tus sesiones personales.",
    category: "qa",
    duration: "3:15",
    cloudinaryId: "", // QA10
  },
  {
    id: "qa-11",
    title: "¿Quién puede tomar esta terapia?",
    description: "Aprende quiénes son los candidatos ideales para la regresión a vidas pasadas.",
    category: "qa",
    duration: "6:41",
    cloudinaryId: "", // QA11
  },
];

const liberationVideos = videos.filter((v) => v.category === "liberation");
const qaVideos = videos.filter((v) => v.category === "qa");

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

function VideoCard({ video }: { video: Video }) {
  return (
    <motion.div
      variants={itemVariants}
      className="group relative overflow-hidden cursor-pointer"
    >
      <div className="relative bg-[#0f172a] border-2 border-[#C5A059]/30 hover:border-[#C5A059]/60 transition duration-300 overflow-hidden h-full">
        {/* Ornate corner frames */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C5A059] z-20"></div>
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#C5A059] z-20"></div>
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#C5A059] z-20"></div>
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C5A059] z-20"></div>

        {/* Video Placeholder / Thumbnail */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-900 flex items-center justify-center group-hover:from-indigo-500 group-hover:to-purple-800 transition duration-500">
          <Play className="w-16 h-16 text-white opacity-60 group-hover:opacity-100 transition" />
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Title */}
          <h3 className="text-lg font-cinzel text-white mb-3 leading-tight group-hover:text-[#C5A059] transition-colors line-clamp-3">
            {video.title}
          </h3>

          {/* Description */}
          <p className="text-gray-300 text-sm font-[Cormorant_Garamond] leading-relaxed mb-4 line-clamp-2">
            {video.description}
          </p>

          {/* Divider */}
          <div className="h-px bg-[#C5A059]/20 mb-3"></div>

          {/* Duration and CTA */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">{video.duration || "N/A"}</span>
            <span className="text-[#C5A059] text-xs uppercase tracking-widest font-semibold group-hover:translate-x-1 transition-transform">
              Ver Video
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function VideosPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#020617] pt-32">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 mb-20"
        >
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold">
            Biblioteca de Videos
          </span>
          <h1 className="text-5xl md:text-6xl text-white mt-4 mb-6 font-cinzel font-bold">
            Explora tu Camino
          </h1>
          <p className="font-[Cormorant_Garamond] text-xl text-gray-300 max-w-3xl leading-relaxed">
            Accede a contenido educativo y transformador sobre regresión a vidas pasadas,
            sanación espiritual y liberación del ser.
          </p>
          <div className="w-16 h-[1px] bg-[#C5A059] mt-6"></div>
        </motion.div>

        {/* Liberación Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-6xl mx-auto px-4 sm:px-6 mb-20"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl text-white mb-3 font-cinzel">
              Liberación de Entidades Espirituales
            </h2>
            <div className="w-12 h-[1px] bg-[#C5A059]/50 mb-6"></div>
            <p className="text-gray-300 font-[Cormorant_Garamond] text-lg max-w-2xl">
              Descubre el poder transformador de la liberación espiritual y cómo sanar
              las conexiones energéticas que afectan tu vida.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {liberationVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </motion.div>

        {/* Q&A Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-6xl mx-auto px-4 sm:px-6 mb-20"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl text-white mb-3 font-cinzel">
              Preguntas Frecuentes (Q&A)
            </h2>
            <div className="w-12 h-[1px] bg-[#C5A059]/50 mb-6"></div>
            <p className="text-gray-300 font-[Cormorant_Garamond] text-lg max-w-2xl">
              Resuelve tus dudas sobre la hipnoterapia de regresión a través de videos
              informativos que abordan las preguntas más comunes.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {qaVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </motion.div>
      </main>
    </>
  );
}
