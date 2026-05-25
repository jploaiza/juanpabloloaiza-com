"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Trash2, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import AcademyCard from "@/components/academy/AcademyCard";

interface NLList {
  slug: string;
  label: string;
  description: string | null;
  preset: boolean;
  count: number;
}

export default function ListsManager() {
  const [lists, setLists] = useState<NLList[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [createError, setCreateError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter/lists");
      if (res.ok) {
        const data = await res.json();
        setLists(data.lists ?? []);
      }
    } catch {
      // network error — keep previous list state
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadLists(); }, [loadLists]);

  async function createList() {
    setCreateError("");
    const res = await fetch("/api/newsletter/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: newSlug, label: newLabel }),
    });
    const data = await res.json();
    if (!res.ok) { setCreateError(data.error ?? "Error al crear la lista."); return; }
    setCreating(false);
    setNewSlug(""); setNewLabel("");
    loadLists();
  }

  async function deleteList(slug: string, label: string) {
    if (!confirm(`¿Eliminar la lista "${label}"? Se quitará el tag de todos los suscriptores.`)) return;
    setDeleting(slug);
    await fetch(`/api/newsletter/lists/${slug}/subscribers`, { method: "DELETE" });
    setDeleting(null);
    loadLists();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <p className="font-crimson text-gray-400 text-sm leading-relaxed max-w-lg">
          Las listas permiten segmentar suscriptores por frecuencia o interés.
          Asigna suscriptores desde la página de Suscriptores y selecciona la lista al programar una campaña.
        </p>
        <button onClick={() => { setCreating(true); setCreateError(""); }}
          className="flex items-center gap-1.5 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10 font-cinzel text-[9px] uppercase tracking-widest px-3 py-2 transition whitespace-nowrap flex-shrink-0">
          <Plus className="w-3 h-3" /> Nueva lista
        </button>
      </div>

      {creating && (
        <AcademyCard>
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-4">Nueva lista personalizada</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">
                Identificador *
              </label>
              <input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="ej. quincenal"
                className="w-full bg-[#0a1628] border border-[#C5A059]/20 text-gray-200 font-crimson px-3 py-2 text-sm focus:outline-none focus:border-[#C5A059]/50"
              />
              <p className="font-mono text-[9px] text-gray-600 mt-1">
                tag: &quot;lista:{newSlug || "..."}&quot;
              </p>
            </div>
            <div>
              <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">
                Nombre visible
              </label>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="ej. Quincenal"
                className="w-full bg-[#0a1628] border border-[#C5A059]/20 text-gray-200 font-crimson px-3 py-2 text-sm focus:outline-none focus:border-[#C5A059]/50"
              />
            </div>
          </div>
          {createError && <p className="font-crimson text-sm text-red-400 mb-3">{createError}</p>}
          <div className="flex gap-2">
            <button
              onClick={createList}
              disabled={!newSlug}
              className="flex items-center gap-1.5 bg-[#C5A059] hover:bg-[#d4b06a] disabled:opacity-60 text-[#020617] font-cinzel text-[9px] uppercase tracking-widest px-4 py-2 transition"
            >
              Crear lista
            </button>
            <button
              onClick={() => { setCreating(false); setNewSlug(""); setNewLabel(""); setCreateError(""); }}
              className="border border-white/10 text-gray-500 hover:text-white font-cinzel text-[9px] uppercase tracking-widest px-4 py-2 transition"
            >
              Cancelar
            </button>
          </div>
        </AcademyCard>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3">
          <Loader2 className="w-5 h-5 text-[#C5A059] animate-spin" />
          <span className="font-crimson text-sm text-gray-500">Cargando...</span>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <AcademyCard key={list.slug}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  {list.preset ? (
                    <span className="inline-block font-cinzel text-[7px] uppercase tracking-widest text-[#C5A059]/50 border border-[#C5A059]/20 px-1.5 py-0.5 mb-2">
                      predefinida
                    </span>
                  ) : (
                    <span className="inline-block font-cinzel text-[7px] uppercase tracking-widest text-gray-600 border border-white/10 px-1.5 py-0.5 mb-2">
                      personalizada
                    </span>
                  )}
                  <p className="font-cinzel text-sm text-white">{list.label}</p>
                  <p className="font-mono text-[9px] text-gray-600 mt-0.5">lista:{list.slug}</p>
                </div>
                {!list.preset && (
                  <button
                    onClick={() => deleteList(list.slug, list.label)}
                    disabled={deleting === list.slug}
                    title="Eliminar lista"
                    className="p-1.5 text-red-500/30 hover:text-red-400 transition flex-shrink-0"
                  >
                    {deleting === list.slug
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              {list.description && (
                <p className="font-crimson text-xs text-gray-500 mb-3 leading-relaxed">{list.description}</p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-[#C5A059]/50" />
                  <span className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/80">
                    {list.count} confirmados
                  </span>
                </div>
                <Link
                  href={`/academy/admin/newsletter/subscribers?lista=${list.slug}`}
                  className="flex items-center gap-1 text-gray-600 hover:text-[#C5A059] font-cinzel text-[8px] uppercase tracking-widest transition"
                >
                  Ver suscriptores <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </AcademyCard>
          ))}
        </div>
      )}

      <div className="bg-[#0a1628] border border-white/5 p-4">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-600 mb-2">Cómo usar las listas</p>
        <ol className="font-crimson text-xs text-gray-500 space-y-1 list-decimal list-inside leading-relaxed">
          <li>Ve a Suscriptores, selecciona uno o varios, y asígnales una lista con &quot;Agregar a lista&quot;.</li>
          <li>Al crear o editar una campaña, en la sección Segmento selecciona la lista de destino.</li>
          <li>La campaña solo se enviará a los confirmados de esa lista.</li>
        </ol>
      </div>
    </div>
  );
}
