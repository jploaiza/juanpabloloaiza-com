"use client";

import { motion } from "framer-motion";

export default function HeroSection() {
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
    <section className="hero-gradient min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#d4a017] rounded-full"
            initial={{
              x: `${(i * 3.3) % 100}%`,
              y: `${(i * 5) % 100}%`,
              opacity: 0.2 + (i * 0.01),
            }}
            animate={{
              y: ['0%', '-20px', '0%'],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + (i % 2),
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center px-4"
      >
        <motion.h1
          variants={itemVariants}
          className="headline-xl mb-4 text-white"
        >
          Regresión a Vidas Pasadas
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="subtitle mb-12 max-w-2xl mx-auto"
        >
          DEVUELVE LA FELICIDAD A TU VIDA
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-6 justify-center"
        >
          <button className="btn-gold">Comienza tu Viaje</button>
          <button className="btn-gold-outline">Conoce más</button>
        </motion.div>
      </motion.div>
    </section>
  );
}
