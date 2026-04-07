# 📋 PLAN DE ACCIÓN DETALLADO - 30 DÍAS

**www.juanpabloloaiza.com**  
**Inicio:** 2026-04-05  
**Finalización:** 2026-05-05  
**Actualizado:** 2026-04-04

---

## 🗂️ ESTRUCTURA DEL PLAN

```
SEMANA 1: Fundamentos (Proteger & Limpiar)
├─ Seguridad inmediata
├─ Limpieza de contenido
└─ Baseline de métricas

SEMANA 2: SEO Técnico
├─ Schema markup
├─ Sitemap y indexación
├─ URLs y slugs
└─ Taxonomía

SEMANA 3: Contenido y Multimedia
├─ Optimización de contenido
├─ Imágenes (JPG → WebP)
├─ Videos (migración a YouTube)
└─ Internal linking

SEMANA 4: Performance y Monitoreo
├─ Lazy loading
├─ CDN
├─ Plugins optimization
└─ Setup de monitoreo
```

---

## 📅 SEMANA 1: FUNDAMENTOS (5-10 HORAS)

### LUNES: Seguridad (3 horas)

#### Tarea 1.1: Instalar Wordfence Security ⭐ CRÍTICO
```
Tiempo: 45 minutos
Pasos:
[ ] Ir a Plugins > Añadir Nuevo
[ ] Buscar "Wordfence Security"
[ ] Instalar y activar
[ ] Ir a Wordfence > Configuración
[ ] Habilitar:
    [ ] Web Application Firewall (WAF)
    [ ] IP reputation
    [ ] Real-time threat intelligence
[ ] Configurar tabla de diagnóstico
[ ] Guardando cambios

Verificación:
✓ Plugin activo en panel
✓ Pequeño icono Wordfence en admin bar
✓ Dashboard de Wordfence accesible
```

#### Tarea 1.2: Configurar 2FA en Admin
```
Tiempo: 45 minutos
Herramienta: Wordfence + Google Authenticator

Pasos:
[ ] En Wordfence > Two-Factor Authentication
[ ] Generar código de activación
[ ] Scannear con Google Authenticator (descarga: https://authenticator.google.com/)
[ ] Guardar backup codes
[ ] Aplicar a todos los administradores:
    [ ] adminbo
    [ ] juanpabloloaiza_v2llh2
[ ] Guardar y verificar logout/login con 2FA

Verificación:
✓ Login ahora requiere código 2FA
✓ Backup codes guardados en lugar seguro
```

#### Tarea 1.3: Revisar Permisos de Usuarios
```
Tiempo: 30 minutos

Tareas:
[ ] Ir a Usuarios > Todos los usuarios
[ ] Revisar rol de cada usuario:
    ✓ adminbo (2) → Mantener Administrator
    ✓ juanpabloloaiza_v2llh2 (1) → Mantener Administrator
    ⚠️ booknetic (4) → Cambiar a rol custom "Editor" o "Contributor"
    ✓ tapia.ptp@gmail.com (5) → Mantener booknetic_customer

[ ] Cambiar permisos booknetic:
    [ ] Hacer click en usuario booknetic
    [ ] Cambiar "Role" de Administrator a "Editor"
    [ ] Guardar cambios
    
[ ] Considerar eliminar usuario de DreamHost si no se usa

Verificación:
✓ Solo 2 administradores
✓ booknetic con permisos limitados
```

---

### MARTES: Backups y Auditoría (2.5 horas)

#### Tarea 1.4: Implementar Backups Automáticos
```
Tiempo: 1 hora
Plugin: UpdraftPlus (versión gratis)

Pasos:
[ ] Plugins > Añadir Nuevo
[ ] Buscar "UpdraftPlus Backup"
[ ] Instalar y activar
[ ] Ir a UpdraftPlus > Configuración
[ ] Configurar:
    [ ] Frecuencia: Diaria (o cada 3 días)
    [ ] Almacenamiento: Dropbox o Google Drive (gratis)
    [ ] Crear cuenta/conectar cloud storage
    [ ] Seleccionar qué incluir:
        [✓] Database
        [✓] All WordPress files
        [✓] Plugins
        [✓] Themes
        [✓] Uploads folder
[ ] Guardar y hacer backup manual inicial
[ ] Verificar backup se creó correctamente

Verificación:
✓ Backup se ejecuta automáticamente
✓ Archivos en cloud storage
✓ Puedes restaurar desde panel UpdraftPlus
```

