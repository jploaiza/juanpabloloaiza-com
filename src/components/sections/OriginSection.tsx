"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function OriginSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    hover: { y: -10, transition: { duration: 0.3 } },
  };

  const explorationAreas = [
    {
      title: "Vidas Pasadas",
      description: "Karma no resuelto de encarnaciones anteriores que afecta tu presente",
      image: "/assets/doors/past-lives.webp",
    },
    {
      title: "Vida Presente",
      description: "Traumas de infancia y vientre que influyen en tu bienestar actual",
      image: "/assets/doors/present-life.webp",
    },
    {
      title: "Transgeneracional",
      description: "Patrones familiares heredados que necesitan sanación ancestral",
      image: "/assets/doors/transgenerational.webp",
    },
    {
      title: "Entre Vidas",
      description: "Decisiones pre-encarnación que moldean tus circunstancias actuales",
      image: "/assets/doors/between-lives.webp",
    },
  ];

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
          variants={cardVariants}
          className="headline-lg text-center mb-16"
        >
          DESCUBRE EL ORIGEN DE TUS CONFLICTOS
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {explorationAreas.map((area, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover="hover"
              className="group"
            >
              <div className="glass-card p-6 h-full flex flex-col relative overflow-hidden">
                <div className="relative h-40 mb-6 -mx-6 -mt-6">
                  <Image
                    src={area.image}
                    alt={area.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                <h3 className="headline-md text-[#d4a017] mb-3">
                  {area.title}
                </h3>
                <p className="body-text text-sm flex-grow">
                  {area.description}
                </p>

                <div className="mt-4 text-[#d4a017] text-sm font-semibold">
                  Explorar →
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={cardVariants}
          className="mt-16 bg-gradient-to-r from-[#110f1e] to-[#1a1535] border border-[#d4a017]/20 rounded-lg p-8"
        >
          <p className="body-text text-center text-lg">
            Cada área representa una dimensión profunda de tu ser. Juntos exploraremos cuál es la raíz real de tus conflictos y cómo transformarlos.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
