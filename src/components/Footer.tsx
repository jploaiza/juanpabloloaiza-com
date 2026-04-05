"use client";

import { Mail, Phone, Globe } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#020617] border-t border-[#C5A059]/10 py-16 px-4 relative">
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-[#C5A059]/50 to-transparent"></div>
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12 mb-12">

        {/* Brand */}
        <div className="space-y-4">
          <Image
            src="https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png"
            alt="Juan Pablo Loaiza — Terapeuta Holístico"
            width={220}
            height={80}
            className="w-auto h-16 object-contain opacity-90"
          />
          <p className="text-gray-400 font-crimson text-base leading-relaxed">
            Hipnoterapia especializada en regresión a vidas pasadas y liberación espiritual para quienes están listos a sanar.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-cinzel font-semibold text-[#C5A059] mb-6 uppercase text-xs tracking-widest">
            Navegación
          </h4>
          <ul className="space-y-3">
            {[
              { label: "Inicio", href: "/" },
              { label: "El Proceso", href: "/#ComoFunciona" },
              { label: "El Origen", href: "/#origen" },
              { label: "Vidas Pasadas", href: "/#QueEsTRVP" },
              { label: "Preguntas Frecuentes", href: "/#PreguntasFrecuentes" },
              { label: "Blog", href: "/#blog" },
              { label: "Entidades Espirituales", href: "/#liberacion" },
              { label: "Políticas de Servicio", href: "/politicas-de-servicio" },
            ].map((link) => (
              <li key={link.label}>
                <a href={link.href} className="font-crimson text-base text-gray-400 hover:text-[#C5A059] transition">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="font-cinzel font-semibold text-[#C5A059] mb-6 uppercase text-xs tracking-widest">
            Servicios
          </h4>
          <ul className="space-y-3">
            {[
              "Regresión a Vidas Pasadas",
              "Hipnoterapia Transformacional",
              "Liberación de Entidades",
            ].map((service) => (
              <li key={service}>
                <a href="/#ListaDeAdmision" className="font-crimson text-base text-gray-400 hover:text-[#C5A059] transition">
                  {service}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-cinzel font-semibold text-[#C5A059] mb-6 uppercase text-xs tracking-widest">
            Contacto
          </h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-[#C5A059] mt-1 flex-shrink-0" />
              <a href="https://api.whatsapp.com/send?phone=56962081884" className="font-crimson text-base text-gray-400 hover:text-[#C5A059] transition">
                +56 9 6208 1884
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[#C5A059] mt-1 flex-shrink-0" />
              <a href="mailto:contacto@juanpabloloaiza.com" className="font-crimson text-base text-gray-400 hover:text-[#C5A059] transition break-all">
                contacto@juanpabloloaiza.com
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-[#C5A059] mt-1 flex-shrink-0" />
              <span className="font-crimson text-base text-gray-400">Sesiones en todo el mundo vía Zoom</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#C5A059]/10 my-12"></div>

      <div className="text-center">
        <div className="flex justify-center gap-8 mb-6">
          {[
            { label: "Instagram", href: "https://www.instagram.com/jploaizao" },
            { label: "YouTube", href: "https://www.youtube.com/@jploaizao" },
            { label: "TikTok", href: "https://www.tiktok.com/@jploaizao" },
          ].map(({ label, href }, i) => (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-cinzel text-xs uppercase tracking-widest text-gray-400 hover:text-[#C5A059] transition"
            >
              {label}
            </a>
          ))}
        </div>
        <p className="font-cinzel text-xs text-gray-400 uppercase tracking-widest">
          © 2026 Juan Pablo Loaiza · Todos los derechos reservados
        </p>
      </div>
    </footer>
  );
}
