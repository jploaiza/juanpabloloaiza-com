"use client";

import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-[#d4a017]/20 py-12 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
        {/* Brand */}
        <div>
          <h3 className="font-cinzel font-bold text-xl text-[#d4a017] mb-4">
            Juan Pablo Loaiza
          </h3>
          <p className="body-text text-sm">
            Hipnoterapia especializada en regresión a vidas pasadas y liberación
            espiritual.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-cinzel font-semibold text-white mb-4">
            NAVEGACIÓN
          </h4>
          <ul className="space-y-2">
            {[
              "Inicio",
              "Servicios",
              "Blog",
              "Contacto",
            ].map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className="body-text text-sm hover:text-[#d4a017] transition"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="font-cinzel font-semibold text-white mb-4">
            SERVICIOS
          </h4>
          <ul className="space-y-2">
            {[
              "Regresión a Vidas Pasadas",
              "Hipnoterapia Transformacional",
              "Liberación Espiritual",
            ].map((service) => (
              <li key={service}>
                <a
                  href="#"
                  className="body-text text-sm hover:text-[#d4a017] transition"
                >
                  {service}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-cinzel font-semibold text-white mb-4">
            CONTACTO
          </h4>
          <ul className="space-y-3">
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#d4a017]" />
              <a href="tel:+573001234567" className="body-text text-sm">
                +57 300 123 4567
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#d4a017]" />
              <a
                href="mailto:jp@juanpabloloaiza.com"
                className="body-text text-sm"
              >
                jp@juanpabloloaiza.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#d4a017]" />
              <span className="body-text text-sm">Medellín, Colombia</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Social Links */}
      <div className="border-t border-[#d4a017]/20 pt-8">
        <div className="flex justify-center gap-6 mb-6">
          {[
            { label: "📷", href: "#" },
            { label: "👤", href: "#" },
            { label: "💼", href: "#" },
          ].map(({ label, href }, i) => (
            <a
              key={i}
              href={href}
              className="text-gray-400 hover:text-[#d4a017] transition text-xl"
            >
              {label}
            </a>
          ))}
        </div>

        <p className="text-center text-gray-500 text-sm">
          © 2026 Juan Pablo Loaiza. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
