/**
 * Asigna imágenes de Pexels a todos los posts del blog que no tienen featured_image_url.
 * Uso: node scripts/add-blog-images.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Leer .env.local manualmente
function loadEnv() {
  const envPath = path.join(__dirname, "../.env.local");
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = process.env[key] ?? value;
    }
  }
}

loadEnv();

const PEXELS_KEY = process.env.PEXELS_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!PEXELS_KEY) { console.error("❌ PEXELS_API_KEY no encontrada en .env.local"); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error("❌ Variables de Supabase no encontradas"); process.exit(1); }

// Mapa slug → query de Pexels (ajustado por tema del artículo)
const SLUG_QUERIES = {
  // Hipnosis general
  "que-es-la-hipnoterapia": "hypnosis therapy dark abstract",
  "hipnosis-terapeutica-online": "online therapy screen dark",
  "hipnoterapeuta-online": "therapist online video call",
  "hipnoterapeuta": "therapist healing professional",
  "hipnoterapeuta-chile": "chile landscape misty mountain",
  "hipnoterapeuta-mexico": "mexico landscape mystical",
  "hipnoterapeuta-trauma-chile": "healing trauma misty forest dark",
  "psicologo-vs-hipnoterapeuta": "therapy choice path forest",
  "psicologo-vs-coach-vs-hipnoterapeuta": "professional choice direction",
  "diferencia-entre-hipnosis-y-psicologia": "mind psychology dark abstract",
  "diferencia-entre-hipnosis-y-meditacion": "meditation vs mind dark",
  "meditacion-vs-hipnosis": "meditation candle dark calm",
  "como-la-hipnosis-cambia-el-cerebro": "brain neural network dark glow",
  "hipnosis-para-ansiedad": "anxiety calm breathing dark",
  "hipnosis-para-traumas": "trauma healing light dark",
  "hipnosis-para-el-duelo": "grief loss dark light candle",
  "hipnosis-para-la-autoestima": "self confidence mirror light",
  "hipnosis-para-superar-una-ruptura": "heartbreak healing solitude dark",
  "hipnosis-para-adelgazar": "transformation body wellness",
  "hipnosis-para-el-miedo-al-abandono": "abandonment fear alone dark room",
  "hipnosis-para-dejar-de-fumar": "smoke freedom breath dark",
  "hipnosis-para-sanar-el-nino-interior": "child innocence light healing",
  "hipnosis-guiada-meditacion-vidas-pasadas": "guided meditation waves dark",
  "que-se-siente-en-hipnosis": "trance calm mind dark abstract",
  "que-pasa-en-una-sesion-de-hipnosis": "therapy session calm dark",
  "es-peligrosa-la-hipnosis-de-regresion": "safety protection light dark",
  "cuantas-sesiones-de-hipnosis-necesito": "journey path steps dark",

  // Regresión a vidas pasadas
  "que-es-la-regresion-a-vidas-pasadas": "past lives universe galaxy dark",
  "regresion-a-vidas-pasadas-online": "online spiritual session dark",
  "vidas-pasadas-como-saber-si-existen": "universe stars existence dark",
  "vidas-pasadas-como-recordarlas": "memory time spiral dark",
  "regresion-cuantica-que-es": "quantum universe dark abstract",
  "primera-sesion-de-regresion-que-esperar": "first step journey dark light",
  "sesion-de-regresion-a-vidas-pasadas": "regression session spiritual dark",
  "como-funciona-la-hipnosis-de-regresion": "spiral time regression dark",
  "como-funciona-una-sesion-de-regresion": "therapy process steps dark",
  "sesion-de-hipnosis-online": "online session screen calm dark",

  // Métodos y figuras
  "metodo-brian-weiss": "book library wisdom dark",
  "michael-newton-vidas-entre-vidas": "soul journey between lives universe",
  "qhht-que-es": "quantum healing hypnosis technique dark",
  "psicologia-transpersonal": "transpersonal psychology universe mind",

  // Trauma y heridas
  "trauma-de-infancia-como-sanar": "child wound healing dark light",
  "trauma-complejo-tratamiento": "complex trauma healing therapy dark",
  "terapia-para-traumas-psicologicos": "psychological trauma therapy healing",
  "el-cuerpo-guarda-el-trauma": "body trauma stored dark",
  "epigenetica-y-trauma": "dna cell biology dark science",

  // Emociones y condiciones
  "ansiedad-generalizada-tratamiento": "anxiety stress dark rain",
  "terapia-para-ansiedad": "anxiety calm breathing forest",
  "terapia-para-la-depresion": "depression dark alone light hope",
  "depresion-existencial-toc-alternativo": "existential depression dark empty room",
  "terapia-para-el-duelo": "grief mourning candle dark",
  "terapia-para-fobias": "fear dark shadow abstract",
  "insomnio-origen-emocional": "insomnia night awake dark bed",
  "cuando-la-medicacion-no-funciona": "pills medication alternative dark",
  "la-psicologia-no-me-ayuda": "help alone dark light hope",

  // Relaciones
  "como-sanar-relaciones-toxicas": "toxic relationship chains dark",
  "dependencia-emocional": "emotional dependency hands dark",
  "no-puedo-superar-una-ruptura": "heartbreak alone dark room",
  "terapia-para-superar-infidelidad": "infidelity betrayal dark shadows",
  "alma-gemela-que-es": "soulmate connection cosmic dark",

  // Identidad y autoconocimiento
  "autoconocimiento-y-desarrollo-personal": "self discovery mirror introspection",
  "terapia-para-la-autoestima": "self esteem confidence light",
  "nino-interior-herido": "inner child healing dark light",
  "familia-disfuncional-como-sanar": "family healing dark light",
  "no-me-siento-en-mi-lugar-en-el-mundo": "misfit alone world dark",
  "que-es-crisis-de-identidad": "identity crisis mirror dark",
  "crisis-espiritual-que-es": "spiritual crisis dark light awakening",
  "despertar-espiritual-sintomas": "spiritual awakening light dark",

  // Cuerpo y psicosomático
  "enfermedades-emocionales-psicosomaticas": "psychosomatic body pain dark",
  "enfermedades-psicosomaticas": "body pain emotional dark abstract",
  "dolor-fisico-sin-causa-medica": "body pain mysterious dark",
  "terapia-para-el-trastorno-de-apego": "attachment bond connection dark",

  // Espiritual
  "yo-superior-que-es": "higher self spiritual light dark",
  "guias-espirituales-como-conectar": "spiritual guide light dark misty",
  "psicologia-transpersonal": "transpersonal cosmic dark abstract",
  "reprogramacion-del-subconsciente": "subconscious mind reprogramming dark",
  "cuando-vives-para-todos-menos-para-ti": "self sacrifice exhaustion dark",
  "energia-que-reprimes-quien-la-usa": "suppressed energy dark shadow",
  "cuando-el-rechazo-a-tu-familia-no-es-tuyo": "family roots dark inheritance",

  // Testimonios y experiencias
  "testimonios-hipnosis-regresion": "testimonial experience healing light",
  "hipnosis-para-sanar-el-nino-interior": "inner child healing light dark",

  // Hipnoterapia precio / info práctica
  "hipnoterapia-precio": "therapy session professional dark",
};

const DEFAULT_QUERIES = {
  hipnosis: "hypnosis therapy dark abstract mind",
  regresion: "regression past lives universe dark",
  trauma: "trauma healing dark light",
  terapia: "therapy healing light dark",
  espiritualidad: "spiritual mystical dark light",
  default: "meditation healing dark abstract light",
};

function getQuery(slug, title) {
  if (SLUG_QUERIES[slug]) return SLUG_QUERIES[slug];
  // Fallback por tema
  if (slug.includes("hipnos")) return DEFAULT_QUERIES.hipnosis;
  if (slug.includes("regresion") || slug.includes("vidas-pasadas")) return DEFAULT_QUERIES.regresion;
  if (slug.includes("trauma")) return DEFAULT_QUERIES.trauma;
  if (slug.includes("terapia")) return DEFAULT_QUERIES.terapia;
  if (slug.includes("espiritual") || slug.includes("despertar")) return DEFAULT_QUERIES.espiritualidad;
  return DEFAULT_QUERIES.default;
}

async function searchPexels(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) throw new Error(`Pexels error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const photo = data.photos?.[0];
  if (!photo) return null;
  // Usar large2x para calidad 1200×800, recortable a 1200×630
  return photo.src.large2x || photo.src.large;
}

async function updatePost(id, imageUrl) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({ featured_image_url: imageUrl }),
  });
  if (!res.ok) throw new Error(`Supabase error ${res.status}`);
}

async function main() {
  console.log("🔍 Obteniendo posts sin imagen...");
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/blog_posts?select=id,slug,title&or=(featured_image_url.is.null,featured_image_url.eq.)&order=created_at.desc`,
    {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  const posts = await res.json();
  console.log(`📝 ${posts.length} posts sin imagen\n`);

  let ok = 0, fail = 0;

  for (const post of posts) {
    const query = getQuery(post.slug, post.title);
    try {
      const imageUrl = await searchPexels(query);
      if (!imageUrl) {
        console.log(`⚠️  Sin resultado Pexels: ${post.slug} (query: "${query}")`);
        fail++;
        continue;
      }
      await updatePost(post.id, imageUrl);
      console.log(`✅ ${post.slug}`);
      ok++;
      // Respetar rate limit de Pexels (200 req/hora)
      await new Promise(r => setTimeout(r, 350));
    } catch (err) {
      console.error(`❌ ${post.slug}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\n🏁 Terminado: ${ok} actualizados, ${fail} errores`);
}

main();
