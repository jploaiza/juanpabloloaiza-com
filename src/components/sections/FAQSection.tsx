"use client";

import { motion } from "framer-motion";
import { useState, useRef } from "react";
import ScrollDivider from "@/components/ScrollDivider";
import HeraldFrame from "@/components/HeraldFrame";

const R2 = "https://pub-60ec8d051cfb4b658728c606968895bb.r2.dev";

const faqs = [
  {
    question: "¿Se puede realizar en línea?",
    answer:
      "Por supuesto. La terapia de regresión a vidas pasadas es completamente segura para realizar en línea. Me he certificado internacionalmente para realizar estos procesos vía Zoom. Más de 200 procesos terapéuticos se han realizado de esta manera con resultados maravillosos, sin que nadie haya experimentado algún problema durante las sesiones.",
    src: `${R2}/QA1.m4v`,
  },
  {
    question: "¿Puedo tomar solo una sesión?",
    answer:
      "No es recomendable. Una sola sesión muchas veces deja más preguntas que respuestas. En el proceso de regresión a vidas pasadas se trabaja en tres etapas: descubrir, entender y limpiar. Tenemos un principio y un final, por lo cual podemos asegurar que habrá un gran beneficio para ti.",
    src: `${R2}/QA2.m4v`,
  },
  {
    question: "¿Existen contraindicaciones?",
    answer:
      "La única contraindicación es para personas con enfermedades mentales diagnosticadas bajo tratamiento farmacológico, ya que los medicamentos podrían alterar el estado natural de conciencia. Esta terapia es siempre complementaria y jamás se abandona ningún tratamiento médico previamente establecido.",
    src: `${R2}/QA3.m4v`,
  },
  {
    question: "¿Podré entrar en hipnosis?",
    answer:
      "Si puedes dormir en la noche, podrás entrar en hipnosis. La hipnosis ocupa el mismo proceso donde en la noche te relajas y te puedes quedar dormido. Se realiza a través de una relajación consciente, un proceso de meditación guiado por mí para que alcances ese nivel de relajación profunda.",
    src: `${R2}/QA4.m4v`,
  },
  {
    question: "¿Qué pasa si se corta la llamada?",
    answer:
      "Utilizamos Zoom para evitar este tipo de situaciones. Si la llamada se corta, podemos volver a conectarnos sin necesidad de que hagas nada en tu dispositivo. Y si no hay posibilidad de reconectarnos, simplemente puedes levantarte y seguir con tu vida, ya que puedes salir de hipnosis solo, igual que cuando te despiertas en la mañana.",
    src: `${R2}/QA5.m4v`,
  },
  {
    question: "¿Qué pasa si no veo nada?",
    answer:
      "Ver imágenes no es nuestro enfoque ni nuestra meta. Lo que define una terapia exitosa es cuando logramos conectar con la emoción y liberamos esa emoción que está atrapada. Si logramos este resultado viendo ninguna imagen o viéndolas todas, el resultado se logra y el proceso es exitoso.",
    src: `${R2}/QA6.m4v`,
  },
  {
    question: "¿Y si me lo estuviera imaginando todo?",
    answer:
      "La imaginación es la imagen que no tiene ninguna emoción adjunta a ella. Los recuerdos de vidas pasadas van a estar siempre presentes junto a una emoción real. Vamos a sentir lo que nos está pasando, cómo nuestro corazón se agita, y lo que nos sucedió en ese momento. Esa emoción no puede ser fabricada.",
    src: `${R2}/QA7.m4v`,
  },
  {
    question: "¿Voy a estar consciente durante la hipnosis?",
    answer:
      "Siempre vas a estar consciente. Tu mente consciente se queda presente, mirándolo todo y entendiendo todo lo que está sucediendo. Jamás vas a perder la conciencia. La hipnosis clínica permite que tu mente inconsciente acceda a toda la información de tus vidas pasadas, mientras tú observas conscientemente este viaje.",
    src: `${R2}/QA8.m4v`,
  },
  {
    question: "¿Me acordaré de lo que viví en hipnosis?",
    answer:
      "Sí. Recordarás todo lo que experimentaste, ya que nunca perderás la conciencia. Todo lo que vives y aprendes en estas sesiones quedará tan integrado dentro de ti que en todo momento podrás acceder a él como un conocimiento adquirido a través de la experiencia.",
    src: `${R2}/QA9.m4v`,
  },
  {
    question: "¿Las sesiones se graban?",
    answer:
      "Todas las sesiones se realizan a través de Zoom y se graban tanto en audio como en video. Esto se hace para mantener registros y porque hay muchos aprendizajes espirituales importantes que los guías espirituales y maestros nos entregan. Si necesitas tu grabación, con gusto te la hago llegar.",
    src: `${R2}/QA10.m4v`,
  },
  {
    question: "¿Quién puede tomar esta terapia?",
    answer:
      "Todas las personas pueden tomar esta terapia. Las únicas contraindicaciones son personas con algún tipo de enfermedad mental diagnosticada por un profesional de la salud o bajo tratamiento farmacológico. Los menores de edad no son elegibles, aunque sí se puede trabajar junto con su padre o madre.",
    src: `${R2}/QA11.m4v`,
  },
];

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSelect = (index: number) => {
    setActiveIndex(index);
    // Reset and reload video
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.load();
    }
  };

  const active = faqs[activeIndex];

  return (
    <section id="PreguntasFrecuentes" className="py-20 sm:py-28 bg-[#020617] relative border-y border-[#C5A059]/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold font-cinzel">Tus Dudas</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl text-white mt-4 mb-4 font-cinzel">
            Preguntas Frecuentes
          </h2>
          <ScrollDivider className="mt-6" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Central video player */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:sticky lg:top-32"
          >
            <HeraldFrame variant="eagle" size={72}>
              {/* 9:16 vertical video */}
              <div className="bg-black border border-[#C5A059]/30 overflow-hidden" style={{ aspectRatio: "9/16", maxHeight: "70vh" }}>
                <video
                  ref={videoRef}
                  key={active.src}
                  src={active.src}
                  controls
                  className="w-full h-full object-contain"
                  controlsList="nodownload"
                  disablePictureInPicture
                />
              </div>
            </HeraldFrame>

            {/* Current question label */}
            <div className="mt-4 px-1">
              <p className="text-[#C5A059] text-xs uppercase tracking-widest mb-1">Reproduciendo</p>
              <p className="text-white font-crimson text-lg leading-snug">{active.question}</p>
            </div>

            {/* Answer text */}
            <div className="mt-4 p-5 bg-[#0f172a] border border-[#C5A059]/20">
              <p className="text-gray-300 font-crimson text-base leading-relaxed">
                {active.answer}
              </p>
            </div>
          </motion.div>

          {/* Right: Question list */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-2"
          >
            {faqs.map((faq, index) => (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                className={`w-full text-left p-4 sm:p-5 border transition-all duration-300 group ${
                  activeIndex === index
                    ? "border-[#C5A059]/60 bg-[#0f172a]"
                    : "border-[#C5A059]/15 bg-[#0f172a]/50 hover:border-[#C5A059]/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-cinzel font-bold transition-colors ${
                    activeIndex === index ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/10" : "border-gray-600 text-gray-500"
                  }`}>
                    {index + 1}
                  </span>
                  <span className={`font-crimson text-base leading-snug transition-colors ${
                    activeIndex === index ? "text-white" : "text-gray-400 group-hover:text-gray-200"
                  }`}>
                    {faq.question}
                  </span>
                  {activeIndex === index && (
                    <i className="fas fa-play text-[#C5A059] text-xs ml-auto flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-gray-300 font-crimson text-lg">
            ¿Tienes más preguntas?{" "}
            <a
              href="https://api.whatsapp.com/send?phone=56962081884"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C5A059] hover:text-[#F3E5AB] transition"
            >
              Contáctame por WhatsApp
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
