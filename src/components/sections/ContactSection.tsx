"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactSection() {
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

  const contactMethods = [
    {
      icon: Phone,
      title: "WhatsApp / Teléfono",
      value: "+56 9 6208 1884",
      href: "https://api.whatsapp.com/send?phone=56962081884",
    },
    {
      icon: Mail,
      title: "Correo Electrónico",
      value: "contacto@juanpabloloaiza.com",
      href: "mailto:contacto@juanpabloloaiza.com",
    },
    {
      icon: MapPin,
      title: "Cobertura",
      value: "Sesiones en todo el mundo",
      href: "#",
    },
  ];

  return (
    <section id="contacto" className="py-28 bg-[#020617] relative border-t border-[#C5A059]/5">
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
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold">Comunicación Directa</span>
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl text-white mt-4 mb-4 font-cinzel"
          >
            Conectemos
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-gray-300 font-crimson text-xl max-w-2xl mx-auto"
          >
            Ponte en contacto para una entrevista preliminar gratuita
          </motion.p>
          <div className="w-16 h-[1px] bg-[#C5A059] mx-auto mt-6"></div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <motion.a
                key={index}
                variants={itemVariants}
                href={method.href}
                target={method.href.startsWith("http") ? "_blank" : "_self"}
                rel={method.href.startsWith("http") ? "noopener noreferrer" : ""}
                className="group relative bg-[#0f172a] border border-[#C5A059]/20 hover:border-[#C5A059]/40 p-8 text-center transition duration-300"
              >
                {/* Ornate corner frames */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#C5A059]/30 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#C5A059]/30 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#C5A059]/30 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#C5A059]/30 opacity-0 group-hover:opacity-100 transition duration-300"></div>

                <div className="flex justify-center mb-6">
                  <Icon className="w-8 h-8 text-[#C5A059] group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-almendra text-white mb-2 uppercase text-sm tracking-widest">
                  {method.title}
                </h3>
                <p className="text-[#C5A059] font-light font-crimson text-lg">
                  {method.value}
                </p>
              </motion.a>
            );
          })}
        </div>

        <motion.div
          variants={itemVariants}
          className="bg-[#0f172a] border border-[#C5A059]/20 p-12 text-center"
        >
          <p className="text-gray-300 font-crimson text-lg mb-8">
            ✨ Disponible para sesiones vía Zoom en todo el mundo
          </p>
          <a
            href="https://api.whatsapp.com/send?phone=56962081884"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold inline-block"
          >
            Enviar Mensaje por WhatsApp
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
