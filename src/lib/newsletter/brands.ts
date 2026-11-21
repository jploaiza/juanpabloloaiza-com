/**
 * Marcas del newsletter.
 *
 * Una sola plataforma envía correos para varios sitios. Cada marca define su
 * remitente, su lista (etiqueta `lista:<slug>` en newsletter_subscribers), su
 * sitio y su estilo de correo. La marca `jpl` es el valor por defecto en todo
 * el código: si no se indica marca, nada cambia respecto al comportamiento
 * original.
 */

export type BrandKey = "jpl" | "rvp";

export interface BrandPalette {
  pageBg: string;
  cardBg: string;
  panelBg: string;
  gold: string;
  goldRgb: string; // "r,g,b" para los rgba() del dorado
  heading: string;
  body: string;
  muted: string;
  dim: string;
  faint: string;
  btnText: string;
}

export interface Brand {
  key: BrandKey;
  name: string;
  siteUrl: string;
  siteDomain: string;
  blogUrl: string;
  /** URL pública de un artículo a partir de su slug. */
  articleUrl: (slug: string) => string;
  fromName: string;
  fromEmail: string;
  supportEmail: string;
  /** Etiqueta de lista en newsletter_subscribers.tags (null = sin lista propia). */
  listTag: string | null;
  logoUrl: string;
  logoWidth: number;
  logoAlt: string;
  emailTitle: string;
  copyright: string;
  author: { label: string; name: string; bio: string; note: string; cta: string };
  welcomeText: string;
  reengagementText: string;
  palette: BrandPalette;
}

const JPL_SITE = "https://www.juanpabloloaiza.com";
const RVP_SITE = "https://www.regresionvidaspasadas.com";

const JPL_PALETTE: BrandPalette = {
  pageBg: "#0a1628",
  cardBg: "#16213e",
  panelBg: "#0e1b30",
  gold: "#C5A059",
  goldRgb: "197,160,89",
  heading: "#ffffff",
  body: "#8a9bb5",
  muted: "#6b7f99",
  dim: "#4a6a8a",
  faint: "#2d4a6e",
  btnText: "#020617",
};

const RVP_PALETTE: BrandPalette = {
  pageBg: "#090E0D",
  cardBg: "#0E1514",
  panelBg: "#151E1D",
  gold: "#E6C875",
  goldRgb: "230,200,117",
  heading: "#FAF7F2",
  body: "#C6C0B1",
  muted: "#9C9686",
  dim: "#8A8576",
  faint: "#6B6558",
  btnText: "#0E1514",
};

export const BRANDS: Record<BrandKey, Brand> = {
  jpl: {
    key: "jpl",
    name: "Juan Pablo Loaiza",
    siteUrl: JPL_SITE,
    siteDomain: "juanpabloloaiza.com",
    blogUrl: `${JPL_SITE}/blog`,
    articleUrl: (slug) => `${JPL_SITE}/blog/${slug}`,
    fromName: "Juan Pablo Loaiza",
    fromEmail: "newsletter@juanpabloloaiza.com",
    supportEmail: "newsletter@juanpabloloaiza.com",
    listTag: null,
    logoUrl: "https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png",
    logoWidth: 160,
    logoAlt: "Juan Pablo Loaiza",
    emailTitle: "Juan Pablo Loaiza",
    copyright: "© 2026 Juan Pablo Loaiza · Todos los derechos reservados",
    author: {
      label: "Tu terapeuta",
      name: "Juan Pablo Loaiza",
      bio: "Terapeuta Holístico Certificado Internacionalmente en Hipnosis Clínica con Técnicas Regresivas y Liberación de Entidades Espirituales, con más de 18 años de experiencia.",
      note: "Si tienes dudas sobre tu sesión o tu proceso, contáctame directamente. Tu compromiso te llevará a la meta.",
      cta: "Contactar por WhatsApp",
    },
    welcomeText:
      "Recibirás artículos sobre terapia de regresión, hipnoterapia y autoconocimiento. Sin spam, solo lo que vale la pena leer.",
    reengagementText:
      "Si quieres seguir leyendo artículos sobre terapia de regresión, solo haz click abajo.",
    palette: JPL_PALETTE,
  },
  rvp: {
    key: "rvp",
    name: "Regresión a Vidas Pasadas",
    siteUrl: RVP_SITE,
    siteDomain: "regresionvidaspasadas.com",
    blogUrl: `${RVP_SITE}/blog/`,
    articleUrl: (slug) => `${RVP_SITE}/blog/${slug}/`,
    fromName: "Regresión a Vidas Pasadas",
    fromEmail: "newsletter@regresionvidaspasadas.com",
    supportEmail: "newsletter@regresionvidaspasadas.com",
    listTag: "lista:regresion-vidas-pasadas",
    logoUrl: `${RVP_SITE}/email/logo-rvp.png`,
    logoWidth: 300,
    logoAlt: "Regresión a Vidas Pasadas",
    emailTitle: "Regresión a Vidas Pasadas",
    copyright: "© 2026 Regresión a Vidas Pasadas · Todos los derechos reservados",
    author: {
      label: "Autor del portal",
      name: "Juan Pablo Loaiza",
      bio: "Terapeuta de Regresión a Vidas Pasadas con más de 19 años de experiencia. Atiende sesiones online a personas de todo el mundo.",
      note: "Si quieres conocer más sobre el proceso o tienes dudas, escríbeme directamente.",
      cta: "Escríbeme por WhatsApp",
    },
    welcomeText:
      "Recibirás artículos sobre regresión a vidas pasadas, hipnosis y liberación espiritual. Sin spam, solo lo que vale la pena leer.",
    reengagementText:
      "Si quieres seguir leyendo artículos sobre regresión a vidas pasadas, hipnosis y liberación espiritual, solo haz click abajo.",
    palette: RVP_PALETTE,
  },
};

