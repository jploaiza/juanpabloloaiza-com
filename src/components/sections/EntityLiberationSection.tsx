"use client";

import { motion } from "framer-motion";
import HeraldFrame from "@/components/HeraldFrame";
import { Lightbulb, Heart, Zap, Handshake, Star, ChevronRight } from "lucide-react";

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
    "Cambios bruscos de humor",
    "Miedos irracionales",
    "Pesadillas frecuentes o problemas para dormir",
    "Dolores físicos sin causa aparente",
    "Desconexión espiritual o pérdida de propósito",
    "Problemas en las relaciones personales",
    "Sensación de opresión o peso en el cuerpo",
    "Falta de motivación o apatía",
    "Inseguridades repentinas e inexplicables",
  ];

  const benefits = [
    { icon: "lightbulb", title: "Claridad Mental" },
    { icon: "heart", title: "Paz Interior" },
    { icon: "zap", title: "Energía Renovada" },
    { icon: "handshake", title: "Mejora en las Relaciones" },
    { icon: "star", title: "Reconexión Espiritual" },
  ];

  return (
    <section id="liberacion" className="py-28 bg-[#050b1a] border-y border-[#C5A059]/5 relative">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div variants={itemVariants} className="flex items-center justify-center space-x-4 mb-6">
            <span className="h-[1px] w-10 bg-[#C5A059]"></span>
            <span className="text-[#C5A059] uppercase tracking-widest text-xs font-bold font-cinzel">Liberación de Entidades Espirituales</span>
            <span className="h-[1px] w-10 bg-[#C5A059]"></span>
          </motion.div>
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl text-white mb-6 font-cinzel leading-tight"
          >
            Terapia de Liberación de<br />Entidades Espirituales
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-gray-300 font-crimson text-xl max-w-3xl mx-auto leading-relaxed"
          >
            Esta terapia tiene sus raíces en los estudios del Dr. Carl Wickland y fue perfeccionada por el Dr. William Baldwin, quienes desarrollaron métodos eficaces para identificar y liberar influencias espirituales o energéticas que interfieren en el bienestar de las personas.
          </motion.p>
        </motion.div>

        {/* Video */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mb-16"
        >
          <HeraldFrame size={64} className="w-full max-w-xs">
            <div className="bg-black border border-[#C5A059]/30 overflow-hidden" style={{ aspectRatio: "9/16" }}>
              <video
                src="https://pub-60ec8d051cfb4b658728c606968895bb.r2.dev/SRT1-2.mp4"
                controls
                className="w-full h-full object-contain"
                controlsList="nodownload"
                disablePictureInPicture
              />
            </div>
          </HeraldFrame>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16 items-start mb-16">
          {/* Left: Description */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="space-y-5 text-gray-300 font-crimson text-lg leading-relaxed">
              <p>
                Esta terapia aborda la presencia de energías externas o entidades espirituales que pueden adherirse al campo energético de una persona, afectando su salud mental, emocional y física.
              </p>
              <p>
                Estas entidades pueden ser espíritus de personas fallecidas que no han trascendido, o energías no humanas que se adhieren a través de estados de baja vibración emocional como el miedo, la ira o la tristeza profunda.
              </p>
              <p>
                A través de la hipnosis profunda, se accede a los planos energéticos de la persona para detectar y liberar estas influencias, guiando tanto a la entidad como al paciente hacia un estado de equilibrio energético.
              </p>
            </motion.div>

            {/* Benefits */}
            <motion.div variants={itemVariants} className="mt-10">
              <p className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold mb-6">Beneficios de la Terapia</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 bg-[#0f172a] border border-[#C5A059]/20 hover:border-[#C5A059]/40 transition"
                  >
                    {benefit.icon === "lightbulb" && <Lightbulb size={16} className="text-[#C5A059]" />}
                  {benefit.icon === "heart" && <Heart size={16} className="text-[#C5A059]" />}
                  {benefit.icon === "zap" && <Zap size={16} className="text-[#C5A059]" />}
                  {benefit.icon === "handshake" && <Handshake size={16} className="text-[#C5A059]" />}
                  {benefit.icon === "star" && <Star size={16} className="text-[#C5A059]" />}
                    <span className="text-gray-300 text-base font-crimson">{benefit.title}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Symptoms */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
            <HeraldFrame size={48}>
            <div className="bg-[#0f172a] border border-[#C5A059]/30 p-8">
              <p className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold mb-6">Síntomas que pueden indicar presencia de entidades</p>
              <ul className="space-y-3">
                {symptoms.map((symptom, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    className="flex items-start gap-3 text-gray-300 font-crimson text-lg"
                  >
                    <ChevronRight size={14} className="text-[#C5A059] mt-1 flex-shrink-0" />
                    <span>{symptom}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            </HeraldFrame>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="mt-6 text-gray-400 text-xl font-crimson italic leading-relaxed"
            >
              Estos síntomas pueden dificultar la vida diaria generando confusión y un sentimiento constante de estar fuera de control. Muchas veces no se identifican como influencias externas, lo que hace que la persona busque soluciones sin resultados duraderos.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
