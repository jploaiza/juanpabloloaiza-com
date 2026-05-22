"use client";

import { useState, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";

interface PexelsPhoto {
  id: number;
  src: string;
  preview: string;
  alt: string;
  photographer: string;
  photographer_url: string;
  page_url: string;
}

interface PexelsSearchProps {
  onSelect: (url: string) => void;
  defaultQuery?: string;
}

export default function PexelsSearch({ onSelect, defaultQuery = "" }: PexelsSearchProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setPhotos([]);
    try {
      const res = await fetch(`/api/admin/pexels-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al buscar"); return; }
      setPhotos(data.photos ?? []);
      if ((data.photos ?? []).length === 0) setError("Sin resultados. Intenta otra búsqueda.");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleSearch(); }
  };

  const handleSelect = (photo: PexelsPhoto) => {
    setSelected(photo.id);
    onSelect(photo.src);
  };

  return (
    <div className="mt-3 space-y-2">
      <p className="font-cinzel text-[8px] uppercase tracking-widest text-blue-400/80">
        Buscar en Pexels
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="ej: woman meditation dark, forest light healing…"
          className="flex-1 bg-black/40 border border-blue-500/20 text-gray-300 font-mono text-[11px] px-3 py-2 focus:outline-none focus:border-blue-500/40 placeholder:text-gray-600"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-3 py-2 bg-blue-900/30 border border-blue-500/30 text-blue-300 hover:bg-blue-900/50 disabled:opacity-40 transition-colors"
          title="Buscar en Pexels"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      {error && <p className="text-red-400 text-xs font-crimson">{error}</p>}

      {photos.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => handleSelect(photo)}
                className={`relative overflow-hidden aspect-video focus:outline-none group ${
                  selected === photo.id ? "ring-2 ring-blue-400" : ""
                }`}
                title={photo.alt || photo.photographer}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.preview}
                  alt={photo.alt}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/40 transition-colors flex items-center justify-center">
                  <span className="text-white font-cinzel text-[8px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    {selected === photo.id ? "✓ Seleccionada" : "Seleccionar"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <p className="font-cinzel text-[7px] uppercase tracking-widest text-gray-600">
            Fotos de{" "}
            <a
              href="https://www.pexels.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500/60 hover:text-blue-400 transition-colors"
            >
              Pexels
            </a>
            {selected !== null && (
              <>
                {" · "}
                <a
                  href={photos.find((p) => p.id === selected)?.photographer_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500/60 hover:text-blue-400 transition-colors"
                >
                  {photos.find((p) => p.id === selected)?.photographer}
                </a>
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}
