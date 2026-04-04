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

  return (
    <section className="py-20 px-4 bg-black">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-6xl mx-auto"
      >
        <motion.h2
          variants={itemVariants}
          className="headline-lg text-center mb-12"
        >
          ¿CÓMO FUNCIONA EL PROCESO?
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-8">
          <motion.div variants={itemVariants}>
            <div className="aspect-video bg-[#110f1e] rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="¿Cómo funciona el proceso?"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6">
            <p className="body-text text-lg">
              Mi nombre es Juan Pablo Loaiza, soy terapeuta holístico especialista en terapia de regresión a vidas pasadas, y te doy la bienvenida a este viaje para encontrar y devolver la felicidad a tu vida.
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="headline-md text-[#d4a017] mb-2">
                  Tres Etapas Fundamentales
                </h3>
                <ul className="space-y-2 body-text">
                  <li className="flex gap-3">
                    <span className="text-[#d4a017]">•</span>
                    <span><strong>Descubrir:</strong> Identificar el origen de tus conflictos</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#d4a017]">•</span>
                    <span><strong>Entender:</strong> Comprender las causas profundas</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#d4a017]">•</span>
                    <span><strong>Liberar:</strong> Sanar y transformar tu realidad</span>
                  </li>
                </ul>
              </div>

              <p className="body-text">
                <strong>Duración:</strong> Típicamente 3-5 sesiones, dependiendo de tu guía espiritual y necesidades personales.
              </p>

              <p className="body-text">
                <strong>Próximos pasos:</strong> Para comenzar este proceso, deberás llenar un formulario de admisión y responder varias preguntas que nos ayudarán a entender tu problema.
              </p>
            </div>

            <button className="btn-gold mt-4">
              Comienza tu Viaje
            </button>
          </motion.div>
        </div>

        <motion.div
          variants={itemVariants}
          className="bg-[#110f1e] border border-[#d4a017]/20 rounded-lg p-6 mt-12"
        >
          <p className="body-text text-center">
            ✨ Incluye una entrevista preliminar gratuita para evaluar tu caso • Sesiones vía Zoom para máxima comodidad • Acceso global
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
