"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Check, AlertCircle, Video, Eye, EyeOff } from "lucide-react";

interface ZoomConfig {
  waiting_room: boolean;
  host_video: boolean;
  participant_video: boolean;
  mute_upon_entry: boolean;
  join_before_host: boolean;
  auto_recording: string;
}

interface CredentialsSet {
  account_id: boolean;
  client_id: boolean;
  client_secret: boolean;
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
  const [credsSet, setCredsSet] = useState<CredentialsSet>({ account_id: false, client_id: false, client_secret: false });
  const [zoom, setZoom] = useState<ZoomConfig>(DEFAULTS);
  const [accountId, setAccountId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
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
        if (d.zoom_credentials_set) setCredsSet(d.zoom_credentials_set);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false);
    try {
      const payload: Record<string, unknown> = { zoom };
      // Only include credentials if at least one field is filled in
      if (accountId.trim() || clientId.trim() || clientSecret.trim()) {
        payload.zoom_credentials = {
          account_id: accountId.trim(),
          client_id: clientId.trim(),
          client_secret: clientSecret.trim(),
        };
      }
      const res = await fetch("/api/admin/calendar/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) setError(d.error ?? "Error");
      else {
        setSaved(true);
        // Reload zoom_ready after saving credentials
        fetch("/api/admin/calendar/settings").then((r) => r.json()).then((d2) => {
          setZoomReady(!!d2.zoom_ready);
          if (d2.zoom_credentials_set) setCredsSet(d2.zoom_credentials_set);
        });
        setAccountId(""); setClientId(""); setClientSecret("");
        setTimeout(() => setSaved(false), 3000);
      }
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
        <p className={`font-cinzel text-xs ${zoomReady ? "text-green-400" : "text-amber-400"}`}>
          {zoomReady ? "Credenciales configuradas" : "Credenciales no configuradas"}
        </p>
      </div>

      {/* Credentials */}
      <div className="space-y-3">
        <h3 className="font-cinzel text-gray-400 text-[9px] uppercase tracking-widest">Credenciales Server-to-Server OAuth</h3>
        <p className="font-crimson text-gray-500 text-xs">
          Obtén estos valores en{" "}
          <span className="text-gray-400">marketplace.zoom.us → Develop → Build App → Server-to-Server OAuth</span>.
          Deja en blanco los campos que no quieras cambiar.
        </p>
        {[
          { label: "Account ID", value: accountId, set: credsSet.account_id, onChange: setAccountId, type: "text" as const },
          { label: "Client ID", value: clientId, set: credsSet.client_id, onChange: setClientId, type: "text" as const },
        ].map(({ label, value, set, onChange, type }) => (
          <div key={label}>
            <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">
              {label}{set && <span className="ml-2 text-green-500">✓ guardado</span>}
            </label>
            <input
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={set ? "••••••••••••••• (guardado)" : "Pega aquí tu " + label}
              className="w-full bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 font-crimson placeholder:text-gray-700"
            />
          </div>
        ))}
        <div>
          <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-400 block mb-1">
            Client Secret{credsSet.client_secret && <span className="ml-2 text-green-500">✓ guardado</span>}
          </label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder={credsSet.client_secret ? "••••••••••••••• (guardado)" : "Pega aquí tu Client Secret"}
              className="w-full bg-[#020617] border border-white/10 text-white text-sm px-3 py-2 pr-10 font-crimson placeholder:text-gray-700"
            />
            <button
              type="button"
              onClick={() => setShowSecret((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
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
