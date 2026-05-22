import type { Metadata } from "next";
import { Source_Serif_4, DM_Sans, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "@/components/WhatsAppButton";
import PageTracker from "@/components/PageTracker";

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
  metadataBase: new URL("https://www.juanpabloloaiza.com"),
  title: "Regresión a Vidas Pasadas Online | Juan Pablo Loaiza",
  description: "Hipnoterapeuta de regresión a vidas pasadas. Sana traumas, libera patrones kármicos y transforma tu vida. Sesiones online: Chile, Colombia, México, Argentina.",
  keywords: "hipnoterapeuta online, regresión a vidas pasadas, hipnosis terapéutica, hipnoterapeuta Chile, hipnoterapeuta Colombia, hipnoterapeuta México, hipnoterapeuta Argentina, sesión de regresión online",
  alternates: { canonical: "https://www.juanpabloloaiza.com" },
  openGraph: {
    title: "Regresa a tus Vidas Pasadas — Hipnosis Terapéutica de Regresión | Juan Pablo Loaiza",
    description: "Hipnosis Terapéutica especializada en regresión a vidas pasadas y liberación de entidades espirituales. Sesiones vía Zoom en todo el mundo.",
    url: "https://www.juanpabloloaiza.com",
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
      "@id": "https://www.juanpabloloaiza.com/#service",
      name: "Juan Pablo Loaiza — Hipnosis Terapéutica de Regresión a Vidas Pasadas",
      description: "Hipnosis Terapéutica especializada en regresión a vidas pasadas y liberación de entidades espirituales. Sesiones individuales vía Zoom.",
      url: "https://www.juanpabloloaiza.com",
      telephone: "+56962081884",
      email: "contacto@juanpabloloaiza.com",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Medellín",
        addressCountry: "CO",
      },
      areaServed: [
        { "@type": "Country", name: "Chile" },
        { "@type": "Country", name: "Colombia" },
        { "@type": "Country", name: "México" },
        { "@type": "Country", name: "Argentina" },
        "Worldwide",
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
              name: "Regresión a Vidas Pasadas",
              description: "Sesión de hipnosis terapéutica para explorar vidas pasadas, sanar traumas y liberar patrones kármicos.",
            },
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Liberación de Entidades Espirituales",
              description: "Proceso terapéutico de identificación y liberación de entidades espirituales que afectan el bienestar.",
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
      "@id": "https://www.juanpabloloaiza.com/#person",
      name: "Juan Pablo Loaiza",
      url: "https://www.juanpabloloaiza.com",
      jobTitle: "Hipnoterapeuta y Terapeuta de Regresión a Vidas Pasadas",
      description: "Terapeuta especializado en hipnosis clínica y regresión a vidas pasadas. Sesiones individuales en línea para sanar traumas, superar miedos y liberar patrones kármicos.",
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
      worksFor: { "@id": "https://www.juanpabloloaiza.com/#service" },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://www.juanpabloloaiza.com/#website",
      name: "Juan Pablo Loaiza",
      url: "https://www.juanpabloloaiza.com",
      inLanguage: "es",
      publisher: { "@id": "https://www.juanpabloloaiza.com/#person" },
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
        <meta name="robots" content="index, follow, max-image-preview:large" />
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
