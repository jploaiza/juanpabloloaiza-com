"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import { Play, ChevronDown } from "lucide-react";
import ScrollDivider from "@/components/ScrollDivider";
import HeraldFrame from "@/components/HeraldFrame";

const R2 = "https://media.juanpabloloaiza.com";

// Static poster image shown before video plays (avoids black screen on iOS)
const POSTER = "https://res.cloudinary.com/dvudfdhoi/image/upload/f_auto,q_auto,w_400/main-juanpabloloaiza-regresion-vidas-pasadas_u6gseu";

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

// Callback ref: plays the video as soon as it mounts — critical for iOS Safari
// where autoplay must happen synchronously within the user-gesture call stack.
function useVideoAutoplay(active: boolean) {
  return useCallback(
    (node: HTMLVideoElement | null) => {
      if (node && active) {
        node.play().catch(() => {});
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active]
  );
}

// Desktop: single video panel (shared, swaps content)
function DesktopVideoPanel({ faq, index }: { faq: typeof faqs[0]; index: number }) {
  const videoRef = useVideoAutoplay(true);
  return (
    <div className="flex flex-col items-center w-full">
      <HeraldFrame size={64} className="w-full max-w-[280px] sm:max-w-[320px]">
        <div
          className="border border-[#C5A059]/30 overflow-hidden w-full"
          style={{ aspectRatio: "9/16", background: "linear-gradient(to bottom, #0a0f1e, #0a1628)" }}
        >
          <video
            ref={videoRef}
            key={faq.src}
            src={faq.src}
            poster={POSTER}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain"
            controlsList="nodownload"
            disablePictureInPicture
          />
        </div>
      </HeraldFrame>
      <div className="mt-5 w-full max-w-[320px] px-1">
        <p className="text-[#C5A059] text-xs uppercase tracking-widest mb-1 font-cinzel">Reproduciendo</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={index + "-q"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-white font-crimson text-lg leading-snug"
          >
            {faq.question}
          </motion.p>
        </AnimatePresence>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={index + "-a"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mt-4 w-full max-w-[320px] p-5 bg-[#16213e] border border-[#C5A059]/20"
        >
          <p className="text-gray-300 font-crimson text-base leading-relaxed">{faq.answer}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Mobile: inline video inside accordion item
function MobileAccordionItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: typeof faqs[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const videoRef = useVideoAutoplay(isOpen);

  return (
    <div className={`border transition-all duration-300 ${isOpen ? "border-[#C5A059]/60 bg-[#16213e]" : "border-[#C5A059]/15 bg-[#16213e]/50"}`}>
      {/* Header button */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center gap-3"
      >
        <span
          className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-cinzel font-bold transition-colors ${
            isOpen ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/10" : "border-gray-600 text-gray-500"
          }`}
        >
          {index + 1}
        </span>
        <span className={`font-crimson text-base leading-snug flex-1 transition-colors ${isOpen ? "text-white" : "text-gray-400"}`}>
          {faq.question}
        </span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-[#C5A059] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-5 flex flex-col items-center gap-4">
              {/* Video inline */}
              <div
                className="w-full max-w-[260px] border border-[#C5A059]/30 overflow-hidden"
                style={{ aspectRatio: "9/16", background: "linear-gradient(to bottom, #0a0f1e, #0a1628)" }}
              >
                <video
                  ref={videoRef}
                  key={faq.src}
                  src={faq.src}
                  poster={POSTER}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain"
                  controlsList="nodownload"
                  disablePictureInPicture
                />
              </div>

              {/* Answer */}
              <div className="w-full p-4 bg-[#0a1628] border border-[#C5A059]/10">
                <p className="text-gray-300 font-crimson text-base leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleSelect = (index: number) => {
    if (typeof document !== "undefined") {
      document.querySelectorAll("video").forEach((v) => {
        v.pause();
        v.currentTime = 0;
      });
    }
    setActiveIndex(index);
  };

  // Mobile accordion: toggle open/close, only one open at a time
  const [mobileOpen, setMobileOpen] = useState<number | null>(null);
  const handleMobileToggle = (index: number) => {
    if (typeof document !== "undefined") {
      document.querySelectorAll("video").forEach((v) => {
        v.pause();
        v.currentTime = 0;
      });
    }
    setMobileOpen((prev) => (prev === index ? null : index));
  };

  return (
    <section
      id="PreguntasFrecuentes"
      className="py-20 sm:py-28 bg-[#0a1628] relative border-y border-[#C5A059]/5"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold font-cinzel">Tus Dudas</span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl text-white mt-4 mb-4 font-cinzel">Preguntas Frecuentes</h2>
          <ScrollDivider className="mt-6" />
        </motion.div>

        {/* ── MOBILE: Accordion (< lg) ── */}
        <div className="lg:hidden space-y-2">
          {faqs.map((faq, index) => (
            <MobileAccordionItem
              key={index}
              faq={faq}
              index={index}
              isOpen={mobileOpen === index}
              onToggle={() => handleMobileToggle(index)}
            />
          ))}
        </div>

        {/* ── DESKTOP: Sticky video + question list (lg+) ── */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-10 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:sticky lg:top-32 flex justify-center"
          >
            <DesktopVideoPanel faq={faqs[activeIndex]} index={activeIndex} />
          </motion.div>

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
                    ? "border-[#C5A059]/60 bg-[#16213e]"
                    : "border-[#C5A059]/15 bg-[#16213e]/50 hover:border-[#C5A059]/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-cinzel font-bold transition-colors ${
                      activeIndex === index
                        ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/10"
                        : "border-gray-600 text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`font-crimson text-base leading-snug transition-colors ${
                      activeIndex === index ? "text-white" : "text-gray-400 group-hover:text-gray-200"
                    }`}
                  >
                    {faq.question}
                  </span>
                  {activeIndex === index && (
                    <Play size={11} className="text-[#C5A059] ml-auto flex-shrink-0" />
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
