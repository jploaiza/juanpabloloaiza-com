-- ═══════════════════════════════════════════════════════════
-- JPL Academy — Course Seed
-- Run AFTER academy-schema.sql
-- ═══════════════════════════════════════════════════════════

do $$
declare
  v_course_id  uuid;
  v_section_id uuid;
begin

-- ── Insert course ────────────────────────────────────────────
insert into public.courses (slug, title, description, instructor_name, instructor_bio, instructor_photo_url, thumbnail_url, is_free, is_published)
values (
  'hipnosis-regresiva-preparacion',
  'Preparación para tu Regresión a Vidas Pasadas',
  'Un recorrido completo para que llegues a tu sesión preparado, confiado y abierto. Aprende sobre hipnosis, liberación de entidades y qué esperar del proceso terapéutico.',
  'Juan Pablo Loaiza',
  'Terapeuta Holístico Certificado Internacionalmente en Hipnosis Clínica con Técnicas Regresivas y Liberación de Entidades Espirituales, con más de 18 años de experiencia.',
  'https://media.juanpabloloaiza.com/images/jpl-newwsp.jpeg',
  'https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png',
  true,
  true
)
returning id into v_course_id;

-- ── Sección 1: Introducción ──────────────────────────────────
insert into public.sections (course_id, title, order_index) values (v_course_id, 'Introducción', 0) returning id into v_section_id;
insert into public.lessons (section_id, course_id, slug, title, duration_seconds, order_index) values
  (v_section_id, v_course_id, 'introduccion', 'Introducción', 100, 0);

-- ── Sección 2: Liberación de Entidades Espirituales ──────────
insert into public.sections (course_id, title, order_index) values (v_course_id, 'Liberación de Entidades Espirituales', 1) returning id into v_section_id;
insert into public.lessons (section_id, course_id, slug, title, duration_seconds, order_index) values
  (v_section_id, v_course_id, 'introduccion-a-la-tlee', 'Introducción a la TLEE', 128, 0),
  (v_section_id, v_course_id, 'guia-espiritual', 'Guía Espiritual', 75, 1),
  (v_section_id, v_course_id, 'telepatia', 'Telepatía', 139, 2),
  (v_section_id, v_course_id, 'funcion-del-guia-espiritual', 'Función del Guía Espiritual', 193, 3),
  (v_section_id, v_course_id, 'desencarnados', 'Desencarnados', 259, 4),
  (v_section_id, v_course_id, 'entidades-de-fuerza-oscura', 'Entidades de Fuerza Oscura', 336, 5),
  (v_section_id, v_course_id, 'energias-extraterrestres', 'Energías Extraterrestres', 217, 6),
  (v_section_id, v_course_id, 'beneficio-de-la-tlee', '¿Cuál es el beneficio de la TLEE?', 164, 7);

-- ── Sección 3: Hipnosis ──────────────────────────────────────
insert into public.sections (course_id, title, order_index) values (v_course_id, 'Hipnosis', 2) returning id into v_section_id;
insert into public.lessons (section_id, course_id, slug, title, duration_seconds, order_index) values
  (v_section_id, v_course_id, 'que-es-la-hipnosis', '¿Qué es la Hipnosis?', 91, 0),
  (v_section_id, v_course_id, 'estado-despierto', 'Estado Despierto', 135, 1),
  (v_section_id, v_course_id, 'estado-duermiendo', 'Estado Duermiendo', 170, 2),
  (v_section_id, v_course_id, 'poder-de-la-mente-subconsciente', 'El Poder de la Mente Subconsciente', 71, 3),
  (v_section_id, v_course_id, 'estado-hipnotico', 'Estado Hipnótico', 70, 4),
  (v_section_id, v_course_id, 'que-pasa-si-me-desconcentro', '¿Qué pasa si me desconcentro?', 75, 5),
  (v_section_id, v_course_id, 'ganas-de-ir-al-bano', '¿Y si me dan ganas de ir al baño?', 76, 6),
  (v_section_id, v_course_id, 'uno-dos-tres-duerme', '1, 2, 3 Duerme!', 92, 7),
  (v_section_id, v_course_id, 'como-se-siente-hipnosis', '¿Cómo se siente estar en Hipnosis?', 54, 8),
  (v_section_id, v_course_id, 'rol-del-paciente', '¿Cuál es el rol del paciente?', 141, 9),
  (v_section_id, v_course_id, 'relatar-no-solo-responder', 'Relatar, no solo responder', 73, 10),
  (v_section_id, v_course_id, 'no-cambies-ni-modifiques', 'No cambies ni modifiques nada!', 140, 11),
  (v_section_id, v_course_id, 'y-si-me-lo-estoy-imaginando', '¿Y si me lo estoy imaginando todo?', 114, 12),
  (v_section_id, v_course_id, 'diferencia-recuerdo-imaginacion', 'Diferencia entre recuerdo e imaginación', 193, 13),
  (v_section_id, v_course_id, 'aunque-sea-muy-raro', 'Aunque sea muy raro, tienes que decirlo!', 110, 14),
  (v_section_id, v_course_id, 'confia-en-lo-primero', 'Confía en lo primero que sientas', 79, 15),
  (v_section_id, v_course_id, 'que-hacer-si-no-llega-respuesta', '¿Qué hacer si no llega la respuesta?', 189, 16),
  (v_section_id, v_course_id, 'no-tiene-que-ser-historicamente-correcto', 'No tiene que ser históricamente correcto', 77, 17),
  (v_section_id, v_course_id, 'no-buscamos-experiencia-audiovisual', 'No buscamos una experiencia Audiovisual!', 199, 18);

-- ── Sección 4: Final ─────────────────────────────────────────
insert into public.sections (course_id, title, order_index) values (v_course_id, 'Final', 3) returning id into v_section_id;
insert into public.lessons (section_id, course_id, slug, title, duration_seconds, order_index) values
  (v_section_id, v_course_id, 'palabras-finales', 'Palabras finales', 70, 0);

raise notice 'Seed complete. Course ID: %', v_course_id;
end;
$$;
