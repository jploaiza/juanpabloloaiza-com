import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const GENERATE_PROMPT = (idea: string) => `Eres Juan Pablo Loaiza, terapeuta chileno con más de una década de experiencia en regresión a vidas pasadas, hipnosis terapéutica y sanación espiritual. Tu trabajo ha transformado la vida de cientos de personas en Chile y Latinoamérica. Escribes con calidez, profundidad y autoridad, siempre posicionándote como el referente en terapias espirituales de habla hispana.

Escribe un artículo de blog completo en español sobre esta idea: "${idea}"

Requisitos de contenido:
- Entre 2000 y 2800 palabras — artículos largos posicionan mejor en Google
- Formato Markdown (## para subtítulos H2, ### para H3, **negrita** para conceptos clave)
- Tono: cálido, espiritual, empático, con autoridad profesional — como si conversaras con un paciente
- Habla en primera persona desde tu experiencia real como terapeuta
- Menciona casos o situaciones que tus pacientes han vivido (sin identificarlos)
- Incluye al menos 5 subtítulos (##)
- Párrafo inicial poderoso que enganche y genere curiosidad
- Sección de beneficios o qué pueden esperar de una sesión contigo
- Llamado a la acción sutil al final (sin ser comercial agresivo)
- Posiciónate como guía y acompañante en el proceso de sanación
- Incluye reflexiones sobre el por qué este tema importa en la vida moderna

Devuelve ÚNICAMENTE el contenido en Markdown, sin explicaciones ni texto adicional.`;

const GENERATE_FULL_PROMPT = (idea: string) => `Eres Juan Pablo Loaiza, terapeuta chileno con más de una década de experiencia en regresión a vidas pasadas, hipnosis terapéutica y sanación espiritual. Tu trabajo ha transformado la vida de cientos de personas en Chile y Latinoamérica. Escribes con calidez, profundidad y autoridad, posicionándote como referente en terapias espirituales de habla hispana.

Crea un artículo de blog completo y optimizado para SEO sobre esta idea: "${idea}"

REQUISITOS DEL ARTÍCULO:
- Entre 2000 y 2800 palabras (el contenido)
- Formato Markdown (## para H2, ### para H3, **negrita** para keywords)
- Tono: cálido, espiritual, empático, con autoridad — primera persona
- Menciona experiencias de pacientes (sin identificarlos)
- Al menos 5 subtítulos (##)
- Párrafo inicial poderoso que enganche
- Sección sobre beneficios de trabajar contigo
- Llamado a la acción sutil al final
- Posiciónate como guía en el proceso de sanación

Devuelve ÚNICAMENTE un JSON válido (sin markdown wrapper, sin explicaciones) con esta estructura exacta:
{
  "title": "título atractivo y con keyword principal, máximo 70 caracteres",
  "excerpt": "resumen que engancha al lector, máximo 280 caracteres",
  "content": "el artículo completo en Markdown, mínimo 2000 palabras",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seoTitle": "título SEO optimizado para Google, máximo 60 caracteres",
  "seoDescription": "meta descripción atractiva para clicks, máximo 155 caracteres",
  "imagePrompt": "cinematic realistic photo, ultra-detailed, [tema específico del artículo], ethereal spiritual atmosphere, soft golden light, mystical depth, professional photography, 8k resolution, --ar 16:9, no text, no faces, no logos"
}`;

const IMPROVE_PROMPT = (content: string) => `Eres un editor experto en contenido espiritual y terapéutico en español.

Mejora el siguiente artículo de blog manteniendo:
- El significado y mensaje original
- El tono espiritual y terapéutico
- La estructura en Markdown

Mejoras a aplicar: fluidez, vocabulario más rico, párrafos mejor conectados, eliminación de redundancias.

Devuelve ÚNICAMENTE el contenido mejorado en Markdown:

${content}`;

const SEO_PROMPT = (title: string, excerpt: string, content: string) => `Eres un experto en SEO para contenido espiritual y terapéutico en español.

Analiza este artículo de blog y genera campos SEO optimizados para Google.

Título del artículo: ${title}
Extracto actual: ${excerpt}
Contenido: ${content.slice(0, 3000)}

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta (sin markdown, sin bloques de código, sin explicaciones):
{
  "seoTitle": "título SEO optimizado, máximo 60 caracteres, incluye keyword principal",
  "seoDescription": "meta descripción atractiva para clicks, máximo 160 caracteres",
  "excerpt": "extracto del artículo para listados, máximo 300 caracteres, engancha al lector"
}`;

