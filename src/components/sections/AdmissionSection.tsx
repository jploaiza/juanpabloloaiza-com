"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

export default function AdmissionSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    reason: "",
    medicalHistory: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send form data via email using a service
      const response = await fetch("https://formspree.io/f/xgvqkeqv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          name: "",
          email: "",
          phone: "",
          reason: "",
          medicalHistory: "",
        });
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="ListaDeAdmision" className="py-28 bg-[#020617] relative border-t border-[#C5A059]/5">
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
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold">Tu Transformación Comienza</span>
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl text-white mt-4 mb-4 font-cinzel"
          >
            Comienza Ahora
          </motion.h2>
          <div className="w-16 h-[1px] bg-[#C5A059] mx-auto"></div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start mb-12">
          <motion.div variants={itemVariants} className="space-y-6">
            <p className="text-gray-300 font-[Cormorant_Garamond] text-xl leading-relaxed">
              Para comenzar este viaje transformador, necesitamos que completes un formulario de admisión. Esto nos ayuda a:
            </p>

            <ul className="space-y-3">
              {[
                "Entender tu situación y tus principales conflictos",
                "Evaluar tu disponibilidad y comprometimiento",
                "Preparar una sesión personalizada",
                "Establecer objetivos claros para tu terapia",
              ].map((item, index) => (
                <li key={index} className="flex gap-3 text-gray-300">
                  <span className="text-[#C5A059] min-w-fit font-bold">✓</span>
                  <span className="font-[Cormorant_Garamond] text-lg">{item}</span>
                </li>
              ))}
            </ul>

            <div className="bg-[#0f172a]/60 border border-[#C5A059]/30 p-6 backdrop-blur-sm">
              <p className="font-cinzel font-semibold text-[#C5A059] mb-3 uppercase text-sm tracking-widest">
                Nota Importante
              </p>
              <p className="text-gray-300 text-sm leading-relaxed font-[Cormorant_Garamond]">
                Espacios limitados disponibles. El proceso es personalizado y dedicado a cada cliente. Se requiere entrevista preliminar gratuita antes de comenzar.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            {/* Ornate frame borders */}
            <div className="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-[#C5A059]/50 z-10"></div>
            <div className="absolute -top-4 -right-4 w-12 h-12 border-t-2 border-r-2 border-[#C5A059]/50 z-10"></div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-2 border-l-2 border-[#C5A059]/50 z-10"></div>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-2 border-r-2 border-[#C5A059]/50 z-10"></div>

            <div className="bg-[#0f172a] border border-[#C5A059]/30 p-8">
            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded text-center"
              >
                <p className="body-text text-green-300 font-semibold">
                  ¡Solicitud recibida! Me pondré en contacto pronto.
                </p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="name" className="text-[#C5A059] text-xs uppercase tracking-widest font-semibold block mb-2">Nombre Completo</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  required
                  aria-required="true"
                  aria-label="Nombre completo"
                  className="w-full px-4 py-2.5 bg-[#050b1a] border border-[#C5A059]/30 rounded-sm text-white placeholder-gray-600 focus:border-[#C5A059] focus:outline-none focus:ring-1 focus:ring-[#C5A059]/50 transition"
                />
              </div>

              <div>
                <label htmlFor="email" className="text-[#C5A059] text-xs uppercase tracking-widest font-semibold block mb-2">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                  aria-required="true"
                  aria-label="Correo electrónico"
                  className="w-full px-4 py-2.5 bg-[#050b1a] border border-[#C5A059]/30 rounded-sm text-white placeholder-gray-600 focus:border-[#C5A059] focus:outline-none focus:ring-1 focus:ring-[#C5A059]/50 transition"
                />
              </div>

              <div>
                <label htmlFor="phone" className="text-[#C5A059] text-xs uppercase tracking-widest font-semibold block mb-2">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+56 9 6208 1884"
                  required
                  aria-required="true"
                  aria-label="Teléfono o WhatsApp"
                  className="w-full px-4 py-2.5 bg-[#050b1a] border border-[#C5A059]/30 rounded-sm text-white placeholder-gray-600 focus:border-[#C5A059] focus:outline-none focus:ring-1 focus:ring-[#C5A059]/50 transition"
                />
              </div>

              <div>
                <label htmlFor="reason" className="text-[#C5A059] text-xs uppercase tracking-widest font-semibold block mb-2">¿Cuál es tu motivo de consulta?</label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Cuéntanos brevemente tu situación..."
                  required
                  rows={3}
                  aria-required="true"
                  aria-label="Motivo de consulta"
                  className="w-full px-4 py-2.5 bg-[#050b1a] border border-[#C5A059]/30 rounded-sm text-white placeholder-gray-600 focus:border-[#C5A059] focus:outline-none focus:ring-1 focus:ring-[#C5A059]/50 transition resize-none"
                />
              </div>

              <div>
                <label htmlFor="medicalHistory" className="text-[#C5A059] text-xs uppercase tracking-widest font-semibold block mb-2">Historial Médico Relevante (Opcional)</label>
                <textarea
                  id="medicalHistory"
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleChange}
                  placeholder="¿Tienes algún antecedente médico importante?"
                  rows={2}
                  aria-label="Historial médico relevante"
                  className="w-full px-4 py-2.5 bg-[#050b1a] border border-[#C5A059]/30 rounded-sm text-white placeholder-gray-600 focus:border-[#C5A059] focus:outline-none focus:ring-1 focus:ring-[#C5A059]/50 transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar Solicitud"}
              </button>
            </form>
            </div>
          </motion.div>
        </div>

        <motion.div
          variants={itemVariants}
          className="bg-[#0f172a] border border-[#C5A059]/20 p-12"
        >
          <h3 className="text-3xl font-cinzel text-center mb-10 text-white">
            Próximos Pasos
          </h3>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                number: "I",
                title: "Completa el Formulario",
                description: "Responde con honestidad sobre tu situación",
              },
              {
                number: "II",
                title: "Entrevista Gratuita",
                description: "Nos conocemos y evaluamos tu caso",
              },
              {
                number: "III",
                title: "Plan Personalizado",
                description: "Diseñamos tu proceso terapéutico",
              },
              {
                number: "IV",
                title: "Comienza tu Viaje",
                description: "Primera sesión vía Zoom",
              },
            ].map((step, index) => (
              <div
                key={index}
                className="text-center p-6 bg-[#050b1a] border border-[#C5A059]/20 group hover:border-[#C5A059]/40 transition duration-300"
              >
                <div className="text-4xl font-cinzel text-[#C5A059] mb-3 opacity-80 group-hover:opacity-100 transition">
                  {step.number}
                </div>
                <h4 className="font-cinzel text-white mb-2 text-sm uppercase tracking-widest">
                  {step.title}
                </h4>
                <p className="text-gray-400 text-xs font-[Cormorant_Garamond]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
