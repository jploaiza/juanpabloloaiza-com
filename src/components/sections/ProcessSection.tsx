"use client";

import { motion } from "framer-motion";

export default function ProcessSection() {
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

  const steps = [
    {
      number: "I",
      title: "Revelación",
      icon: "fas fa-search",
      description: "Accedemos con precisión quirúrgica al origen del bloqueo. Nada queda oculto ante la luz de la consciencia.",
    },
    {
      number: "II",
      title: "Comprensión",
      icon: "fas fa-balance-scale",
      description: "Elevamos tu perspectiva. Entendemos el pacto álmico detrás del dolor para disolverlo desde la sabiduría.",
    },
    {
      number: "III",
      title: "Transmutación",
      icon: "fas fa-gem",
      description: "Limpieza energética total. Cortamos lazos y reprogramamos tu campo para vibrar en abundancia y paz.",
    },
  ];

  return (
    <section id="ComoFunciona" className="py-28 bg-[#020617] relative border-t border-[#C5A059]/5">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold">Cómo Funciona</span>
          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-5xl text-white mt-4 mb-4 font-cinzel"
          >
            El Proceso de Sanación
          </motion.h2>
          <div className="w-16 h-[1px] bg-[#C5A059] mx-auto"></div>
        </motion.div>

        {/* Three steps grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-10 relative mb-16"
        >
          {/* Timeline line */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A059]/30 to-transparent z-0"></div>

          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="glass-card p-10 relative z-10 text-center group bg-[#0f172a]"
            >
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#020617] border border-[#C5A059] rounded-full flex items-center justify-center text-[#C5A059] text-xs font-bold">
                {step.number}
              </div>

              <div className="mb-6 mt-4">
                <i className={`${step.icon} text-3xl text-[#C5A059] opacity-80`}></i>
              </div>
              <h3 className="text-2xl text-white mb-4 font-cinzel">{step.title}</h3>
              <p className="font-[Cormorant_Garamond] text-lg text-gray-400 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Process note */}
        <motion.p
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mt-12 text-gray-500 text-xs uppercase tracking-widest font-light"
        >
          <i className="fas fa-star text-[#C5A059] mr-2"></i> Proceso exclusivo de 3 a 5 sesiones personalizadas
        </motion.p>
      </div>
    </section>
  );
}
