"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  return (
    <motion.a
      href="https://api.whatsapp.com/send?phone=56962081884&text=Hola%20Juan%20Pablo%2C%20estoy%20interesado%20en%20la%20terapia%20de%20regresión%20a%20vidas%20pasadas"
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-8 left-8 z-40 p-4 bg-[#25d366] hover:bg-[#1ead50] text-white rounded-full shadow-lg transition-all flex items-center gap-2"
      aria-label="Contact via WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="text-sm font-semibold hidden sm:inline">Contactar</span>
    </motion.a>
  );
}
