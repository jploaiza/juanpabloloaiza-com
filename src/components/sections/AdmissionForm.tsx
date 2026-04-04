"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const steps = [
  "INFORMACIÓN PERSONAL",
  "MOTIVO DE CONSULTA",
  "HISTORIAL MÉDICO",
  "DISPONIBILIDAD",
];

export default function AdmissionForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <section className="py-24 px-4 bg-[#0a0812]">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="headline-lg mb-4">PROCESO DE ADMISIÓN</h2>
          <p className="subtitle">Completa tu solicitud en 4 sencillos pasos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="glass-card p-8 md:p-12"
        >
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-cinzel font-bold transition-all ${
                      index <= currentStep
                        ? "bg-[#d4a017] text-black"
                        : "bg-gray-600 text-gray-300"
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        index < currentStep ? "bg-[#d4a017]" : "bg-gray-600"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center label text-sm">{steps[currentStep]}</p>
          </div>

          {/* Form Content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 mb-8"
          >
            {currentStep === 0 && (
              <>
                <div>
                  <label className="label text-sm block mb-2">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Tu nombre completo"
                    className="w-full px-4 py-3 bg-[#1a1535] border border-[#d4a017]/30 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a017] focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="label text-sm block mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 bg-[#1a1535] border border-[#d4a017]/30 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a017] focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="label text-sm block mb-2">Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+57 300 000 0000"
                    className="w-full px-4 py-3 bg-[#1a1535] border border-[#d4a017]/30 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a017] focus:outline-none transition"
                  />
                </div>
              </>
            )}

            {currentStep === 1 && (
              <div>
                <label className="label text-sm block mb-2">
                  ¿Cuál es tu motivo de consulta?
                </label>
                <textarea
                  placeholder="Cuéntanos brevemente..."
                  className="w-full px-4 py-3 bg-[#1a1535] border border-[#d4a017]/30 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a017] focus:outline-none transition min-h-32"
                ></textarea>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <label className="label text-sm block mb-2">
                  ¿Tienes algún antecedente médico importante?
                </label>
                <textarea
                  placeholder="Cuéntanos sobre tu historial médico relevante..."
                  className="w-full px-4 py-3 bg-[#1a1535] border border-[#d4a017]/30 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a017] focus:outline-none transition min-h-32"
                ></textarea>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <label className="label text-sm block mb-2">
                  ¿Cuándo te gustaría agendar tu sesión?
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 bg-[#1a1535] border border-[#d4a017]/30 rounded-lg text-white focus:border-[#d4a017] focus:outline-none transition"
                />
              </div>
            )}
          </motion.div>

          {/* Buttons */}
          <div className="flex gap-4 justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="btn-gold-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ATRÁS
            </button>
            {currentStep === steps.length - 1 ? (
              <button className="btn-gold">ENVIAR SOLICITUD</button>
            ) : (
              <button onClick={handleNext} className="btn-gold">
                SIGUIENTE
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
