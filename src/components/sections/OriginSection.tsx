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

  const R2 = "https://pub-60ec8d051cfb4b658728c606968895bb.r2.dev/images";

  const explorationAreas = [
    {
      title: "Vidas Pasadas",
      description: "Las acciones que realizamos en vidas pasadas, las relaciones poco saludables y los karmas no resueltos pueden influir en nuestra vida presente, generando conflictos y desafíos. Es fundamental comprender y sanar estos aspectos para avanzar y encontrar paz y equilibrio en nuestra existencia actual.",
      image: `${R2}/doorpast1.png`,
    },
    {
      title: "Vida Presente",
      description: "Comprender tu vida presente es tan crucial como entender tus vidas pasadas. En esta vida, podemos encontrar traumas de la infancia e incluso desde el vientre materno, los cuales pueden influir profundamente en nuestro presente. Reconocer y sanar estos traumas es esencial para vivir una vida plena y equilibrada.",
      image: `${R2}/doorpresent1.png`,
    },
    {
      title: "Transgeneracional",
      description: "Explora problemas y patrones heredados de generaciones anteriores. Las heridas de nuestros ancestros se transmiten de generación en generación hasta que alguien del clan las sane. Al conectar con estos traumas, liberamos heridas que no son nuestras, pero que nos afectan profundamente.",
      image: `${R2}/doorclan.png`,
    },
    {
      title: "Entre Vidas",
      description: "En el proceso entre vidas, antes de nuestra última encarnación, decidimos las lecciones que aprenderemos y la vida que viviremos. Esto nos ayuda a entender por qué tenemos ciertos padres, familia y relaciones, y cómo estos aspectos influyen en nuestros desafíos actuales.",
      image: `${R2}/doorentrevidas.png`,
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
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {explorationAreas.map((area, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover="hover"
              className="group flex flex-col items-center"
            >
              {/* Door image — full PNG, no cropping */}
              <div className="relative w-full flex items-end justify-center" style={{ height: "420px" }}>
                <Image
                  src={area.image}
                  alt={area.title}
                  fill
                  className="object-contain object-bottom transition duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>

              {/* Title and description below the door */}
              <div className="mt-5 text-center px-2">
                <div className="w-8 h-[1px] bg-[#C5A059] mx-auto mb-3 group-hover:w-16 transition-all duration-500" />
                <h3 className="text-lg font-cinzel text-white group-hover:text-[#C5A059] transition-colors duration-300 mb-3">
                  {area.title}
                </h3>
                <p className="text-gray-400 font-[Cormorant_Garamond] text-base italic leading-relaxed">
                  {area.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
