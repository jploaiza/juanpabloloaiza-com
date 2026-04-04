"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQSection() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const faqs = [
    {
      question: "¿Se puede realizar en línea?",
      answer:
        "Sí, completamente segura vía Zoom. Se han completado más de 200 sesiones exitosas en línea sin ningún problema.",
    },
    {
      question: "¿Puedo tomar solo una sesión?",
      answer:
        "No es recomendado. Una sola sesión deja muchas preguntas sin responder. El proceso típicamente requiere 3-5 sesiones.",
    },
    {
      question: "¿Existen contraindicaciones?",
      answer:
        "Solo para personas diagnosticadas con condiciones de salud mental bajo medicación. En esos casos, consulta con tu médico primero.",
    },
    {
      question: "¿Podré entrar en hipnosis?",
      answer:
        "Sí. Si puedes dormir, puedes entrar en hipnosis. Es un estado natural y cómodo de relajación profunda.",
    },
    {
      question: "¿Qué pasa si se corta la llamada?",
      answer:
        "Puedes reconectarte vía Zoom fácilmente. También puedes auto-salir de la hipnosis como lo harías al despertar naturalmente.",
    },
    {
      question: "¿Qué pasa si no veo nada?",
      answer:
        "Ver imágenes claras no es el objetivo. La conexión emocional es lo más importante. Algunos ven imágenes vívidas, otros sienten y saben.",
    },
    {
      question: "¿Y si me lo estuviera imaginando?",
      answer:
        "La imaginación carece de emoción real. Los recuerdos auténticos llevan intensidad emocional genuina que no puede ser fabricada.",
    },
    {
      question: "¿Voy a estar inconsciente?",
      answer:
        "No. Tu mente consciente permanece presente observando todo. Estás en control total durante toda la sesión.",
    },
    {
      question: "¿Me acordaré de algo?",
      answer:
        "Sí, tienes recuerdo completo de las experiencias. El conocimiento adquirido se integra naturalmente en tu consciencia.",
    },
    {
      question: "¿Las sesiones se graban?",
      answer:
        "Sí, se graban automáticamente vía Zoom en audio y video. Están disponibles a tu solicitud para que puedas revisar.",
    },
    {
      question: "¿Quién puede tomar esta terapia?",
      answer:
        "Prácticamente todos, excepto personas con diagnóstico de enfermedad mental que requiera medicación. El bienestar es para todos.",
    },
  ];

  return (
    <section className="py-20 px-4 bg-black">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-4xl mx-auto"
      >
        <motion.h2
          variants={itemVariants}
          className="headline-lg text-center mb-12"
        >
          Preguntas Frecuentes
        </motion.h2>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="glass-card overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedIndex(expandedIndex === index ? null : index)
                }
                className="w-full p-6 flex items-center justify-between hover:bg-white/10 transition"
              >
                <h3 className="body-text font-semibold text-left">
                  {faq.question}
                </h3>
                <motion.div
                  animate={{ rotate: expandedIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0 ml-4"
                >
                  <ChevronDown className="w-5 h-5 text-[#d4a017]" />
                </motion.div>
              </button>

              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: expandedIndex === index ? "auto" : 0,
                  opacity: expandedIndex === index ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 border-t border-[#d4a017]/20">
                  <p className="body-text text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={itemVariants}
          className="mt-12 text-center"
        >
          <p className="body-text">
            ¿Tienes más preguntas? Contáctame directamente por{" "}
            <a
              href="https://api.whatsapp.com/send?phone=56962081884"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4a017] hover:underline"
            >
              WhatsApp
            </a>
            {" "}o{" "}
            <a
              href="mailto:contacto@juanpabloloaiza.com"
              className="text-[#d4a017] hover:underline"
            >
              correo electrónico
            </a>
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
