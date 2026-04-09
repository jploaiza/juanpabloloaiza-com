import type { Metadata } from "next";
import { Playfair_Display, Source_Serif_4, DM_Sans } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "@/components/WhatsAppButton";
import PageTracker from "@/components/PageTracker";

const playfairDisplay = Playfair_Display({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
});

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

export const metadata: Metadata = {
  metadataBase: new URL("https://juanpabloloaiza.com"),
  title: "Regresa a tus Vidas Pasadas — Hipnosis Terapéutica de Regresión | Juan Pablo Loaiza",
  description: "Hipnosis Terapéutica de regresión a vidas pasadas y liberación de entidades espirituales. Descubre el origen de tus conflictos y transforma tu vida. Sesiones vía Zoom en todo el mundo.",
  keywords: "regresión a vidas pasadas, hipnosis terapéutica, liberación espiritual, traumas, sanación, hipnosis terapéutica online, hipnoterapeuta, vidas pasadas zoom",
  alternates: { canonical: "https://juanpabloloaiza.com" },
  openGraph: {
    title: "Regresa a tus Vidas Pasadas — Hipnosis Terapéutica de Regresión | Juan Pablo Loaiza",
    description: "Hipnosis Terapéutica especializada en regresión a vidas pasadas y liberación de entidades espirituales. Sesiones vía Zoom en todo el mundo.",
    url: "https://juanpabloloaiza.com",
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
    title: "Regresa a tus Vidas Pasadas — Hipnosis Terapéutica de Regresión | Juan Pablo Loaiza",
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
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Juan Pablo Loaiza - Hipnosis Terapéutica de Regresión a Vidas Pasadas",
    description: "Hipnosis Terapéutica especializada en regresión a vidas pasadas y liberación de entidades espirituales",
    url: "https://juanpabloloaiza.com",
    telephone: "+56962081884",
    email: "contacto@juanpabloloaiza.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Medellín",
      addressCountry: "CO",
    },
    areaServed: "Worldwide",
    offers: {
      "@type": "Offer",
      name: "Regresión a Vidas Pasadas",
      description: "Terapia de hipnosis para explorar vidas pasadas y sanar traumas",
      priceCurrency: "USD",
    },
  };

  return (
    <html
      lang="es"
      className={`${playfairDisplay.variable} ${sourceSerif4.variable} ${dmSans.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        {/* Preconnect to external asset hosts */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://media.juanpabloloaiza.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <meta name="robots" content="index, follow, max-image-preview:large" />
      </head>
      <body className="min-h-full flex flex-col bg-black text-white">
        {children}
        <WhatsAppButton />
        <PageTracker />
      </body>
    </html>
  );
}
