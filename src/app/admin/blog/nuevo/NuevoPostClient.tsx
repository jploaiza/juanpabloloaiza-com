"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import ContentEditor from "@/components/admin/ContentEditor";
import { ArrowLeft, X, Plus, Upload, Sparkles, ImagePlus } from "lucide-react";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const inputClass =
  "w-full bg-[#020d1f] border border-white/10 text-gray-200 font-crimson text-base px-4 py-3 placeholder-gray-600 focus:outline-none focus:border-[#C5A059]/60 transition-colors";
const labelClass =
  "block font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059]/80 mb-1.5";
const errorClass = "text-red-400 text-xs font-crimson mt-1";
const charCountClass = "font-cinzel text-[9px] tracking-widest";

interface Props {
  basePath?: string;
}

export default function NuevoPostClient({ basePath = "/admin/blog" }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [seoImproving, setSeoImproving] = useState(false);
  const [seoError, setSeoError] = useState("");
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiFields, setAiFields] = useState<string[]>(["title", "excerpt", "content", "tags", "seoTitle", "seoDescription"]);
  const [aiImproving, setAiImproving] = useState(false);
  const [aiError, setAiError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleTitleChange = useCallback(
    (val: string) => {
      setTitle(val);
      if (!slugManual) {
        setSlug(slugify(val));
      }
    },
    [slugManual]
  );

  const handleSlugChange = (val: string) => {
    setSlugManual(true);
    setSlug(slugify(val));
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const AI_FIELDS = [
    { key: "title", label: "Título" },
    { key: "excerpt", label: "Extracto" },
    { key: "content", label: "Contenido" },
    { key: "tags", label: "Tags" },
    { key: "seoTitle", label: "SEO Title" },
    { key: "seoDescription", label: "SEO Description" },
  ];

  const toggleAiField = (key: string) =>
    setAiFields((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]);

  const handleAiImproveAll = async () => {
    if (!aiFields.length) { setAiError("Selecciona al menos un campo."); return; }
    setAiError("");
    setAiImproving(true);
    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "improve-fields",
          input: JSON.stringify({ fields: aiFields, title, excerpt, content, tags, seoTitle, seoDescription }),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error ?? "Error al mejorar con IA."); return; }
      if (data.title) { setTitle(data.title); if (!slugManual) setSlug(slugify(data.title)); }
      if (data.excerpt) setExcerpt(data.excerpt.slice(0, 300));
      if (data.content) setContent(data.content);
      if (data.tags && Array.isArray(data.tags)) setTags(data.tags);
      if (data.seoTitle) setSeoTitle(data.seoTitle.slice(0, 60));
      if (data.seoDescription) setSeoDescription(data.seoDescription.slice(0, 160));
      setShowAiModal(false);
    } catch {
      setAiError("Error de conexión.");
    } finally {
      setAiImproving(false);
    }
  };

  const handleSeoImprove = async () => {
    if (!title.trim() || !content.trim()) {
      setSeoError("Agrega título y contenido antes de mejorar SEO.");
      return;
    }
    setSeoError("");
    setSeoImproving(true);
    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "seo",
          input: JSON.stringify({ title, excerpt, content }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSeoError(data.error ?? "Error al mejorar SEO.");
      } else {
        if (data.seoTitle) setSeoTitle(data.seoTitle.slice(0, 60));
        if (data.seoDescription) setSeoDescription(data.seoDescription.slice(0, 160));
        if (data.excerpt) setExcerpt(data.excerpt.slice(0, 300));
      }
    } catch {
      setSeoError("Error de conexión.");
    } finally {
      setSeoImproving(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!title.trim()) { setUploadError("Agrega un título antes de generar imagen."); return; }
    setUploadError("");
    setGeneratingImage(true);
    try {
      const res = await fetch("/api/admin/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, excerpt, content }),
      });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error ?? "Error al generar imagen."); }
      else { setFeaturedImageUrl(data.url); }
    } catch {
      setUploadError("Error de conexión al generar imagen.");
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Error al subir imagen.");
      } else {
        setFeaturedImageUrl(data.url);
      }
    } catch {
      setUploadError("Error de conexión al subir imagen.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "El título es requerido.";
    if (!slug.trim()) errs.slug = "El slug es requerido.";
    if (!content.trim()) errs.content = "El contenido es requerido.";
    if (excerpt.length > 300) errs.excerpt = "Máximo 300 caracteres.";
    if (seoTitle.length > 60) errs.seoTitle = "Máximo 60 caracteres.";
    if (seoDescription.length > 160) errs.seoDescription = "Máximo 160 caracteres.";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          featuredImageUrl,
          tags,
          status,
          seoTitle,
          seoDescription,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error ?? "Error al crear el post.");
        setSubmitting(false);
        return;
      }

      router.push(basePath);
    } catch {
      setServerError("Error de conexión. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-20">
      <Link
        href={basePath}
        className="inline-flex items-center gap-2 font-cinzel text-[9px] uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition-colors mb-8"
      >
        <ArrowLeft className="w-3 h-3" />
        Volver al blog
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">
            Blog Manager
          </p>
          <h1 className="font-cinzel text-2xl text-white">Nuevo Post</h1>
        </div>
        <button
          type="button"
          onClick={() => { setAiError(""); setShowAiModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/20 font-cinzel text-[9px] uppercase tracking-widest transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Mejorar con IA
        </button>
      </div>

      {/* AI Improve Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="relative bg-[#0a1628] border border-[#C5A059]/20 p-8 max-w-md w-full overflow-hidden">
            <ScrollworkCorners size={36} opacity={0.6} />
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <h3 className="font-cinzel text-base text-white">Mejorar con IA</h3>
            </div>
            <p className="font-crimson text-sm text-gray-400 mb-6">
              Selecciona qué campos quieres mejorar:
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {AI_FIELDS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => toggleAiField(key)}
                    className={`w-4 h-4 border flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                      aiFields.includes(key)
                        ? "border-[#C5A059] bg-[#C5A059]"
                        : "border-white/20 group-hover:border-white/40"
                    }`}
                  >
                    {aiFields.includes(key) && <div className="w-2 h-2 bg-[#020617]" />}
                  </div>
                  <span className="font-cinzel text-[10px] uppercase tracking-widest text-gray-300">
                    {label}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => setAiFields(AI_FIELDS.map((f) => f.key))}
                className="font-cinzel text-[8px] uppercase tracking-widest text-[#C5A059]/60 hover:text-[#C5A059] transition-colors"
              >
                Seleccionar todo
              </button>
              <span className="text-gray-600">·</span>
              <button
                type="button"
                onClick={() => setAiFields([])}
                className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors"
              >
                Limpiar
              </button>
            </div>
            {aiError && <p className="text-red-400 text-xs font-crimson mb-4">{aiError}</p>}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleAiImproveAll}
                disabled={aiImproving || !aiFields.length}
                className="flex-1 bg-[#C5A059] hover:bg-[#d4b06a] disabled:opacity-50 text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-6 py-3 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {aiImproving ? "Mejorando..." : "Mejorar seleccionado"}
              </button>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                disabled={aiImproving}
                className="px-6 py-3 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 font-cinzel text-[10px] uppercase tracking-widest transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {serverError && (
        <div className="mb-6 px-4 py-3 border border-red-500/30 bg-red-500/10">
          <p className="font-crimson text-sm text-red-400">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card: Core fields */}
        <div className="relative bg-[#0a1628] border border-white/5 p-6 overflow-hidden">
          <ScrollworkCorners size={40} opacity={0.7} />
          <h2 className="font-cinzel text-xs uppercase tracking-widest text-white mb-6">
            Contenido principal
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Título *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="El título del artículo"
                className={inputClass}
              />
              {errors.title && <p className={errorClass}>{errors.title}</p>}
            </div>
            <div>
              <label className={labelClass}>Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="url-del-articulo"
                className={inputClass}
              />
              {slug && (
                <p className="font-cinzel text-[8px] text-gray-600 mt-1 tracking-widest">
                  URL: /blog/<span className="text-[#C5A059]/60">{slug}</span>
                </p>
              )}
              {errors.slug && <p className={errorClass}>{errors.slug}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass.replace("mb-1.5", "")}>Extracto</label>
                <span className={`${charCountClass} ${excerpt.length > 300 ? "text-red-400" : "text-gray-600"}`}>
                  {excerpt.length}/300
                </span>
              </div>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Breve descripción del artículo (aparece en listados y SEO)..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
              {errors.excerpt && <p className={errorClass}>{errors.excerpt}</p>}
            </div>
            <div>
              <label className={labelClass}>Contenido *</label>
              <ContentEditor
                value={content}
                onChange={setContent}
                onFullGenerate={(data) => {
                  if (data.title) { setTitle(data.title); if (!slugManual) setSlug(slugify(data.title)); }
                  if (data.excerpt) setExcerpt(data.excerpt.slice(0, 300));
                  if (data.content) setContent(data.content);
                  if (data.tags?.length) setTags(data.tags);
                  if (data.seoTitle) setSeoTitle(data.seoTitle.slice(0, 60));
                  if (data.seoDescription) setSeoDescription(data.seoDescription.slice(0, 160));
                }}
              />
              {errors.content && <p className={errorClass}>{errors.content}</p>}
            </div>
          </div>
        </div>

        {/* Card: Meta & Media */}
        <div className="relative bg-[#0a1628] border border-white/5 p-6 overflow-hidden">
          <ScrollworkCorners size={40} opacity={0.7} />
          <h2 className="font-cinzel text-xs uppercase tracking-widest text-white mb-6">
            Imagen & Tags
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Imagen destacada</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  placeholder="https://media.juanpabloloaiza.com/blog/..."
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={generatingImage || uploading}
                  className="px-3 py-3 bg-purple-900/30 border border-purple-500/30 text-purple-300 hover:bg-purple-900/50 disabled:opacity-50 transition-colors"
                  title="Generar imagen con IA"
                >
                  <ImagePlus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || generatingImage}
                  className="px-3 py-3 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/20 disabled:opacity-50 transition-colors"
                  title="Subir imagen a R2"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              {(uploading || generatingImage) && (
                <p className="font-cinzel text-[9px] tracking-widest text-[#C5A059]/60 mt-1">
                  {generatingImage ? "Generando imagen con IA (~20s)..." : "Subiendo..."}
                </p>
              )}
              {uploadError && <p className="text-red-400 text-xs font-crimson mt-1">{uploadError}</p>}
              {featuredImageUrl && !uploading && !generatingImage && (
                <a
                  href={featuredImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-cinzel text-[8px] tracking-widest text-[#C5A059]/50 hover:text-[#C5A059] mt-1 block truncate transition-colors"
                >
                  {featuredImageUrl}
                </a>
              )}
              {featuredImageUrl && (
                <div className="mt-2 border border-white/5 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredImageUrl}
                    alt="Preview imagen destacada"
                    className="w-full h-32 object-cover opacity-70"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}>Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Agregar tag y presiona Enter o coma"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-3 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/20 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] font-cinzel text-[9px] uppercase tracking-widest"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-[#C5A059]/60 hover:text-[#C5A059] transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card: SEO */}
        <div className="relative bg-[#0a1628] border border-white/5 p-6 overflow-hidden">
          <ScrollworkCorners size={40} opacity={0.7} />
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-cinzel text-xs uppercase tracking-widest text-white">SEO</h2>
            <button
              type="button"
              onClick={handleSeoImprove}
              disabled={seoImproving}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/20 disabled:opacity-50 font-cinzel text-[9px] uppercase tracking-widest transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              {seoImproving ? "Generando..." : "Mejorar con IA"}
            </button>
          </div>
          {seoError && <p className="text-red-400 text-xs font-crimson mb-4">{seoError}</p>}

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass.replace("mb-1.5", "")}>SEO Title</label>
                <span className={`${charCountClass} ${seoTitle.length > 60 ? "text-red-400" : "text-gray-600"}`}>
                  {seoTitle.length}/60
                </span>
              </div>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Título para motores de búsqueda (opcional)"
                className={inputClass}
              />
              {errors.seoTitle && <p className={errorClass}>{errors.seoTitle}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass.replace("mb-1.5", "")}>SEO Description</label>
                <span className={`${charCountClass} ${seoDescription.length > 160 ? "text-red-400" : "text-gray-600"}`}>
                  {seoDescription.length}/160
                </span>
              </div>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Descripción meta para motores de búsqueda (opcional)..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
              {errors.seoDescription && <p className={errorClass}>{errors.seoDescription}</p>}
            </div>
          </div>
        </div>

        {/* Card: Status & Submit */}
        <div className="relative bg-[#0a1628] border border-white/5 p-6 overflow-hidden">
          <ScrollworkCorners size={40} opacity={0.7} />
          <h2 className="font-cinzel text-xs uppercase tracking-widest text-white mb-6">
            Publicación
          </h2>
          <div className="flex gap-6 mb-8">
            {(["draft", "published"] as const).map((s) => (
              <label key={s} className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                    status === s
                      ? "border-[#C5A059] bg-[#C5A059]"
                      : "border-white/20 group-hover:border-white/40"
                  }`}
                  onClick={() => setStatus(s)}
                >
                  {status === s && <div className="w-2 h-2 bg-[#020617]" />}
                </div>
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={status === s}
                  onChange={() => setStatus(s)}
                  className="sr-only"
                />
                <span className="font-cinzel text-[10px] uppercase tracking-widest text-gray-300">
                  {s === "draft" ? "Borrador" : "Publicado"}
                </span>
                {s === "published" && (
                  <span className="font-crimson text-xs text-gray-600">(visible en el blog)</span>
                )}
              </label>
            ))}
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 sm:flex-none bg-[#C5A059] hover:bg-[#d4b06a] disabled:opacity-50 disabled:cursor-not-allowed text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-8 py-3 transition-colors"
            >
              {submitting ? "Guardando..." : "Crear Post"}
            </button>
            <Link
              href={basePath}
              className="px-6 py-3 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 font-cinzel text-[10px] uppercase tracking-widest transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
