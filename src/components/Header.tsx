"use client";

import { useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

const navItems = [
  { label: "EL PROCESO", href: "#ComoFunciona" },
  { label: "EL ORIGEN", href: "#QueEsTRVP" },
  { label: "SANACIÓN", href: "#ListaDeAdmision" },
  { label: "VIDEOS", href: "/videos" },
  { label: "DUDAS", href: "#PreguntasFrecuentes" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-[#020617]/95 backdrop-blur-xl border-b border-[#C5A059]/10 transition-all duration-300">
      {/* Top Bar - Hidden on mobile */}
      <div className="hidden lg:block bg-[#050b1a] border-b border-white/5 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-[10px] uppercase tracking-widest text-gray-400">
          <div className="flex items-center space-x-6">
            <span className="flex items-center"><MessageCircle className="w-3 h-3 text-[#C5A059] mr-2" /> +56 9 6208 1884</span>
            <span className="flex items-center"><span className="text-[#C5A059] mr-2">✉</span> contacto@juanpabloloaiza.com</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>SÍGUEME:</span>
            <a href="#" className="hover:text-[#C5A059] transition">Instagram</a>
            <a href="#" className="hover:text-[#C5A059] transition">YouTube</a>
            <a href="#" className="hover:text-[#C5A059] transition">LinkedIn</a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <div className="flex items-center gap-4 group cursor-pointer">
            <Image
              src="/assets/logo.webp"
              alt="Juan Pablo Loaiza"
              height={48}
              width={150}
              className="h-12 w-auto object-contain opacity-90 group-hover:opacity-100 transition"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-10 items-center">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-xs uppercase tracking-widest text-gray-400 hover:text-[#C5A059] transition duration-300"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#ListaDeAdmision"
              className="border border-[#C5A059] text-[#C5A059] px-8 py-2.5 rounded-sm text-xs uppercase tracking-widest hover:bg-[#C5A059] hover:text-[#020617] transition duration-500 shadow-[0_0_15px_rgba(197,160,89,0.1)]"
            >
              Comienza Ahora
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-[#C5A059]"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-[#020617]/95 border-t border-[#C5A059]/10 p-4"
        >
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="font-cinzel text-sm text-gray-300 hover:text-[#C5A059] transition"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="#ListaDeAdmision"
              className="border border-[#C5A059] text-[#C5A059] px-4 py-2 rounded-sm text-xs uppercase tracking-widest hover:bg-[#C5A059] hover:text-[#020617] transition mt-4"
              onClick={() => setIsOpen(false)}
            >
              Comienza Ahora
            </a>
          </div>
        </motion.div>
      )}
    </header>
  );
}
