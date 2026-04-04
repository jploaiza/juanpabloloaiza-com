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
      title: "Ubicación",
      value: "Medellín, Colombia",
      href: "#",
    },
  ];

  return (
    <section id="contacto" className="py-20 px-4 bg-black border-t border-[#d4a017]/20">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-6xl mx-auto"
      >
        <motion.h2
          variants={itemVariants}
          className="headline-lg text-center mb-4"
        >
          Contacto
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="subtitle text-center mb-12 max-w-3xl mx-auto"
        >
          Ponte en contacto conmigo para una entrevista preliminar gratuita
        </motion.p>

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
                className="glass-card p-8 text-center hover:border-[#d4a017]/50 transition group"
              >
                <div className="flex justify-center mb-4">
                  <Icon className="w-8 h-8 text-[#d4a017] group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="headline-md mb-2 text-white">
                  {method.title}
                </h3>
                <p className="body-text text-[#d4a017] font-semibold">
                  {method.value}
                </p>
              </motion.a>
            );
          })}
        </div>

        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-[#110f1e] to-[#1a1535] rounded-lg p-8 text-center border border-[#d4a017]/20"
        >
          <p className="body-text mb-6">
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
