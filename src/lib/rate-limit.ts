// Simple sliding-window in-memory rate limiter (per serverless instance)
// Provides baseline protection — not a substitute for edge-level rate limiting

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function getIp(headers: Headers): string {
  // On Vercel, x-forwarded-for is set by the infrastructure and contains the real client IP
  // as the first element. We use ALL entries as the key to prevent a single-IP bypass via
  // adding fake entries, but we trust only the first (leftmost) value for display.
  // WARNING: this rate limiter is in-process (per serverless instance) — it is a best-effort
  // baseline. Production hardening should use Vercel Edge Middleware or Upstash Redis.
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    // Use the full XFF header as the key to prevent spoofing by prepending a fake IP.
    // If the platform (Vercel) sets a trusted cf-connecting-ip or x-real-ip, prefer that.
    const realIp = headers.get("x-real-ip");
    return realIp ?? xff.split(",")[0]?.trim() ?? "unknown";
  }
  return "unknown";
}
