"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const TEMPLATE_OPTIONS = [
  { kind: "editorial",    label: "Newsletter Editorial",  desc: "Artículo principal + 2 secundarios" },
  { kind: "announcement", label: "Anuncio / Lanzamiento", desc: "CTA único para eventos o cursos" },
  { kind: "welcome",      label: "Bienvenida",           desc: "Para nuevos suscriptores" },
  { kind: "reengagement", label: "Re-engagement",        desc: "Reactiva suscriptores inactivos" },
];

export default function NewCampaignForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState("editorial");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("El nombre es obligatorio."); return; }
    setLoading(true); setError("");

    const res = await fetch("/api/newsletter/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), template_kind: kind }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error al crear."); setLoading(false); return; }
    router.push(`/academy/admin/newsletter/campaigns/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">
          Nombre interno de la campaña
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ej. Newsletter Mayo 2026"
          className="w-full bg-[#0a1628] border border-[#C5A059]/20 text-gray-200 font-crimson px-3 py-2.5 text-sm focus:outline-none focus:border-[#C5A059]/50 placeholder-gray-600"
        />
        <p className="font-crimson text-xs text-gray-600 mt-1">Solo visible en el admin, no se muestra al suscriptor.</p>
      </div>

      <div>
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-3">Tipo de campaña</p>
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATE_OPTIONS.map((t) => (
            <button
              key={t.kind}
              type="button"
              onClick={() => setKind(t.kind)}
              className={`text-left p-4 border transition ${
                kind === t.kind
                  ? "border-[#C5A059] bg-[#C5A059]/8"
                  : "border-white/10 bg-[#16213e] hover:border-[#C5A059]/30"
              }`}
            >
              <p className="font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059] mb-1">{t.label}</p>
              <p className="font-crimson text-xs text-gray-500">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="font-crimson text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-[#C5A059] hover:bg-[#d4b06a] disabled:opacity-60 text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-6 py-3 transition"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {loading ? "Creando..." : "Crear y continuar"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-white/10 text-gray-400 hover:text-white font-cinzel text-[10px] uppercase tracking-widest px-6 py-3 transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
