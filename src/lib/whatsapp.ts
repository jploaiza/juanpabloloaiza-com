export async function sendWhatsApp({
  to,
  body,
}: {
  to: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.TEXTMEBOT_API_KEY;
  if (!apiKey) return { ok: false, error: "TEXTMEBOT_API_KEY not set" };

  const phone = to.replace(/[^\d+]/g, "");
  if (!phone) return { ok: false, error: "Invalid phone number" };

  try {
    const url = `https://api.textmebot.com/send.php?recipient=${encodeURIComponent(phone)}&apikey=${apiKey}&text=${encodeURIComponent(body)}&json=yes`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    const lower = text.toLowerCase();
    if (lower.includes("error") || lower.includes("invalid") || lower.includes("failed")) {
      throw new Error(text);
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
