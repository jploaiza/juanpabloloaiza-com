"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Check, AlertCircle, Send } from "lucide-react";

interface AlertTemplate {
  id: string;
  event_type_slug: string;
  trigger: string;
  channel: string;
  subject: string | null;
  body: string;
  is_active: boolean;
}

const TRIGGERS = [
  { id: "confirmation", label: "Confirmación" },
  { id: "reminder_24h", label: "Recordatorio 24h" },
  { id: "reminder_1h", label: "Recordatorio 1h" },
  { id: "followup_24h", label: "Seguimiento 24h" },
  { id: "followup_72h", label: "Seguimiento 72h" },
  { id: "cancellation", label: "Cancelación" },
  { id: "reschedule", label: "Reprogramación" },
];

const TEMPLATE_VARS = [
  "{{name}}", "{{first_name}}", "{{email}}", "{{type_label}}",
  "{{duration}}", "{{date_long}}", "{{time}}", "{{booking_code}}",
  "{{zoom_join_url}}", "{{manage_url}}", "{{cancel_url}}", "{{reschedule_url}}",
  "{{site_url}}", "{{logo_url}}",
];

interface AlertsPanelProps {
  channel: "email" | "whatsapp";
}

export default function AlertsPanel({ channel }: AlertsPanelProps) {
  const [templates, setTemplates] = useState<AlertTemplate[]>([]);
  const [eventTypeSlugs, setEventTypeSlugs] = useState<{ slug: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState<string>("session");
  const [activeTrigger, setActiveTrigger] = useState<string>("confirmation");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [showTestInput, setShowTestInput] = useState(false);

  async function load() {
    const [tRes, eRes] = await Promise.all([
      fetch("/api/admin/calendar/templates"),
      fetch("/api/event-types"),
    ]);
    const [tData, eData] = await Promise.all([tRes.json(), eRes.json()]);
    setTemplates(tData.templates ?? []);
    setEventTypeSlugs((eData.types ?? []).map((t: { slug: string; label: string }) => ({ slug: t.slug, label: t.label })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const current = templates.find(
    (t) => t.event_type_slug === activeSlug && t.trigger === activeTrigger && t.channel === channel
  );

  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftActive, setDraftActive] = useState(true);

  useEffect(() => {
    if (current) {
      setDraftSubject(current.subject ?? "");
      setDraftBody(current.body);
      setDraftActive(current.is_active);
    } else {
      setDraftSubject("");
      setDraftBody("");
      setDraftActive(true);
    }
    setSaved(false);
    setError(null);
  }, [current?.id, activeSlug, activeTrigger, channel]);

  async function handleSave() {
    if (!current) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      const patch: Record<string, unknown> = { body: draftBody, is_active: draftActive };
      if (channel === "email") patch.subject = draftSubject;
      const res = await fetch(`/api/admin/calendar/templates/${current.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const d = await res.json();
      if (!res.ok) setError(d.error ?? "Error");
      else { setSaved(true); setTimeout(() => setSaved(false), 3000); await load(); }
    } catch { setError("Error de conexión"); }
    finally { setSaving(false); }
  }

  async function handleTest() {
    if (!current) return;
    setTesting(true); setError(null);
    try {
      const body: Record<string, string> = { template_id: current.id };
      if (channel === "email" && testEmail) body.recipient_email = testEmail;
      if (channel === "whatsapp" && testPhone) body.recipient_phone = testPhone;
      const res = await fetch("/api/admin/calendar/templates/test", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) setError(d.error ?? "Error al enviar test");
    } catch { setError("Error de conexión"); }
    finally { setTesting(false); setShowTestInput(false); }
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Cargando…</div>;

  return (
    <div className="space-y-6">
      <h2 className="font-cinzel text-white text-sm uppercase tracking-widest">
        Alertas {channel === "email" ? "Email" : "WhatsApp"}
      </h2>

      {/* Event type selector */}
      <div className="flex flex-wrap gap-2">
        {eventTypeSlugs.map(({ slug, label }) => (
          <button key={slug} onClick={() => setActiveSlug(slug)}
            className={`font-cinzel text-[9px] uppercase tracking-widest px-4 py-2 border transition ${activeSlug === slug ? "bg-[#C5A059]/10 border-[#C5A059]/50 text-[#C5A059]" : "border-white/10 text-gray-500 hover:border-white/20"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Trigger selector */}
      <div className="flex flex-wrap gap-2">
        {TRIGGERS.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTrigger(id)}
            className={`font-cinzel text-[9px] uppercase tracking-widest px-3 py-1.5 border transition ${activeTrigger === id ? "border-white/30 text-white" : "border-white/5 text-gray-600 hover:border-white/10"}`}>
            {label}
          </button>
        ))}
      </div>

      {current ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={draftActive} onChange={(e) => setDraftActive(e.target.checked)} className="accent-[#C5A059]" />
                <span className="font-crimson text-sm text-gray-300">Activo</span>
              </label>
            </div>

            {channel === "email" && (
              <div>
                <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Asunto</label>
                <input type="text" value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)}
                  className="w-full bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson" />
              </div>
            )}

            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">
                {channel === "email" ? "Cuerpo (HTML)" : "Mensaje (texto plano)"}
              </label>
              <textarea
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                rows={channel === "email" ? 16 : 10}
                className="w-full bg-[#020617] border border-white/10 text-white text-xs px-3 py-2 font-mono resize-y"
              />
            </div>

            {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-2"><AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /><p className="font-crimson text-sm text-red-300">{error}</p></div>}

            <div className="flex flex-wrap gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-[9px] uppercase tracking-widest px-5 py-2.5 hover:bg-[#C5A059]/90 disabled:opacity-60 transition">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? "Guardando…" : saved ? "Guardado" : "Guardar"}
              </button>

              <button onClick={() => setShowTestInput(!showTestInput)}
                className="flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-widest text-gray-400 border border-white/10 px-4 py-2.5 hover:border-white/20 transition">
                <Send className="w-3 h-3" /> Enviar test
              </button>
            </div>

            {showTestInput && (
              <div className="flex gap-2">
                <input
                  type={channel === "email" ? "email" : "tel"}
                  placeholder={channel === "email" ? "correo@ejemplo.com" : "+57300…"}
                  value={channel === "email" ? testEmail : testPhone}
                  onChange={(e) => channel === "email" ? setTestEmail(e.target.value) : setTestPhone(e.target.value)}
                  className="flex-1 bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson"
                />
                <button onClick={handleTest} disabled={testing}
                  className="flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/30 px-4 py-2 hover:bg-[#C5A059]/10 disabled:opacity-60 transition">
                  {testing && <Loader2 className="w-3 h-3 animate-spin" />} Enviar
                </button>
              </div>
            )}
          </div>

          {/* Variables reference */}
          <div>
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-3">Variables disponibles</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARS.map((v) => (
                <code key={v} className="font-mono text-[10px] bg-[#0a1628] border border-white/10 text-[#C5A059] px-2 py-0.5 cursor-pointer hover:bg-[#C5A059]/10 transition"
                  onClick={() => { setDraftBody((b) => b + v); }}>
                  {v}
                </code>
              ))}
            </div>
            <p className="font-crimson text-gray-500 text-xs mt-3">Haz clic en una variable para insertarla al final del cuerpo.</p>
          </div>
        </div>
      ) : (
        <p className="font-crimson text-gray-500 text-sm">No hay template para esta combinación.</p>
      )}
    </div>
  );
}