#### Tarea 1.5: Auditar Logs de Acceso (1.5 horas)
```
Tiempo: 1.5 horas
Herramienta: Wordfence > Activity Log

Pasos:
[ ] Ir a Wordfence > Activity Log
[ ] Revisar últimos 30 días:
    [ ] Logins exitosos/fallidos
    [ ] Cambios en plugins/temas
    [ ] Cambios en usuarios
    [ ] Cambios en posts
    
[ ] Crear documento con hallazgos:
    - Logins anormales: ___
    - Cambios sospechosos: ___
    - Anomalías detectadas: ___
    
[ ] Si encuentra actividad sospechosa:
    [ ] Cambiar todas las contraseñas
    [ ] Habilitar Wordfence 2FA
    [ ] Scan completo de malware

Documentar en: /docs/SEGURIDAD_AUDITORIA_2026.md
```

---

### MIÉRCOLES: Limpieza de Contenido (2 horas)

#### Tarea 1.6: Eliminar/Reparar Página 638 Vacía ⭐ CRÍTICO
```
Tiempo: 30 minutos

Pasos:
[ ] Ir a Páginas > Todas las páginas
[ ] Buscar página ID 638 (slug: /638-2/)
[ ] Abrir página
[ ] Revisar contenido actual:
    Contenido: [booknetic-cp] [booknetic-change-status]
    Opción A: Si no se usa → ELIMINAR
    Opción B: Si se usa → Agregar título y descripción
    
[ ] SI ELIMINAR:
    [ ] Click "Mover a basura"
    [ ] Vaciar papelera
    [ ] Crear redirect 301 en Yoast si cambió URL
    
[ ] SI REPARAR:
    [ ] Agregar título: "Panel de Control del Cliente"
    [ ] Agregar meta descripción
    [ ] Publicar

Verificación:
✓ Página eliminada O completada
✓ No hay página vacía en índice
```

#### Tarea 1.7: Auditar Todas las Páginas Funcionales
```
Tiempo: 1.5 horas

Páginas a revisar:
1. Panel de Cliente (/panelcliente/)
2. Agenda (/agenda/)
3. Artículo (/articulo/)
4. Formulario de Admisión (/formulario-de-admision/)
5. Admisión (/admision/)
6. Políticas de Servicio (/politicas-de-servicio/)
7. Blog (/blog/)

Para cada página:
[ ] ¿Tiene título descriptivo?
[ ] ¿Tiene meta descripción (SEO)?
[ ] ¿Tiene contenido visible o solo shortcodes?
[ ] ¿Está optimizada para mobile?
[ ] ¿Hay CTAs claros?
[ ] ¿Funciona correctamente?

Documento: /docs/AUDITORIA_PAGINAS_2026.md
```

---

### JUEVES-VIERNES: Baseline de Métricas (2.5 horas)

#### Tarea 1.8: Google PageSpeed Insights Audit
```
Tiempo: 1 hora

Pasos:
[ ] Ir a https://pagespeed.web.dev/
[ ] Ingresar URL: https://www.juanpabloloaiza.com
[ ] Esperar análisis (2-3 minutos)
[ ] Captura de pantalla de:
    [ ] Performance Score (Desktop)
    [ ] Performance Score (Mobile)
    [ ] Metrics:
        - LCP (Largest Contentful Paint)
        - FID (First Input Delay)
        - CLS (Cumulative Layout Shift)
    [ ] Oportunidades principales
    [ ] Diagnósticos

[ ] También hacer audit de:
    [ ] Homepage: /
    [ ] Post popular: /2024/10/12/sanacion-karmica...
    [ ] Página de servicios

Guardar en: /docs/BASELINE_PAGESPEED_2026.md

Documentar:
📌 Desktop LCP: ___ s
📌 Mobile LCP: ___ s
📌 Desktop Score: ___ /100
📌 Mobile Score: ___ /100
```

#### Tarea 1.9: Google Search Console Review
```
Tiempo: 1 hora

Pasos:
[ ] Ir a https://search.google.com/search-console
[ ] Seleccionar property: www.juanpabloloaiza.com
[ ] Revisar secciones:

Perf​ormance:
[ ] Impresiones totales (últimos 28 días)
[ ] CTR promedio
[ ] Posición promedio
[ ] Dispositivos principales (mobile/desktop)

Coverage:
[ ] Páginas indexadas
[ ] Errores detectados
[ ] Exclusiones

Core Web Vitals:
[ ] Estado de LCP
[ ] Estado de FID
[ ] Estado de CLS

Enhanced Results:
[ ] Rich results detectados
[ ] Errores en schema

Documentar en: /docs/GSC_BASELINE_2026.md
```

