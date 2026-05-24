"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface Props { onClose: () => void }

interface ImportResult {
  inserted: number; skipped: number;
  errors: Array<{ row: number; email: string; reason: string }>;
}

export default function ImportCSV({ onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".csv") || f.type === "text/csv")) setFile(f);
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true); setError(""); setResult(null);

    const text = await file.text();
    const res = await fetch("/api/newsletter/subscribers/import", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: text,
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Error importando"); return; }
    setResult(data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#0e1b30] border border-[#C5A059]/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <p className="font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059]">Importar suscriptores CSV</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-6 space-y-5">
          {!result ? (
            <>
              <div
                onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-[#C5A059]/20 hover:border-[#C5A059]/50 transition p-8 text-center cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".csv" className="hidden"
                  onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
                <Upload className="w-8 h-8 text-[#C5A059]/40 mx-auto mb-3" />
                {file ? (
                  <div>
                    <p className="font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059]">{file.name}</p>
                    <p className="font-crimson text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-crimson text-sm text-gray-400">Arrastra tu CSV o haz click</p>
                    <p className="font-crimson text-xs text-gray-600 mt-1">Columnas: email, name, apellido, tags (opcional)</p>
                  </div>
                )}
              </div>

              <div className="bg-[#0a1628] border border-white/5 p-4">
                <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-2">Formato esperado</p>
                <code className="font-mono text-xs text-gray-400 block leading-relaxed">
                  email,name,apellido,tags<br/>
                  juan@ejemplo.com,Juan,Pérez,taller|retiro<br/>
                  maria@ejemplo.com,María,López,
                </code>
              </div>

              {error && <p className="font-crimson text-sm text-red-400">{error}</p>}

              <div className="flex gap-3">
                <button onClick={handleImport} disabled={!file || loading}
                  className="flex items-center gap-2 bg-[#C5A059] hover:bg-[#d4b06a] disabled:opacity-60 text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-5 py-3 transition">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {loading ? "Importando..." : "Importar"}
                </button>
                <button onClick={onClose}
                  className="border border-white/10 text-gray-400 hover:text-white font-cinzel text-[10px] uppercase tracking-widest px-5 py-3 transition">
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="font-cinzel text-sm text-white">Importación completada</p>
                  <p className="font-crimson text-sm text-gray-400">
                    {result.inserted} añadidos · {result.skipped} duplicados omitidos
                    {result.errors.length > 0 && ` · ${result.errors.length} errores`}
                  </p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-[#0a1628] border border-red-500/20 p-4 max-h-40 overflow-y-auto">
                  <p className="font-cinzel text-[9px] uppercase tracking-widest text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" /> Filas con error
                  </p>
                  {result.errors.slice(0, 10).map((e, i) => (
                    <p key={i} className="font-mono text-xs text-gray-500">
                      Fila {e.row}: {e.email} — {e.reason}
                    </p>
                  ))}
                </div>
              )}
              <button onClick={onClose}
                className="w-full bg-[#C5A059] hover:bg-[#d4b06a] text-[#020617] font-cinzel text-[10px] uppercase tracking-widest py-3 transition">
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
