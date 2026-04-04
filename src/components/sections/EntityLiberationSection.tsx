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
    "Fatiga inexplicable",
    "Pensamientos negativos recurrentes",
    "Pesadillas frecuentes o problemas para dormir",
    "Dolores físicos sin causa aparente",
  ];

  const benefits = [
    "Claridad mental",
    "Paz interior",
    "Energía renovada",
    "Mejora en las relaciones",
    "Reconexión espiritual",
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-[#0a0812] via-[#110f1e] to-[#0a0812]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-6xl mx-auto"
      >
        <motion.h2
          variants={itemVariants}
          className="headline-lg text-center mb-4"
        >
          Liberación De Entidades Espirituales
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="subtitle text-center mb-12 max-w-3xl mx-auto"
        >
          Una terapia complementaria para limpiar energías externas
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="grid md:grid-cols-2 gap-12 mb-12"
        >
          <div className="space-y-6">
            <div>
              <h3 className="headline-md text-[#d4a017] mb-3">
                Raíces Históricas
              </h3>
              <p className="body-text leading-relaxed">
                La Terapia de Liberación de Entidades Espirituales tiene sus raíces en los estudios del Dr. Carl Wickland a principios del siglo 20, posteriormente refinada por el Dr. William Baldwin.
              </p>
              <p className="body-text mt-4 leading-relaxed">
                Esta práctica aborda cómo entidades o energías externas pueden afectar tu bienestar general y tu vida cotidiana.
              </p>
            </div>

            <div>
              <h3 className="headline-md text-[#d4a017] mb-3">
                Síntomas Comunes
              </h3>
              <ul className="space-y-2">
                {symptoms.map((symptom, index) => (
                  <li key={index} className="flex gap-3 body-text">
                    <span className="text-[#d4a017]">→</span>
                    <span>{symptom}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="headline-md text-[#d4a017] mb-3">
                Beneficios de la Liberación
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="glass-card p-4 border-l-4 border-[#d4a017]"
                  >
                    <p className="body-text text-sm font-semibold">
                      {benefit}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1a1535] border border-[#d4a017]/20 rounded-lg p-6">
              <p className="body-text text-sm">
                ✨ La liberación de entidades es un proceso seguro y efectivo que puede transformar significativamente tu calidad de vida.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-[#110f1e] to-[#1a1535] border border-[#d4a017]/20 rounded-lg p-8 text-center"
        >
          <button className="btn-gold">
            Conoce más sobre Liberación Espiritual
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
