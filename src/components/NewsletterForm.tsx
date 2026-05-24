"use client";

import { useState } from "react";
import { Mail, CheckCircle, Loader2 } from "lucide-react";

export default function NewsletterForm() {
  const [form, setForm] = useState({ name: "", apellido: "", email: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Error al suscribirse.");
      } else {
        setStatus("success");
        setForm({ name: "", apellido: "", email: "" });
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexión. Intenta de nuevo.");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <CheckCircle className="w-10 h-10 text-[#C5A059]" />
        <p className="font-cinzel text-sm text-white">Revisa tu correo</p>
        <p className="font-crimson text-sm text-gray-400 text-center">
          Te enviamos un enlace de confirmación. Un click y listo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">
            Nombre
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Tu nombre"
            className="w-full bg-[#0a1628] border border-[#C5A059]/20 text-gray-300 font-crimson px-3 py-2.5 text-sm focus:outline-none focus:border-[#C5A059]/50 placeholder-gray-600"
          />
        </div>
        <div>
          <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">
            Apellido
          </label>
          <input
            type="text"
            required
            value={form.apellido}
            onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
            placeholder="Tu apellido"
            className="w-full bg-[#0a1628] border border-[#C5A059]/20 text-gray-300 font-crimson px-3 py-2.5 text-sm focus:outline-none focus:border-[#C5A059]/50 placeholder-gray-600"
          />
        </div>
      </div>
      <div>
        <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">
          Correo electrónico
        </label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="tu@email.com"
          className="w-full bg-[#0a1628] border border-[#C5A059]/20 text-gray-300 font-crimson px-3 py-2.5 text-sm focus:outline-none focus:border-[#C5A059]/50 placeholder-gray-600"
        />
      </div>

      {status === "error" && (
        <p className="font-crimson text-sm text-red-400">{message}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full flex items-center justify-center gap-2 bg-[#C5A059] hover:bg-[#d4b06a] disabled:opacity-60 text-[#020617] font-cinzel text-[10px] uppercase tracking-widest py-3 transition"
      >
        {status === "loading" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Mail className="w-3.5 h-3.5" />
        )}
        {status === "loading" ? "Suscribiendo..." : "Suscribirme"}
      </button>

      <p className="font-crimson text-xs text-gray-600 text-center leading-relaxed">
        Sin spam. Solo artículos y recursos sobre regresión e hipnoterapia.
        Al suscribirte aceptas el tratamiento de tus datos para enviarte el newsletter.{" "}
        <a href="/politicas-de-servicio" className="text-gray-500 underline underline-offset-2 hover:text-[#C5A059] transition">
          Política de privacidad
        </a>
      </p>
    </form>
  );
}
