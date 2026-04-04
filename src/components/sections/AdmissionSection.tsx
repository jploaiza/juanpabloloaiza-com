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
    <section className="py-20 px-4 bg-black">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-6xl mx-auto"
      >
        <motion.h2
          variants={itemVariants}
          className="headline-lg text-center mb-12"
        >
          Admisión a la Terapia
        </motion.h2>

        <div className="grid lg:grid-cols-2 gap-12 items-start mb-12">
          <motion.div variants={itemVariants} className="space-y-6">
            <p className="body-text text-lg">
              Para comenzar este viaje transformador, necesitamos que completes un formulario de admisión. Esto nos ayuda a:
            </p>

            <ul className="space-y-3">
              {[
                "Entender tu situación y tus principales conflictos",
                "Evaluar tu disponibilidad y comprometimiento",
                "Preparar una sesión personalizada",
                "Establecer objetivos claros para tu terapia",
              ].map((item, index) => (
                <li key={index} className="flex gap-3 body-text">
                  <span className="text-[#d4a017] min-w-fit">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="bg-[#110f1e] border-l-4 border-[#d4a017] p-6 rounded">
              <p className="body-text font-semibold text-[#d4a017] mb-2">
                Nota importante:
              </p>
              <p className="body-text text-sm">
                Espacios limitados disponibles. El proceso es personalizado y dedicado a cada cliente. Se requiere entrevista preliminar gratuita antes de comenzar.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card p-8">
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

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="name" className="label text-sm block mb-2">Nombre Completo</label>
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
                  className="w-full px-4 py-2 bg-[#1a1535] border border-[#d4a017]/30 rounded text-white placeholder-gray-500 focus:border-[#d4a017] focus:outline-none focus:ring-2 focus:ring-[#d4a017]/30 transition"
                />
              </div>

              <div>
                <label htmlFor="email" className="label text-sm block mb-2">Correo Electrónico</label>
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
                  className="w-full px-4 py-2 bg-[#1a1535] border border-[#d4a017]/30 rounded text-white placeholder-gray-500 focus:border-[#d4a017] focus:outline-none focus:ring-2 focus:ring-[#d4a017]/30 transition"
                />
              </div>

              <div>
                <label htmlFor="phone" className="label text-sm block mb-2">Teléfono / WhatsApp</label>
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
                  className="w-full px-4 py-2 bg-[#1a1535] border border-[#d4a017]/30 rounded text-white placeholder-gray-500 focus:border-[#d4a017] focus:outline-none focus:ring-2 focus:ring-[#d4a017]/30 transition"
                />
              </div>

              <div>
                <label htmlFor="reason" className="label text-sm block mb-2">¿Cuál es tu motivo de consulta?</label>
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
                  className="w-full px-4 py-2 bg-[#1a1535] border border-[#d4a017]/30 rounded text-white placeholder-gray-500 focus:border-[#d4a017] focus:outline-none focus:ring-2 focus:ring-[#d4a017]/30 transition resize-none"
                />
              </div>

              <div>
                <label htmlFor="medicalHistory" className="label text-sm block mb-2">Historial Médico Relevante (Opcional)</label>
                <textarea
                  id="medicalHistory"
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleChange}
                  placeholder="¿Tienes algún antecedente médico importante?"
                  rows={2}
                  aria-label="Historial médico relevante"
                  className="w-full px-4 py-2 bg-[#1a1535] border border-[#d4a017]/30 rounded text-white placeholder-gray-500 focus:border-[#d4a017] focus:outline-none focus:ring-2 focus:ring-[#d4a017]/30 transition resize-none"
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
          </motion.div>
        </div>

        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-[#110f1e] to-[#1a1535] rounded-lg p-8"
        >
          <h3 className="headline-md text-center mb-6">
            Próximos Pasos
          </h3>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                number: "1",
                title: "Completa el Formulario",
                description: "Responde con honestidad sobre tu situación",
              },
              {
                number: "2",
                title: "Entrevista Gratuita",
                description: "Nos conocemos y evaluamos tu caso",
              },
              {
                number: "3",
                title: "Plan Personalizado",
                description: "Diseñamos tu proceso terapéutico",
              },
              {
                number: "4",
                title: "Comienza tu Viaje",
                description: "Primera sesión vía Zoom",
              },
            ].map((step, index) => (
              <div
                key={index}
                className="text-center p-4 glass-card"
              >
                <div className="text-3xl font-bold text-[#d4a017] mb-2">
                  {step.number}
                </div>
                <h4 className="body-text font-semibold mb-2">
                  {step.title}
                </h4>
                <p className="body-text text-sm text-gray-400">
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
