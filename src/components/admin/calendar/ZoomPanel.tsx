"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Check, AlertCircle, Video } from "lucide-react";

interface ZoomConfig {
  waiting_room: boolean;
  host_video: boolean;
  participant_video: boolean;
  mute_upon_entry: boolean;
  join_before_host: boolean;
  auto_recording: string;
}

const DEFAULTS: ZoomConfig = {
  waiting_room: true, host_video: true, participant_video: true,
  mute_upon_entry: true, join_before_host: false, auto_recording: "none",
};

const TOGGLES: { key: keyof ZoomConfig; label: string }[] = [
  { key: "waiting_room", label: "Sala de espera" },
  { key: "host_video", label: "Vídeo del host al entrar" },
  { key: "participant_video", label: "Vídeo del participante al entrar" },
  { key: "mute_upon_entry", label: "Silenciar al entrar" },
  { key: "join_before_host", label: "Permitir unirse antes que el host" },
];

export default function ZoomPanel() {
  const [zoomReady, setZoomReady] = useState(false);
  const [zoom, setZoom] = useState<ZoomConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/calendar/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.config?.zoom) setZoom({ ...DEFAULTS, ...d.config.zoom });
        setZoomReady(!!d.zoom_ready);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false);
    try {
      const res = await fetch("/api/admin/calendar/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoom }),
      });
      const d = await res.json();
      if (!res.ok) setError(d.error ?? "Error");
      else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch { setError("Error de conexión"); }
    finally { setSaving(false); }
  }

  async function handleTest() {
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch("/api/admin/calendar/settings/test-zoom", { method: "POST" });
      const d = await res.json();
      setTestResult(d.ok ? "Conexión exitosa" : (d.error ?? "Error al conectar"));
    } catch { setTestResult("Error de conexión"); }
    finally { setTesting(false); }
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Cargando…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="font-cinzel text-white text-sm uppercase tracking-widest">Zoom</h2>

      {/* Status */}
      <div className={`flex items-center gap-3 px-4 py-3 border ${zoomReady ? "bg-green-500/10 border-green-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
        <Video className={`w-4 h-4 shrink-0 ${zoomReady ? "text-green-400" : "text-amber-400"}`} />
        <div>
          <p className={`font-cinzel text-xs ${zoomReady ? "text-green-400" : "text-amber-400"}`}>
            {zoomReady ? "Credenciales configuradas" : "Credenciales no configuradas"}
          </p>
          {!zoomReady && (
            <p className="font-crimson text-gray-400 text-xs mt-0.5">
              Configura ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID y ZOOM_CLIENT_SECRET en las variables de entorno de Vercel.
            </p>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-3">
        <h3 className="font-cinzel text-gray-400 text-[9px] uppercase tracking-widest">Configuración de reuniones</h3>
        {TOGGLES.map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between bg-[#0a1628] border border-white/10 px-4 py-3 cursor-pointer">
            <span className="font-crimson text-sm text-gray-300">{label}</span>
            <input
              type="checkbox"
              checked={zoom[key] as boolean}
              onChange={(e) => setZoom((z) => ({ ...z, [key]: e.target.checked }))}
              className="accent-[#C5A059]"
            />
          </label>
        ))}
        <div className="bg-[#0a1628] border border-white/10 px-4 py-3">
          <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-2">Grabación automática</label>
          <select
            value={zoom.auto_recording}
            onChange={(e) => setZoom((z) => ({ ...z, auto_recording: e.target.value }))}
            className="w-full bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson"
          >
            <option value="none">Sin grabación</option>
            <option value="local">Local (en el dispositivo del host)</option>
            <option value="cloud">Cloud</option>
          </select>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3"><AlertCircle className="w-4 h-4 text-red-400 shrink-0" /><p className="font-crimson text-sm text-red-300">{error}</p></div>}
      {testResult && <p className="font-crimson text-sm text-gray-300">{testResult}</p>}

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-[9px] uppercase tracking-widest px-6 py-3 hover:bg-[#C5A059]/90 disabled:opacity-60 transition">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Guardando…" : saved ? "Guardado" : "Guardar"}
        </button>
        {zoomReady && (
          <button onClick={handleTest} disabled={testing} className="flex items-center gap-2 font-cinzel text-[9px] uppercase tracking-widest text-gray-400 border border-white/10 px-5 py-3 hover:border-white/20 disabled:opacity-60 transition">
            {testing && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Probar conexión
          </button>
        )}
      </div>
    </div>
  );
}
