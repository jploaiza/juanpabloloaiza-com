"use client";

import { useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

const navItems = [
  { label: "INICIO", href: "#home" },
  { label: "¿CÓMO FUNCIONA?", href: "#ComoFunciona" },
  { label: "¿QUÉ SON VIDAS PASADAS?", href: "#QueEsTRVP" },
  { label: "PREGUNTAS FRECUENTES", href: "#PreguntasFrecuentes" },
  { label: "ADMISIÓN", href: "#ListaDeAdmision" },
  { label: "BLOG", href: "#blog" },
  { label: "CONTACTO", href: "#contacto" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-black/95 backdrop-blur-md border-b border-[#d4a017]/20">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="h-12 w-auto relative">
          <Image
            src="/assets/logo.webp"
            alt="Juan Pablo Loaiza"
            height={48}
            width={180}
            className="object-contain"
          />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="font-cinzel text-sm text-gray-300 hover:text-[#d4a017] transition"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* WhatsApp Button */}
        <a
          href="https://api.whatsapp.com/send?phone=56962081884"
          className="hidden sm:flex items-center gap-2 bg-[#25d366] hover:bg-[#1ead50] text-white px-4 py-2 rounded-lg transition"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="font-cinzel text-sm">WhatsApp</span>
        </a>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-[#d4a017]"
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-black/95 border-t border-[#d4a017]/20 p-4"
        >
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="font-cinzel text-sm text-gray-300 hover:text-[#d4a017] transition"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="https://api.whatsapp.com/send?phone=56962081884"
              className="flex items-center gap-2 bg-[#25d366] hover:bg-[#1ead50] text-white px-4 py-2 rounded-lg transition mt-4"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="font-cinzel text-sm">WhatsApp</span>
            </a>
          </div>
        </motion.div>
      )}
    </header>
  );
}
