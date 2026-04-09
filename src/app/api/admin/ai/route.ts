import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const GENERATE_PROMPT = (idea: string) => `Eres Juan Pablo Loaiza, terapeuta chileno especializado en regresión a vidas pasadas, hipnosis terapéutica y sanación espiritual. Escribes para tu blog personal.

Escribe un artículo de blog completo en español sobre esta idea: "${idea}"

Requisitos:
- Formato Markdown (usa ## para subtítulos, - para listas)
- Entre 800 y 1200 palabras
- Tono cálido, espiritual, profesional y empático
- Comienza con un párrafo introductorio que enganche al lector
- Incluye al menos 3 subtítulos (##)
- Termina con una conclusión inspiradora
- Habla desde tu experiencia como terapeuta

Devuelve ÚNICAMENTE el contenido en Markdown, sin explicaciones ni texto adicional.`;

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

export async function POST(req: NextRequest) {
  // Auth guard
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

  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_AI_API_KEY no está configurada." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { action, input } = body as { action: "generate" | "improve" | "seo"; input: string };

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
  } else {
    prompt = action === "generate" ? GENERATE_PROMPT(input) : IMPROVE_PROMPT(input);
  }

  let raw: string;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    raw = result.response.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ai] Gemini error:", msg);
    return NextResponse.json({ error: `Gemini: ${msg}` }, { status: 500 });
  }

  if (action === "seo") {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const seoData = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      return NextResponse.json(seoData);
    } catch {
      return NextResponse.json({ error: "IA no devolvió JSON válido.", raw }, { status: 500 });
    }
  }

  return NextResponse.json({ content: raw });
}
