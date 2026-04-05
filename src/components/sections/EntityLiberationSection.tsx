"use client";

import { motion } from "framer-motion";

export default function EntityLiberationSection() {
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

  const symptoms = [
    "Eliminación de drenajes energéticos.",
    "Corte de lazos tóxicos.",
    "Restauración del aura.",
    "Reprogramación del campo energético.",
  ];

  const benefits = [
    { icon: "fas fa-lightbulb", title: "Claridad Mental" },
    { icon: "fas fa-heart", title: "Paz Interior" },
    { icon: "fas fa-bolt", title: "Energía Renovada" },
    { icon: "fas fa-handshake", title: "Mejora Relacional" },
  ];

  return (
    <section id="liberacion" className="py-28 bg-[#020617] border-y border-[#C5A059]/5 relative">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-20 items-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="order-2 md:order-1"
        >
          <motion.div variants={itemVariants} className="flex items-center space-x-4 mb-6">
            <span className="h-[1px] w-10 bg-[#C5A059]"></span>
            <span className="text-[#C5A059] uppercase tracking-widest text-xs font-bold">Liberación de Entidades</span>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl text-white mb-8 font-cinzel leading-tight"
          >
            Liberación de <br/>Entidades Espirituales
          </motion.h2>

          <motion.div
            variants={itemVariants}
            className="prose prose-invert text-gray-400 mb-10 font-[Cormorant_Garamond] text-xl leading-relaxed font-light"
          >
            <p>La excelencia requiere pureza energética. Muchas veces, el agotamiento o el bloqueo mental no son tuyos, sino interferencias externas adheridas a tu campo.</p>
            <p>Realizamos un barrido profundo para que recuperes el 100% de tu vitalidad y soberanía.</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 gap-4 border-l border-[#C5A059]/20 pl-6"
          >
            {symptoms.map((symptom, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center text-gray-300"
              >
                <i className="fas fa-check text-[#C5A059] mr-4 text-xs"></i>
                <span>{symptom}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right side - Image/Video area */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative order-1 md:order-2"
        >
          {/* Ornate frame border */}
          <motion.div
            variants={itemVariants}
            className="absolute -top-4 -right-4 w-full h-full border-2 border-[#C5A059]/30 rounded-sm z-0"
          ></motion.div>

          <motion.div
            variants={itemVariants}
            className="relative z-10 bg-[#0f172a] p-2 shadow-2xl"
          >
            <div className="aspect-video bg-black flex items-center justify-center relative group cursor-pointer overflow-hidden border border-[#C5A059]/20">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#312e81]/40 via-transparent to-[#C5A059]/10 mix-blend-overlay"></div>

              {/* Decorative corner frames */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#C5A059]/50"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#C5A059]/50"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#C5A059]/50"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#C5A059]/50"></div>

              {/* Play button */}
              <motion.div
                whileHover={{ scale: 1.15 }}
                className="z-10 flex flex-col items-center"
              >
                <div className="w-24 h-24 rounded-full border-2 border-white/30 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:bg-[#C5A059] group-hover:border-[#C5A059] transition duration-500 relative">
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border border-white/10"></div>
                  {/* Play icon */}
                  <i className="fas fa-play text-white ml-1 text-2xl group-hover:text-[#020617] transition duration-500"></i>
                </div>
                <span className="text-white text-xs uppercase tracking-widest border-b border-transparent group-hover:border-white transition">
                  Ver Explicación
                </span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