const IMPROVE_FIELDS_PROMPT = (
  fields: string[],
  data: { title: string; excerpt: string; content: string; tags: string[]; seoTitle: string; seoDescription: string }
) => `Eres Juan Pablo Loaiza, terapeuta chileno especializado en regresión a vidas pasadas, hipnosis terapéutica y sanación espiritual.

Artículo actual:
- Título: ${data.title}
- Extracto: ${data.excerpt}
- Tags: ${data.tags.join(", ")}
- SEO Title: ${data.seoTitle}
- SEO Description: ${data.seoDescription}
- Contenido: ${data.content.slice(0, 6000)}

Mejora ÚNICAMENTE estos campos: ${fields.join(", ")}

Reglas por campo:
- title: más atractivo y claro, mantén la esencia
- excerpt: engancha al lector, máximo 300 caracteres
- content: más fluido y rico en vocabulario, mantén Markdown y longitud similar
- tags: array de 4-8 tags relevantes en español, palabras simples
- seoTitle: optimizado para Google, máximo 60 caracteres
- seoDescription: atractiva para clicks, máximo 160 caracteres

Devuelve ÚNICAMENTE un JSON válido con SOLO los campos solicitados (sin markdown, sin explicaciones):
{
  ${fields.includes("title") ? '"title": "...",' : ""}
  ${fields.includes("excerpt") ? '"excerpt": "...",' : ""}
  ${fields.includes("content") ? '"content": "...",' : ""}
  ${fields.includes("tags") ? '"tags": ["...", "..."],' : ""}
  ${fields.includes("seoTitle") ? '"seoTitle": "...",' : ""}
  ${fields.includes("seoDescription") ? '"seoDescription": "..."' : ""}
}`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: "DEEPSEEK_API_KEY no está configurada." }, { status: 500 });
  }

  const body = await req.json();
  const { action, input } = body as { action: "generate" | "generate-full" | "improve" | "seo" | "improve-fields"; input: string };

  if (!action || !input?.trim()) {
    return NextResponse.json({ error: "Faltan campos requeridos." }, { status: 400 });
  }

  let prompt: string;
  if (action === "seo") {
    let parsed: { title: string; excerpt: string; content: string };
    try {
      parsed = JSON.parse(input);
    } catch {
      return NextResponse.json({ error: "Input inválido para acción SEO." }, { status: 400 });
    }
    prompt = SEO_PROMPT(parsed.title, parsed.excerpt, parsed.content);
  } else if (action === "improve-fields") {
    let parsed: { fields: string[]; title: string; excerpt: string; content: string; tags: string[]; seoTitle: string; seoDescription: string };
    try {
      parsed = JSON.parse(input);
    } catch {
      return NextResponse.json({ error: "Input inválido para improve-fields." }, { status: 400 });
    }
    if (!parsed.fields?.length) {
      return NextResponse.json({ error: "Selecciona al menos un campo." }, { status: 400 });
    }
    prompt = IMPROVE_FIELDS_PROMPT(parsed.fields, parsed);
  } else if (action === "generate-full") {
    prompt = GENERATE_FULL_PROMPT(input);
  } else {
    prompt = action === "generate" ? GENERATE_PROMPT(input) : IMPROVE_PROMPT(input);
  }

  let raw: string;
  try {
    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    });
    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      max_tokens: action === "seo" ? 512 : action === "generate-full" ? 8192 : 4096,
      messages: [{ role: "user", content: prompt }],
    });
    raw = response.choices[0]?.message?.content ?? "";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ai] DeepSeek error:", msg);
    return NextResponse.json({ error: `DeepSeek: ${msg}` }, { status: 500 });
  }

  if (action === "seo" || action === "improve-fields" || action === "generate-full") {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ error: "IA no devolvió JSON válido.", raw }, { status: 500 });
    }
  }

  return NextResponse.json({ content: raw });
}
