"use client";

import { useState } from "react";
import { UserCheck, RefreshCcw, Loader2 } from "lucide-react";

interface Automation {
  id: string; kind: string; name: string; enabled: boolean; config: Record<string, unknown>;
}

const ICONS: Record<string, React.ElementType> = { welcome: UserCheck, reengagement: RefreshCcw };
const DESCRIPTIONS: Record<string, string> = {
  welcome: "Se envía cuando un nuevo suscriptor confirma su email. Delay configurable. Actualmente envía de forma inmediata.",
  reengagement: `Se envía a suscriptores que no han abierto ningún email en ${60} días. Cron diario a las 14:00 UTC. Tras ${90} días de inactividad, se dan de baja automáticamente.`,
};

export default function AutomationsClient({ automations }: { automations: Automation[] }) {
  const [list, setList] = useState(automations);
  const [toggling, setToggling] = useState<string | null>(null);

  async function toggle(id: string, enabled: boolean) {
    setToggling(id);
    const res = await fetch(`/api/newsletter/automations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    setToggling(null);
    if (res.ok) {
      setList((l) => l.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a));
    }
  }

  return (
    <div className="space-y-4">
      {list.map((a) => {
        const Icon = ICONS[a.kind] ?? RefreshCcw;
        return (
          <div key={a.id} className="relative bg-[#16213e] border border-white/5 p-6">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#C5A059]" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#C5A059]" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#C5A059]" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#C5A059]" />

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <Icon className="w-5 h-5 text-[#C5A059] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-cinzel text-sm text-white mb-1">{a.name}</h3>
                  <p className="font-crimson text-sm text-gray-400 leading-relaxed mb-3">
                    {DESCRIPTIONS[a.kind] ?? "Automatización sin descripción."}
                  </p>
                  {Object.entries(a.config ?? {}).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(a.config).map(([k, v]) => (
                        <span key={k} className="inline-block px-2 py-0.5 bg-[#0a1628] border border-white/10 font-mono text-[10px] text-gray-500">
                          {k}: {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => toggle(a.id, a.enabled)}
                disabled={toggling === a.id}
                className={`flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  a.enabled ? "bg-[#C5A059]" : "bg-gray-700"
                } disabled:opacity-60`}
                aria-label={a.enabled ? "Desactivar" : "Activar"}
              >
                {toggling === a.id ? (
                  <Loader2 className="w-3.5 h-3.5 text-white/80 absolute inset-0 m-auto animate-spin" />
                ) : (
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${a.enabled ? "translate-x-6" : "translate-x-1"}`} />
                )}
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-white/5">
              <span className={`inline-flex items-center gap-1.5 font-cinzel text-[8px] uppercase tracking-widest ${a.enabled ? "text-emerald-400" : "text-gray-600"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${a.enabled ? "bg-emerald-400" : "bg-gray-600"}`} />
                {a.enabled ? "Activa" : "Inactiva"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
