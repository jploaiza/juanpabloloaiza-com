"use client";

import { motion } from "framer-motion";
import { Sparkles, Brain, Lightbulb } from "lucide-react";

const services = [
  {
    id: 1,
    title: "REGRESIÓN A VIDAS PASADAS",
    description:
      "Explora tus vidas anteriores y descubre patrones que aún te afectan hoy.",
    icon: Sparkles,
  },
  {
    id: 2,
    title: "HIPNOTERAPIA TRANSFORMACIONAL",
    description:
      "Sana traumas profundos y libera creencias limitantes a través de la hipnosis.",
    icon: Brain,
  },
  {
    id: 3,
    title: "LIBERACIÓN ESPIRITUAL",
    description: "Conecta con tu propósito de vida y eleva tu consciencia.",
    icon: Lightbulb,
  },
];

export default function ServicesSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className="py-24 px-4 bg-[#110f1e]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="headline-lg mb-4">SERVICIOS PREMIUM</h2>
          <div className="h-1 w-24 bg-[#d4a017] mx-auto"></div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.id}
                variants={itemVariants}
                className="glass-card p-8 hover:scale-105 transition-transform"
              >
                <Icon className="w-16 h-16 text-[#d4a017] mb-4" />
                <h3 className="headline-md mb-4">{service.title}</h3>
                <p className="body-text">{service.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
