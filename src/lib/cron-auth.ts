import { timingSafeEqual } from "crypto";

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length > 0 && ba.length === bb.length && timingSafeEqual(ba, bb);
}

/**
 * Autoriza una llamada de cron. Acepta el secreto en cualquiera de los dos formatos:
 *
 * - `x-cron-secret: <CRON_SECRET>`  (cron-job.org, GitHub Actions, curl)
 * - `Authorization: Bearer <CRON_SECRET>`  (formato fijo de Vercel Cron, que NO permite
 *   encabezados personalizados)
 *
 * Antes cada ruta aceptaba solo uno, así que los crons de vercel.json (que envían Bearer)
 * recibían 401 en las rutas que exigían `x-cron-secret`, y viceversa.
 */
export function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret) return false;

  const header = req.headers.get("x-cron-secret");
  if (header && safeEqual(header, secret)) return true;

  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ") && safeEqual(auth.slice(7), secret)) return true;

  return false;
}
