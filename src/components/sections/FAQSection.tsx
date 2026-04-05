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
    <section id="PreguntasFrecuentes" className="py-28 bg-[#020617] relative border-y border-[#C5A059]/5">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-4xl mx-auto px-4"
      >
        <motion.div
          variants={itemVariants}
          className="text-center mb-16"
        >
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold">Claridad Total</span>
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl text-white mt-4 mb-4 font-cinzel"
          >
            Preguntas Frecuentes
          </motion.h2>
          <div className="w-16 h-[1px] bg-[#C5A059] mx-auto"></div>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative bg-[#0f172a] border border-[#C5A059]/20 hover:border-[#C5A059]/40 transition duration-300 overflow-hidden"
            >
              {/* Ornate corner accent */}
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#C5A059]/30 opacity-0 group-hover:opacity-100 transition duration-300"></div>

              <button
                onClick={() =>
                  setExpandedIndex(expandedIndex === index ? null : index)
                }
                className="w-full p-6 flex items-center justify-between hover:bg-[#C5A059]/5 transition"
              >
                <h3 className="text-white font-light text-left font-[Cormorant_Garamond] text-lg">
                  {faq.question}
                </h3>
                <motion.div
                  animate={{ rotate: expandedIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0 ml-4"
                >
                  <ChevronDown className="w-5 h-5 text-[#C5A059]" />
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
                <div className="px-6 pb-6 border-t border-[#C5A059]/20">
                  <p className="text-gray-300 text-sm leading-relaxed font-light font-[Cormorant_Garamond]">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={itemVariants}
          className="mt-16 text-center"
        >
          <p className="text-gray-300 font-[Cormorant_Garamond] text-lg">
            ¿Tienes más preguntas?{" "}
            <a
              href="https://api.whatsapp.com/send?phone=56962081884"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C5A059] hover:text-[#F3E5AB] transition"
            >
              Contáctame por WhatsApp
            </a>
            {" "}o{" "}
            <a
              href="mailto:contacto@juanpabloloaiza.com"
              className="text-[#C5A059] hover:text-[#F3E5AB] transition"
            >
              correo
            </a>
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
