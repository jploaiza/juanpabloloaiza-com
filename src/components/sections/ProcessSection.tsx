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
      title: "Descubrir",
      icon: "fas fa-search",
      description: "Accedemos al origen de lo que nos sucedió. Exploramos vidas pasadas, la vida presente, el transgeneracional y la entre vida para descubrir la raíz de tus conflictos.",
    },
    {
      number: "II",
      title: "Entender",
      icon: "fas fa-balance-scale",
      description: "Comprendemos el significado y las lecciones detrás de lo descubierto. Esta etapa puede extenderse a dos o tres sesiones según lo que necesites trabajar y el consejo de tu guía espiritual.",
    },
    {
      number: "III",
      title: "Limpiar",
      icon: "fas fa-gem",
      description: "Liberamos y limpiamos todo lo que hemos trabajado para que puedas recuperar la felicidad. Cortamos lazos, liberamos energías y espíritus, y cerramos el proceso terapéutico.",
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
          <motion.p
            variants={itemVariants}
            className="text-gray-300 font-[Cormorant_Garamond] text-lg max-w-2xl mx-auto mt-4"
          >
            La terapia de regresión a vidas pasadas es un proceso terapéutico que se compone de tres etapas. Tenemos un principio y un final, lo que nos permite asegurar un gran beneficio para tu proceso.
          </motion.p>
          <div className="w-16 h-[1px] bg-[#C5A059] mx-auto mt-6"></div>
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

        {/* Process details */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 mt-12"
        >
          {[
            {
              icon: "fas fa-calendar-alt",
              title: "3 a 5 Sesiones",
              text: "El proceso básico comprende 3 sesiones. Tu guía espiritual indicará si es necesaria una cuarta o quinta sesión.",
            },
            {
              icon: "fas fa-video",
              title: "Sesiones por Zoom",
              text: "Todas las sesiones se realizan en línea vía Zoom. No importa dónde te encuentres, siempre que tengas conexión a Internet.",
            },
            {
              icon: "fas fa-clipboard-list",
              title: "Entrevista Gratuita",
              text: "Antes de comenzar, realizamos una entrevista completamente gratuita para conocernos y evaluar tu caso.",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex items-start gap-4 p-6 bg-[#0f172a]/60 border border-[#C5A059]/10"
            >
              <i className={`${item.icon} text-[#C5A059] text-xl mt-1`}></i>
              <div>
                <h4 className="text-white font-cinzel text-sm uppercase tracking-widest mb-2">{item.title}</h4>
                <p className="text-gray-400 text-sm font-[Cormorant_Garamond] leading-relaxed">{item.text}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
