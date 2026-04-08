"use client";

import dynamic from "next/dynamic";
import { useState, useRef } from "react";
import { Sparkles, Upload, Loader2, X, Wand2 } from "lucide-react";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface Props {
  value: string;
  onChange: (val: string) => void;
}

const btnBase =
  "flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-widest px-3 py-2 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export default function ContentEditor({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [panel, setPanel] = useState<"generate" | "improve" | null>(null);
  const [idea, setIdea] = useState("");
  const [aiError, setAiError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Image upload ─────────────────────────────────── */
  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      const md = `\n\n![${file.name}](${url})\n\n`;
      onChange(value + md);
    } catch {
      // silently fail — user sees no change
    } finally {
      setUploading(false);
    }
  };

  /* ── AI: generate post ────────────────────────────── */
  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", input: idea }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      onChange(data.content);
      setPanel(null);
      setIdea("");
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Error generando el post");
    } finally {
      setAiLoading(false);
    }
  };

  /* ── AI: improve text ─────────────────────────────── */
  const handleImprove = async () => {
    if (!value.trim()) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "improve", input: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      onChange(data.content);
      setPanel(null);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Error mejorando el texto");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div data-color-mode="dark">
      {/* ── Toolbar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => { setPanel(panel === "generate" ? null : "generate"); setAiError(""); }}
          className={`${btnBase} border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059]/10`}
        >
          <Sparkles className="w-3 h-3" />
          Generar desde idea
        </button>

        <button
          type="button"
          onClick={() => { setPanel(panel === "improve" ? null : "improve"); setAiError(""); }}
          disabled={!value.trim() || aiLoading}
          className={`${btnBase} border-white/15 text-gray-400 hover:border-white/30 hover:text-white`}
        >
          <Wand2 className="w-3 h-3" />
          Mejorar texto
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={`${btnBase} border-white/15 text-gray-400 hover:border-white/30 hover:text-white`}
        >
          {uploading
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <Upload className="w-3 h-3" />}
          {uploading ? "Subiendo..." : "Subir imagen"}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {/* ── AI Error ────────────────────────────────── */}
      {aiError && (
        <div className="mb-3 px-4 py-2 border border-red-500/30 bg-red-500/10">
          <p className="font-crimson text-sm text-red-400">{aiError}</p>
        </div>
      )}

      {/* ── Generate panel ──────────────────────────── */}
      {panel === "generate" && (
        <div className="mb-4 border border-[#C5A059]/30 bg-[#070f20] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <p className="font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059]">
                Generar post desde idea
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPanel(null)}
              className="text-gray-600 hover:text-gray-400 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Ej: La conexión entre traumas de vidas pasadas y las relaciones tóxicas actuales..."
            rows={3}
            className="w-full bg-[#020d1f] border border-white/10 text-gray-200 font-crimson text-sm px-4 py-3 placeholder-gray-600 focus:outline-none focus:border-[#C5A059]/40 resize-none"
          />

          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={aiLoading || !idea.trim()}
              className="flex items-center gap-2 bg-[#C5A059] hover:bg-[#d4b06a] disabled:opacity-50 text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-5 py-2.5 transition"
            >
              {aiLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              {aiLoading ? "Generando..." : "Generar post completo"}
            </button>
            <p className="font-crimson text-xs text-gray-600">
              Reemplazará el contenido actual
            </p>
          </div>
        </div>
      )}

      {/* ── Improve panel ───────────────────────────── */}
      {panel === "improve" && (
        <div className="mb-4 border border-white/10 bg-[#070f20] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wand2 className="w-3.5 h-3.5 text-gray-300" />
              <p className="font-cinzel text-[10px] uppercase tracking-widest text-gray-300">
                Mejorar texto con IA
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPanel(null)}
              className="text-gray-600 hover:text-gray-400 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="font-crimson text-sm text-gray-500 mb-4">
            Se mejorará la redacción y fluidez del contenido actual manteniendo el significado y tono espiritual.
          </p>
          <button
            type="button"
            onClick={handleImprove}
            disabled={aiLoading || !value.trim()}
            className="flex items-center gap-2 border border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059]/10 disabled:opacity-50 font-cinzel text-[10px] uppercase tracking-widest px-5 py-2.5 transition"
          >
            {aiLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            {aiLoading ? "Mejorando..." : "Mejorar texto"}
          </button>
        </div>
      )}

      {/* ── Editor ──────────────────────────────────── */}
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        height={480}
        preview="live"
        className="!bg-[#020d1f]"
      />
    </div>
  );
}
