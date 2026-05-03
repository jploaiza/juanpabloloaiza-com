"use client";
import ScrollDivider from "@/components/ScrollDivider";
import HeraldFrame from "@/components/HeraldFrame";

import { motion } from "framer-motion";
import { Mail, Phone, Globe } from "lucide-react";

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
      icon: Globe,
      title: "Atención Internacional",
      value: "Sana donde sea que estés",
      href: "#",
    },
  ];

  return (
    <section id="contacto" className="py-28 bg-[#0a1628] relative border-t border-[#C5A059]/5">
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
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold font-cinzel">Comunicación Directa</span>
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
          <ScrollDivider className="mt-6" />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <HeraldFrame size={48} className="h-full">
                  <a
                    href={method.href}
                    target={method.href.startsWith("http") ? "_blank" : "_self"}
                    rel={method.href.startsWith("http") ? "noopener noreferrer" : ""}
                    className="group flex flex-col items-center bg-[#16213e] border border-[#C5A059]/20 hover:border-[#C5A059]/40 p-8 text-center transition duration-300 h-full"
                  >
                    <div className="flex justify-center mb-6">
                      <Icon className="w-8 h-8 text-[#C5A059] group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="font-cinzel text-white mb-2 uppercase text-sm tracking-widest">
                      {method.title}
                    </h3>
                    <p className="text-[#C5A059] font-light font-crimson text-lg">
                      {method.value}
                    </p>
                  </a>
                </HeraldFrame>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          variants={itemVariants}
          className="relative bg-[#16213e] border border-[#C5A059]/20 p-12 text-center"
        >
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#C5A059]/60"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#C5A059]/60"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#C5A059]/60"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#C5A059]/60"></div>
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