#### Tarea 1.10: Crear Documento de Baseline Completo
```
Archivo: /docs/BASELINE_METRICAS_2026.md

Contenido:
# BASELINE ACTUAL (Antes de Optimizaciones)

## PageSpeed Scores
- Desktop: ___ /100
- Mobile: ___ /100

## Core Web Vitals
- LCP: ___ s (Baseline)
- FID: ___ ms (Baseline)
- CLS: ___ (Baseline)

## Google Search Console
- Indexadas: ___ páginas
- Impresiones/mes: ___
- CTR promedio: ___ %
- Posición promedio: ___ 

## Tráfico Actual
- Sessions/mes: ___
- Bounce rate: ___ %
- Avg session duration: ___ s

Fecha: 2026-04-07
```

---

## 📅 SEMANA 2: SEO TÉCNICO (8-10 HORAS)

### LUNES-MARTES: Schema Markup (2.5 horas)

#### Tarea 2.1: Completar Schema de Persona en AIOSEO
```
Tiempo: 1 hora

Pasos:
[ ] Ir a All in One SEO > Search Appearance > Global
[ ] Ir a sección "Global"
[ ] Expandir "Schema Markup" > "Person"
    
[ ] Completar campos faltantes:
    [ ] Person Name: "Juan Pablo Loaiza"
    [ ] Email: "contacto@juanpabloloaiza.com" ⭐ AGREGAR
    [ ] Phone: "+34 XXX XXX XXX" ⭐ AGREGAR (si disponible)
    [ ] Logo de persona: Subir foto profesional
    [ ] Social profiles:
        [ ] Facebook: facebook.com/jploaiza...
        [ ] Twitter: twitter.com/...
        [ ] Instagram: instagram.com/jploaizao
        [ ] LinkedIn: linkedin.com/in/...
        [ ] YouTube: youtube.com/...
        
[ ] Guardar cambios

Verificación:
[ ] Ir a Google Rich Results Test
[ ] URL: https://www.juanpabloloaiza.com/
[ ] Validar: Debe mostrar schema de Person con datos completos
[ ] No debe haber errores
```

#### Tarea 2.2: Crear Article Schema para Posts
```
Tiempo: 1.5 horas

Pasos:
[ ] AIOSEO > Search Appearance > Post
[ ] Ir a sección "Post Type" 
[ ] Verificar Article Schema:
    [ ] Enabled: ✓ SÍ
    [ ] Include author information: ✓ SÍ
    [ ] Include date published: ✓ SÍ
    [ ] Include date modified: ✓ SÍ
    [ ] Include featured image: ✓ SÍ
    [ ] Include description: ✓ SÍ
    
[ ] Guardar cambios

[ ] Verificar en posts individuales:
    [ ] Abrir post en editor
    [ ] AIOSEO metabox
    ] Verificar "Schema"
    [ ] Debe mostrar Article schema configurado

Verificación:
[ ] Rich Results Test post: /2024/10/12/sanacion-karmica...
[ ] Debe mostrar Article schema con:
    - Title ✓
    - Image ✓
    - Author ✓
    - Date Published ✓
    - Date Modified ✓
    - Description ✓
```

---

### MIÉRCOLES: Sitemap y Indexación (2 horas)

#### Tarea 2.3: Configurar Sitemap con Imágenes ⭐ CRÍTICO
```
Tiempo: 1 hora

Pasos:
[ ] AIOSEO > Sitemaps > General
[ ] Verificar configuración:
    [ ] Enable sitemap: ✓ SÍ
    [ ] Sitemap filename: "sitemap" (default)
    [ ] Include images: ✓ SÍ ⭐ IMPORTANTE
    [ ] Images per index: 500 (default)
    
[ ] Guardar cambios

[ ] Crear Video Sitemap:
    [ ] AIOSEO > Sitemaps
    [ ] Si hay opción de "Video Sitemap": Activar
    [ ] Si no hay opción:
        └─ Usar plugin "XML Video Sitemap"
        
[ ] Verificar sitemaps generados:
    [ ] https://www.juanpabloloaiza.com/sitemap.xml
    [ ] https://www.juanpabloloaiza.com/sitemap-posts.xml
    [ ] https://www.juanpabloloaiza.com/sitemap-images.xml
    [ ] Deben cargar sin errores

Validación:
[ ] Google Search Console > Sitemaps
[ ] Enviar:
    [ ] /sitemap.xml
    [ ] /sitemap-posts.xml (si existe)
    [ ] /sitemap-images.xml
```

#### Tarea 2.4: Auditar Google Index Status
```
Tiempo: 1 hora

Pasos:
[ ] Google Search Console > Coverage
[ ] Revisar estado de indexación:

Total Indexed: ___ páginas
Excluded: ___ páginas
Errors: ___ páginas
Valid with warnings: ___ páginas

[ ] Documentar cualquier problema:
    [ ] Páginas excluidas: ¿Por qué?
    [ ] Errores detectados: ¿Cuáles?
    [ ] Warnings: ¿Quéimportancia tienen?

[ ] Acción por tipo:
    
Excluded:
    [ ] Si es página huérfana: Eliminar
    [ ] Si no debe indexarse: Verificar robots.txt
    
Errors:
    [ ] Click en cada error
    [ ] Entender causa
    [ ] Crear plan de fix

Warnings:
    [ ] Review de baja prioridad
    [ ] Considerar fix después

Documentar: /docs/GSC_COVERAGE_2026.md
```

