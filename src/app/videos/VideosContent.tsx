"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const R2_BASE = "https://media.juanpabloloaiza.com";

interface Video {
  id: string;
  title: string;
  description: string;
  src: string;
  category: "liberation" | "rvp" | "qa";
}

const videos: Video[] = [
  {
    id: "liberation-1",
    title: "Liberación de Entidades Espirituales",
    description: "Conoce en qué consiste la Terapia de Liberación de Entidades Espirituales, sus raíces en los estudios del Dr. Carl Wickland y el Dr. William Baldwin, y cómo puede ayudarte a recuperar tu bienestar energético.",
    src: `${R2_BASE}/SRT1-2.mp4`,
    category: "liberation",
  },
  {
    id: "rvp-1",
    title: "¿Cómo funciona el proceso?",
    description: "Juan Pablo explica el proceso terapéutico de la regresión a vidas pasadas: las tres etapas de Descubrir, Entender y Limpiar, y cómo funciona cada sesión.",
    src: `${R2_BASE}/RVP1.m4v`,
    category: "rvp",
  },
  {
    id: "rvp-2",
    title: "¿Qué es la Terapia de Regresión a Vidas Pasadas?",
    description: "Conoce en qué consiste esta terapia, cómo el alma acumula información de vidas pasadas y cómo la hipnosis clínica permite acceder a ella para sanar.",
    src: `${R2_BASE}/Que-es-la-terapia-de-Regresion-a-Vidas-Pasadas.mp4`,
    category: "rvp",
  },
  { id: "qa-1", title: "¿Se puede realizar en línea?", description: "Por supuesto. La terapia es completamente segura en línea. Más de 200 procesos terapéuticos se han realizado via Zoom con resultados maravillosos.", src: `${R2_BASE}/QA1.m4v`, category: "qa" },
  { id: "qa-2", title: "¿Puedo tomar solo una sesión?", description: "No es recomendable. Una sola sesión deja más preguntas que respuestas. El proceso básico siempre comprende tres sesiones: descubrir, entender y limpiar.", src: `${R2_BASE}/QA2.m4v`, category: "qa" },
  { id: "qa-3", title: "¿Existen contraindicaciones?", description: "La única contraindicación es para personas con enfermedades mentales diagnosticadas bajo tratamiento farmacológico. Esta terapia es siempre complementaria.", src: `${R2_BASE}/QA3.m4v`, category: "qa" },
  { id: "qa-4", title: "¿Podré entrar en hipnosis?", description: "Si puedes dormir en la noche, podrás entrar en hipnosis. Es el mismo proceso natural de relajación profunda, guiado conscientemente.", src: `${R2_BASE}/QA4.m4v`, category: "qa" },
  { id: "qa-5", title: "¿Qué pasa si se corta la llamada?", description: "Podemos reconectarnos y retomar la sesión desde donde la dejamos. Puedes salir de hipnosis solo, igual que al despertar en la mañana.", src: `${R2_BASE}/QA5.m4v`, category: "qa" },
  { id: "qa-6", title: "¿Qué pasa si no veo nada?", description: "Ver imágenes no es el objetivo. Lo que define una terapia exitosa es conectar con la emoción atrapada y liberarla, independiente de las imágenes.", src: `${R2_BASE}/QA6.m4v`, category: "qa" },
  { id: "qa-7", title: "¿Y si me lo estuviera imaginando todo?", description: "La imaginación no tiene emoción. Los recuerdos de vidas pasadas vienen siempre acompañados de una emoción real que no puede ser fabricada.", src: `${R2_BASE}/QA7.m4v`, category: "qa" },
  { id: "qa-8", title: "¿Voy a estar consciente durante la hipnosis?", description: "Siempre estarás consciente. Tu mente consciente se queda presente, mirando y entendiendo todo lo que sucede durante el proceso.", src: `${R2_BASE}/QA8.m4v`, category: "qa" },
  { id: "qa-9", title: "¿Me acordaré de lo que viví en hipnosis?", description: "Sí. Nunca perderás la conciencia. Todo lo que aprendes y vives en estas sesiones quedará integrado en ti como un conocimiento adquirido.", src: `${R2_BASE}/QA9.m4v`, category: "qa" },
  { id: "qa-10", title: "¿Las sesiones se graban?", description: "Sí. Todas las sesiones se graban en audio y video por Zoom, para mantener registros y para que puedas acceder a tu grabación si la necesitas.", src: `${R2_BASE}/QA10.m4v`, category: "qa" },
  { id: "qa-11", title: "¿Quién puede tomar esta terapia?", description: "Todas las personas pueden tomar esta terapia, excepto menores de edad o personas con enfermedades mentales diagnosticadas bajo tratamiento farmacológico.", src: `${R2_BASE}/QA11.m4v`, category: "qa" },
];

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
            <video src={video.src} controls autoPlay className="w-full h-full object-contain" controlsList="nodownload" disablePictureInPicture />
          ) : (
            <button onClick={() => setPlaying(true)} className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#16213e] to-[#0a1628] group/play" aria-label={`Reproducir: ${video.title}`}>
              <div className="w-16 h-16 rounded-full border-2 border-[#C5A059]/60 flex items-center justify-center group-hover/play:bg-[#C5A059] group-hover/play:border-[#C5A059] transition duration-300">
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
          <a href="/#ListaDeAdmision" className="btn-gold">Iniciar Proceso</a>
        </div>
      </motion.div>
    </main>
  );
}
