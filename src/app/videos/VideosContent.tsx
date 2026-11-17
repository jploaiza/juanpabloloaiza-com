"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import VideoPlayer from "@/components/VideoPlayer";
import { VIDEO_POSTER } from "@/lib/videos";
import { videoItems, videoUrl, type VideoCategory } from "@/lib/videos-data";

interface Video {
  id: string;
  title: string;
  description: string;
  src: string;
  category: VideoCategory;
}

const videos: Video[] = videoItems.map((v) => ({
  id: v.id,
  title: v.title,
  description: v.description,
  src: videoUrl(v),
  category: v.category,
}));

const liberationVideos = videos.filter((v) => v.category === "liberation");
const rvpVideos = videos.filter((v) => v.category === "rvp");
const qaVideos = videos.filter((v) => v.category === "qa");

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

function VideoCard({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false);

  return (
    <motion.div variants={itemVariants} className="group relative overflow-hidden">
      <div className="relative bg-[#16213e] border-2 border-[#C5A059]/30 hover:border-[#C5A059]/60 transition duration-300 overflow-hidden h-full">
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C5A059] z-20"></div>
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#C5A059] z-20"></div>
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#C5A059] z-20"></div>
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C5A059] z-20"></div>

        <div className="relative bg-black aspect-video">
          {playing ? (
            <VideoPlayer src={video.src} autoPlay />
          ) : (
            <button onClick={() => setPlaying(true)} className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-[#16213e] to-[#0a1628] group/play" aria-label={`Reproducir: ${video.title}`}>
              {/* Los videos son verticales (9:16): se recorta la miniatura a 16:9 centrada en el rostro */}
              <Image
                src={VIDEO_POSTER}
                alt=""
                fill
                sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-[50%_30%]"
              />
              <div className="absolute inset-0 bg-[#020617]/35 group-hover/play:bg-[#020617]/15 transition duration-300" />
              <div className="relative w-16 h-16 rounded-full border-2 border-[#C5A059]/80 bg-[#020617]/60 flex items-center justify-center group-hover/play:bg-[#C5A059] group-hover/play:border-[#C5A059] transition duration-300">
                <svg className="w-6 h-6 text-[#C5A059] group-hover/play:text-[#020617] ml-1 transition duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-base font-cinzel text-white mb-2 leading-snug group-hover:text-[#C5A059] transition-colors">{video.title}</h3>
          <div className="h-px bg-[#C5A059]/20 mb-3"></div>
          <p className="text-gray-300 text-base font-crimson leading-relaxed">{video.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function VideosContent() {
  return (
    <main className="min-h-screen bg-[#0a1628] pt-32">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-6xl mx-auto px-4 sm:px-6 mb-20">
        <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold font-cinzel">Biblioteca de Videos</span>
        <h1 className="text-5xl md:text-6xl text-white mt-4 mb-6 font-cinzel font-bold">Explora tu Camino</h1>
        <p className="font-crimson text-xl text-gray-300 max-w-3xl leading-relaxed">
          Accede a videos informativos sobre la terapia de regresión a vidas pasadas y resuelve todas tus dudas antes de comenzar tu proceso.
        </p>
        <div className="w-16 h-[1px] bg-[#C5A059] mt-6"></div>
        <p className="font-crimson text-lg text-gray-400 max-w-3xl leading-relaxed mt-6">
          Aquí encuentras {videoItems.length} videos breves de Juan Pablo Loaiza, terapeuta de regresión a vidas pasadas e hipnosis
          terapéutica. Explican qué es la terapia, cómo se desarrolla en tres etapas (descubrir, entender y limpiar), cómo es una sesión
          en línea por Zoom y responden las dudas más frecuentes antes de empezar. Si prefieres leer, también puedes
          explorar el <Link href="/blog" className="text-[#C5A059] hover:text-[#F3E5AB] underline underline-offset-2">blog</Link>.
        </p>
      </motion.div>

      {/* Liberation */}
      <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-6xl mx-auto px-4 sm:px-6 mb-20">
        <motion.div variants={itemVariants} className="mb-10">
          <h2 className="text-3xl md:text-4xl text-white mb-3 font-cinzel">Liberación de Entidades Espirituales</h2>
          <div className="w-12 h-[1px] bg-[#C5A059]/50 mb-4"></div>
          <p className="text-gray-300 font-crimson text-lg max-w-2xl">Descubre cómo la terapia de liberación espiritual puede ayudarte a recuperar tu bienestar y paz interior.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-8">
          {liberationVideos.map((v) => <VideoCard key={v.id} video={v} />)}
        </div>
      </motion.div>

      {/* RVP */}
      <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-6xl mx-auto px-4 sm:px-6 mb-20">
        <motion.div variants={itemVariants} className="mb-10">
          <h2 className="text-3xl md:text-4xl text-white mb-3 font-cinzel">La Terapia de Regresión a Vidas Pasadas</h2>
          <div className="w-12 h-[1px] bg-[#C5A059]/50 mb-4"></div>
          <p className="text-gray-300 font-crimson text-lg max-w-2xl">Conoce en detalle cómo funciona el proceso y qué puedes esperar de cada sesión.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-8">
          {rvpVideos.map((v) => <VideoCard key={v.id} video={v} />)}
        </div>
      </motion.div>

      {/* Q&A */}
      <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-6xl mx-auto px-4 sm:px-6 mb-20">
        <motion.div variants={itemVariants} className="mb-10">
          <h2 className="text-3xl md:text-4xl text-white mb-3 font-cinzel">Preguntas Frecuentes</h2>
          <div className="w-12 h-[1px] bg-[#C5A059]/50 mb-4"></div>
          <p className="text-gray-300 font-crimson text-lg max-w-2xl">Resuelve tus dudas sobre la hipnosis terapéutica de regresión a vidas pasadas.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {qaVideos.map((v) => <VideoCard key={v.id} video={v} />)}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-6xl mx-auto px-4 sm:px-6 mb-20 text-center">
        <div className="border border-[#C5A059]/20 p-12 bg-[#16213e]">
          <h3 className="text-3xl font-cinzel text-white mb-4">¿Listo para comenzar?</h3>
          <p className="text-gray-300 font-crimson text-lg mb-8 max-w-xl mx-auto">Si ya resolviste tus dudas, da el primer paso y completa el formulario de admisión.</p>
          <Link href="/#ListaDeAdmision" className="btn-gold">Iniciar Proceso</Link>
        </div>
      </motion.div>
    </main>
  );
}
