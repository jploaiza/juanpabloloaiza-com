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
      description: "Las acciones que realizamos en vidas pasadas, las relaciones poco saludables y los karmas no resueltos pueden influir en nuestra vida presente, generando conflictos y desafíos. Es fundamental comprender y sanar estos aspectos para avanzar y encontrar paz y equilibrio en nuestra existencia actual.",
      image: "/assets/doors/past-lives.webp",
    },
    {
      title: "Vida Presente",
      description: "Comprender tu vida presente es tan crucial como entender tus vidas pasadas. En esta vida, podemos encontrar traumas de la infancia e incluso desde el vientre materno, los cuales pueden influir profundamente en nuestro presente. Reconocer y sanar estos traumas es esencial para vivir una vida plena y equilibrada.",
      image: "/assets/doors/present-life.webp",
    },
    {
      title: "Transgeneracional",
      description: "Explora problemas y patrones heredados de generaciones anteriores. Las heridas de nuestros ancestros se transmiten de generación en generación hasta que alguien del clan las sane. Al conectar con estos traumas, liberamos heridas que no son nuestras, pero que nos afectan profundamente.",
      image: "/assets/doors/transgenerational.webp",
    },
    {
      title: "Entre Vidas",
      description: "En el proceso entre vidas, antes de nuestra última encarnación, decidimos las lecciones que aprenderemos y la vida que viviremos. Esto nos ayuda a entender por qué tenemos ciertos padres, familia y relaciones, y cómo estos aspectos influyen en nuestros desafíos actuales.",
      image: "/assets/doors/between-lives.webp",
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
            <h2 className="text-4xl md:text-5xl text-white mb-2 font-cinzel">Descubre el Origen de tus Conflictos</h2>
            <p className="text-[#C5A059] font-[Cormorant_Garamond] text-xl italic">Para sanar profundamente, primero debemos descubrir el origen de lo que nos enfermó.</p>
          </div>
          <div className="mt-6 md:mt-0">
            <a href="#ListaDeAdmision" className="text-sm uppercase tracking-widest text-gray-400 hover:text-white transition">
              Comienza Ahora →
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
                className="absolute inset-0 w-full h-full object-cover transition duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-80"
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