---

### JUEVES-VIERNES: URLs y Taxonomía (4-5 horas)

#### Tarea 2.5: Auditar y Acortar Slugs de Posts ⭐ IMPORTANTE
```
Tiempo: 2 horas

Problema: URLs largas hasta 127 caracteres
Objetivo: Reducir a 50-60 caracteres

Posts a revisar:
1. /2024/10/12/sanacion-karmica-liberandote-de-contratos-antiguos-para-vivir-en-plenitud/
   → Propuesta: /sanacion-karmica-contratos-antiguos/
   
2. /2024/10/12/como-la-regresion-a-vidas-pasadas-puede-transformar-tus-relaciones-actuales/
   → Propuesta: /regresion-relaciones-actuales/
   
3. /2024/10/12/descubriendo-tu-proposito-de-vida-a-traves-de-la-regresion-a-vidas-pasadas/
   → Propuesta: /proposito-vida-regresion-vidas-pasadas/

Para cada post:
[ ] Abrir editor de posts
[ ] Ir a "Permalink" (AIOSEO)
[ ] Editar slug a versión más corta
[ ] ANTES de guardar:
    [ ] Ir a AIOSEO > Redirects
    [ ] Crear redirect 301:
        FROM: URL antigua
        TO: URL nueva
    [ ] Guardar redirect
[ ] Ahora sí guardar el post

Verificación:
[ ] Acceder a URL antigua: debe redirigir a nueva
[ ] URL nueva funciona correctamente
[ ] Google Search Console: Sin errores 404

Documento: /docs/REDIRECCIONES_301_2026.md
```

#### Tarea 2.6: Consolidar Taxonomía (2-3 horas) ⭐ CRÍTICO
```
Tiempo: 2.5 horas

Problema: 54 etiquetas, muchas duplicadas

PASO 1: Identificar Duplicados
[ ] Ir a Posts > Etiquetas
[ ] Revisar lista completa
[ ] Identificar duplicados o muy similares:
    
Ejemplos encontrados:
- Terapia de Regresión (20) vs Hipnosis y Regresión (14)
  → Consolidar en "Terapia de Regresión"
  
- Desarrollo Personal (7) vs Desarrollo espiritual (1)
  → Consolidar en "Desarrollo Personal"
  
- Sanación Espiritual (41) vs Sanación Holística (18)
  → Consolidar en "Sanación Espiritual"
  
- Brian Weiss (56) vs Dr. Brian Weiss (9)
  → Consolidar en "Brian Weiss"
  
- Dolores Cannon (8) vs Dolores Cannon (5)
  → Ya consolidada

PASO 2: Fusionar Etiquetas
[ ] Instalar plugin "Merge Tags" (gratis)
[ ] Para cada par de etiquetas duplicadas:
    [ ] Merge Tags > Seleccionar 2 etiquetas
    [ ] Click "Merge"
    [ ] Seleccionar etiqueta principal
    [ ] Confirmar
    
PASO 3: Eliminar Etiquetas Huérfanas (0 posts)
[ ] Para cada etiqueta con count = 0:
    [ ] Eliminar etiqueta
    
Ejemplo de etiquetas a eliminar:
- Posesiones Espirituales
- William J. Baldwin
- Etc.

PASO 4: Reorganizar Categorías
[ ] Ir a Posts > Categorías
[ ] Hacer lo mismo: consolidar duplicados
[ ] Resultado esperado: 20-25 categorías (vs 25 actuales)

Resultado esperado:
54 etiquetas → 30-35 etiquetas consolidadas

Documentar: /docs/CONSOLIDACION_TAXONOMIA_2026.md
```

---

## 📅 SEMANA 3: CONTENIDO Y MULTIMEDIA (12-15 HORAS)

### LUNES: Optimización de Imágenes (3-4 horas)

