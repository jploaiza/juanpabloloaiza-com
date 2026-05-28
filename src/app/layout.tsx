import type { Metadata } from "next";
import { Source_Serif_4, DM_Sans, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "@/components/WhatsAppButton";
import PageTracker from "@/components/PageTracker";
import { SITE_URL } from "@/lib/site";

const sourceSerif4 = Source_Serif_4({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal"],
});

const libreBaskervilleCinzel = Libre_Baskerville({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Regresión a Vidas Pasadas Online | Juan Pablo Loaiza",
  description: "Hipnoterapeuta online especializado en regresión a vidas pasadas. Sesiones por Zoom para España, Chile y México. Sana el origen de tus patrones. Consulta gratuita.",
  keywords: "hipnoterapeuta online, hipnoterapeuta España, regresión a vidas pasadas online, hipnosis terapéutica, hipnoterapeuta Chile, hipnoterapeuta México, sesión de regresión online, terapia de regresión",
  robots: "index, follow, max-image-preview:large",
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    title: "Regresa a tus Vidas Pasadas — Hipnosis Terapéutica de Regresión | Juan Pablo Loaiza",
    description: "Hipnosis Terapéutica especializada en regresión a vidas pasadas y liberación de entidades espirituales. Sesiones vía Zoom en todo el mundo.",
    url: SITE_URL,
    siteName: "Juan Pablo Loaiza",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "https://res.cloudinary.com/dvudfdhoi/image/upload/w_1200,h_630,c_fill,f_jpg,q_auto/main-juanpabloloaiza-regresion-vidas-pasadas_u6gseu",
        width: 1200,
        height: 630,
        alt: "Juan Pablo Loaiza — Hipnosis Terapéutica de Regresión a Vidas Pasadas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hipnosis de Regresión a Vidas Pasadas | Juan Pablo Loaiza",
    description: "Hipnosis Terapéutica especializada en regresión a vidas pasadas y liberación de entidades espirituales.",
    images: ["https://res.cloudinary.com/dvudfdhoi/image/upload/w_1200,h_630,c_fill,f_jpg,q_auto/main-juanpabloloaiza-regresion-vidas-pasadas_u6gseu"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: "Juan Pablo Loaiza — Hipnosis Terapéutica y Regresión a Vidas Pasadas Online",
      description: "Hipnosis Terapéutica especializada en regresión a vidas pasadas. Sesiones individuales online vía Zoom para España, Chile y México.",
      url: SITE_URL,
      email: "contacto@juanpabloloaiza.com",
      availableChannel: {
        "@type": "ServiceChannel",
        serviceType: "Online via Zoom",
        availableLanguage: { "@type": "Language", name: "Spanish" },
      },
      areaServed: [
        { "@type": "Country", name: "Spain" },
        { "@type": "Country", name: "Chile" },
        { "@type": "Country", name: "Mexico" },
      ],
      availableLanguage: { "@type": "Language", name: "Spanish" },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Servicios Terapéuticos",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Regresión a Vidas Pasadas Online",
              description: "Sesión de hipnosis terapéutica online para explorar vidas pasadas, sanar traumas y liberar patrones kármicos. Disponible vía Zoom.",
            },
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Liberación de Entidades Espirituales Online",
              description: "Proceso terapéutico online de identificación y liberación de entidades espirituales que afectan el bienestar.",
            },
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
        ],
      },
      image: "https://res.cloudinary.com/dvudfdhoi/image/upload/w_1200,h_630,c_fill,f_jpg,q_auto/main-juanpabloloaiza-regresion-vidas-pasadas_u6gseu",
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Juan Pablo Loaiza",
      url: SITE_URL,
      jobTitle: "Hipnoterapeuta y Terapeuta de Regresión a Vidas Pasadas",
      description: "Terapeuta especializado en hipnosis clínica y regresión a vidas pasadas. Sesiones individuales en línea para España, Chile y México.",
      knowsAbout: [
        "Hipnosis Terapéutica",
        "Regresión a Vidas Pasadas",
        "Liberación de Entidades Espirituales",
        "Sanación Kármica",
        "Hipnosis Clínica",
      ],
      sameAs: [
        "https://www.instagram.com/juanpabloloaizao/",
        "https://www.youtube.com/@JuanPabloLoaizaO",
      ],
      worksFor: { "@id": `${SITE_URL}/#service` },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Juan Pablo Loaiza",
      url: SITE_URL,
      inLanguage: "es",
      publisher: { "@id": `${SITE_URL}/#person` },
    },
  ];

  return (
    <html
      lang="es"
      className={`${libreBaskervilleCinzel.variable} ${sourceSerif4.variable} ${dmSans.variable} ${libreBaskerville.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        {/* Preconnect to external asset hosts */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://media.juanpabloloaiza.com" />
        {structuredData.map((block, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
          />
        ))}
        {/* Auto-retry failed JS chunks (slow mobile connections) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  var _retried = {};
  window.addEventListener('error', function(e) {
    var src = e && e.target && (e.target.src || e.target.href);
    if (!src || _retried[src]) return;
    if (/(\\/_next\\/static\\/)/.test(src)) {
      _retried[src] = true;
      var el = e.target.cloneNode();
      el.src = src + '?r=' + Date.now();
      document.head.appendChild(el);
    }
  }, true);
})();
`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-black text-white">
        {children}
        <WhatsAppButton />
        <PageTracker />
      </body>
    </html>
  );
}
