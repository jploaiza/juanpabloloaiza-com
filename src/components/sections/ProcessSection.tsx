"use client";
import ScrollDivider from "@/components/ScrollDivider";
import HeraldFrame from "@/components/HeraldFrame";
import { motion } from "framer-motion";

export default function ProcessSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
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
      description:
        "Accedemos al origen de lo que nos sucedió. Exploramos vidas pasadas, la vida presente, el transgeneracional y la entre vida para descubrir la raíz de tus conflictos.",
    },
    {
      number: "II",
      title: "Entender",
      icon: "fas fa-balance-scale",
      description:
        "Comprendemos el significado y las lecciones detrás de lo descubierto. Esta etapa puede extenderse según lo que necesites trabajar y el consejo de tu guía espiritual.",
    },
    {
      number: "III",
      title: "Limpiar",
      icon: "fas fa-gem",
      description:
        "Liberamos y limpiamos todo lo trabajado para que puedas recuperar la felicidad. Cortamos lazos, liberamos energías y cerramos el proceso terapéutico.",
    },
  ];

  return (
    <section id="ComoFunciona" className="py-20 sm:py-28 bg-[#020617] relative border-t border-[#C5A059]/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold font-cinzel">Cómo Funciona</span>
          <motion.h2 variants={itemVariants} className="text-2xl sm:text-3xl md:text-5xl text-white mt-4 mb-4 font-cinzel">
            El Proceso de Sanación
          </motion.h2>
          <motion.p variants={itemVariants} className="text-gray-300 font-crimson text-lg max-w-2xl mx-auto mt-4 leading-relaxed">
            Un proceso terapéutico de hasta 10 sesiones, dividido en tres etapas. Tenemos un principio y un final, lo que nos permite asegurar un resultado real para ti.
          </motion.p>
          <ScrollDivider className="mt-6" />
        </motion.div>

        {/* Video */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-3xl mx-auto mb-20"
        >
          <HeraldFrame size={64}>
            <video
              src="https://pub-60ec8d051cfb4b658728c606968895bb.r2.dev/RVP1.m4v"
              controls
              className="w-full aspect-video object-contain bg-black border border-[#C5A059]/30"
              controlsList="nodownload"
              disablePictureInPicture
            />
          </HeraldFrame>
        </motion.div>

        {/* Three steps grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-3 gap-6 sm:gap-10 relative"
        >
          <div className="hidden sm:block absolute top-12 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A059]/30 to-transparent z-0" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-[#0f172a] p-8 sm:p-10 relative z-10 text-center group"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#020617] border border-[#C5A059] rounded-full flex items-center justify-center text-[#C5A059] text-xs font-bold font-cinzel">
                {step.number}
              </div>
              <div className="mb-6 mt-4">
                <i className={`${step.icon} text-3xl text-[#C5A059] opacity-80`} />
              </div>
              <h3 className="text-2xl sm:text-3xl text-white mb-4 font-cinzel font-bold">{step.title}</h3>
              <p className="font-crimson text-xl text-gray-300 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12 text-gray-500 text-xs uppercase tracking-widest"
        >
          <i className="fas fa-star text-[#C5A059] mr-2" /> Proceso de hasta 10 sesiones vía Zoom · Entrevista preliminar gratuita
        </motion.p>
      </div>
    </section>
  );
}
