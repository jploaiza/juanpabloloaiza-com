"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function NuevoFormularioPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const effectiveSlug = slugTouched ? slug : slugify(title);

  async function create() {
    if (!title.trim()) {
      setError("El título es requerido.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), slug: effectiveSlug }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Error al crear el formulario.");
        setSaving(false);
        return;
      }
      router.push(`/academy/admin/formularios/${json.form.id}`);
    } catch {
      setError("Error de conexión.");
      setSaving(false);
    }
  }

  const inputCls =
    "w-full bg-[#0a1628] border border-white/10 text-white px-4 py-3 font-crimson text-base focus:outline-none focus:border-[#C5A059] transition placeholder-white/30";

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 lg:pl-56">
      <Link href="/academy/admin/formularios" className="inline-flex items-center gap-1 font-cinzel text-[10px] uppercase tracking-widest text-gray-400 hover:text-[#C5A059] transition mb-6">
        <ChevronLeft className="w-4 h-4" /> Formularios
      </Link>

      <h1 className="font-cinzel text-2xl text-white mb-8">Nuevo formulario</h1>

      <div className="space-y-5">
        <div>
          <label className="block font-cinzel text-[10px] uppercase tracking-widest text-gray-400 mb-2">Título *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="Ej: Formulario de Admisión" className={inputCls} />
        </div>
        <div>
          <label className="block font-cinzel text-[10px] uppercase tracking-widest text-gray-400 mb-2">Slug (URL pública)</label>
          <div className="flex items-center">
            <span className="font-crimson text-sm text-gray-500 mr-1">/f/</span>
            <input
              value={effectiveSlug}
              onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
              placeholder="formulario-de-admision"
              className={inputCls}
            />
          </div>
        </div>

        {error && <p className="font-crimson text-sm text-red-400">{error}</p>}

        <button
          onClick={create}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-xs uppercase tracking-widest px-6 py-3 hover:bg-[#d4b06a] disabled:opacity-50 transition"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Creando…" : "Crear y editar"}
        </button>
      </div>
    </div>
  );
}
