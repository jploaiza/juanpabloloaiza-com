import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/whatsapp";

/**
 * Programa un WhatsApp para después de enviar la respuesta HTTP.
 *
 * En Vercel, lo que se lanza con `void promesa` y no se espera puede quedar congelado en cuanto
 * la función responde, y el mensaje no sale. `after()` mantiene la función viva hasta que
 * termine. Si TextMeBot rechaza el mensaje, queda en los logs y en comms_log.
 */
export function sendWhatsAppAfter({ to, body, context }: { to: string; body: string; context: string }): void {
  after(async () => {
    const res = await sendWhatsApp({ to, body });
    if (res.ok) return;
    console.error(`[whatsapp:${context}] no se pudo enviar a ${to}: ${res.error}`);
    try {
      await createAdminClient().from("comms_log").insert({
        type: `whatsapp_${context}`,
        subject: `WhatsApp ${context} falló`,
        status: "error",
        sent_at: new Date().toISOString(),
        body_preview: `${to} | ${String(res.error).slice(0, 300)}`,
      });
    } catch { /* el log es de mejor esfuerzo */ }
  });
}
