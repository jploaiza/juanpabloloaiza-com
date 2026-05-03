"use client";
import ScrollDivider from "@/components/ScrollDivider";
import HeraldFrame from "@/components/HeraldFrame";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function AdmissionSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    reason: "",
  });
  const [countryCode, setCountryCode] = useState("+56");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countryCodes = [
    { code: "+54", label: "🇦🇷 Argentina (+54)" },
    { code: "+591", label: "🇧🇴 Bolivia (+591)" },
    { code: "+55", label: "🇧🇷 Brasil (+55)" },
    { code: "+56", label: "🇨🇱 Chile (+56)" },
    { code: "+57", label: "🇨🇴 Colombia (+57)" },
    { code: "+506", label: "🇨🇷 Costa Rica (+506)" },
    { code: "+53", label: "🇨🇺 Cuba (+53)" },
    { code: "+593", label: "🇪🇨 Ecuador (+593)" },
    { code: "+503", label: "🇸🇻 El Salvador (+503)" },
    { code: "+34", label: "🇪🇸 España (+34)" },
    { code: "+502", label: "🇬🇹 Guatemala (+502)" },
    { code: "+504", label: "🇭🇳 Honduras (+504)" },
    { code: "+52", label: "🇲🇽 México (+52)" },
    { code: "+505", label: "🇳🇮 Nicaragua (+505)" },
    { code: "+507", label: "🇵🇦 Panamá (+507)" },
    { code: "+595", label: "🇵🇾 Paraguay (+595)" },
    { code: "+51", label: "🇵🇪 Perú (+51)" },
    { code: "+1787", label: "🇵🇷 Puerto Rico (+1787)" },
    { code: "+1", label: "🇺🇸 USA / Canadá (+1)" },
    { code: "+598", label: "🇺🇾 Uruguay (+598)" },
    { code: "+58", label: "🇻🇪 Venezuela (+58)" },
  ];

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        const countryCallingCode = data.country_calling_code;
        if (countryCallingCode && countryCodes.some((c) => c.code === countryCallingCode)) {
          setCountryCode(countryCallingCode);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, phone: formData.phone ? `${countryCode} ${formData.phone}` : "" }),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          name: "",
          email: "",
          phone: "",
          reason: "",
        });
        setTimeout(() => setSubmitted(false), 8000);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Hubo un problema al enviar tu solicitud. Por favor intenta de nuevo.");
      }
    } catch {
      setError("No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="ListaDeAdmision" className="py-28 bg-[#0a1628] relative border-t border-[#C5A059]/5">
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
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold font-cinzel">Tu Transformación Comienza</span>
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl text-white mt-4 mb-4 font-cinzel"
          >
            Comienza Ahora
          </motion.h2>
          <ScrollDivider className="mt-6" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start mb-12">
          <motion.div variants={itemVariants} className="space-y-6">
            <p className="text-gray-300 font-crimson text-xl leading-relaxed">
              Este es tu primer paso para conectarte conmigo. Cuéntame brevemente sobre ti para que pueda:
            </p>

            <ul className="space-y-3">
              {[
                "Conocer tu situación y lo que te trajo aquí",
                "Entender qué tipo de ayuda estás buscando",
                "Evaluar si el proceso es adecuado para ti",
                "Contactarte personalmente para explicarte todo el proceso",
              ].map((item, index) => (
                <li key={index} className="flex gap-3 text-gray-300">
                  <span className="text-[#C5A059] min-w-fit font-bold">✓</span>
                  <span className="font-crimson text-lg">{item}</span>
                </li>
              ))}
            </ul>

            <div className="bg-[#16213e]/60 border border-[#C5A059]/30 p-6 backdrop-blur-sm">
              <p className="font-cinzel font-semibold text-[#C5A059] mb-3 uppercase text-sm tracking-widest">
                Nota Importante
              </p>
              <p className="text-gray-300 text-sm leading-relaxed font-crimson">
                Este formulario es solo el primer contacto. Una vez que hablemos y entiendas el proceso, las sesiones, los valores y todo lo que implica, te enviaré personalmente el formulario de admisión completo.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <HeraldFrame size={60}>
            <div className="bg-[#16213e] border border-[#C5A059]/30 p-8">
            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-500/20 border border-green-500/50 text-center"
              >
                <p className="text-green-300 font-semibold font-cinzel text-sm uppercase tracking-widest mb-1">
                  ¡Solicitud Recibida!
                </p>
                <p className="text-green-200/80 font-crimson text-base">
                  Gracias por contactarme. Te escribiré a la brevedad para coordinar tu entrevista gratuita.
                </p>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-center"
              >
                <p className="text-red-300 font-semibold font-cinzel text-sm uppercase tracking-widest mb-1">
                  Error al Enviar
                </p>
                <p className="text-red-200/80 font-crimson text-base">{error}</p>
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
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    aria-label="Código de país"
                    className="bg-[#050b1a] border border-[#C5A059]/30 text-white text-sm px-2 py-2.5 focus:border-[#C5A059] focus:outline-none focus:ring-1 focus:ring-[#C5A059]/50 transition rounded-sm shrink-0"
                  >
                    {countryCodes.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9 6208 1884"
                    required
                    aria-required="true"
                    aria-label="Número de teléfono"
                    className="w-full px-4 py-2.5 bg-[#050b1a] border border-[#C5A059]/30 rounded-sm text-white placeholder-gray-600 focus:border-[#C5A059] focus:outline-none focus:ring-1 focus:ring-[#C5A059]/50 transition"
                  />
                </div>
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

              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar Solicitud"}
              </button>
            </form>
            </div>
            </HeraldFrame>
          </motion.div>
        </div>

        <motion.div
          variants={itemVariants}
          className="bg-[#16213e] border border-[#C5A059]/20 p-12"
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
              <HeraldFrame key={index} size={40} className="h-full">
                <div className="h-full text-center p-6 bg-[#050b1a] border border-[#C5A059]/20 group hover:border-[#C5A059]/40 transition duration-300">
                  <div className="text-4xl font-cinzel text-[#C5A059] mb-3 opacity-80 group-hover:opacity-100 transition">
                    {step.number}
                  </div>
                  <h4 className="font-cinzel font-semibold text-white mb-2 text-sm uppercase tracking-widest">
                    {step.title}
                  </h4>
                  <p className="text-gray-400 text-base font-crimson">
                    {step.description}
                  </p>
                </div>
              </HeraldFrame>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
