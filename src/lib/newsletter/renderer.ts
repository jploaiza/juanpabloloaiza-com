import { emailShell, esc } from "@/lib/email/shell";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://juanpabloloaiza.com";

interface Subscriber {
  id: string;
  email: string;
  name: string;
  apellido: string;
  unsubscribe_token: string;
}

/** Replace {{nombre}}, {{primer_nombre}}, {{apellido}}, {{email}} tokens with subscriber data. */
export function personalize(text: string, sub: Subscriber): string {
  const firstName = (sub.name ?? "").split(" ")[0] || (sub.name ?? "");
  return (text ?? "")
    .replace(/\{\{nombre\}\}/gi, sub.name ?? "")
    .replace(/\{\{primer_nombre\}\}/gi, firstName)
    .replace(/\{\{apellido\}\}/gi, sub.apellido ?? "")
    .replace(/\{\{email\}\}/gi, sub.email ?? "");
}

function unsubFooter(unsubToken: string): string {
  return `
    <p style="color:#2d4a6e;font-size:11px;margin:0 0 6px;font-family:Georgia,serif;">
      Recibes este correo porque te suscribiste en juanpabloloaiza.com
    </p>
    <p style="color:#2d4a6e;font-size:11px;margin:0;font-family:Georgia,serif;">
      <a href="${SITE_URL}/newsletter/baja/${unsubToken}" style="color:#4a6a8a;text-decoration:underline;">Darse de baja</a>
      &nbsp;·&nbsp;
      <a href="mailto:newsletter@juanpabloloaiza.com" style="color:#4a6a8a;text-decoration:none;">newsletter@juanpabloloaiza.com</a>
    </p>`;
}

function renderEditorial(data: Record<string, unknown>, sub: Subscriber): string {
  const intro = String(data.intro ?? "");
  const cta = data.cta as { text?: string; url?: string } | undefined;
  const articles = (data.articles ?? []) as Array<{
    title?: string; excerpt?: string; imageUrl?: string; slug?: string;
  }>;

  const [primary, ...rest] = articles;

  const primaryHtml = primary ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:32px 32px 0;">
          ${primary.imageUrl ? `<img src="${esc(safeUrl(primary.imageUrl, ""))}" width="100%" style="display:block;width:100%;max-height:300px;object-fit:cover;border:0;margin-bottom:20px;" alt="${esc(primary.title ?? '')}"/>` : ""}
          <p style="color:#C5A059;font-size:9px;letter-spacing:3px;text-transform:uppercase;font-family:Georgia,serif;margin:0 0 10px;">Artículo principal</p>
          <h2 style="color:#ffffff;font-size:22px;margin:0 0 12px;font-family:Georgia,serif;font-weight:normal;line-height:1.4;">${esc(primary.title ?? "")}</h2>
          <p style="color:#8a9bb5;font-size:14px;line-height:1.7;margin:0 0 20px;font-family:Georgia,serif;">${esc(primary.excerpt ?? "")}</p>
          <a href="${SITE_URL}/blog/${esc(primary.slug ?? "")}" style="display:inline-block;padding:10px 24px;background:#C5A059;color:#020617;font-family:Georgia,serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Leer artículo</a>
        </td>
      </tr>
    </table>` : "";

  const secondaryHtml = rest.length > 0 ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
      <tr>
        ${rest.map((a) => `
        <td width="50%" valign="top" style="padding:24px 16px;">
          ${a.imageUrl ? `<img src="${esc(safeUrl(a.imageUrl, ""))}" width="100%" style="display:block;width:100%;height:120px;object-fit:cover;border:0;margin-bottom:12px;" alt="${esc(a.title ?? '')}"/>` : ""}
          <h3 style="color:#ffffff;font-size:14px;margin:0 0 8px;font-family:Georgia,serif;font-weight:normal;line-height:1.4;">${esc(a.title ?? "")}</h3>
          <p style="color:#8a9bb5;font-size:12px;line-height:1.6;margin:0 0 12px;font-family:Georgia,serif;">${esc((a.excerpt ?? "").substring(0, 100))}…</p>
          <a href="${SITE_URL}/blog/${esc(a.slug ?? "")}" style="color:#C5A059;font-family:Georgia,serif;font-size:11px;text-decoration:none;letter-spacing:2px;text-transform:uppercase;">Leer →</a>
        </td>`).join('<td width="1" style="border-left:1px solid rgba(197,160,89,0.1);"></td>')}
      </tr>
    </table>` : "";

  const introHtml = intro ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:28px 32px 0;">
        <p style="color:#8a9bb5;font-size:15px;line-height:1.8;margin:0;font-family:Georgia,serif;">${esc(personalize(intro, sub)).replace(/\n/g, "<br/>")}</p>
      </td></tr>
    </table>` : "";

  const ctaHtml = cta?.url ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:32px 32px 28px;text-align:center;">
        <a href="${esc(safeUrl(cta.url, SITE_URL + "/blog"))}" style="display:inline-block;padding:14px 36px;background:#C5A059;color:#020617;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">${esc(cta.text ?? "Leer más")}</a>
      </td></tr>
    </table>` : "";

  const content = `<tr><td style="padding:0;">${introHtml}${primaryHtml}${secondaryHtml}${ctaHtml}</td></tr>`;
  return emailShell(content, unsubFooter(sub.unsubscribe_token));
}

