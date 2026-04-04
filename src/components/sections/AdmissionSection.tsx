"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function AdmissionSection() {
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
          Admisión a la Terapia
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div variants={itemVariants} className="space-y-6">
            <p className="body-text text-lg">
              Para comenzar este viaje transformador, necesitamos que completes un formulario de admisión. Esto nos ayuda a:
            </p>

            <ul className="space-y-3">
              {[
                "Entender tu situación y tus principales conflictos",
                "Evaluar tu disponibilidad y comprometimiento",
                "Preparar una sesión personalizada",
                "Establecer objetivos claros para tu terapia",
              ].map((item, index) => (
                <li key={index} className="flex gap-3 body-text">
                  <span className="text-[#d4a017] min-w-fit">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="bg-[#110f1e] border-l-4 border-[#d4a017] p-6 rounded">
              <p className="body-text font-semibold text-[#d4a017] mb-2">
                Nota importante:
              </p>
              <p className="body-text text-sm">
                Espacios limitados disponibles. El proceso es personalizado y dedicado a cada cliente. Se requiere entrevista preliminar gratuita antes de comenzar.
              </p>
            </div>

            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="#admission-form"
              className="btn-gold inline-block"
            >
              Comenzar Formulario de Admisión
            </motion.a>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="relative aspect-[4/5] rounded-lg overflow-hidden"
          >
            <Image
              src="/assets/images/admission-form.webp"
              alt="Formulario de Admisión"
              fill
              className="object-cover"
            />
          </motion.div>
        </div>

        <motion.div
          variants={itemVariants}
          className="mt-12 bg-gradient-to-r from-[#110f1e] to-[#1a1535] rounded-lg p-8"
        >
          <h3 className="headline-md text-center mb-6">
            Próximos Pasos
          </h3>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                number: "1",
                title: "Completa el Formulario",
                description: "Responde con honestidad sobre tu situación",
              },
              {
                number: "2",
                title: "Entrevista Gratuita",
                description: "Nos conocemos y evaluamos tu caso",
              },
              {
                number: "3",
                title: "Plan Personalizado",
                description: "Diseñamos tu proceso terapéutico",
              },
              {
                number: "4",
                title: "Comienza tu Viaje",
                description: "Primera sesión vía Zoom",
              },
            ].map((step, index) => (
              <div
                key={index}
                className="text-center p-4 glass-card"
              >
                <div className="text-3xl font-bold text-[#d4a017] mb-2">
                  {step.number}
                </div>
                <h4 className="body-text font-semibold mb-2">
                  {step.title}
                </h4>
                <p className="body-text text-sm text-gray-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
