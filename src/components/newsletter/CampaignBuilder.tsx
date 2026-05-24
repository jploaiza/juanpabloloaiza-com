"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Send, Eye, TestTube, Clock, CheckCircle,
  ChevronDown, ChevronUp, ChevronRight, Loader2, Save, X, Copy, Settings2
} from "lucide-react";
import type { BlogPost } from "@/lib/blog-data";
import ArticlePicker from "./ArticlePicker";

interface Campaign {
  id: string; name: string; subject: string; preheader: string;
  template_kind: string; template_data: Record<string, unknown>;
  status: string; scheduled_at: string | null;
  sender_name: string; sender_email: string;
  segment: { status?: string; tags?: string[] };
  stats_cache: Record<string, number>;
}

interface Props { campaign: Campaign; posts: BlogPost[] }

type Section = "articles" | "ai" | "review" | "preview" | "schedule";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador", scheduled: "Programada", sending: "Enviando",
  sent: "Enviada", canceled: "Cancelada", failed: "Fallida"
};

const TAG_HINTS = [
  { tag: "{{nombre}}", desc: "Nombre completo" },
  { tag: "{{primer_nombre}}", desc: "Primer nombre" },
  { tag: "{{apellido}}", desc: "Apellido" },
  { tag: "{{email}}", desc: "Email" },
];

