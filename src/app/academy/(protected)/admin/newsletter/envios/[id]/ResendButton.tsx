"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";

export default function ResendButton({ campaignId, nonOpenersCount }: { campaignId: string; nonOpenersCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");

  async function handleResend() {
    setLoading(true); setError("");
    const res = await fetch(`/api/newsletter/campaigns/${campaignId}/resend-unopened`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push(`/academy/admin/newsletter/campaigns/${data.id}`);
    } else {
      setError(data.error ?? "Error al crear el reenvío");
      setConfirm(false);
    }
  }

  if (error) {
    return <p className="font-crimson text-sm text-red-400">{error}</p>;
  }

  if (confirm) {
    return (
      <div className="flex flex-col items-end gap-2">
        <p className="font-crimson text-sm text-gray-400">
          Se creará una nueva campaña para <span className="text-white">{nonOpenersCount} no lectores</span>
        </p>
        <div className="flex gap-2">
          <button onClick={handleResend} disabled={loading}
            className="flex items-center gap-1.5 bg-[#C5A059] hover:bg-[#d4b06a] disabled:opacity-60 text-[#020617] font-cinzel text-[9px] uppercase tracking-widest px-3 py-2 transition">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Crear campaña de reenvío
          </button>
          <button onClick={() => setConfirm(false)} className="border border-white/10 text-gray-500 hover:text-white font-cinzel text-[9px] uppercase tracking-widest px-3 py-2 transition">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirm(true)}
      className="flex items-center gap-2 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10 font-cinzel text-[9px] uppercase tracking-widest px-4 py-2.5 transition">
      <RefreshCw className="w-3.5 h-3.5" />
      Reenviar a no lectores ({nonOpenersCount})
    </button>
  );
}
