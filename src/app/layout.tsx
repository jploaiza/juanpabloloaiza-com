import type { Metadata } from "next";
import { Cormorant_Garamond, Cinzel, Inter } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import WhatsAppButton from "@/components/WhatsAppButton";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Regresa a tus Vidas Pasadas - Hipnoterapia de Regresión | Juan Pablo Loaiza",
  description: "Hipnoterapia de regresión a vidas pasadas y liberación de entidades espirituales. Descubre el origen de tus conflictos y transforma tu vida. Sesiones vía Zoom en todo el mundo.",
  keywords: "regresión a vidas pasadas, hipnoterapia, liberación espiritual, traumas, sanación",
  openGraph: {
    title: "Regresa a tus Vidas Pasadas - Hipnoterapia de Regresión",
    description: "Hipnoterapia especializada en regresión a vidas pasadas y liberación de entidades espirituales",
    url: "https://juanpabloloaiza-com.vercel.app",
    siteName: "Juan Pablo Loaiza",
    locale: "es_ES",
    type: "website",
  },
  icons: {
    icon: "/assets/logo.webp",
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
    name: "Juan Pablo Loaiza - Hipnoterapia de Regresión a Vidas Pasadas",
    description: "Hipnoterapia especializada en regresión a vidas pasadas y liberación de entidades espirituales",
    url: "https://juanpabloloaiza-com.vercel.app",
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
      className={`${cormorant.variable} ${cinzel.variable} ${inter.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <meta name="google-site-verification" content="your-verification-code" />
      </head>
      <body className="min-h-full flex flex-col bg-black text-white">
        {children}
        <WhatsAppButton />
        <ScrollToTop />
      </body>
    </html>
  );
}
