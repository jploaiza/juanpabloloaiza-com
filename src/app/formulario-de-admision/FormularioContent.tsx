"use client";
import ScrollDivider from "@/components/ScrollDivider";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";

export default function FormularioContent() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jotfor.ms/s/umd/latest/for-form-embed-handler.js";
    script.async = true;
    script.onload = () => {
      if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).jotformEmbedHandler) {
        (window as unknown as Record<string, (selector: string, base: string) => void>).jotformEmbedHandler(
          "iframe[id='JotFormIFrame-212815791546058']",
          "https://form.jotform.com/"
        );
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen w-full bg-[#020617] pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold font-cinzel">Proceso de Admisión</span>
            <h1 className="text-4xl md:text-5xl text-white mt-4 mb-4 font-cinzel">
              Formulario de Admisión
            </h1>
            <p className="font-crimson text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Completa este formulario con honestidad y detalle. Tu información es completamente confidencial y me ayudará a preparar tu proceso terapéutico personalizado.
            </p>
            <ScrollDivider className="mt-6" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Ornate frame borders */}
            <div className="absolute -top-6 -left-6 w-12 h-12 border-t-2 border-l-2 border-[#C5A059]/50 z-10"></div>
            <div className="absolute -top-6 -right-6 w-12 h-12 border-t-2 border-r-2 border-[#C5A059]/50 z-10"></div>
            <div className="absolute -bottom-6 -left-6 w-12 h-12 border-b-2 border-l-2 border-[#C5A059]/50 z-10"></div>
            <div className="absolute -bottom-6 -right-6 w-12 h-12 border-b-2 border-r-2 border-[#C5A059]/50 z-10"></div>

            <div className="bg-[#0f172a] border border-[#C5A059]/30 p-4 sm:p-8 relative z-0">
              <iframe
                id="JotFormIFrame-212815791546058"
                title="Formulario de admisión TRVP"
                onLoad={() => window.scrollTo(0, 0)}
                allowTransparency={true}
                allow="geolocation; microphone; camera; fullscreen; payment"
                src="https://form.jotform.com/212815791546058"
                style={{
                  minWidth: "100%",
                  maxWidth: "100%",
                  height: "539px",
                  border: "none",
                  backgroundColor: "transparent",
                }}
                scrolling="no"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 p-6 bg-[#0f172a] border border-[#C5A059]/20 rounded-sm"
          >
            <p className="font-crimson text-base text-gray-300 leading-relaxed">
              <span className="text-[#C5A059] font-semibold">Confidencialidad:</span> Toda la información que compartas en este formulario es estrictamente confidencial. Solo será utilizada para preparar tu proceso terapéutico. Si tienes alguna duda, contáctame por WhatsApp.
            </p>
          </motion.div>
        </div>
      </main>
    </>
  );
}
