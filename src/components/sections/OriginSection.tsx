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
    hover: { y: -15, transition: { duration: 0.3 } },
  };

  const explorationAreas = [
    {
      title: "Vidas Pasadas",
      description: "Memorias de poder y dolor de otras encarnaciones que moldean tu presente.",
      image: "/assets/doors/past-lives.webp",
    },
    {
      title: "Vida Presente",
      description: "La niña interior y las memorias uterinas que dictan tus reacciones hoy.",
      image: "/assets/doors/present-life.webp",
    },
    {
      title: "Entre Vidas",
      description: "El espacio sagrado donde tu alma diseñó su misión antes de nacer.",
      image: "/assets/doors/between-lives.webp",
    },
    {
      title: "Linaje Ancestral",
      description: "Sanación del clan. Liberamos las lealtades invisibles que heredas de tus ancestros.",
      image: "/assets/doors/transgenerational.webp",
    },
  ];

  return (
    <section id="QueEsTRVP" className="py-28 bg-[#050b1a] relative overflow-hidden">
      {/* Decorative background gradient */}
      <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#312e81]/5 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-white/5 pb-8"
        >
          <div>
            <h2 className="text-4xl md:text-5xl text-white mb-2 font-cinzel">Los 4 Pilares de la Memoria</h2>
            <p className="text-[#C5A059] font-[Cormorant_Garamond] text-xl italic">"La llave de tu libertad reside en tu propia historia."</p>
          </div>
          <div className="mt-6 md:mt-0">
            <a href="#ListaDeAdmision" className="text-sm uppercase tracking-widest text-gray-400 hover:text-white transition">
              Agendar Evaluación →
            </a>
          </div>
        </motion.div>

        {/* 4 doors grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {explorationAreas.map((area, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover="hover"
              className="group relative h-[500px] overflow-hidden bg-[#0f172a] border border-white/5 hover:border-[#C5A059]/40 transition duration-700"
            >
              {/* Ornate corner frames */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#C5A059]/40 z-20 opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#C5A059]/40 z-20 opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#C5A059]/40 z-20 opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#C5A059]/40 z-20 opacity-0 group-hover:opacity-100 transition duration-300"></div>

              {/* Image with overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition duration-700 z-10"></div>
              <Image
                src={area.image}
                alt={area.title}
                fill
                className="absolute inset-0 w-full h-full object-cover transition duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-80 grayscale"
              />

              {/* Content */}
              <div className="absolute bottom-0 left-0 w-full p-8 z-20">
                <motion.div
                  initial={{ width: 40 }}
                  whileHover={{ width: 80 }}
                  transition={{ duration: 0.5 }}
                  className="h-[1px] bg-[#C5A059] mb-4"
                ></motion.div>
                <h3 className="text-2xl text-white mb-2 font-cinzel">{area.title}</h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-sm text-gray-300 leading-relaxed font-light"
                >
                  {area.description}
                </motion.p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
