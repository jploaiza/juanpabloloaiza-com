-- Dos artículos tenían exactamente el mismo título ("Crisis de identidad: qué es y cómo
-- sanarla con TRVP") y competían por la misma búsqueda. Se diferencian por enfoque:
--   que-es-crisis-de-identidad                  -> causas y señales (psicológicas y espirituales)
--   crisis-de-identidad-que-es-y-como-sanarla   -> origen en vidas pasadas
-- Ejecutar en Supabase -> SQL Editor. Cambia solo texto (no slugs ni URLs).

UPDATE blog_posts SET
  title           = 'Crisis de identidad: causas, señales y cómo sanarla con TRVP',
  seo_title       = 'Crisis de identidad: causas y señales de que la vives',
  seo_description = 'Cómo reconocer una crisis de identidad: causas psicológicas y espirituales, señales de vacío y desconexión, y cómo la hipnosis terapéutica ayuda a sanarla.'
WHERE slug = 'que-es-crisis-de-identidad';

UPDATE blog_posts SET
  title           = 'Crisis de identidad y vidas pasadas: cuando el alma no sabe quién es',
  seo_title       = 'Crisis de identidad y vidas pasadas: el origen del alma',
  seo_description = 'Si la crisis de identidad no se explica con tu historia actual, su origen puede estar en otra vida. Así lo trabaja la regresión a vidas pasadas con Juan Pablo Loaiza.'
WHERE slug = 'crisis-de-identidad-que-es-y-como-sanarla';

-- Verificación: debe devolver 2 filas con títulos distintos
SELECT slug, title, length(seo_title) AS len_seo_title, length(seo_description) AS len_desc
FROM blog_posts
WHERE slug IN ('que-es-crisis-de-identidad', 'crisis-de-identidad-que-es-y-como-sanarla');