function SectionHeader({ title, open, onToggle, done }: { title: string; open: boolean; onToggle: () => void; done?: boolean }) {
  return (
    <button type="button" onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition">
      <div className="flex items-center gap-3">
        {done
          ? <CheckCircle className="w-4 h-4 text-[#C5A059]" />
          : <div className="w-4 h-4 rounded-full border border-white/20" />}
        <span className="font-cinzel text-[10px] uppercase tracking-widest text-white">{title}</span>
      </div>
      {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
    </button>
  );
}

export default function CampaignBuilder({ campaign, posts }: Props) {
  const router = useRouter();
  const isEditable = ["draft", "scheduled"].includes(campaign.status);

  const [open, setOpen] = useState<Section>(campaign.template_kind === "editorial" ? "articles" : "ai");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Subject / preheader — filled by AI, then editable
  const [subject, setSubject] = useState(campaign.subject ?? "");
  const [preheader, setPreheader] = useState(campaign.preheader ?? "");
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);

  // Sender — advanced
  const [senderName, setSenderName] = useState(campaign.sender_name ?? "Juan Pablo Loaiza");
  const [senderEmail, setSenderEmail] = useState(campaign.sender_email ?? "newsletter@juanpabloloaiza.com");
  const [showSender, setShowSender] = useState(false);

  // Articles (editorial template)
  const td = campaign.template_data as Record<string, unknown>;
  const articleIds = (td?.article_ids as string[] | undefined) ?? [];
  const [articles, setArticles] = useState<(BlogPost | null)[]>([
    posts.find((p) => p.id === articleIds[0]) ?? null,
    posts.find((p) => p.id === articleIds[1]) ?? null,
    posts.find((p) => p.id === articleIds[2]) ?? null,
  ]);
  const [intro, setIntro] = useState(String(td?.intro ?? ""));
  const [transitions, setTransitions] = useState<string[]>([
    String((td?.transitions as string[])?.[0] ?? ""),
    String((td?.transitions as string[])?.[1] ?? ""),
  ]);
  const [cta, setCta] = useState({
    text: String((td?.cta as Record<string, string>)?.text ?? "Explorar el blog"),
    url: String((td?.cta as Record<string, string>)?.url ?? "https://juanpabloloaiza.com/blog"),
  });

  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiDone, setAiDone] = useState(false);

  // Preview — use srcdoc to bypass X-Frame-Options/CSP
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  // Test send
  const [testEmail, setTestEmail] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testMsg, setTestMsg] = useState("");

  // Schedule
  const [scheduledAt, setScheduledAt] = useState(
    campaign.scheduled_at ? new Date(campaign.scheduled_at).toISOString().slice(0, 16) : ""
  );
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState("");

  const buildTemplateData = useCallback(() => {
    if (campaign.template_kind === "editorial") {
      return {
        article_ids: articles.map((a) => a?.id ?? null),
        articles: articles.map((a) =>
          a ? { id: a.id, title: a.title, excerpt: a.excerpt ?? "", slug: a.slug, imageUrl: a.imageUrl, tags: a.tags ?? [] } : null
        ),
        intro,
        transitions,
        cta,
      };
    }
    return td;
  }, [articles, intro, transitions, cta, campaign.template_kind, td]);

  async function save() {
    setSaving(true); setSaveMsg("");
    const res = await fetch(`/api/newsletter/campaigns/${campaign.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject, preheader,
        sender_name: senderName, sender_email: senderEmail,
        template_data: buildTemplateData(),
      }),
    });
    setSaving(false);
    if (res.ok) { setSaveMsg("Guardado"); setTimeout(() => setSaveMsg(""), 2000); }
    else { setSaveMsg("Error al guardar"); }
  }

  async function generateAI() {
    setAiLoading(true); setAiError(""); setAiDone(false);
    const articleData = articles.filter(Boolean).map((a) => ({
      title: a!.title, excerpt: a!.excerpt ?? "", tags: a!.tags ?? []
    }));
    const res = await fetch(`/api/newsletter/campaigns/${campaign.id}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articles: articleData, template_kind: campaign.template_kind }),
    });
    const data = await res.json();
    setAiLoading(false);
    if (!res.ok) { setAiError(data.error ?? "Error"); return; }
    const r = data.result;
    if (r.subject_options?.length) setSubjectOptions(r.subject_options);
    if (r.intro) setIntro(r.intro);
    if (r.transitions?.length === 2) setTransitions(r.transitions);
    if (r.preheader) setPreheader(r.preheader);
    if (r.cta) setCta(r.cta);
    if (r.subject_options?.[0]) setSubject(r.subject_options[0]);
    setAiDone(true);
    setOpen("review");
  }

  async function openPreview() {
    setPreviewLoading(true);
    await save();
    const res = await fetch(`/api/newsletter/campaigns/${campaign.id}/preview`);
    if (res.ok) {
      const html = await res.text();
      setPreviewHtml(html);
    }
    setPreviewLoading(false);
  }

  async function sendTest() {
    if (!testEmail) return;
    setTestLoading(true); setTestMsg("");
    await save();
    const res = await fetch(`/api/newsletter/campaigns/${campaign.id}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test_email: testEmail }),
    });
    setTestLoading(false);
    setTestMsg(res.ok ? "✓ Enviado" : "Error al enviar");
    setTimeout(() => setTestMsg(""), 3000);
  }

  async function scheduleOrSend(sendNow: boolean) {
    setScheduleLoading(true); setScheduleMsg("");
    await save();
    const body = sendNow ? { send_now: true } : { scheduled_at: new Date(scheduledAt).toISOString() };
    const res = await fetch(`/api/newsletter/campaigns/${campaign.id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setScheduleLoading(false);
    if (res.ok) {
      setScheduleMsg(sendNow ? "Campaña en cola para envío" : "Campaña programada");
      setTimeout(() => router.push("/academy/admin/newsletter/campaigns"), 1500);
    } else {
      setScheduleMsg(data.error ?? "Error");
    }
  }

  async function cancelSchedule() {
    setScheduleLoading(true);
    await fetch(`/api/newsletter/campaigns/${campaign.id}/cancel`, { method: "POST" });
    setScheduleLoading(false);
    router.refresh();
  }

  async function duplicate() {
    const res = await fetch(`/api/newsletter/campaigns/${campaign.id}/duplicate`, { method: "POST" });
    const data = await res.json();
    if (res.ok) router.push(`/academy/admin/newsletter/campaigns/${data.id}`);
  }

  const toggle = (s: Section) => setOpen((cur) => (cur === s ? ("" as Section) : s));
  const hasArticles = articles.filter(Boolean).length >= 1;
  const minDateTime = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5);
    return d.toISOString().slice(0, 16);
  }, []);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left: editor sections */}
      <div className="lg:col-span-2 space-y-4">

        {/* Status + actions bar */}
        <div className="flex items-center justify-between bg-[#16213e] border border-white/5 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest border ${
              campaign.status === "sent" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
              campaign.status === "scheduled" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
              "bg-white/5 text-gray-500 border-white/10"
            }`}>{STATUS_LABEL[campaign.status] ?? campaign.status}</span>
            {campaign.stats_cache?.sent ? (
              <span className="font-crimson text-xs text-gray-500">
                {campaign.stats_cache.sent} enviados · {campaign.stats_cache.opened ?? 0} abiertos
              </span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button onClick={duplicate} title="Duplicar"
              className="p-2 border border-white/10 text-gray-500 hover:text-[#C5A059] transition">
              <Copy className="w-3.5 h-3.5" />
            </button>
            {isEditable && (
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 border border-[#C5A059]/30 text-[#C5A059] font-cinzel text-[9px] uppercase tracking-widest px-3 py-2 hover:bg-[#C5A059]/10 transition disabled:opacity-50">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {saveMsg || "Guardar"}
              </button>
            )}
          </div>
        </div>

        {/* SECTION 1: Artículos (editorial only) */}
        {campaign.template_kind === "editorial" && (
          <div className="bg-[#16213e] border border-white/5">
            <SectionHeader title="1 · Artículos" open={open === "articles"} onToggle={() => toggle("articles")} done={hasArticles} />
            {open === "articles" && (
              <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                {(["Principal", "Secundario", "Terciario"] as const).map((label, i) => (
                  <div key={i}>
                    <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-2">
                      {label} {i === 0 ? "*" : "(opcional)"}
                    </p>
                    <ArticlePicker posts={posts} value={articles[i]} onChange={(p) => {
                      const next = [...articles] as (BlogPost | null)[];
                      next[i] = p;
                      setArticles(next);
                    }} disabled={!isEditable} />
                  </div>
                ))}
                {hasArticles && isEditable && (
                  <button onClick={() => setOpen("ai")}
                    className="flex items-center gap-2 bg-[#C5A059]/10 hover:bg-[#C5A059]/20 border border-[#C5A059]/30 text-[#C5A059] font-cinzel text-[9px] uppercase tracking-widest px-4 py-2.5 transition">
                    <Sparkles className="w-3 h-3" /> Continuar → Generar con IA
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: Generar con IA */}
        {isEditable && (
          <div className="bg-[#16213e] border border-white/5">
            <SectionHeader
              title={campaign.template_kind === "editorial" ? "2 · Generar con IA" : "1 · Generar con IA"}
              open={open === "ai"}
              onToggle={() => toggle("ai")}
              done={aiDone || !!subject}
            />
            {open === "ai" && (
              <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                <p className="font-crimson text-sm text-gray-400 leading-relaxed">
                  DeepSeek redactará el asunto, preencabezado, introducción y transiciones en la voz de Juan Pablo (terapeuta TRVP).
                  {campaign.template_kind === "editorial" && !hasArticles && (
                    <span className="text-amber-400"> Selecciona al menos un artículo primero.</span>
                  )}
                </p>
                {aiError && <p className="font-crimson text-sm text-red-400">{aiError}</p>}
                <button
                  onClick={generateAI}
                  disabled={aiLoading || (campaign.template_kind === "editorial" && !hasArticles)}
                  className="flex items-center gap-2 bg-[#C5A059] hover:bg-[#d4b06a] disabled:opacity-60 text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-5 py-3 transition"
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {aiLoading ? "Generando..." : aiDone ? "Regenerar" : "Generar con DeepSeek"}
                </button>
                {aiDone && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <p className="font-crimson text-sm text-emerald-400">
                      ✓ Contenido generado
                    </p>
                    <button onClick={() => setOpen("review")}
                      className="flex items-center gap-1.5 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10 font-cinzel text-[9px] uppercase tracking-widest px-4 py-2 transition">
                      Siguiente <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: Asunto y contenido */}
        <div className="bg-[#16213e] border border-white/5">
          <SectionHeader
            title={campaign.template_kind === "editorial" ? "3 · Asunto y contenido" : isEditable ? "2 · Asunto y contenido" : "1 · Asunto y contenido"}
            open={open === "review"}
            onToggle={() => toggle("review")}
            done={!!subject}
          />
          {open === "review" && (
            <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
              {subjectOptions.length > 0 && (
                <div className="space-y-2">
                  <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/70">Opciones generadas:</p>
                  {subjectOptions.map((s, i) => (
                    <button key={i} onClick={() => isEditable && setSubject(s)} disabled={!isEditable}
                      className={`block w-full text-left font-crimson text-sm px-3 py-2 border transition ${
                        subject === s
                          ? "text-white bg-[#C5A059]/10 border-[#C5A059]/40"
                          : "text-gray-400 hover:text-white bg-[#0a1628] border-white/5 hover:border-[#C5A059]/30"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div>
                <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">Asunto *</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!isEditable}
                  placeholder="ej. Lo que encontré en tres regresiones esta semana"
                  className="w-full bg-[#0a1628] border border-[#C5A059]/20 text-gray-200 font-crimson px-3 py-2.5 text-sm focus:outline-none focus:border-[#C5A059]/50 placeholder-gray-600 disabled:opacity-50" />
                <div className="flex items-center justify-between mt-1">
                  <p className="font-crimson text-xs text-gray-600">{subject.length}/60 caracteres recomendados</p>
                  <div className="flex gap-1">
                    {["{{primer_nombre}}", "{{nombre}}"].map((tag) => (
                      <button key={tag} type="button" onClick={() => isEditable && setSubject((v) => v + tag)}
                        disabled={!isEditable}
                        className="font-mono text-[9px] px-1.5 py-0.5 bg-[#0a1628] border border-[#C5A059]/20 text-[#C5A059]/60 hover:text-[#C5A059] transition disabled:opacity-40">
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">Preencabezado</label>
                <input value={preheader} onChange={(e) => setPreheader(e.target.value)} disabled={!isEditable}
                  placeholder="Texto que aparece después del asunto en el inbox"
                  className="w-full bg-[#0a1628] border border-[#C5A059]/20 text-gray-200 font-crimson px-3 py-2.5 text-sm focus:outline-none focus:border-[#C5A059]/50 placeholder-gray-600 disabled:opacity-50" />
              </div>
              {campaign.template_kind === "editorial" && (
                <div className="space-y-2">
                  <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500">Introducción</label>
                  <textarea value={intro} onChange={(e) => setIntro(e.target.value)} disabled={!isEditable} rows={5}
                    placeholder="Párrafo de introducción de la newsletter..."
                    className="w-full bg-[#0a1628] border border-[#C5A059]/20 text-gray-200 font-crimson px-3 py-2.5 text-sm focus:outline-none focus:border-[#C5A059]/50 placeholder-gray-600 resize-none disabled:opacity-50" />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="font-cinzel text-[8px] uppercase tracking-widest text-gray-600 self-center">Variables:</span>
                    {TAG_HINTS.map(({ tag, desc }) => (
                      <button key={tag} type="button" onClick={() => isEditable && setIntro((v) => v + tag)}
                        disabled={!isEditable}
                        className="font-mono text-[10px] px-2 py-0.5 bg-[#0a1628] border border-[#C5A059]/20 text-[#C5A059]/70 hover:text-[#C5A059] hover:border-[#C5A059]/50 transition disabled:opacity-40"
                        title={desc}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-2 border-t border-white/5">
                <button onClick={() => setOpen("preview")}
                  className="flex items-center gap-1.5 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10 font-cinzel text-[9px] uppercase tracking-widest px-4 py-2.5 transition">
                  Siguiente <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: Vista previa */}
        <div className="bg-[#16213e] border border-white/5">
          <SectionHeader
            title={campaign.template_kind === "editorial" ? "4 · Vista previa" : isEditable ? "3 · Vista previa" : "2 · Vista previa"}
            open={open === "preview"}
            onToggle={() => toggle("preview")}
          />
          {open === "preview" && (
            <div className="px-5 pb-5 border-t border-white/5 pt-4">
              <div className="flex gap-3 mb-4">
                <button onClick={openPreview} disabled={previewLoading}
                  className="flex items-center gap-2 border border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059]/10 font-cinzel text-[10px] uppercase tracking-widest px-4 py-2.5 transition disabled:opacity-50">
                  {previewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                  {previewLoading ? "Cargando..." : previewHtml ? "Actualizar preview" : "Ver preview"}
                </button>
                {previewHtml && (
                  <button onClick={() => setPreviewHtml("")}
                    className="p-2 border border-white/10 text-gray-500 hover:text-white transition">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {previewHtml && (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full border border-white/10"
                  style={{ height: "600px" }}
                  title="Email preview"
                  sandbox="allow-same-origin"
                />
              )}
              {isEditable && (
                <div className="flex justify-end mt-3 pt-3 border-t border-white/5">
                  <button onClick={() => setOpen("schedule")}
                    className="flex items-center gap-1.5 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10 font-cinzel text-[9px] uppercase tracking-widest px-4 py-2.5 transition">
                    Siguiente <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="mt-4 flex items-end gap-3">
                <div className="flex-1">
                  <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">Enviar prueba a</label>
                  <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full bg-[#0a1628] border border-[#C5A059]/20 text-gray-200 font-crimson px-3 py-2.5 text-sm focus:outline-none focus:border-[#C5A059]/50 placeholder-gray-600" />
                </div>
                <button onClick={sendTest} disabled={testLoading || !testEmail}
                  className="flex items-center gap-1.5 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10 font-cinzel text-[9px] uppercase tracking-widest px-4 py-2.5 transition disabled:opacity-50 whitespace-nowrap">
                  {testLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <TestTube className="w-3 h-3" />}
                  {testMsg || "Enviar test"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: Programar envío */}
        {isEditable && (
          <div className="bg-[#16213e] border border-white/5">
            <SectionHeader
              title={campaign.template_kind === "editorial" ? "5 · Programar envío" : "4 · Programar envío"}
              open={open === "schedule"}
              onToggle={() => toggle("schedule")}
            />
            {open === "schedule" && (
              <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                {scheduleMsg && (
                  <p className={`font-crimson text-sm ${scheduleMsg.includes("Error") ? "text-red-400" : "text-emerald-400"}`}>
                    {scheduleMsg}
                  </p>
                )}
                <div>
                  <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">Fecha y hora</label>
                  <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                    min={minDateTime}
                    className="bg-[#0a1628] border border-[#C5A059]/20 text-gray-200 font-crimson px-3 py-2.5 text-sm focus:outline-none focus:border-[#C5A059]/50" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => scheduleOrSend(false)} disabled={scheduleLoading || !scheduledAt}
                    className="flex items-center gap-2 bg-[#C5A059] hover:bg-[#d4b06a] disabled:opacity-60 text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-5 py-3 transition">
                    {scheduleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                    Programar
                  </button>
                  <button onClick={() => scheduleOrSend(true)} disabled={scheduleLoading}
                    className="flex items-center gap-2 border border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059]/10 font-cinzel text-[10px] uppercase tracking-widest px-5 py-3 transition disabled:opacity-50">
                    {scheduleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Enviar ahora
                  </button>
                  {campaign.status === "scheduled" && (
                    <button onClick={cancelSchedule} disabled={scheduleLoading}
                      className="flex items-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-cinzel text-[10px] uppercase tracking-widest px-5 py-3 transition disabled:opacity-50">
                      <X className="w-3.5 h-3.5" /> Cancelar envío
                    </button>
                  )}
                </div>

                {/* Advanced: sender settings */}
                <div className="border-t border-white/5 pt-3">
                  <button type="button" onClick={() => setShowSender((v) => !v)}
                    className="flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition">
                    <Settings2 className="w-3 h-3" />
                    {showSender ? "Ocultar remitente" : "Cambiar remitente"}
                  </button>
                  {showSender && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">Nombre</label>
                        <input value={senderName} onChange={(e) => setSenderName(e.target.value)}
                          className="w-full bg-[#0a1628] border border-[#C5A059]/20 text-gray-200 font-crimson px-3 py-2.5 text-sm focus:outline-none focus:border-[#C5A059]/50" />
                      </div>
                      <div>
                        <label className="block font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">Email</label>
                        <input value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)}
                          className="w-full bg-[#0a1628] border border-[#C5A059]/20 text-gray-200 font-crimson px-3 py-2.5 text-sm focus:outline-none focus:border-[#C5A059]/50" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-[#16213e] border border-white/5 p-5">
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-4">Detalles</p>
          <dl className="space-y-3 text-sm">
            {[
              ["Template", campaign.template_kind],
              ["Estado", STATUS_LABEL[campaign.status]],
              ...(campaign.scheduled_at ? [[
                "Programado",
                new Date(campaign.scheduled_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
              ]] : []),
              ...(campaign.stats_cache?.sent ? [
                ["Enviados", String(campaign.stats_cache.sent)],
                ["Abiertos", String(campaign.stats_cache.opened ?? 0)],
                ["Clicks", String(campaign.stats_cache.clicked ?? 0)],
              ] : []),
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-start gap-2">
                <dt className="font-cinzel text-[9px] uppercase tracking-widest text-gray-600">{label}</dt>
                <dd className="font-crimson text-gray-300 text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-[#16213e] border border-white/5 p-5">
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-3">CTA final</p>
          <div className="space-y-2">
            <input value={cta.text} onChange={(e) => setCta((c) => ({ ...c, text: e.target.value }))} disabled={!isEditable}
              placeholder="Texto del botón"
              className="w-full bg-[#0a1628] border border-[#C5A059]/20 text-gray-200 font-crimson px-3 py-2 text-xs focus:outline-none focus:border-[#C5A059]/50 placeholder-gray-600 disabled:opacity-50" />
            <input value={cta.url} onChange={(e) => setCta((c) => ({ ...c, url: e.target.value }))} disabled={!isEditable}
              placeholder="URL"
              className="w-full bg-[#0a1628] border border-[#C5A059]/20 text-gray-200 font-crimson px-3 py-2 text-xs focus:outline-none focus:border-[#C5A059]/50 placeholder-gray-600 disabled:opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