#### Tarea 3.1: Convertir JPGs a WebP
```
Tiempo: 1.5 horas

Imágenes JPG a convertir:
1. IMG-1-landscape.jpg → IMG-1-landscape.webp
2. IMG-1-square.jpg → IMG-1-square.webp
3. IMG-2-landscape.jpg → IMG-2-landscape.webp
4. IMG-2-square.jpg → IMG-2-square.webp
5. logomaill.jpg → logomaill.webp
6. jpl-newwsp.jpeg → jpl-newwsp.webp (JPEG)

OPCIÓN A: Automático (Recomendado)
[ ] Plugins > EWWW Image Optimizer
[ ] Ir a configuración
[ ] Convertir a WebP: ✓ HABILITAR
[ ] Click en "Bulk Optimize"
[ ] Seleccionar todas las imágenes JPG
[ ] Click "Start Optimization"
[ ] Esperar (5-10 minutos)

OPCIÓN B: Manual
[ ] Descargar imágenes JPG
[ ] Usar convertidor online:
    └─ CloudConvert.com
    └─ OnlineConvertFree.com
[ ] Convertir JPG → WebP
[ ] Calidad: 85% (balance entre calidad y tamaño)
[ ] Descargar archivos .webp
[ ] Subir a WordPress reemplazando originales

Verificación:
[ ] En librería multimedia
[ ] Verificar todas ahora tienen .webp
[ ] Comparar tamaño:
    - JPG: ~200KB → WebP: ~80KB (60% reducción)
```

#### Tarea 3.2: Auditar y Completar Alt Text
```
Tiempo: 2-3 horas

Pasos:
[ ] Ir a Medios > Librería
[ ] Seleccionar cada imagen
[ ] Revisar campo "Alt Text"
[ ] Si está vacío o genérico:
    [ ] Editar
    [ ] Escribir alt text descriptivo
    
Guía de Alt Text SEO-Friendly:
- NO: "imagen1" "photo" "pic"
- SÍ: "Persona liberándose de cadenas, representando sanación kármica"
- Máx 125 caracteres
- Incluir palabra clave si es relevante
- Describa la imagen, no sea spam

Ejemplos para cada imagen:

Logos:
- "Logo de Juan Pablo Loaiza - Terapeuta de Regresión a Vidas Pasadas"

Imágenes de Posts:
- Post 409: "Figura humana liberándose de cadenas que se disuelven en luz, simbolizando la liberación de contratos kármicos"
- Post 405: "Dos personas en interacción, con siluetas transparentes mostrando escenas de vidas pasadas"
- Post 401: "Persona contemplando un camino hacia el horizonte, representando el viaje de autodescubrimiento"

Fondos:
- "Fondo degradado en tonos azules y violetas para sección de contacto"

Videos:
- "Portada de video: Introducción a la Terapia de Regresión a Vidas Pasadas"

Documentar en: /docs/AUDITORIA_ALT_TEXT_2026.md
```

---

### MARTES-MIÉRCOLES: Migración de Videos a YouTube (3-4 horas)

#### Tarea 3.3: Crear Playlist en YouTube
```
Tiempo: 30 minutos

Pasos:
[ ] Ir a https://youtube.com (conectado con cuenta)
[ ] Click en perfil > Create a channel (si no existe)
[ ] Nombre: "Juan Pablo Loaiza - Regresión a Vidas Pasadas"
[ ] Descripción: "Terapia profesional de regresión a vidas pasadas con enfoque holístico"
[ ] Banner: Usar logo/imagen principal del sitio
[ ] Crear playlists:
    [ ] Playlist 1: "Introducción a la Terapia" (2 videos)
    [ ] Playlist 2: "Preguntas Frecuentes (Q&A)" (11 videos)
    [ ] Playlist 3: "Temas Avanzados" (1 video)

[ ] En cada playlist:
    [ ] Descripción clara
    [ ] Orden lógico de videos
    [ ] Thumbnail personalizado

Canal de YouTube creado: https://youtube.com/c/JuanPabloLoaiza
```

#### Tarea 3.4: Subir Videos a YouTube
```
Tiempo: 2-3 horas (según conexión)

Videos a subir (14 total):
1. Qué es la Terapia de Regresión (ID 85)
2. Cómo Funciona la Regresión (ID 86)
3-13. 11 videos de Preguntas Frecuentes (IDs 87-108, 111)
14. Liberación de Entidades Espirituales (ID 124)

Pasos para cada video:
[ ] Ir a https://youtube.com > Tu contenido > Subir
[ ] Seleccionar archivo MP4 del servidor
[ ] Esperar a que termine la carga
[ ] Rellenar:
    [ ] Título: (igual al del sitio)
    [ ] Descripción:
        Párrafo 1: Resumen del contenido
        Párrafo 2: Link al blog post relacionado
        Párrafo 3: CTA "Descubre más en www.juanpabloloaiza.com"
    [ ] Miniatura: Subir thumbnail optimizada
    [ ] Visibilidad: Public (o Unlisted si es prueba)
    [ ] Etiquetas: #regresion #vidas_pasadas #hipnosis
    [ ] Playlist: Asignar a playlist correspondiente
[ ] Publicar

Cronograma:
- Día 1: Videos 1-3 (3 videos, ~30 min carga)
- Día 2: Videos 4-8 (5 videos, ~50 min carga)
- Día 3: Videos 9-14 (6 videos, ~60 min carga)

Total YouTube carga: ~2 horas
Total trabajo: 2-3 horas (incluye descripciones)

Verificación:
✓ 14 videos en YouTube
✓ Cada uno con descripción y CTA
✓ Todos en playlists
✓ URLs anotadas para próximo paso
```

