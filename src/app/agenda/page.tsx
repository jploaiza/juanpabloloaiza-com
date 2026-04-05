"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";

export default function AgendaPage() {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "trvp" });
      cal("ui", {
        theme: "light",
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
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
            <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold">Reserva tu Espacio</span>
            <h1 className="text-4xl md:text-5xl text-white mt-4 mb-4 font-cinzel">
              Agenda tu Sesión
            </h1>
            <p className="font-[Cormorant_Garamond] text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Selecciona la fecha y hora que mejor te convenga para tu sesión. Las sesiones se realizan vía Zoom en privacidad total.
            </p>
            <div className="w-16 h-[1px] bg-[#C5A059] mx-auto mt-6"></div>
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

            <div className="bg-[#0f172a] border border-[#C5A059]/30 p-8 sm:p-12 relative z-0">
            <div className="bg-white rounded-sm overflow-hidden">
              <Cal
                namespace="trvp"
                calLink="jploaizao/trvp"
                style={{
                  width: "100%",
                  height: "auto",
                  minHeight: "700px",
                }}
                config={{
                  layout: "month_view",
                  theme: "light",
                }}
              />
            </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 p-6 bg-[#0f172a] border border-[#C5A059]/20 rounded-sm"
          >
            <p className="font-[Cormorant_Garamond] text-sm text-gray-300 leading-relaxed">
              <span className="text-[#C5A059] font-semibold">Privacidad:</span> Este calendario es privado y solo para clientes admitidos. Cada sesión es personalizada y confidencial. Si necesitas ayuda, contacta vía WhatsApp.
            </p>
          </motion.div>
        </div>
      </main>
    </>
  );
}
