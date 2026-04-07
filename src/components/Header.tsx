"use client";

import { useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

const navItems = [
  { label: "EL PROCESO", href: "/#ComoFunciona" },
  { label: "EL ORIGEN", href: "/#origen" },
  { label: "VIDAS PASADAS", href: "/#QueEsTRVP" },
  { label: "ENTIDADES ESPIRITUALES", href: "/#liberacion" },
  { label: "PREGUNTAS", href: "/#PreguntasFrecuentes" },
  { label: "BLOG", href: "/#blog" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-[#020617]/95 backdrop-blur-xl border-b border-[#C5A059]/10 transition-all duration-300">
      {/* Top Bar */}
      <div className="hidden lg:block bg-[#050b1a] border-b border-white/5 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-6 font-cinzel text-[13px] font-semibold uppercase tracking-widest text-gray-300">
            <span className="flex items-center gap-2">
              <MessageCircle className="w-3 h-3 text-[#C5A059]" />
              +56 9 6208 1884
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[#C5A059]">✉</span>
              contacto@juanpabloloaiza.com
            </span>
          </div>
          <div className="flex items-center space-x-5 font-cinzel text-[13px] font-semibold uppercase tracking-widest text-gray-300">
            <span className="text-gray-400">SÍGUEME:</span>
            <a href="https://www.instagram.com/jploaizao" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059] transition">Instagram</a>
            <a href="https://www.youtube.com/@jploaizao" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059] transition">YouTube</a>
            <a href="https://www.tiktok.com/@jploaizao" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059] transition">TikTok</a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          {/* Logo */}
          <a href="https://www.juanpabloloaiza.com/" className="flex items-center gap-4 group cursor-pointer">
            <Image
              src="https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png"
              alt="Juan Pablo Loaiza"
              height={48}
              width={200}
              className="h-10 md:h-12 w-auto object-contain opacity-90 group-hover:opacity-100 transition"
            />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 items-center">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="font-cinzel text-[12px] font-semibold uppercase tracking-widest text-gray-300 hover:text-[#C5A059] transition duration-300"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/#ListaDeAdmision"
              className="font-cinzel font-bold border border-[#C5A059] text-[#C5A059] px-6 py-2.5 text-[12px] uppercase tracking-widest hover:bg-[#C5A059] hover:text-[#020617] transition duration-500 shadow-[0_0_15px_rgba(197,160,89,0.1)]"
            >
              Comienza Ahora
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-[#C5A059] p-2"
            aria-label="Abrir menú"
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-[#020617]/98 border-t border-[#C5A059]/10 px-6 py-6"
        >
          <div className="flex flex-col gap-5">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="font-cinzel text-base uppercase tracking-widest text-gray-300 hover:text-[#C5A059] transition py-1 border-b border-white/5"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="/#ListaDeAdmision"
              className="font-cinzel mt-2 border border-[#C5A059] text-[#C5A059] px-4 py-3 text-sm uppercase tracking-widest text-center hover:bg-[#C5A059] hover:text-[#020617] transition"
              onClick={() => setIsOpen(false)}
            >
              Comienza Ahora
            </a>
            {/* Mobile social links */}
            <div className="flex gap-6 justify-center pt-2 font-cinzel text-xs uppercase tracking-widest text-gray-500">
              <a href="https://www.instagram.com/jploaizao" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059] transition">Instagram</a>
              <a href="https://www.youtube.com/@jploaizao" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059] transition">YouTube</a>
              <a href="https://www.tiktok.com/@jploaizao" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059] transition">TikTok</a>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}
