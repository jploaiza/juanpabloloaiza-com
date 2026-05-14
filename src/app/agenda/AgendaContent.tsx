"use client";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import BookingWidget from "@/components/booking/BookingWidget";

export default function AgendaContent() {
  return (
    <>
      <Header />
      <main className="min-h-screen w-full bg-[#0a1628] pt-24 font-baskerville">
        {/* Hero text */}
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="font-baskerville text-[#C5A059] uppercase tracking-[0.25em] text-xs font-semibold">
              Reserva tu Espacio
            </span>
            <h1 className="font-baskerville text-4xl md:text-5xl text-white mt-4 mb-5 font-bold leading-tight">
              Agenda tu Sesión
            </h1>
            <p className="font-baskerville text-lg text-gray-300 max-w-xl mx-auto leading-relaxed">
              Selecciona la fecha y hora que mejor te convenga. Las sesiones se realizan vía Zoom en privacidad total.
            </p>
          </motion.div>
        </div>

        {/* White booking card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 pb-24"
        >
          {/* Gold corner accents */}
          <div className="relative">
            <div className="absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-[#C5A059]/60 z-10 pointer-events-none" />
            <div className="absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-[#C5A059]/60 z-10 pointer-events-none" />
            <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-[#C5A059]/60 z-10 pointer-events-none" />
            <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-[#C5A059]/60 z-10 pointer-events-none" />

            <div className="bg-white shadow-2xl shadow-black/40 p-8 sm:p-10">
              <BookingWidget type="session" />
            </div>
          </div>

          {/* Privacy note */}
          <div className="mt-8 px-1">
            <p className="font-baskerville text-sm text-gray-400 leading-relaxed text-center">
              <span className="text-[#C5A059] font-semibold">Privacidad:</span>{" "}
              Este calendario es privado y solo para clientes admitidos. Cada sesión es personalizada y confidencial.
            </p>
          </div>
        </motion.div>
      </main>
    </>
  );
}
