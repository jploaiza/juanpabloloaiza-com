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
    <section className="py-20 px-4 bg-gradient-to-b from-black via-[#110f1e] to-black">
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
          ¿QUÉ ES LA TERAPIA DE REGRESIÓN A VIDAS PASADAS?
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div variants={itemVariants}>
            <div className="aspect-video bg-[#110f1e] rounded-lg overflow-hidden">
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
            <p className="body-text text-lg leading-relaxed">
              Los problemas en nuestra vida presente muchas veces pueden estar vinculados a situaciones que nos han sucedido en los primeros años de esta, pero también podrían estar vinculados directamente a situaciones que hemos vivido en vidas pasadas.
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="headline-md text-[#d4a017] mb-2">
                  Conceptos Clave
                </h3>
                <ul className="space-y-3 body-text">
                  <li className="flex gap-3">
                    <span className="text-[#d4a017] min-w-fit">✓</span>
                    <span>El alma es inmortal y acumula información de todas tus encarnaciones</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#d4a017] min-w-fit">✓</span>
                    <span>Los problemas actuales frecuentemente tienen raíces en vidas pasadas</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#d4a017] min-w-fit">✓</span>
                    <span>Mediante meditación guiada e hipnosis clínica accedemos a esa información</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#d4a017] min-w-fit">✓</span>
                    <span>Tu guía espiritual colabora activamente en el proceso de sanación</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#1a1535] border-l-4 border-[#d4a017] p-4">
                <p className="body-text italic">
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
