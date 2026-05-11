import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const VALID_GEOS = new Set(["ES", "US", "MX", "CL", "ALL"]);

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
}

const JPL_CONTEXT = `Eres Juan Pablo Loaiza, terapeuta chileno con más de una década de experiencia en regresión a vidas pasadas, hipnosis terapéutica y sanación espiritual (metodología TRVP). Tienes autoridad como referente en terapias espirituales de habla hispana. Tu audiencia son personas que buscan sanar emociones, comprender su alma, superar traumas y crecer espiritualmente.`;

function articleIdeaPrompt(keyword: string, geo: string) {
  return `${JPL_CONTEXT}

Keyword objetivo: "${keyword}" (mercado: ${geo === "ALL" ? "Latinoamérica" : geo})

Genera una idea de artículo de blog SEO-optimizado para este keyword. Devuelve ÚNICAMENTE un JSON válido con esta estructura:
{
  "title": "título del artículo con keyword natural, máx 70 chars",
  "angle": "el ángulo narrativo único que diferencia este artículo — 1 oración",
  "keyPoints": ["punto 1", "punto 2", "punto 3", "punto 4", "punto 5"],
  "targetQuery": "la intención de búsqueda exacta que responde este artículo",
  "estimatedWords": 2000
}`;
}

function reelIdeaPrompt(keyword: string, geo: string) {
  return `${JPL_CONTEXT}

Keyword objetivo: "${keyword}" (mercado: ${geo === "ALL" ? "Latinoamérica" : geo})

Genera una idea de reel/short de 60-90 segundos para Instagram/TikTok/YouTube Shorts. Devuelve ÚNICAMENTE un JSON válido:
{
  "title": "título del reel — el hook visual/textual, máx 60 chars",
  "hook": "primera frase de impacto para los primeros 3 segundos (pregunta o afirmación que detiene el scroll)",
  "structure": ["escena 1: ...", "escena 2: ...", "escena 3: ...", "escena 4: CTA"],
  "cta": "llamado a la acción final del reel",
  "angle": "ángulo emocional o sorprendente que hace viral este tema"
}`;
}

function carouselIdeaPrompt(keyword: string, geo: string) {
  return `${JPL_CONTEXT}

Keyword objetivo: "${keyword}" (mercado: ${geo === "ALL" ? "Latinoamérica" : geo})

Genera una idea de carrusel para Instagram (6-10 slides). Devuelve ÚNICAMENTE un JSON válido:
{
  "title": "título de la primera slide (portada) — el hook, máx 60 chars",
  "slides": [
    {"number": 1, "headline": "portada/hook", "body": "texto breve"},
    {"number": 2, "headline": "...", "body": "..."},
    {"number": 3, "headline": "...", "body": "..."},
    {"number": 4, "headline": "...", "body": "..."},
    {"number": 5, "headline": "...", "body": "..."},
    {"number": 6, "headline": "CTA", "body": "..."}
  ],
  "caption": "texto del caption para el post con hashtags relevantes en español"
}`;
}

function fullArticlePrompt(keyword: string, geo: string) {
  const market = geo === "ALL" ? "Latinoamérica hispanohablante" : geo === "ES" ? "España" : geo === "MX" ? "México" : geo === "CL" ? "Chile" : "Estados Unidos hispanohablante";
  return `${JPL_CONTEXT}

Crea un artículo de blog completo y profundamente optimizado para SEO sobre: "${keyword}"
Mercado objetivo: ${market}

REQUISITOS OBLIGATORIOS:
- Entre 1800 y 2500 palabras en el campo "content"
- Estructura E-E-A-T: demuestra Experiencia, Expertise, Autoridad y Confianza desde la primera oración
- H1 implícito en el title, mínimo 5 H2 (##) y 3 H3 (###) en el contenido
- Keyword "${keyword}" en: primer párrafo, 2-3 H2, distribuida naturalmente (densidad ~1.5%)
- Párrafo inicial poderoso: empieza con una verdad incómoda o pregunta que resuena
- Sección "Mi experiencia como terapeuta" con caso real (anonimizado)
- Sección de beneficios concretos (lista de 5-7 items con **)
- Sección FAQ al final (mínimo 3 preguntas frecuentes que la gente busca en Google)
- CTA sutil pero efectivo al final (sin sonar comercial agresivo)
- Tono: cálido, empático, espiritual, con autoridad — primera persona
- Usa conectores naturales y vocabulario rico en español (no traducido del inglés)
- Negrita en conceptos clave y frases poderosas

Devuelve ÚNICAMENTE un JSON válido (sin markdown wrapper):
{
  "title": "título SEO-friendly con keyword, máx 65 chars",
  "excerpt": "meta descripción que genera curiosidad y clicks, máx 155 chars",
  "content": "artículo completo en Markdown, mínimo 1800 palabras",
  "tags": ["keyword-principal", "tag2", "tag3", "tag4", "tag5"],
  "seoTitle": "H1 optimizado para Google, máx 60 chars",
  "seoDescription": "meta description final, máx 155 chars",
  "imagePrompt": "cinematic realistic photo, ultra-detailed, ${keyword} concept, ethereal spiritual atmosphere, soft golden light, mystical depth, no people, no text, no faces, 8k resolution, --ar 16:9"
}`;
}

export async function POST(req: NextRequest) {
  const isAdmin = await assertAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
  const rawGeo = typeof body.geo === "string" ? body.geo.toUpperCase() : "ES";
  const geo = VALID_GEOS.has(rawGeo) ? rawGeo : "ES";

  if (!keyword || keyword.length < 2 || keyword.length > 100) {
    return NextResponse.json({ error: "keyword must be 2–100 chars" }, { status: 400 });
  }

  const client = getClient();
  const call = (prompt: string) =>
    client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 4000,
    }).then((r) => {
      const raw = r.choices[0]?.message?.content ?? "{}";
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
      return JSON.parse(cleaned);
    });

  const [articleIdea, reelIdea, carouselIdea, fullArticle] = await Promise.allSettled([
    call(articleIdeaPrompt(keyword, geo)),
    call(reelIdeaPrompt(keyword, geo)),
    call(carouselIdeaPrompt(keyword, geo)),
    call(fullArticlePrompt(keyword, geo)),
  ]);

  return NextResponse.json({
    keyword,
    geo,
    articleIdea: articleIdea.status === "fulfilled" ? articleIdea.value : null,
    reelIdea: reelIdea.status === "fulfilled" ? reelIdea.value : null,
    carouselIdea: carouselIdea.status === "fulfilled" ? carouselIdea.value : null,
    fullArticle: fullArticle.status === "fulfilled" ? fullArticle.value : null,
  });
}
