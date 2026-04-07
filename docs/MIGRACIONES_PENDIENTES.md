# Migraciones SQL pendientes — JPL Academy

El MCP de Supabase no tiene acceso al proyecto `nnovaliktjmemieiogbj`.
Ejecuta esto manualmente en **Supabase Dashboard → SQL Editor**.

## Orden de ejecución

### 1. Schema (`docs/academy-schema.sql`)
Crea todas las tablas, RLS, triggers y la vista `course_progress_summary`.

### 2. Seed (`docs/academy-seed.sql`)
Inserta el curso "Preparación para tu Regresión a Vidas Pasadas" con sus 4 secciones y 28 lecciones.

## Pasos

1. Ir a https://supabase.com/dashboard/project/nnovaliktjmemieiogbj/sql/new
2. Pegar el contenido de `docs/academy-schema.sql` → Run
3. Pegar el contenido de `docs/academy-seed.sql` → Run
4. Verificar en Table Editor que existan las tablas: `profiles`, `courses`, `sections`, `lessons`, `enrollments`, `lesson_progress`, `notes`, `questions`, `certificates`

## Agregar video_url a las lecciones

Una vez que los videos estén en Cloudflare R2, actualiza con:

```sql
UPDATE public.lessons
SET video_url = 'https://media.juanpabloloaiza.com/videos/introduccion.mp4'
WHERE slug = 'introduccion';

-- Repite para cada lección con su URL de R2
```

O usa el Admin panel de Supabase para editar la columna `video_url` de cada lección directamente.
