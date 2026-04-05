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
      <main className="min-h-screen w-full bg-black pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="headline-lg text-center mb-4">
              Agenda tu Sesión
            </h1>
            <p className="body-text text-lg text-gray-400 max-w-2xl mx-auto">
              Selecciona la fecha y hora que mejor te convenga para tu sesión de hipnoterapia de regresión a vidas pasadas. Las sesiones se realizan vía Zoom.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-card p-8 sm:p-12 rounded-lg"
          >
            <div className="bg-white rounded-lg overflow-hidden">
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 p-6 bg-[#110f1e] border-l-4 border-[#d4a017] rounded"
          >
            <p className="body-text text-sm text-gray-300">
              <span className="text-[#d4a017] font-semibold">Nota:</span> Este enlace es privado y solo está disponible para clientes que ya han completado el proceso de admisión. Si tienes dudas, contáctame vía WhatsApp.
            </p>
          </motion.div>
        </div>
      </main>
    </>
  );
}
