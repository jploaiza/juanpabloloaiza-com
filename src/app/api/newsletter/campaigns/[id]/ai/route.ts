import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";

export const dynamic = "force-dynamic";

function sanitizePromptField(value: unknown, maxLen: number): string {
  return String(value ?? "").replace(/[\r\n<>]/g, " ").substring(0, maxLen).trim();
}

const NEWSLETTER_AI_PROMPT = (articles: Array<{ title: string; excerpt: string; tags: string[] }>, templateKind: string) => {
  if (templateKind === "editorial") {
    const articleList = articles.map((a, i) => {
      const label = i === 0 ? "PRINCIPAL" : `SECUNDARIO ${i}`;
      const title = sanitizePromptField(a.title, 200);
      const excerpt = sanitizePromptField(a.excerpt, 500);
      const tags = (Array.isArray(a.tags) ? a.tags : []).map((t) => sanitizePromptField(t, 50)).join(", ");
      return `${label}: <title>${title}</title><excerpt>${excerpt}</excerpt><tags>${tags}</tags>`;
    }).join("\n");
    return `Eres Juan Pablo Loaiza, terapeuta TRVP chileno (regresión a vidas pasadas, hipnosis terapéutica, sanación espiritual). Escribes con calidez, profundidad y autoridad espiritual. Hablas en primera persona, tono cercano, sin emojis.

Tags de personalización disponibles (úsalos de forma natural en la introducción):
- {{primer_nombre}} — nombre de pila del suscriptor
- {{nombre}} — nombre completo
- {{apellido}} — apellido

Genera el contenido para una newsletter editorial con estos artículos:
${articleList}

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:
{
  "subject_options": ["asunto 1 (máx 50 chars)", "asunto 2 (máx 50 chars)", "asunto 3 (máx 50 chars)"],
  "preheader": "texto de preview (máx 90 chars, complementa el asunto)",
  "intro": "introducción personalizada (MÁXIMO 150 palabras, usa {{primer_nombre}} al inicio o de forma natural dentro del texto, 2-3 párrafos cortos, voz TRVP, conecta emocionalmente con los temas de esta entrega)",
  "transitions": ["frase puente hacia artículo secundario 1 (1 línea)", "frase puente hacia artículo secundario 2 (1 línea)"],
  "cta": {"text": "texto del botón CTA final (máx 30 chars)", "url": "https://juanpabloloaiza.com/blog"}
}`;
  }

  if (templateKind === "announcement") {
    return `Eres Juan Pablo Loaiza, terapeuta TRVP. Genera contenido para un email de anuncio/lanzamiento.

Devuelve ÚNICAMENTE un JSON válido:
{
  "subject_options": ["asunto 1 (máx 50 chars)", "asunto 2 (máx 50 chars)", "asunto 3 (máx 50 chars)"],
  "preheader": "texto preview (máx 90 chars)",
  "title": "título del anuncio (máx 40 chars, impactante)",
  "body": "cuerpo del anuncio (3-4 párrafos, entusiasta pero sin exagerar, voz personal TRVP)",
  "cta": {"text": "texto CTA (máx 30 chars)", "url": "https://juanpabloloaiza.com"}
}`;
  }

  return `Eres Juan Pablo Loaiza, terapeuta TRVP. Genera contenido de bienvenida para nuevos suscriptores.

Devuelve ÚNICAMENTE un JSON válido:
{
  "subject_options": ["asunto 1 (máx 50 chars)", "asunto 2 (máx 50 chars)", "asunto 3 (máx 50 chars)"],
  "preheader": "texto preview (máx 90 chars)",
  "intro": "mensaje de bienvenida cálido (2 párrafos, voz TRVP personal)"
}`;
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  const { articles, template_kind } = await req.json();

  if (!Array.isArray(articles)) {
    return NextResponse.json({ error: "articles debe ser un arreglo." }, { status: 400 });
  }

  const { data: campaign } = await auth.adminSb
    .from("newsletter_campaigns")
    .select("template_kind")
    .eq("id", id)
    .single();

  if (!campaign) return NextResponse.json({ error: "No encontrada." }, { status: 404 });

  const kind = template_kind ?? campaign.template_kind ?? "editorial";

  try {
    const client = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: "https://api.deepseek.com" });

    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: NEWSLETTER_AI_PROMPT(articles ?? [], kind) }],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 1200,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(raw);

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[newsletter/ai]", err);
    return NextResponse.json({ error: "Error generando con IA. Intenta de nuevo." }, { status: 500 });
  }
}
