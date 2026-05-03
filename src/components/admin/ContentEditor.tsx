"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Link2, ImageIcon, Sparkles, Wand2, Upload, Loader2, X, Copy, Check, Quote,
} from "lucide-react";

type FullGenerateData = {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  imagePrompt: string;
};

interface Props {
  value: string;
  onChange: (val: string) => void;
  onFullGenerate?: (data: FullGenerateData) => void;
}

const btnTool = "p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-30 text-gray-400 hover:text-white";
const btnActive = "bg-white/15 text-white";

export default function ContentEditor({ value, onChange, onFullGenerate }: Props) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState("");
  const [uploading, setUploading] = useState(false);
  const [panel, setPanel] = useState<"generate" | "improve" | null>(null);
  const [idea, setIdea] = useState("");
  const [aiError, setAiError] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isInternalUpdate = useRef(false);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) return null;
      const { url } = await res.json();
      return url;
    } catch {
      return null;
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({ html: false, tightLists: true }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Escribe el contenido del artículo..." }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-sm max-w-none min-h-[480px] px-5 py-4 focus:outline-none font-crimson text-gray-200 leading-relaxed",
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        const file = files[0];
        if (!file.type.startsWith("image/")) return false;
        event.preventDefault();
        uploadImage(file).then((url) => {
          if (url) view.dispatch(view.state.tr.replaceSelectionWith(
            view.state.schema.nodes.image.create({ src: url, alt: file.name })
          ));
        });
        return true;
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) return true;
            uploadImage(file).then((url) => {
              if (url) view.dispatch(view.state.tr.replaceSelectionWith(
                view.state.schema.nodes.image.create({ src: url, alt: "imagen" })
              ));
            });
            return true;
          }
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      if (isInternalUpdate.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const md = (editor.storage as any).markdown.getMarkdown();
      onChange(md);
    },
  });

  // Sync external value changes (e.g. AI generation)
  useEffect(() => {
    if (!editor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = (editor.storage as any).markdown.getMarkdown();
    if (current !== value) {
      isInternalUpdate.current = true;
      editor.commands.setContent(value);
      isInternalUpdate.current = false;
    }
  }, [value, editor]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const url = await uploadImage(file);
    if (url && editor) {
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    }
    setUploading(false);
  };

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setAiLoading(true);
    setAiError("");
    setImagePrompt("");
    setAiProgress("Conectando con IA...");
    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-full", input: idea }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(err.error ?? "Error");
      }

      // Read the streamed plain-text response, accumulate, parse JSON at the end
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let chars = 0;
      setAiProgress("Generando artículo…");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        chars += chunk.length;
        setAiProgress(`Generando… ${chars} caracteres`);
      }
      fullText += decoder.decode(); // flush remaining bytes

      // Parse the complete JSON
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("La IA no devolvió un artículo válido. Intenta de nuevo.");
      const data = JSON.parse(jsonMatch[0]);

      onChange(data.content ?? "");
      if (data.imagePrompt) setImagePrompt(data.imagePrompt);
      if (onFullGenerate) {
        onFullGenerate({
          title: data.title ?? "",
          excerpt: data.excerpt ?? "",
          content: data.content ?? "",
          tags: Array.isArray(data.tags) ? data.tags : [],
          seoTitle: data.seoTitle ?? "",
          seoDescription: data.seoDescription ?? "",
          imagePrompt: data.imagePrompt ?? "",
        });
      }
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Error generando el post");
    } finally {
      setAiLoading(false);
      setAiProgress("");
    }
  };

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

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(imagePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setLink = () => {
    const url = window.prompt("URL del enlace:");
    if (!url) return;
    editor?.chain().focus().setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div className="border border-white/10 bg-[#0e1b30]">
      {/* ── AI toolbar ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/5">
        <button
          type="button"
          onClick={() => { setPanel(panel === "generate" ? null : "generate"); setAiError(""); }}
          className="flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-widest px-3 py-1.5 border border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059]/10 transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          Generar desde idea
        </button>
        <button
          type="button"
          onClick={() => { setPanel(panel === "improve" ? null : "improve"); setAiError(""); }}
          disabled={!value.trim() || aiLoading}
          className="flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-widest px-3 py-1.5 border border-white/15 text-gray-400 hover:border-white/30 hover:text-white transition-colors disabled:opacity-40"
        >
          <Wand2 className="w-3 h-3" />
          Mejorar texto
        </button>
      </div>

      {/* ── Format toolbar ─────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-white/5">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${btnTool} ${editor.isActive("bold") ? btnActive : ""}`} title="Negrita"><Bold className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btnTool} ${editor.isActive("italic") ? btnActive : ""}`} title="Cursiva"><Italic className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${btnTool} ${editor.isActive("heading", { level: 2 }) ? btnActive : ""}`} title="Título H2"><Heading2 className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`${btnTool} ${editor.isActive("heading", { level: 3 }) ? btnActive : ""}`} title="Título H3"><Heading3 className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btnTool} ${editor.isActive("bulletList") ? btnActive : ""}`} title="Lista"><List className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${btnTool} ${editor.isActive("orderedList") ? btnActive : ""}`} title="Lista numerada"><ListOrdered className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${btnTool} ${editor.isActive("blockquote") ? btnActive : ""}`} title="Cita"><Quote className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button type="button" onClick={setLink} className={`${btnTool} ${editor.isActive("link") ? btnActive : ""}`} title="Enlace"><Link2 className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={`${btnTool} flex items-center gap-1`}
          title="Insertar imagen"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          <span className="font-cinzel text-[8px] tracking-widest">Imagen</span>
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt("URL de imagen externa:");
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
          className={btnTool}
          title="Insertar imagen por URL"
        >
          <Upload className="w-4 h-4" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
      </div>

      {/* ── AI Error ────────────────────────────────── */}
      {aiError && (
        <div className="mx-4 mt-3 px-4 py-2 border border-red-500/30 bg-red-500/10">
          <p className="font-crimson text-sm text-red-400">{aiError}</p>
        </div>
      )}

      {/* ── Generate panel ──────────────────────────── */}
      {panel === "generate" && (
        <div className="mx-4 mt-4 border border-[#C5A059]/30 bg-[#070f20] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <p className="font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059]">Generar post completo desde idea</p>
            </div>
            <button type="button" onClick={() => { setPanel(null); setImagePrompt(""); }} className="text-gray-600 hover:text-gray-400"><X className="w-4 h-4" /></button>
          </div>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Ej: La conexión entre traumas de vidas pasadas y las relaciones tóxicas actuales..."
            rows={3}
            className="w-full bg-[#0e1b30] border border-white/10 text-gray-200 font-crimson text-sm px-4 py-3 placeholder-gray-600 focus:outline-none focus:border-[#C5A059]/40 resize-none"
          />
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={aiLoading || !idea.trim()}
              className="flex items-center gap-2 bg-[#C5A059] hover:bg-[#d4b06a] disabled:opacity-50 text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-5 py-2.5 transition"
            >
              {aiLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              {aiLoading ? (aiProgress || "Generando…") : "Generar post completo"}
            </button>
            <p className="font-crimson text-xs text-gray-600">
              {onFullGenerate ? "Llenará todos los campos automáticamente" : "Reemplazará el contenido"}
            </p>
          </div>
          {imagePrompt && (
            <div className="mt-5 border border-purple-500/20 bg-purple-900/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-cinzel text-[9px] uppercase tracking-widest text-purple-300">Prompt de imagen</p>
                <button type="button" onClick={handleCopyPrompt} className="flex items-center gap-1.5 font-cinzel text-[8px] uppercase tracking-widest text-purple-300 hover:text-purple-200">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
              <p className="font-crimson text-sm text-gray-400">{imagePrompt}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Improve panel ───────────────────────────── */}
      {panel === "improve" && (
        <div className="mx-4 mt-4 border border-white/10 bg-[#070f20] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wand2 className="w-3.5 h-3.5 text-gray-300" />
              <p className="font-cinzel text-[10px] uppercase tracking-widest text-gray-300">Mejorar texto con IA</p>
            </div>
            <button type="button" onClick={() => setPanel(null)} className="text-gray-600 hover:text-gray-400"><X className="w-4 h-4" /></button>
          </div>
          <p className="font-crimson text-sm text-gray-500 mb-4">Mejora redacción y fluidez manteniendo el tono espiritual.</p>
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

      {/* ── TipTap Editor ───────────────────────────── */}
      <EditorContent editor={editor} />
      <p className="px-5 py-2 font-cinzel text-[8px] tracking-widest text-gray-700 border-t border-white/5">
        Drag & drop o pega imágenes directamente en el editor — se suben automáticamente a R2
      </p>
    </div>
  );
}
