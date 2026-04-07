# 🎓 INFORME COMPLETO: SISTEMA LMS PROPIO
## academy.juanpabloloaiza.com → Plataforma Custom

**Fecha:** 2026-04-06
**Propósito:** Migración desde WordPress + TutorLMS a plataforma propia
**Stack Objetivo:** Next.js + Supabase + Vercel

---

## 📋 TABLA DE CONTENIDOS

1. [Estado Actual del LMS](#1-estado-actual-del-lms)
2. [Análisis de la Competencia](#2-análisis-de-la-competencia)
3. [Lo Mejor de Cada Plataforma](#3-lo-mejor-de-cada-plataforma)
4. [Funcionalidades para el Usuario Final](#4-funcionalidades-para-el-usuario-final)
5. [Arquitectura Técnica](#5-arquitectura-técnica)
6. [Stack Tecnológico Recomendado](#6-stack-tecnológico-recomendado)
7. [Esquema de Base de Datos](#7-esquema-de-base-de-datos)
8. [Módulos a Desarrollar](#8-módulos-a-desarrollar)
9. [Roadmap de Desarrollo](#9-roadmap-de-desarrollo)
10. [Ventajas sobre la Competencia](#10-ventajas-sobre-la-competencia)

---

## 1. ESTADO ACTUAL DEL LMS

### Plataforma Existente
- **URL:** https://academy.juanpabloloaiza.com
- **CMS:** WordPress
- **Plugin LMS:** TutorLMS
- **Hosting:** DreamHost

### Curso Activo

**Nombre:** Introducción a la Hipnosis, Regresión a Vidas Pasadas y Liberación de Entidades Espirituales

**Características:**
- Nivel: Principiante
- Duración total: 1 hora 10 minutos
- Acceso: Gratuito
- Última actualización: 21/11/2024
- Categoría: Introducción a la Hipnosis
- Instructor: Juan Pablo Loaiza (Terapeuta especialista en Hipnosis Regresiva)
- Audiencia: Pacientes que van a comenzar proceso terapéutico

**Estructura de Lecciones (28 lecciones en 4 secciones):**

| Sección | Lecciones | Duración total aprox. |
|---------|-----------|----------------------|
| Introducción | 1 | ~2 min |
| Liberación de Entidades Espirituales | 8 | ~25 min |
| Hipnosis | 18 | ~35 min |
| Final | 1 | ~1 min |

**Detalle de lecciones:**

*Introducción:*
- Introducción (01:40)

*Liberación de Entidades Espirituales:*
- Introducción a la TLEE (02:08)
- Guía Espiritual (01:15)
- Telepatía (02:19)
- Función del Guía Espiritual (03:13)
- Desencarnados (04:19)
- Entidades de Fuerza Oscura (05:36)
- Energías Extraterrestres (03:37)
- ¿Cuál es el beneficio de la TLEE? (02:44)

*Hipnosis:*
- ¿Qué es la Hipnosis? (01:31)
- Estado Despierto (02:15)
- Estado Duermiendo (02:50)
- El Poder de la mente Subconsciente (01:11)
- Estado Hipnótico (01:10)
- ¿Qué pasa si me desconcentro? (01:15)
- ¿Y si me dan ganas de ir al baño? (01:16)
- 1, 2, 3 Duerme! (01:32)
- ¿Cómo se siente estar en Hipnosis? (00:54)
- ¿Cuál es el rol del paciente? (02:21)
- Relatar, no solo responder (01:13)
- No cambies ni modifiques nada! (02:20)
- ¿Y si me lo estoy imaginando todo? (01:54)
- Diferencia entre recuerdo e imaginación (03:13)
- Aunque sea muy raro, tienes que decirlo! (01:50)
- Confía en lo primero que sientas (01:19)
- ¿Qué hacer si no llega la respuesta? (03:09)
- No tiene que ser históricamente correcto (01:17)
- No buscamos una experiencia Audiovisual! (03:19)

*Final:*
- Palabras finales (01:10)

**Tags actuales:** hipnosis, hipnosis clínica, hipnosis regresiva, liberación de entidades espirituales, regresión

### Problemas con el Setup Actual (WordPress + TutorLMS)

| Problema | Impacto |
|----------|---------|
| Peso de WordPress + plugins | Velocidad lenta |
| TutorLMS licencia anual | Costo recurrente |
| Dependencia de plugins de terceros | Fragilidad y bugs |
| Personalización limitada de UI/UX | Experiencia mediocre |
| Sin control total sobre datos | Dependencia de plataforma |
| Hosting compartido DreamHost | Performance limitado |
| Updates de WordPress = riesgo | Inestabilidad |

---

## 2. ANÁLISIS DE LA COMPETENCIA

### TutorLMS

**Fortalezas:**
- Drag-and-drop course builder
- Frontend builder (crear cursos sin acceder al dashboard WP)
- 10 tipos de preguntas en quizzes
- Dashboard limpio y moderno
- Versión gratuita disponible
- Integración con WooCommerce, PayPal, Stripe
- Sistema de comisiones para instructores
- App móvil disponible

**Debilidades:**
- Sigue siendo WordPress (peso, updates, vulnerabilidades)
- Extensiones premium adicionales ($49-$99 c/u)
- Sin email marketing integrado
- Sin landing pages integradas
- Sin herramientas de afiliados
- Bugs con actualizaciones frecuentes
- Soporte limitado en versión gratuita

**Precio:** Gratis (core) + add-ons $49-99/cada uno, Pro ~$149-299/año

### LearnDash

**Fortalezas:**
- Gamificación avanzada (puntos, badges, leaderboards)
- 12 tipos de preguntas en quizzes (incluyendo essays, uploads, hotspots)
- Video Progression (progreso por tiempo de video visto)
- Focus Mode (modo sin distracciones)
- SCORM compliance
- Prerequisites avanzados (bloqueo de lecciones)
- ProPanel analytics
- Content drip sofisticado
- Usado por universidades y Fortune 500

**Debilidades:**
- Precio alto ($199-$799/año)
- UI/UX desactualizada
- Curva de aprendizaje alta
- Sigue siendo WordPress
- Requiere desarrollador para personalización avanzada
- No tiene versión gratuita

**Precio:** $199/año (1 sitio) a $799/año (ilimitado)

### Debilidades COMUNES a ambos

1. **Atadas a WordPress**: Actualizaciones constantes, vulnerabilidades de seguridad, plugins conflictivos
2. **Performance**: WordPress es inherentemente más lento que una app dedicada
3. **UX anticuada**: Interfaz de estudiante no compite con Teachable o Kajabi
4. **Dependencia de terceros**: Cada función importante requiere un plugin adicional
5. **Sin mobile-first real**: Las apps móviles son afterthought, no nativas
6. **Analytics básico**: Métricas de engagement superficiales
7. **Sin personalización de marca profunda**: Siempre se ve "como WordPress"

---

## 3. LO MEJOR DE CADA PLATAFORMA

### Lo que vamos a tomar de TutorLMS
- ✅ Dashboard limpio y minimalista para el estudiante
- ✅ Progress tracking visual por lección
- ✅ Modo de estudio sin distracciones (Focus Mode)
- ✅ Q&A por lección (sección de preguntas)
- ✅ Reproducción de video embebido limpia
- ✅ Interfaz de lista de deseos y cursos guardados

### Lo que vamos a tomar de LearnDash
- ✅ Video Progression (marcar lección completa solo si se ve el video completo)
- ✅ Prerequisites entre lecciones (avanzar solo si completas la anterior)
- ✅ Content drip (liberar lecciones progresivamente)
- ✅ Certificados descargables al completar curso
- ✅ Analytics detallado por estudiante
- ✅ Focus Mode sin headers ni navegación global

### Lo que vamos a SUPERAR de ambos
- 🚀 Stack moderno (Next.js) = 10x más rápido que WordPress
- 🚀 UI/UX diseñada a medida con identidad visual de Juan Pablo Loaiza
- 🚀 Player de video nativo con progreso guardado automáticamente
- 🚀 PWA (Progressive Web App) = funciona como app sin descarga
- 🚀 Sin dependencia de plugins de terceros
- 🚀 Control total de datos (Supabase propio)
- 🚀 Deployments instantáneos en Vercel
- 🚀 Costo cercano a $0 a escala inicial
- 🚀 Integración directa con sistema de reservas (Booknetic/agenda)
- 🚀 Notificaciones push nativas

---

## 4. FUNCIONALIDADES PARA EL USUARIO FINAL

### 4.1 Página de Inicio / Landing del Curso

**Lo que ve el usuario no registrado:**
- Hero con banner del curso
- Descripción completa del curso
- Sección "¿Qué aprenderás?" con bullets
- Lista completa de lecciones (con duración, con lock visual)
- Información del instructor (foto, bio, credenciales)
- Duración total del curso
- Nivel de dificultad
- Fecha de última actualización
- Tags del curso
- Audiencia objetivo
- CTA prominente: "Empezar el aprendizaje" → registro requerido

### 4.2 Registro y Autenticación

- Registro con email y contraseña (simple, sin fricciones)
- Registro con Google OAuth
- Login con "Recordarme"
- Recuperación de contraseña por email
- Sin necesidad de verificar email para acceder (opcional)
- Perfil completable (nombre, foto, descripción)

### 4.3 Player de Video (Pantalla Principal de Lección)

**Elementos del player:**
- Video embebido (YouTube o self-hosted con Cloudflare Stream)
- Progreso guardado automáticamente (timestamp)
- Botón "Lección Completada" (habilitado solo después de ver ≥80% del video)
- Navegación: Lección anterior / Lección siguiente
- Barra de progreso del curso completo (ej: "14 de 28 lecciones completadas")
- Duración de la lección actual
- Título de la lección

**Sidebar / Panel lateral (colapsable):**
- Índice completo del curso
- Secciones acordeón
- Cada lección con: ✅ (completada) / 🔒 (bloqueada) / ▶ (disponible)
- Progreso visual por sección

**Modo Focus:**
- Ocultar header y sidebar
- Solo queda el video y navegación mínima
- Tecla ESC para salir del modo

### 4.4 Progreso del Estudiante

- Barra de progreso circular en dashboard (% completado)
- Historial de lecciones completadas con timestamps
- Última lección vista (reanudar donde dejaste)
- Estimación de tiempo restante
- Streak de días consecutivos estudiando (opcional)

### 4.5 Dashboard del Estudiante

**Vista principal:**
- Tarjeta del curso con progreso visual
- "Continuar donde dejé" → enlace a última lección
- % completado
- Tiempo total invertido
- Fecha de inscripción
- Certificado (disponible al completar 100%)

### 4.6 Certificado de Finalización

- Generado automáticamente al completar todas las lecciones
- PDF descargable
- Diseño branded con logo e identidad de Juan Pablo Loaiza
- Incluye: nombre del estudiante, nombre del curso, fecha de finalización, firma del instructor
- URL única verificable (prueba de autenticidad)
- Shareable en LinkedIn y redes sociales

### 4.7 Sección de Preguntas (Q&A)

- Cada lección tiene sección de preguntas
- El estudiante puede enviar preguntas en texto
- Juan Pablo puede responder desde panel de admin
- Notificación por email cuando hay respuesta
- Preguntas visibles para otros estudiantes (FAQ orgánico)

### 4.8 Notas Personales

- Campo de notas por lección (solo visible para el estudiante)
- Guardado automático
- Vista consolidada de todas las notas del curso

### 4.9 Perfil del Estudiante

- Foto de perfil
- Nombre y email
- Cambio de contraseña
- Historial de cursos
- Certificados obtenidos

### 4.10 Integración con WhatsApp / Contacto

- Botón de WhatsApp directo desde el dashboard
- Email de contacto visible
- Link a formulario de admisión para sesiones terapéuticas
- CTA al completar el curso: "¿Listo para tu primera sesión?"

---

## 5. ARQUITECTURA TÉCNICA

### 5.1 Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────┐
│                   USUARIO FINAL                     │
│              (Browser / Mobile PWA)                 │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────┐
│                    VERCEL CDN                       │
│              (Next.js App Router)                   │
│   - SSR / SSG pages                                 │
│   - API Routes                                      │
│   - Edge Functions                                  │
└───────┬───────────────────────────────┬─────────────┘
        │                               │
┌───────▼───────┐             ┌─────────▼─────────────┐
│   SUPABASE    │             │   CLOUDFLARE / CDN    │
│               │             │                       │
│ - PostgreSQL  │             │ - Videos (Stream)     │
│ - Auth        │             │ - Imágenes            │
│ - Storage     │             │ - Assets estáticos    │
│ - Realtime    │             └───────────────────────┘
│ - Edge Fn     │
└───────────────┘
        │
┌───────▼───────────────────────────────────────────┐
│              SERVICIOS EXTERNOS                    │
│                                                   │
│  - Resend (emails transaccionales)                │
│  - YouTube (videos embebidos)                     │
│  - Google OAuth (login social)                    │
│  - Stripe (si se monetiza en futuro)              │
└───────────────────────────────────────────────────┘
```

### 5.2 Flujo de Autenticación

```
Usuario → Register/Login → Supabase Auth → JWT Token
→ Stored en Cookie HttpOnly → Middleware Next.js verifica token
→ Acceso a rutas protegidas (/dashboard, /lesson/*)
```

### 5.3 Flujo de Progreso de Video

```
Usuario ve video → Evento "timeupdate" en player
→ Cada 5 segundos: guarda timestamp en Supabase
→ Al 80% del video: habilita botón "Marcar como completada"
→ Usuario click → update en tabla lesson_progress
→ UI se actualiza (✅ en sidebar)
→ Si era última lección: trigger generación de certificado
```

### 5.4 Rutas de la Aplicación

```
/ → Landing page del curso (público)
/login → Página de login
/register → Página de registro
/dashboard → Dashboard del estudiante (protegido)
/course/[slug] → Detalle del curso (público)
/course/[slug]/lesson/[lessonSlug] → Player de lección (protegido)
/profile → Perfil del usuario (protegido)
/certificate/[id] → Certificado verificable (público, URL única)
/admin → Panel de administración (solo admin)
/admin/students → Gestión de estudiantes
/admin/analytics → Analytics del curso
```

---

## 6. STACK TECNOLÓGICO RECOMENDADO

### Frontend
| Tecnología | Uso | Justificación |
|-----------|-----|---------------|
| **Next.js 15** | Framework principal | App Router, SSR, SSG, API Routes |
| **TypeScript** | Tipado | Seguridad de tipos, mejor DX |
| **Tailwind CSS** | Estilos | Desarrollo rápido, consistencia |
| **shadcn/ui** | Componentes base | UI profesional sin esfuerzo |
| **Framer Motion** | Animaciones | Transiciones fluidas |
| **Zustand** | Estado global | Simple, sin boilerplate |

### Backend / Base de Datos
| Tecnología | Uso | Justificación |
|-----------|-----|---------------|
| **Supabase** | Backend completo | Auth + DB + Storage + Realtime |
| **PostgreSQL** | Base de datos | Supabase lo provee |
| **Supabase Auth** | Autenticación | OAuth, magic links, JWT |
| **Supabase Storage** | Archivos | Fotos de perfil, PDFs |
| **Supabase Edge Functions** | Serverless | Webhooks, lógica compleja |

### Infraestructura
| Tecnología | Uso | Justificación |
|-----------|-----|---------------|
| **Vercel** | Hosting/Deploy | Next.js nativo, CDN global, CI/CD |
| **Cloudflare** | DNS + CDN | Velocidad, DDoS protection |
| **YouTube / Cloudflare Stream** | Videos | Sin costo de almacenamiento propio |
| **Resend** | Emails transaccionales | API moderna, alta deliverability |

### Herramientas de Desarrollo
| Tecnología | Uso |
|-----------|-----|
| **GitHub** | Control de versiones |
| **Vercel CLI** | Deploy y preview environments |
| **Supabase CLI** | Migraciones y desarrollo local |
| **Prisma** (opcional) | ORM sobre Supabase (si se prefiere) |

---

## 7. ESQUEMA DE BASE DE DATOS

### Tablas Principales

```sql
-- USUARIOS
users (manejado por Supabase Auth)
  id          uuid PRIMARY KEY
  email       text UNIQUE
  created_at  timestamptz

-- PERFILES DE USUARIO
profiles
  id          uuid PRIMARY KEY REFERENCES auth.users
  full_name   text
  avatar_url  text
  bio         text
  updated_at  timestamptz

-- CURSOS
courses
  id          uuid PRIMARY KEY
  slug        text UNIQUE
  title       text
  description text
  thumbnail   text
  level       text  -- 'beginner' | 'intermediate' | 'advanced'
  duration    int   -- en segundos
  is_free     bool DEFAULT true
  is_published bool DEFAULT false
  instructor_id uuid REFERENCES profiles
  created_at  timestamptz
  updated_at  timestamptz

-- SECCIONES DEL CURSO
sections
  id          uuid PRIMARY KEY
  course_id   uuid REFERENCES courses
  title       text
  order_index int
  created_at  timestamptz

-- LECCIONES
lessons
  id          uuid PRIMARY KEY
  section_id  uuid REFERENCES sections
  slug        text
  title       text
  video_url   text    -- YouTube URL o Cloudflare Stream
  duration    int     -- en segundos
  order_index int
  is_preview  bool DEFAULT false  -- visible sin login
  created_at  timestamptz

-- INSCRIPCIONES
enrollments
  id          uuid PRIMARY KEY
  user_id     uuid REFERENCES profiles
  course_id   uuid REFERENCES courses
  enrolled_at timestamptz DEFAULT now()
  completed_at timestamptz
  UNIQUE(user_id, course_id)

-- PROGRESO POR LECCIÓN
lesson_progress
  id             uuid PRIMARY KEY
  user_id        uuid REFERENCES profiles
  lesson_id      uuid REFERENCES lessons
  watched_seconds int DEFAULT 0
  is_completed   bool DEFAULT false
  completed_at   timestamptz
  last_watched_at timestamptz
  UNIQUE(user_id, lesson_id)

-- PREGUNTAS (Q&A)
questions
  id          uuid PRIMARY KEY
  lesson_id   uuid REFERENCES lessons
  user_id     uuid REFERENCES profiles
  body        text
  created_at  timestamptz

-- RESPUESTAS
answers
  id          uuid PRIMARY KEY
  question_id uuid REFERENCES questions
  user_id     uuid REFERENCES profiles
  body        text
  is_instructor_answer bool DEFAULT false
  created_at  timestamptz

-- NOTAS DEL ESTUDIANTE
notes
  id          uuid PRIMARY KEY
  lesson_id   uuid REFERENCES lessons
  user_id     uuid REFERENCES profiles
  content     text
  updated_at  timestamptz
  UNIQUE(user_id, lesson_id)

-- CERTIFICADOS
certificates
  id            uuid PRIMARY KEY
  user_id       uuid REFERENCES profiles
  course_id     uuid REFERENCES courses
  issued_at     timestamptz DEFAULT now()
  verify_token  text UNIQUE  -- para URL pública verificable
```

### Row Level Security (RLS) - Supabase

```sql
-- Usuarios solo ven su propio progreso
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own progress" ON lesson_progress
  FOR ALL USING (auth.uid() = user_id);

-- Inscripciones propias
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own enrollments" ON enrollments
  FOR ALL USING (auth.uid() = user_id);

-- Preguntas: todos pueden leer, solo el autor puede modificar
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read questions" ON questions
  FOR SELECT USING (true);
CREATE POLICY "Users create own questions" ON questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 8. MÓDULOS A DESARROLLAR

### Módulo 1: Autenticación y Perfiles
- [ ] Página de login (email + Google OAuth)
- [ ] Página de registro
- [ ] Recuperación de contraseña
- [ ] Página de perfil editable
- [ ] Upload de foto de perfil (Supabase Storage)
- [ ] Middleware de protección de rutas

### Módulo 2: Landing del Curso (Público)
- [ ] Hero section con banner
- [ ] Descripción del curso
- [ ] Lista de aprendizajes (what you'll learn)
- [ ] Curriculum completo con duraciones
- [ ] Info del instructor
- [ ] CTA de inscripción
- [ ] Lecciones de preview (sin login)

### Módulo 3: Dashboard del Estudiante
- [ ] Card del curso con progreso circular
- [ ] Botón "Continuar donde dejé"
- [ ] Estadísticas: % completado, tiempo total, fecha inscripción
- [ ] Acceso al certificado (al completar)
- [ ] Listado de todos los cursos inscritos (futuro)

### Módulo 4: Player de Lección
- [ ] Embed de YouTube responsive
- [ ] Guardado automático de progreso (timestamp)
- [ ] Botón "Marcar como completada" (habilitado al 80%)
- [ ] Navegación prev/next
- [ ] Sidebar con índice del curso
- [ ] Indicadores visuales (✅/🔒/▶)
- [ ] Focus Mode (toggle)
- [ ] Barra de progreso global

### Módulo 5: Q&A por Lección
- [ ] Formulario para enviar pregunta
- [ ] Listado de preguntas con respuestas
- [ ] Notificación por email al responder
- [ ] Panel de admin para responder

### Módulo 6: Notas Personales
- [ ] Editor de notas por lección (textarea con autosave)
- [ ] Vista de todas las notas del curso

### Módulo 7: Certificados
- [ ] Generación automática al completar 100%
- [ ] PDF descargable (react-pdf o puppeteer)
- [ ] Diseño branded con logo JPL
- [ ] URL pública verificable
- [ ] Botón de compartir en LinkedIn

### Módulo 8: Panel de Administración
- [ ] Dashboard con métricas:
  - Total de estudiantes inscritos
  - % de completación promedio
  - Lecciones más vistas / abandonadas
  - Nuevas inscripciones por día/semana
- [ ] Listado de estudiantes con progreso
- [ ] Gestor de preguntas (responder Q&A)
- [ ] Gestión de contenido del curso (CRUD lecciones)

### Módulo 9: Emails Transaccionales (Resend)
- [ ] Bienvenida al inscribirse
- [ ] Notificación de nueva respuesta a pregunta
- [ ] Certificado de finalización (email con PDF adjunto)
- [ ] Recordatorio de progreso (si no ha accedido en X días)

### Módulo 10: PWA (Progressive Web App)
- [ ] Manifest.json configurado
- [ ] Service Worker (offline básico)
- [ ] Icono de app (JPL branding)
- [ ] Prompt de "Agregar a pantalla de inicio"
- [ ] Push notifications (opcional, fase 2)

---

## 9. ROADMAP DE DESARROLLO

### FASE 1: MVP (3-4 semanas)
**Objetivo:** Replicar funcionalidad actual + mejoras core

```
Semana 1:
  ✓ Setup proyecto Next.js 15 + TypeScript
  ✓ Integración Supabase (Auth + DB)
  ✓ Diseño del esquema de base de datos
  ✓ Landing page del curso (público)
  ✓ Sistema de autenticación completo

Semana 2:
  ✓ Módulo de inscripción al curso
  ✓ Dashboard del estudiante
  ✓ Player de lección básico (YouTube embed)
  ✓ Sidebar con índice del curso

Semana 3:
  ✓ Sistema de progreso (marcar lecciones)
  ✓ Guardado de timestamp de video
  ✓ Navegación prev/next entre lecciones
  ✓ Focus Mode

Semana 4:
  ✓ Certificados (generación + PDF)
  ✓ Emails transaccionales básicos
  ✓ Panel de admin básico
  ✓ Deploy en Vercel + dominio academy.juanpabloloaiza.com
```

### FASE 2: Enhancement (2-3 semanas)
**Objetivo:** Superar a TutorLMS en UX

```
  ✓ Q&A por lección
  ✓ Notas personales
  ✓ Analytics avanzado (admin)
  ✓ PWA (manifest + service worker)
  ✓ Optimización mobile
  ✓ SEO (meta tags, Open Graph)
  ✓ Integración con WhatsApp y agenda
```

### FASE 3: Scale (futuro)
**Objetivo:** Preparar para más cursos (pagos)

```
  ✓ Sistema de pagos (Stripe)
  ✓ Cursos de pago + acceso protegido
  ✓ Múltiples instructores (si aplica)
  ✓ App móvil nativa (React Native / Expo)
  ✓ Notificaciones push
  ✓ Gamificación (puntos, badges)
```

---

## 10. VENTAJAS SOBRE LA COMPETENCIA

### vs. WordPress + TutorLMS

| Aspecto | TutorLMS (WP) | Plataforma Custom |
|---------|--------------|-------------------|
| Velocidad | ~3-5s load | <1s load (SSG/CDN) |
| Performance Score | 50-70 | 95+ |
| Costo anual | $150-300/año (plugins) | ~$20/año (Vercel + Supabase) |
| Seguridad | Múltiples vulnerabilidades WP | Superficie mínima de ataque |
| Personalización UI | Limitada por tema | 100% control |
| Updates de riesgo | Sí (WP core + plugins) | CI/CD controlado |
| Control de datos | En hosting DreamHost | Supabase propio |
| Mobile experience | Responsive básico | PWA nativa |
| Identidad visual | Genérica | 100% branded JPL |
| Analytics | Básico | Personalizado |

### vs. LearnDash

| Aspecto | LearnDash | Plataforma Custom |
|---------|-----------|-------------------|
| Precio | $199-799/año | ~$20/año |
| UI/UX | Anticuada | Moderna y branded |
| Curva de aprendizaje admin | Alta | Diseñada a medida |
| Velocidad | Lenta (WP) | Muy rápida |
| Escalabilidad | Limitada por WP/hosting | Cloud-native |
| Integración Booknetic/Agenda | Compleja | Nativa (mismo ecosistema) |
| Certificados | Templates genéricos | Diseño JPL custom |
| Soporte | Ticket externo | Control total del código |

### Ventajas Únicas de tu Plataforma

1. **Integración Total con tu Ecosistema**: El LMS puede leer si el estudiante ya tiene sesión agendada en Booknetic y mostrar CTAs personalizados ("Ya tienes sesión agendada para el 15 de abril")

2. **Identidad Visual JPL**: Todo se ve exactamente como quieres, sin compromisos de diseño genérico

3. **Costo ~$0**: Vercel Free tier + Supabase Free tier cubre perfectamente un curso gratuito con cientos de estudiantes

4. **Velocidad Real**: Sin el overhead de WordPress, Lighthouse score 95+, LCP < 1s

5. **Analytics Propios**: Puedes ver exactamente qué lecciones tienen más drop-off, qué preguntas se hacen más, etc.

6. **Escalabilidad**: Cuando quieras agregar un segundo curso de pago, ya tienes la infraestructura lista

7. **Sin Vendor Lock-in**: Tus datos en Supabase, tu código en GitHub, deploy en Vercel. Puedes cambiar cualquier pieza sin perder nada.

---

## 📊 RESUMEN EJECUTIVO

**Estado actual:** WordPress + TutorLMS = solución correcta pero limitada
**Objetivo:** Plataforma custom Next.js + Supabase + Vercel
**Tiempo estimado de desarrollo:** 4-6 semanas (Fase 1 + 2)
**Costo de infraestructura:** ~$0-20/mes (tiers gratuitos de Vercel + Supabase)
**ROI:** Inmediato - mejor UX + 0 costo de plugins + control total

**El sistema resultante superará a TutorLMS y LearnDash en:**
- Velocidad de carga
- Experiencia del estudiante
- Identidad visual
- Costo operacional
- Integración con tu ecosistema de servicios

---

**Documento generado:** 2026-04-06
**Versión:** 1.0
**Próximo paso:** Prompt para Claude Code → inicializar proyecto
