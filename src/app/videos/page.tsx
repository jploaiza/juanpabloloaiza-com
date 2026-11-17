import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import Header from "@/components/Header";
import VideosContent from "./VideosContent";
import { VIDEO_POSTER } from "@/lib/videos";
import { VIDEOS_UPLOAD_DATE, isoDuration, videoItems, videoUrl } from "@/lib/videos-data";

export const metadata: Metadata = {
  title: "Videos de Hipnosis Terapéutica y Regresión a Vidas Pasadas | Juan Pablo Loaiza",
  description: "Biblioteca de videos informativos sobre hipnosis terapéutica de regresión a vidas pasadas, liberación de entidades espirituales y preguntas frecuentes. Resuelve tus dudas antes de comenzar.",
  alternates: { canonical: `${SITE_URL}/videos` },
  openGraph: {
    title: "Videos de Hipnosis Terapéutica y Regresión a Vidas Pasadas | Juan Pablo Loaiza",
    description: "Biblioteca de videos informativos sobre hipnosis terapéutica de regresión a vidas pasadas y liberación espiritual.",
    url: `${SITE_URL}/videos`,
    type: "website",
  },
};

const THUMBNAIL = `${SITE_URL}${VIDEO_POSTER}`;

const videoSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Videos de Hipnosis Terapéutica y Regresión a Vidas Pasadas",
  url: `${SITE_URL}/videos`,
  numberOfItems: videoItems.length,
  itemListElement: videoItems.map((v, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "VideoObject",
      name: v.title,
      description: v.description,
      contentUrl: videoUrl(v),
      thumbnailUrl: THUMBNAIL,
      duration: isoDuration(v.durationSec),
      uploadDate: VIDEOS_UPLOAD_DATE,
      inLanguage: "es",
      author: { "@type": "Person", name: "Juan Pablo Loaiza", url: SITE_URL },
    },
  })),
};

export default function VideosPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
      />
      <Header />
      <VideosContent />
    </>
  );
}
