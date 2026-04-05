"use client";

import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="hero-gradient min-h-screen flex items-center justify-center relative overflow-hidden pt-32">
      {/* Background image with overlay */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url('/assets/hero-bg.jpg')"}}></div>

      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%22100%22%20height=%22100%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern%20id=%22stardust%22%20x=%220%22%20y=%220%22%20width=%22100%22%20height=%22100%22%20patternUnits=%22userSpaceOnUse%22%3E%3Ccircle%20cx=%2210%22%20cy=%2210%22%20r=%221%22%20fill=%22%23C5A059%22%20opacity=%220.2%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect%20width=%22100%22%20height=%22100%22%20fill=%22url(%23stardust)%22/%3E%3C/svg%3E')] opacity-20"></div>

      {/* Gradient overlays */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#312e81]/30 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-t from-[#312e81]/30 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/40 via-[#020617]/30 to-[#020617]/50"></div>

      {/* Central indigo light */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#312e81] rounded-full filter blur-[150px] opacity-20"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="mb-8 inline-block"
        >
          <span className="text-[#C5A059] uppercase tracking-[0.3em] text-[10px] md:text-xs border border-[#C5A059]/30 py-2 px-6 rounded-sm">
            Hipnoterapia y Regresión a Vidas Pasadas
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          className="text-5xl md:text-7xl lg:text-8xl text-white mb-8 leading-tight font-cinzel font-bold"
        >
          Devuelve la Felicidad <br/>
          <span className="text-[#C5A059]">
            de tu Vida
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 1 }}
          className="text-lg md:text-2xl text-gray-300 max-w-3xl mx-auto font-light font-[Cormorant_Garamond] mb-12 leading-relaxed"
        >
          Un acompañamiento de alto nivel para quienes están decididos a sanar su pasado, liberar cargas ancestrales y vivir con plenitud y propósito.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 1.5 }}
          className="flex flex-col sm:flex-row justify-center gap-8"
        >
          <a href="#ListaDeAdmision" className="btn-gold">
            Iniciar Proceso
          </a>
          <a href="#ComoFunciona" className="flex items-center justify-center text-gray-400 hover:text-[#C5A059] transition uppercase tracking-widest text-xs group">
            <span className="border-b border-transparent group-hover:border-[#C5A059] pb-1 transition-all">
              Descubrir la Metodología
            </span>
            <i className="fas fa-arrow-right ml-3 text-[#C5A059] transform group-hover:translate-x-1 transition"></i>
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center opacity-60"
      >
        <div className="w-[1px] h-16 bg-gradient-to-b from-[#C5A059] to-transparent mb-2"></div>
        <span className="text-[10px] uppercase tracking-widest text-[#C5A059]">Scroll</span>
      </motion.div>
    </section>
  );
}