export function isBrandKey(v: unknown): v is BrandKey {
  return typeof v === "string" && v in BRANDS;
}

/** Devuelve la marca indicada; si no existe o falta, la marca por defecto (jpl). */
export function getBrand(key?: string | null): Brand {
  return isBrandKey(key) ? BRANDS[key] : BRANDS.jpl;
}

/** Dominios permitidos como remitente (uno por marca). */
export const ALLOWED_SENDER_DOMAINS: string[] = Array.from(
  new Set(Object.values(BRANDS).map((b) => b.fromEmail.split("@")[1])),
);

/** Marca a la que pertenece un correo de remitente, según su dominio. */
export function brandFromSenderEmail(email: string): Brand | null {
  const domain = String(email ?? "").split("@")[1]?.toLowerCase();
  return Object.values(BRANDS).find((b) => b.fromEmail.split("@")[1] === domain) ?? null;
}

/** Marca de un suscriptor según su origen (`source`). Los del portal usan `rvp*`. */
export function brandFromSource(source?: string | null): Brand {
  return String(source ?? "").toLowerCase().startsWith("rvp") ? BRANDS.rvp : BRANDS.jpl;
}

/**
 * Aislamiento entre marcas: una campaña de la marca principal (sin lista propia)
 * no debe llegar a quienes se suscribieron solo a través de otra marca.
 */
export function belongsToBrandAudience<T extends { source?: string | null }>(sub: T, brand: Brand): boolean {
  if (brand.listTag === null) return brandFromSource(sub.source).key === "jpl";
  return true; // las marcas con lista propia se filtran por etiqueta en la consulta
}

/** Remitente completo `Nombre <correo>` de una marca. */
export function brandFrom(brand: Brand): string {
  return `${brand.fromName} <${brand.fromEmail}>`;
}

/**
 * Aplica la paleta de una marca al HTML de un correo escrito con la paleta de
 * jpl. Para la marca jpl devuelve el HTML sin cambios.
 */
export function applyPalette(html: string, brand: Brand): string {
  if (brand.key === "jpl") return html;
  const from = BRANDS.jpl.palette;
  const to = brand.palette;
  const pairs: Array<[string, string]> = [
    [from.pageBg, to.pageBg],
    [from.cardBg, to.cardBg],
    [from.panelBg, to.panelBg],
    [from.gold, to.gold],
    [from.heading, to.heading],
    [from.body, to.body],
    [from.muted, to.muted],
    [from.dim, to.dim],
    [from.faint, to.faint],
    [from.btnText, to.btnText],
  ];
  let out = html;
  for (const [a, b] of pairs) {
    out = out.replace(new RegExp(a.replace("#", "#"), "gi"), b);
  }
  return out.replace(new RegExp(`rgba\\(${from.goldRgb.replace(/,/g, ",\\s*")}`, "g"), `rgba(${to.goldRgb}`);
}