#### Tarea 3.5: Actualizar Embeds en WordPress
```
Tiempo: 1-2 horas

Pasos:
[ ] Ir a Páginas/Posts donde están los videos MP4
[ ] Ubicación de videos en el sitio:
    - Página principal o landing (si está)
    - Página de "Preguntas Frecuentes"
    - Página de "Cómo funciona la terapia"

[ ] Para cada video:
    [ ] Borrar embed MP4 anterior
    [ ] Insertar embed YouTube:
        Opción A: Block de WordPress
        - Crear nuevo bloque "Embed"
        - Paste URL de YouTube
        - Auto-genera embed responsivo
        
        Opción B: Shortcode manual
        [youtube id="VIDEO_ID" width="100%"]
        
    [ ] Verificar se vea correctamente
    [ ] Verificar sea responsive (mobile)
    [ ] Guardar

[ ] Crear página "Videos" unificada si no existe:
    [ ] Título: "Videos Educativos"
    [ ] Descripción: Introducción
    [ ] Embeds de todos los 14 videos
    [ ] Organizados por categoria
    [ ] Guardar y publicar

Verificación:
✓ Todos los embeds funcionan
✓ Responsive en mobile
✓ Carga rápida (YouTube CDN)
```

---

### JUEVES-VIERNES: Internal Linking (2-3 horas)

#### Tarea 3.6: Crear Internal Linking Strategy
```
Tiempo: 1.5 horas

Objetivo: Conectar posts temáticamente relacionados

Pasos:
[ ] Identificar clusters temáticos:
    
    Cluster 1: Fundamentos
    - Qué es la Regresión (blog post o landing)
    - Cómo Funciona
    - Preguntas Frecuentes
    
    Cluster 2: Problemas & Soluciones
    - Miedos y Vidas Pasadas
    - Depresión
    - Adicciones
    - Posesiones Espirituales
    
    Cluster 3: Relaciones
    - Regresión y Relaciones Actuales
    - Karmaen Relaciones
    - Vínculos Emocionales
    
    Cluster 4: Transformación
    - Sanación Kármica
    - Propósito de Vida
    - Transformación Personal
    
[ ] Para cada post:
    [ ] Identificar 2-3 posts relacionados en mismo cluster
    [ ] Agregar links internos naturales
    [ ] Usar AOISEO > Link Assistant
    [ ] O hacerlo manualmente en editor

[ ] Crear "Related Posts" widget:
    [ ] Plugin: Yet Another Related Posts Plugin
    [ ] O: Mostrar categoría relacionada
    [ ] Mostrar al final de cada post

Documentar: /docs/INTERNAL_LINKING_MAP_2026.md
```

---

## 📅 SEMANA 4: PERFORMANCE Y MONITOREO (8-10 HORAS)

### LUNES-MARTES: Optimización de Velocidad (4-5 horas)

#### Tarea 4.1: Implementar Lazy Loading de Imágenes
```
Tiempo: 1.5 horas

Opción A: Automático con Plugin (Recomendado)
[ ] Plugins > Añadir Nuevo
[ ] Buscar "Lazy Load by WP Rocket"
[ ] Instalar y activar
[ ] Ir a Configuración:
    [ ] Lazy Load Images: ✓ SÍ
    [ ] Lazy Load Iframes: ✓ SÍ
    [ ] Placeholder color: Seleccionar
    [ ] Threshold: 300px (default)
[ ] Guardar cambios

Opción B: Con AIOSEO (si tiene la función)
[ ] AIOSEO > Performance
[ ] Lazy Loading: ✓ Habilitar
[ ] Guardar

Verificación:
[ ] Google PageSpeed > Ir a post
[ ] Check oportunidad "Defer offscreen images"
[ ] Debe mejorar después de lazy loading
```

#### Tarea 4.2: Minificar CSS/JS
```
Tiempo: 1.5 horas

Opción A: Con AIOSEO
[ ] AIOSEO > General Settings > Advanced
[ ] Minify CSS: ✓ Activar
[ ] Minify JavaScript: ✓ Activar
[ ] Guardar cambios

Opción B: Plugin WP Super Cache
[ ] Configuración > WP Super Cache
[ ] Compression:
    [ ] Gzip compression: ✓ SÍ
    [ ] Minify: ✓ SÍ
[ ] Guardar

Verificación:
[ ] Google PageSpeed: Check "Minify CSS"
[ ] Google PageSpeed: Check "Minify JavaScript"
[ ] Debe haber mejora en métricas
```

