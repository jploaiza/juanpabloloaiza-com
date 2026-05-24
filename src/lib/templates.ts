import { emailShell } from "@/lib/email/shell";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plain-text interpolation only — do NOT use for HTML output (no escaping). */
export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export function renderTemplateHtml(body: string, vars: Record<string, string>): string {
  const escaped: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) escaped[k] = escapeHtml(v);
  const interpolated = body.replace(/\{\{(\w+)\}\}/g, (_, key) => escaped[key] ?? `{{${key}}}`);
  if (/^\s*<!DOCTYPE|^\s*<html/i.test(interpolated)) return interpolated;
  const content = `
    <tr>
      <td style="padding:32px 32px 28px;color:#8a9bb5;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.8;">
        ${interpolated}
      </td>
    </tr>`;
  return emailShell(content);
}
