"use client";

import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#020617] border-t border-[#C5A059]/10 py-16 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12 mb-12">
        {/* Brand */}
        <div className="space-y-4">
          <div>
            <h3 className="font-cinzel font-bold text-2xl text-[#C5A059] mb-2 tracking-widest">
              Juan Pablo Loaiza
            </h3>
            <p className="text-[#C5A059] text-xs uppercase tracking-[0.3em]">Excelencia Espiritual</p>
          </div>
          <p className="text-gray-300 font-[Cormorant_Garamond] text-sm leading-relaxed">
            Hipnoterapia especializada en regresión a vidas pasadas y liberación espiritual para mujeres decididas.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-cinzel font-semibold text-[#C5A059] mb-6 uppercase text-xs tracking-widest">
            Navegación
          </h4>
          <ul className="space-y-3">
            {[
              { label: "Inicio", href: "#" },
              { label: "El Proceso", href: "#ComoFunciona" },
              { label: "Blog", href: "#" },
              { label: "Contacto", href: "#contacto" },
            ].map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-gray-400 hover:text-[#C5A059] transition text-sm font-light"
                >
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
              "Liberación Espiritual",
            ].map((service) => (
              <li key={service}>
                <a
                  href="#"
                  className="text-gray-400 hover:text-[#C5A059] transition text-sm font-light"
                >
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
              <Phone className="w-4 h-4 text-[#C5A059] mt-0.5 flex-shrink-0" />
              <a href="https://api.whatsapp.com/send?phone=56962081884" className="text-gray-400 hover:text-[#C5A059] transition text-sm font-light">
                +56 9 6208 1884
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[#C5A059] mt-0.5 flex-shrink-0" />
              <a
                href="mailto:contacto@juanpabloloaiza.com"
                className="text-gray-400 hover:text-[#C5A059] transition text-sm font-light"
              >
                contacto@juanpabloloaiza.com
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#C5A059] mt-0.5 flex-shrink-0" />
              <span className="text-gray-400 text-sm font-light">Medellín, Colombia</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#C5A059]/10 my-12"></div>

      {/* Bottom Section */}
      <div className="text-center">
        <div className="flex justify-center gap-8 mb-8">
          {[
            { label: "Instagram", href: "#" },
            { label: "YouTube", href: "#" },
            { label: "LinkedIn", href: "#" },
          ].map(({ label, href }, i) => (
            <a
              key={i}
              href={href}
              className="text-gray-400 hover:text-[#C5A059] transition text-xs uppercase tracking-widest font-light"
            >
              {label}
            </a>
          ))}
        </div>

        <p className="text-gray-500 text-xs font-light">
          © 2026 Juan Pablo Loaiza. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
