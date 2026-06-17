"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, ChevronUp, ChevronDown, Plus, Trash2, Copy, Pencil,
  Loader2, Check, Eye, ExternalLink, GripVertical, Settings,
} from "lucide-react";
import {
  type FormRow, type Question, type QuestionType, type Choice, type FormSchema,
  QUESTION_TYPE_META,
} from "@/lib/forms/types";

function mkChoice(label: string): Choice {
  return { id: crypto.randomUUID(), label, value: crypto.randomUUID().slice(0, 8) };
}

function makeQuestion(type: QuestionType): Question {
  const id = crypto.randomUUID();
  const base = { id, title: "", description: undefined, required: false } as const;
  switch (type) {
    case "single_choice":
    case "dropdown":
      return { ...base, type, choices: [mkChoice("Opción 1"), mkChoice("Opción 2")] };
    case "multiple_choice":
      return { ...base, type, choices: [mkChoice("Opción 1"), mkChoice("Opción 2")] };
    case "rating":
      return { ...base, type, scale: 5 };
    case "consent":
      return { ...base, type, consentText: "Acepto los términos y el tratamiento de mis datos." };
    case "statement":
      return { ...base, type, required: false };
    default:
      return { ...base, type } as Question;
  }
}

const inputCls =
  "w-full bg-[#0a1628] border border-white/10 text-white px-3 py-2 font-crimson text-sm focus:outline-none focus:border-[#C5A059] transition placeholder-white/30";
const labelCls = "block font-cinzel text-[9px] uppercase tracking-widest text-gray-400 mb-1.5";

