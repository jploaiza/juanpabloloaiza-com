import { emailShell } from "@/lib/email/shell";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Las plantillas guardadas escriben "(Chile)" a mano junto a la hora ("{{time}} (Chile)",
 * "{{time}} (hora Chile)", "Fecha y hora (Chile)"). Cuando `{{time}}` ya viene en la hora del
 * paciente con la de Chile entre paréntesis (ver buildBookingTimeVars), esas menciones fijas
 * quedarían repetidas o serían falsas, así que se quitan. Si la hora es la de Chile
 * (`time === time_chile`) el texto se deja intacto.
 */
export function adaptChileMentions(body: string, vars: Record<string, string>): string {
  if (!vars.time_chile || vars.time === vars.time_chile) return body;
  return body
    .replace(/(\{\{time\}\})\s*\((?:hora\s+(?:de\s+)?)?Chile\)/gi, "$1")
    .replace(/(fecha y hora)\s*\(Chile\)/gi, "$1");
}

/** Plain-text interpolation only — do NOT use for HTML output (no escaping). */
export function renderTemplate(body: string, vars: Record<string, string>): string {
  return adaptChileMentions(body, vars).replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export function renderTemplateHtml(body: string, vars: Record<string, string>): string {
  const escaped: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) escaped[k] = escapeHtml(v);
  const interpolated = adaptChileMentions(body, vars).replace(/\{\{(\w+)\}\}/g, (_, key) => escaped[key] ?? `{{${key}}}`);
  if (/^\s*<!DOCTYPE|^\s*<html/i.test(interpolated)) return interpolated;
  const content = `
    <tr>
      <td style="padding:32px 32px 28px;color:#8a9bb5;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.8;">
        ${interpolated}
      </td>
    </tr>`;
  return emailShell(content);
}