#### Tarea 4.3: Configurar CDN (Cloudflare Free)
```
Tiempo: 1.5 horas

Pasos:
[ ] Ir a https://cloudflare.com
[ ] Sign Up gratis
[ ] Add Site: juanpabloloaiza.com
[ ] Seleccionar plan: FREE
[ ] Cambiar nameservers:
    [ ] Copia los nameservers de Cloudflare
    [ ] Ir a hosting (DreamHost)
    [ ] Cambiar DNS a nameservers de Cloudflare
    [ ] Esperar propagación (24-48 horas)
    
[ ] En Cloudflare dashboard:
    [ ] Speed > Optimization:
        [ ] Auto Minify CSS: ✓ SÍ
        [ ] Auto Minify JS: ✓ SÍ
        [ ] Auto Minify HTML: ✓ SÍ
        [ ] Browser Cache TTL: Aggressive
    
    [ ] Caching:
        [ ] Cache Level: Cache Everything
        [ ] Browser Cache TTL: 1 month
    
    [ ] Performance:
        [ ] Rocket Loader: ✓ ON
        [ ] Mirage: ✓ ON (optimize images)

Verificación:
[ ] Status en Cloudflare: "Active"
[ ] Test: https://www.juanpabloloaiza.com carga más rápido
[ ] Fondo naranja de Cloudflare en browser
```

---

### MIÉRCOLES: Auditoría de Plugins (2 horas)

#### Tarea 4.4: Revisar Necesidad de Cada Plugin
```
Tiempo: 2 horas

Lista de 20 plugins activos - Auditoría:

SEO Plugins:
[ ] All in One SEO (4.9.5.1) - CRÍTICO, mantener
[ ] Site Kit by Google (1.175.0) - ÚTIL, mantener
[ ] AI Engine (3.4.5) - ¿Se usa? Revisar

Performance:
[ ] WP Super Cache (3.0.3) - CRÍTICO, mantener
[ ] EWWW Image Optimizer (8.5.0) - CRÍTICO, mantener

Booking (Eco-sistema Booknetic):
[ ] Booknetic (5.0.8) - CORE
[ ] Customer Panel (1.9.3) - ¿Usada?
[ ] Custom Forms (2.9.1) - ¿Usada?
[ ] Email Action (1.5.2) - ¿Usada?
[ ] Google Calendar (2.0.0) - ¿Usada?
[ ] Invoices (1.4.0) - ¿Usada?
[ ] Reports (1.5.1) - ¿Usada?
[ ] Zoom Integration (1.5.0) - ¿Usada?
[ ] Twilio SMS (1.5.0) - ¿Usada?
[ ] Twilio WhatsApp (1.5.0) - ¿Usada?
⚠️ RECOMENDACIÓN: Revisar Booknetic, desactivar si no se usa

Comunicación:
[ ] Joinchat (6.1.1) - ¿Se usa el chat?
[ ] Jotform (1.3.9) - ¿Formularios activos?

Compliance:
[ ] WP Consent API (2.0.1) - GDPR, mantener

Otros:
[ ] D.Calendar (1.0.0) - ¿Qué hace?
[ ] DreamHost Panel (1.0.0) - Innecesario probablemente

Acción recomendada:
- Desactivar plugins innecesarios
- Documentar en: /docs/PLUGIN_AUDIT_2026.md
- Medir impacto en velocidad antes/después
```

---

### JUEVES-VIERNES: Setup de Monitoreo (2-3 horas)

#### Tarea 4.5: Configurar Google Analytics 4
```
Tiempo: 1 hora

Pasos:
[ ] Ir a https://analytics.google.com
[ ] Crear propiedad "www.juanpabloloaiza.com"
[ ] Crear data stream:
    [ ] Plataforma: Web
    [ ] URL: https://www.juanpabloloaiza.com
    [ ] Nombre: "Main Website"
[ ] Copiar ID de medición
[ ] En WordPress:
    [ ] AIOSEO > Integrations > Google Analytics
    [ ] O: Site Kit > Google Analytics
    [ ] Pegar ID de medición
    [ ] Guardar

[ ] Configurar eventos:
    [ ] Conversión: Contacto (envío de formulario)
    [ ] Conversión: Descarga (si aplica)
    [ ] Conversión: Booking (if applica)

[ ] Reportes a crear:
    [ ] Traffic overview
    [ ] Landing pages performance
    [ ] Conversion funnels
    [ ] Device & browser breakdown
    [ ] Geographic data

Documentar:
- Propiedad GA4 ID: ___
- Data stream ID: ___
- Eventos de conversión: ___
```

