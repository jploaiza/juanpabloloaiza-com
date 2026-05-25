import { NextResponse } from "next/server";
import { getAllPublishedPosts } from "@/lib/supabase/blog";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await getAllPublishedPosts().catch(() => []);

  const blogLines = posts
    .map((p) => `- [${p.title}](https://juanpabloloaiza.com/blog/${p.slug}/): ${p.excerpt ?? ""}`)
    .join("\n");

  const body = `# Juan Pablo Loaiza - Terapeuta de Regresión a Vidas Pasadas

> Juan Pablo Loaiza es un terapeuta especializado en hipnosis clínica y regresión a vidas pasadas. Ofrece sesiones individuales en línea para ayudar a sus clientes a sanar traumas, superar miedos, liberar patrones kármicos y descubrir su propósito de vida a través de técnicas validadas por referentes como el Dr. Brian Weiss y Dolores Cannon.

## Páginas Principales

- [Inicio](https://juanpabloloaiza.com/): Presentación del terapeuta y sus servicios de regresión a vidas pasadas e hipnosis.
- [Blog](https://juanpabloloaiza.com/blog/): Artículos educativos sobre regresión a vidas pasadas, hipnosis y sanación holística.
- [Videos](https://juanpabloloaiza.com/videos/): Contenido audiovisual educativo sobre terapia de regresión.
- [Políticas de Servicio](https://juanpabloloaiza.com/politicas-de-servicio/): Términos, condiciones y políticas de las sesiones terapéuticas.

## Academy (Plataforma de Aprendizaje)

- [JPL Academy](https://juanpabloloaiza.com/academy/): Plataforma de cursos en línea sobre preparación para regresión a vidas pasadas.
- Curso principal: "Preparación para Hipnosis Regresiva" — disponible gratuitamente para nuevos estudiantes.

## Artículos del Blog

${blogLines}

## Información del Terapeuta

- **Nombre:** Juan Pablo Loaiza
- **Especialidad:** Hipnosis clínica y regresión a vidas pasadas
- **Modalidad:** Sesiones individuales en línea (Zoom)
- **Idioma:** Español
- **Influencias terapéuticas:** Dr. Brian Weiss, Dolores Cannon
- **Sitio web:** https://juanpabloloaiza.com

## Áreas Temáticas

Regresión a vidas pasadas, hipnosis terapéutica, sanación kármica, liberación de traumas, propósito de vida, desarrollo personal, espiritualidad, sanación holística, miedos y fobias, depresión, adicciones, relaciones, posesiones espirituales, liberación de entidades, contratos kármicos, vidas anteriores, alma, conciencia, transformación personal, TRVP.
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
