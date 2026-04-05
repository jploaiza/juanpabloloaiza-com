"use client";

import { motion } from "framer-motion";

export default function TherapySection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  return (
    <section className="py-28 bg-gradient-to-b from-[#020617] via-[#050b1a] to-[#020617] relative border-y border-[#C5A059]/5">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-6xl mx-auto px-4"
      >
        <motion.div
          variants={itemVariants}
          className="text-center mb-16"
        >
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold">Metodología Única</span>
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl text-white mt-4 mb-4 font-cinzel"
          >
            La Terapia de Regresión
          </motion.h2>
          <div className="w-16 h-[1px] bg-[#C5A059] mx-auto"></div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div variants={itemVariants} className="relative">
            {/* Ornate frame borders */}
            <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-[#C5A059]/50 z-10"></div>
            <div className="absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 border-[#C5A059]/50 z-10"></div>
            <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-2 border-l-2 border-[#C5A059]/50 z-10"></div>
            <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-[#C5A059]/50 z-10"></div>

            <div className="aspect-video bg-[#0f172a] border border-[#C5A059]/20 rounded-sm overflow-hidden relative z-0">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="¿Qué es la terapia de regresión?"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6">
            <p className="text-gray-300 font-[Cormorant_Garamond] text-xl leading-relaxed">
              Los problemas en nuestra vida presente muchas veces pueden estar vinculados a situaciones que nos han sucedido en los primeros años de esta, pero también podrían estar vinculados directamente a situaciones que hemos vivido en vidas pasadas.
            </p>

            <div className="space-y-6">
              <div>
                <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold">Principios Fundamentales</span>
                <ul className="space-y-4 mt-4">
                  <li className="flex gap-3 text-gray-300">
                    <span className="text-[#C5A059] min-w-fit font-bold text-lg">✓</span>
                    <span className="font-[Cormorant_Garamond] text-lg leading-relaxed">El alma es inmortal y acumula información de todas tus encarnaciones</span>
                  </li>
                  <li className="flex gap-3 text-gray-300">
                    <span className="text-[#C5A059] min-w-fit font-bold text-lg">✓</span>
                    <span className="font-[Cormorant_Garamond] text-lg leading-relaxed">Los problemas actuales frecuentemente tienen raíces en vidas pasadas</span>
                  </li>
                  <li className="flex gap-3 text-gray-300">
                    <span className="text-[#C5A059] min-w-fit font-bold text-lg">✓</span>
                    <span className="font-[Cormorant_Garamond] text-lg leading-relaxed">Mediante meditación guiada e hipnosis clínica accedemos a esa información</span>
                  </li>
                  <li className="flex gap-3 text-gray-300">
                    <span className="text-[#C5A059] min-w-fit font-bold text-lg">✓</span>
                    <span className="font-[Cormorant_Garamond] text-lg leading-relaxed">Tu guía espiritual colabora activamente en el proceso de sanación</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#0f172a] border border-[#C5A059]/20 p-6">
                <p className="text-gray-300 italic font-[Cormorant_Garamond] text-lg leading-relaxed text-center">
                  "Usando las herramientas correctas y con la ayuda de tu guía espiritual podemos entender, analizar y liberar cada una de estas situaciones."
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
