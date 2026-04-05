"use client";
import ScrollDivider from "@/components/ScrollDivider";
import HeraldFrame from "@/components/HeraldFrame";
import { motion } from "framer-motion";

export default function TherapySection() {
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
    <section className="py-28 bg-gradient-to-b from-[#020617] via-[#050b1a] to-[#020617] relative border-y border-[#C5A059]/5">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-6xl mx-auto px-4"
      >
        <motion.div
          variants={itemVariants}
          className="text-center mb-16"
        >
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold font-cinzel">¿Qué son las Vidas Pasadas?</span>
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl text-white mt-4 mb-4 font-cinzel"
          >
            La Terapia de Regresión a Vidas Pasadas
          </motion.h2>
          <ScrollDivider className="mt-6" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div variants={itemVariants} className="flex justify-center">
            <HeraldFrame size={64} className="w-full max-w-xs">
              <div className="bg-black border border-[#C5A059]/20 overflow-hidden" style={{ aspectRatio: "9/16" }}>
                <video
                  src="https://pub-60ec8d051cfb4b658728c606968895bb.r2.dev/Que-es-la-terapia-de-Regresion-a-Vidas-Pasadas.mp4"
                  controls
                  className="w-full h-full object-contain"
                  controlsList="nodownload"
                  disablePictureInPicture
                />
              </div>
            </HeraldFrame>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6">
            <p className="text-gray-300 font-crimson text-xl leading-relaxed">
              Los problemas en nuestra vida presente muchas veces pueden estar vinculados a situaciones que nos han sucedido en los primeros años de esta, pero también podrían estar vinculados directamente a situaciones que hemos vivido en vidas pasadas.
            </p>

            <p className="text-gray-300 font-crimson text-xl leading-relaxed">
              Somos almas inmortales, hemos vivido innumerables vidas a través de millones de años. Nuestra alma alberga toda esa información y a través de un proceso de meditación guiada e hipnosis clínica podemos acceder a ella para trabajar con ella.
            </p>

            <div className="space-y-6">
              <div>
                <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold font-cinzel">Lo que trabajamos en el proceso</span>
                <ul className="space-y-4 mt-4">
                  <li className="flex gap-3 text-gray-300">
                    <span className="text-[#C5A059] min-w-fit font-bold text-lg">✓</span>
                    <span className="font-crimson text-lg leading-relaxed">Energías, karmas y contratos antiguos que afectan tu vida presente</span>
                  </li>
                  <li className="flex gap-3 text-gray-300">
                    <span className="text-[#C5A059] min-w-fit font-bold text-lg">✓</span>
                    <span className="font-crimson text-lg leading-relaxed">Situaciones de vidas pasadas que aún no han sido liberadas correctamente</span>
                  </li>
                  <li className="flex gap-3 text-gray-300">
                    <span className="text-[#C5A059] min-w-fit font-bold text-lg">✓</span>
                    <span className="font-crimson text-lg leading-relaxed">Energías y espíritus que podrían estar impidiéndote vivir la mejor versión de ti</span>
                  </li>
                  <li className="flex gap-3 text-gray-300">
                    <span className="text-[#C5A059] min-w-fit font-bold text-lg">✓</span>
                    <span className="font-crimson text-lg leading-relaxed">Con la ayuda de tu guía espiritual, entendemos, analizamos y liberamos cada situación</span>
                  </li>
                </ul>
              </div>

              <HeraldFrame size={56}>
                <div className="bg-[#0f172a] border border-[#C5A059]/20 p-6">
                  <p className="text-gray-300 italic font-crimson text-xl leading-relaxed text-center">
                    "Este potente proceso terapéutico es un viaje a tu vida actual, a tus vidas pasadas y a tu vida espiritual, en el cual te guiaré para que encuentres tu verdad y vivas la mejor versión de ti."
                  </p>
                </div>
              </HeraldFrame>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