function safeUrl(raw: unknown, fallback: string): string {
  const s = String(raw ?? "");
  return /^https?:\/\//i.test(s) ? s : fallback;
}

function renderAnnouncement(data: Record<string, unknown>, sub: Subscriber): string {
  const title = String(data.title ?? "");
  const body = String(data.body ?? data.body_md ?? "");
  const heroImage = String(data.hero_image ?? "");
  const ctaText = String(data.cta_text ?? "Ver más");
  const ctaUrl = safeUrl(data.cta_url, SITE_URL);

  const announcementHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:32px 32px 28px;">
        ${heroImage ? `<img src="${esc(safeUrl(heroImage, ""))}" width="100%" style="display:block;width:100%;max-height:260px;object-fit:cover;border:0;margin-bottom:24px;" alt="${esc(title)}"/>` : ""}
        <p style="color:#C5A059;font-size:9px;letter-spacing:4px;text-transform:uppercase;font-family:Georgia,serif;margin:0 0 12px;">Anuncio</p>
        <h1 style="color:#ffffff;font-size:26px;margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;line-height:1.3;">${esc(title)}</h1>
        <p style="color:#8a9bb5;font-size:15px;line-height:1.8;margin:0 0 28px;font-family:Georgia,serif;">${esc(personalize(body, sub)).replace(/\n/g, "<br/>")}</p>
        <table cellpadding="0" cellspacing="0" border="0">
          <tr><td style="background-color:#C5A059;">
            <a href="${esc(ctaUrl)}" style="display:inline-block;padding:15px 40px;color:#020617;font-family:Georgia,serif;font-size:13px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">${esc(ctaText)}</a>
          </td></tr>
        </table>
      </td></tr>
    </table>`;
  return emailShell(`<tr><td style="padding:0;">${announcementHtml}</td></tr>`, unsubFooter(sub.unsubscribe_token));
}

function renderWelcome(data: Record<string, unknown>, sub: Subscriber): string {
  const firstName = sub.name;
  const welcomeBody = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:40px 32px 32px;">
        <p style="color:#C5A059;font-size:9px;letter-spacing:4px;text-transform:uppercase;font-family:Georgia,serif;margin:0 0 16px;">Bienvenido</p>
        <h1 style="color:#ffffff;font-size:22px;margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;line-height:1.4;">Hola ${esc(firstName)}, ya formas parte de esto</h1>
        <p style="color:#8a9bb5;font-size:15px;line-height:1.7;margin:0 0 24px;font-family:Georgia,serif;">
          Recibirás artículos sobre terapia de regresión, hipnoterapia y autoconocimiento.
          Sin spam, solo lo que vale la pena leer.
        </p>
        <table cellpadding="0" cellspacing="0" border="0">
          <tr><td style="background-color:#C5A059;">
            <a href="${SITE_URL}/blog" style="display:inline-block;padding:14px 32px;color:#020617;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Explorar el blog</a>
          </td></tr>
        </table>
      </td></tr>
    </table>`;
  return emailShell(`<tr><td style="padding:0;">${welcomeBody}</td></tr>`, unsubFooter(sub.unsubscribe_token));
}

function renderReengagement(data: Record<string, unknown>, sub: Subscriber): string {
  const days = Number(data.last_engaged_days ?? 60);
  const reengBody = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:40px 32px 32px;">
        <p style="color:#C5A059;font-size:9px;letter-spacing:4px;text-transform:uppercase;font-family:Georgia,serif;margin:0 0 16px;">¿Sigues aquí?</p>
        <h1 style="color:#ffffff;font-size:22px;margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;line-height:1.4;">Hola ${esc(sub.name)}, hace tiempo que no nos vemos</h1>
        <p style="color:#8a9bb5;font-size:15px;line-height:1.7;margin:0 0 24px;font-family:Georgia,serif;">
          Han pasado ${days} días. Si quieres seguir leyendo artículos sobre terapia de regresión, solo haz click abajo.
        </p>
        <table cellpadding="0" cellspacing="0" border="0">
          <tr><td style="background-color:#C5A059;">
            <a href="${SITE_URL}/blog" style="display:inline-block;padding:14px 32px;color:#020617;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Sigo interesado</a>
          </td></tr>
        </table>
        <p style="color:#4a6a8a;font-size:12px;margin:24px 0 0;font-family:Georgia,serif;">
          <a href="${SITE_URL}/newsletter/baja/${sub.unsubscribe_token}" style="color:#4a6a8a;">Darse de baja</a>
        </p>
      </td></tr>
    </table>`;
  return emailShell(`<tr><td style="padding:0;">${reengBody}</td></tr>`, unsubFooter(sub.unsubscribe_token));
}

export function renderCampaignHtml(
  templateKind: string,
  templateData: Record<string, unknown>,
  sub: Subscriber
): string {
  switch (templateKind) {
    case "editorial":    return renderEditorial(templateData, sub);
    case "announcement": return renderAnnouncement(templateData, sub);
    case "welcome":      return renderWelcome(templateData, sub);
    case "reengagement": return renderReengagement(templateData, sub);
    default:             return renderEditorial(templateData, sub);
  }
}