#### Tarea 4.6: Configurar GSC Alerts
```
Tiempo: 30 minutos

Pasos:
[ ] Google Search Console
[ ] Ir a Settings (engranaje) > Email notifications
[ ] Habilitar alertas para:
    [ ] Coverage issues (critical): ✓
    [ ] Crawl anomalies: ✓
    [ ] Rich results issues: ✓
    [ ] Security & manual actions: ✓
    [ ] Mobile issues: ✓
[ ] Email: contacto@juanpabloloaiza.com

Alertas personalizadas:
[ ] Settings > Coverage
[ ] Click 3 puntos > "Notifications"
[ ] Alert when: Issues increase by 20%
```

#### Tarea 4.7: Crear Dashboard de Monitoreo
```
Tiempo: 45 minutos

Archivo: /docs/DASHBOARD_METRICAS_MENSUAL.md

Plantilla:
# Dashboard de Métricas Mensual
**Mes:** Abril 2026
**Período:** 2026-04-05 a 2026-05-05

## Traffic & SEO
| Métrica | Mes Actual | Meta | Variación |
|---------|-----------|------|-----------|
| Organic Traffic | ___ | +50% | ___ |
| Indexadas | ___ | +10 | ___ |
| Impresiones | ___ | +30% | ___ |
| CTR | ___ % | >3% | ___ |
| Posición Promedio | ___ | <10 | ___ |

## Performance
| Métrica | Desktop | Mobile | Meta |
|---------|---------|--------|------|
| LCP | ___s | ___s | <2.5s |
| FID | ___ms | ___ms | <100ms |
| CLS | ___ | ___ | <0.1 |
| PageSpeed Score | ___ | ___ | >85 |

## Conversiones
| Métrica | Count | Rate | Meta |
|---------|-------|------|------|
| Form Submissions | ___ | ___ % | +30% |
| Bookings | ___ | ___ % | +20% |
| Newsletter Signups | ___ | ___ % | +50% |

## Notas
- Cambios realizados este mes: ___
- Problemas detectados: ___
- Acciones próximo mes: ___
```

---

## ✅ CHECKLIST FINAL - SEMANA 4

### Verificaciones Post-Optimización (Viernes)

```
SEGURIDAD
[ ] Wordfence activo y monitoreando
[ ] 2FA activado en todos los admins
[ ] Backups automáticos funcionando
[ ] Permisos de usuarios revisados

SEO TÉCNICO
[ ] Schema markup completado y validado
[ ] Sitemaps incluyen imágenes
[ ] URLs acortadas con redirects 301
[ ] Taxonomía consolidada
[ ] GSC sin errores críticos

CONTENIDO
[ ] Alt text completado en 100% de imágenes
[ ] Internal linking implementado
[ ] Página 638 eliminada/reparada
[ ] Todas las páginas tienen SEO meta

MULTIMEDIA
[ ] JPGs convertidos a WebP
[ ] 14 videos subidos a YouTube
[ ] Embeds YouTube reemplazando MP4
[ ] Lazy loading activado

PERFORMANCE
[ ] Minificación CSS/JS activada
[ ] CDN Cloudflare configurado
[ ] Plugins innecesarios desactivados
[ ] WP Super Cache optimizado

MONITOREO
[ ] Google Analytics 4 configurado
[ ] GSC alerts activadas
[ ] Dashboard de métricas creado
[ ] Baseline guardado para comparación

DOCUMENTACIÓN
[ ] Todos los documentos de auditoría guardados
[ ] Plan de acción completado
[ ] Resultados documentados
[ ] Próximas acciones listadas
```

---

## 📊 RESULTADOS ESPERADOS A 30 DÍAS

### Antes vs Después

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| PageSpeed Mobile | ??? | 80-85 | +40-50% |
| LCP | ~3.5s | <2.5s | -29% |
| Organic Traffic | ~100 | ~150 | +50% |
| Indexadas | ??? | ??? | +5-10 |
| Top 10 Keywords | ??? | +10 | Significativa |
| Seguridad Score | 3/10 | 8/10 | +167% |

---

## 📅 PRÓXIMAS ACCIONES (MES 2)

- [ ] Crear pillar content pages por categoría
- [ ] Implementar newsletter opt-in
- [ ] Crear más contenido (1-2 posts/mes)
- [ ] Expandir contenido a YouTube (clips cortos)
- [ ] Crear case studies de clientes
- [ ] Implementar testimonials widget
- [ ] Análisis de competencia

---

**Plan Creado:** 2026-04-04  
**Inicio Recomendado:** 2026-04-05  
**Finalización Esperada:** 2026-05-05  
**Autor:** Sistema de Investigación MCP my-site
