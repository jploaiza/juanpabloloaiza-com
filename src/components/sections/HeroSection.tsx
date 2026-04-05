"use client";

import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#020617]">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://res.cloudinary.com/dvudfdhoi/image/upload/f_auto,q_auto/main-juanpabloloaiza-regresion-vidas-pasadas_u6gseu')",
          opacity: 0.25,
        }}
      />

      {/* Star dust pattern */}
      <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='stardust' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='10' cy='10' r='1' fill='%23C5A059' opacity='0.2'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23stardust)'/%3E%3C/svg%3E\")"}} />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/60 via-transparent to-[#020617]/70" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#312e81]/15 to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center gap-10 py-40">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <span className="text-[#C5A059] font-cinzel uppercase tracking-[0.2em] text-[9px] sm:text-[10px] md:text-xs border border-[#C5A059]/30 py-2 px-4 sm:px-6 rounded-sm">
            Hipnoterapia · Regresión a Vidas Pasadas
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-white leading-tight font-cinzel font-bold"
        >
          Devuelve la Felicidad
          <br />
          <span className="text-[#C5A059]">de tu Vida</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 1 }}
          className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl font-crimson leading-loose"
        >
          Un proceso terapéutico integral para quienes están decididos a sanar su pasado, liberar cargas ancestrales y vivir con plenitud y propósito.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 1.5 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-10"
        >
          <a href="#ListaDeAdmision" className="btn-gold">
            Iniciar Proceso
          </a>
          <a
            href="#ComoFunciona"
            className="flex items-center justify-center text-gray-400 hover:text-[#C5A059] transition font-cinzel uppercase tracking-widest text-xs group"
          >
            <span className="border-b border-transparent group-hover:border-[#C5A059] pb-1 transition-all">
              Descubrir la Metodología
            </span>
            <i className="fas fa-arrow-right ml-3 text-[#C5A059] transform group-hover:translate-x-1 transition" />
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-60"
      >
        <div className="w-[1px] h-16 bg-gradient-to-b from-[#C5A059] to-transparent mb-2" />
        <span className="text-[10px] font-cinzel uppercase tracking-widest text-[#C5A059]">Scroll</span>
      </motion.div>
    </section>
  );
}