export default function FormBuilder({ initial }: { initial: FormRow }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [description, setDescription] = useState(initial.description ?? "");
  const [notifyEmail, setNotifyEmail] = useState(initial.notify_email);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(initial.notify_whatsapp);
  const [isAdmission, setIsAdmission] = useState(initial.is_admission);
  const [questions, setQuestions] = useState<Question[]>(initial.schema?.questions ?? []);
  const logic = initial.schema?.logic ?? []; // preservado intacto (se edita en fase 2)
  const [status, setStatus] = useState(initial.status);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const markDirty = useCallback(() => { setDirty(true); setSavedAt(null); }, []);

  function patchQuestion(id: string, patch: Record<string, unknown>) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? ({ ...q, ...patch } as Question) : q)));
    markDirty();
  }
  function addQuestion(type: QuestionType) {
    const q = makeQuestion(type);
    setQuestions((qs) => [...qs, q]);
    setEditingId(q.id);
    setShowTypePicker(false);
    markDirty();
  }
  function removeQuestion(id: string) {
    setQuestions((qs) => qs.filter((q) => q.id !== id));
    if (editingId === id) setEditingId(null);
    markDirty();
  }
  function duplicateQuestion(id: string) {
    setQuestions((qs) => {
      const idx = qs.findIndex((q) => q.id === id);
      if (idx < 0) return qs;
      const copy = { ...qs[idx], id: crypto.randomUUID() } as Question;
      const next = [...qs];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    markDirty();
  }
  function move(id: string, dir: -1 | 1) {
    setQuestions((qs) => {
      const idx = qs.findIndex((q) => q.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= qs.length) return qs;
      const next = [...qs];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    markDirty();
  }

  async function save(): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/forms/${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          notify_email: notifyEmail,
          notify_whatsapp: notifyWhatsapp,
          is_admission: isAdmission,
          schema: { questions, logic } as FormSchema,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Error al guardar.");
        return false;
      }
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }));
      return true;
    } catch {
      setError("Error de conexión.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    const publish = status !== "published";
    if (dirty && !(await save())) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/forms/${initial.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Error al publicar."); return; }
      setStatus(json.form.status);
    } catch {
      setError("Error de conexión.");
    } finally {
      setPublishing(false);
    }
  }

  async function del() {
    if (!confirm("¿Eliminar este formulario? Esta acción no se puede deshacer desde aquí.")) return;
    await fetch(`/api/admin/forms/${initial.id}`, { method: "DELETE" });
    router.push("/academy/admin/formularios");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 lg:pl-56 pb-32">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <Link href="/academy/admin/formularios" className="inline-flex items-center gap-1 font-cinzel text-[10px] uppercase tracking-widest text-gray-400 hover:text-[#C5A059] transition">
          <ChevronLeft className="w-4 h-4" /> Formularios
        </Link>
        <div className="flex items-center gap-2">
          {status === "published" && (
            <a href={`/f/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-cinzel text-[10px] uppercase tracking-widest text-gray-400 hover:text-[#C5A059] transition">
              <Eye className="w-3.5 h-3.5" /> Ver <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button onClick={() => setShowSettings((s) => !s)} className="inline-flex items-center gap-1 font-cinzel text-[10px] uppercase tracking-widest text-gray-400 hover:text-[#C5A059] transition">
            <Settings className="w-3.5 h-3.5" /> Ajustes
          </button>
        </div>
      </div>

      {/* Title + meta */}
      <input
        value={title}
        onChange={(e) => { setTitle(e.target.value); markDirty(); }}
        placeholder="Título del formulario"
        className="w-full bg-transparent font-cinzel text-2xl text-white border-b border-white/10 focus:outline-none focus:border-[#C5A059] pb-2 mb-2 transition"
      />
      <p className="font-crimson text-xs text-gray-500 mb-6">/f/{slug}</p>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-[#16213e] border border-white/5 p-5 mb-6 space-y-4">
          <div>
            <label className={labelCls}>Slug (URL pública)</label>
            <input value={slug} onChange={(e) => { setSlug(e.target.value); markDirty(); }} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Descripción (subtítulo)</label>
            <textarea value={description} onChange={(e) => { setDescription(e.target.value); markDirty(); }} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
            <Toggle label="Notificar por email" checked={notifyEmail} onChange={(v) => { setNotifyEmail(v); markDirty(); }} />
            <Toggle label="Notificar por WhatsApp" checked={notifyWhatsapp} onChange={(v) => { setNotifyWhatsapp(v); markDirty(); }} />
            <Toggle label="Es el formulario de admisión" checked={isAdmission} onChange={(v) => { setIsAdmission(v); markDirty(); }} />
          </div>
          <button onClick={del} className="font-cinzel text-[10px] uppercase tracking-widest text-red-400 hover:text-red-300 transition flex items-center gap-1 pt-2">
            <Trash2 className="w-3.5 h-3.5" /> Eliminar formulario
          </button>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-2">
        {questions.map((q, i) => (
          <div key={q.id} className="bg-[#16213e] border border-white/5">
            <div className="flex items-center gap-3 px-4 py-3">
              <GripVertical className="w-4 h-4 text-gray-600 shrink-0" />
              <span className="font-cinzel text-xs text-[#C5A059] shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-crimson text-sm text-white truncate">{q.title || <span className="text-gray-500 italic">Sin título</span>}</p>
                <p className="font-cinzel text-[8px] uppercase tracking-widest text-gray-500 mt-0.5">
                  {QUESTION_TYPE_META[q.type].label}{q.required && " · requerido"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <IconBtn title="Subir" onClick={() => move(q.id, -1)} disabled={i === 0}><ChevronUp className="w-4 h-4" /></IconBtn>
                <IconBtn title="Bajar" onClick={() => move(q.id, 1)} disabled={i === questions.length - 1}><ChevronDown className="w-4 h-4" /></IconBtn>
                <IconBtn title="Duplicar" onClick={() => duplicateQuestion(q.id)}><Copy className="w-4 h-4" /></IconBtn>
                <IconBtn title="Editar" onClick={() => setEditingId(editingId === q.id ? null : q.id)}><Pencil className="w-4 h-4" /></IconBtn>
                <IconBtn title="Eliminar" onClick={() => removeQuestion(q.id)}><Trash2 className="w-4 h-4" /></IconBtn>
              </div>
            </div>
            {editingId === q.id && (
              <div className="border-t border-white/5 p-4">
                <QuestionEditor q={q} onChange={(patch) => patchQuestion(q.id, patch)} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add question */}
      <div className="mt-4">
        {showTypePicker ? (
          <div className="bg-[#16213e] border border-[#C5A059]/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059]">Tipo de pregunta</p>
              <button onClick={() => setShowTypePicker(false)} className="font-crimson text-xs text-gray-500 hover:text-white">Cancelar</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(QUESTION_TYPE_META) as QuestionType[]).map((t) => (
                <button key={t} onClick={() => addQuestion(t)} className="font-crimson text-sm text-gray-200 border border-white/10 hover:border-[#C5A059] hover:text-[#C5A059] px-3 py-2.5 text-left transition">
                  {QUESTION_TYPE_META[t].label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button onClick={() => setShowTypePicker(true)} className="w-full border border-dashed border-white/15 hover:border-[#C5A059] text-gray-400 hover:text-[#C5A059] py-4 font-cinzel text-xs uppercase tracking-widest transition flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Agregar pregunta
          </button>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-52 bg-[#0a1628]/95 backdrop-blur border-t border-white/10 px-4 sm:px-6 py-3 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="font-crimson text-xs text-gray-500 min-w-0 truncate">
            {error ? <span className="text-red-400">{error}</span> : savedAt ? <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Guardado {savedAt}</span> : dirty ? "Cambios sin guardar" : status === "published" ? "Publicado" : "Borrador"}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={save} disabled={saving || !dirty} className="inline-flex items-center gap-2 border border-[#C5A059]/40 text-[#C5A059] font-cinzel text-xs uppercase tracking-widest px-5 py-2.5 hover:bg-[#C5A059]/10 disabled:opacity-40 transition">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Guardar
            </button>
            <button onClick={togglePublish} disabled={publishing} className="inline-flex items-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-xs uppercase tracking-widest px-5 py-2.5 hover:bg-[#d4b06a] disabled:opacity-50 transition">
              {publishing && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === "published" ? "Despublicar" : "Publicar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, title, onClick, disabled }: { children: React.ReactNode; title: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button title={title} onClick={onClick} disabled={disabled} className="p-1.5 text-gray-400 hover:text-[#C5A059] disabled:opacity-20 disabled:hover:text-gray-400 transition">
      {children}
    </button>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-[#C5A059] w-4 h-4" />
      <span className="font-crimson text-sm text-gray-300">{label}</span>
    </label>
  );
}

// ── Editor por pregunta ─────────────────────────────────────────────────────

function QuestionEditor({ q, onChange }: { q: Question; onChange: (patch: Record<string, unknown>) => void }) {
  const meta = QUESTION_TYPE_META[q.type];

  function updateChoice(idx: number, label: string) {
    if (!("choices" in q)) return;
    const choices = q.choices.map((c, i) => (i === idx ? { ...c, label } : c));
    onChange({ choices });
  }
  function addChoice() {
    if (!("choices" in q)) return;
    onChange({ choices: [...q.choices, mkChoice(`Opción ${q.choices.length + 1}`)] });
  }
  function removeChoice(idx: number) {
    if (!("choices" in q)) return;
    onChange({ choices: q.choices.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Pregunta</label>
        <input value={q.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Escribe la pregunta…" className={inputCls} autoFocus />
      </div>
      <div>
        <label className={labelCls}>Ayuda (opcional)</label>
        <input value={q.description ?? ""} onChange={(e) => onChange({ description: e.target.value || undefined })} className={inputCls} />
      </div>

      {meta.hasChoices && "choices" in q && (
        <div>
          <label className={labelCls}>Opciones</label>
          <div className="space-y-2">
            {q.choices.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2">
                <input value={c.label} onChange={(e) => updateChoice(i, e.target.value)} className={inputCls} />
                <button onClick={() => removeChoice(i)} disabled={q.choices.length <= 1} className="p-2 text-gray-500 hover:text-red-400 disabled:opacity-30 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addChoice} className="mt-2 font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059] hover:text-[#d4b06a] transition flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Agregar opción
          </button>
        </div>
      )}

      {(q.type === "short_text" || q.type === "long_text") && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Placeholder</label>
            <input value={q.placeholder ?? ""} onChange={(e) => onChange({ placeholder: e.target.value || undefined })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Máx. caracteres</label>
            <input type="number" value={q.maxLength ?? ""} onChange={(e) => onChange({ maxLength: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} />
          </div>
        </div>
      )}

      {q.type === "number" && (
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Mínimo</label><input type="number" value={q.min ?? ""} onChange={(e) => onChange({ min: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} /></div>
          <div><label className={labelCls}>Máximo</label><input type="number" value={q.max ?? ""} onChange={(e) => onChange({ max: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} /></div>
        </div>
      )}

      {q.type === "rating" && (
        <div className="grid grid-cols-3 gap-3">
          <div><label className={labelCls}>Escala (máx)</label><input type="number" min={2} max={10} value={q.scale} onChange={(e) => onChange({ scale: Math.min(10, Math.max(2, Number(e.target.value) || 5)) })} className={inputCls} /></div>
          <div><label className={labelCls}>Etiqueta baja</label><input value={q.labelLow ?? ""} onChange={(e) => onChange({ labelLow: e.target.value || undefined })} className={inputCls} /></div>
          <div><label className={labelCls}>Etiqueta alta</label><input value={q.labelHigh ?? ""} onChange={(e) => onChange({ labelHigh: e.target.value || undefined })} className={inputCls} /></div>
        </div>
      )}

      {q.type === "consent" && (
        <div>
          <label className={labelCls}>Texto de consentimiento</label>
          <textarea value={q.consentText} onChange={(e) => onChange({ consentText: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
        </div>
      )}

      {q.type !== "statement" && (
        <Toggle label="Campo requerido" checked={q.required} onChange={(v) => onChange({ required: v })} />
      )}
    </div>
  );
}
