import Header from "@/components/Header";
import HeroSection from "@/components/sections/HeroSection";
import ProcessSection from "@/components/sections/ProcessSection";
import OriginSection from "@/components/sections/OriginSection";
import TherapySection from "@/components/sections/TherapySection";
import FAQSection from "@/components/sections/FAQSection";
import EntityLiberationSection from "@/components/sections/EntityLiberationSection";
import AdmissionSection from "@/components/sections/AdmissionSection";
import BlogSection from "@/components/sections/BlogSection";
import ContactSection from "@/components/sections/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      {/* Preload LCP hero image only on the homepage */}
      <link
        rel="preload"
        as="image"
        href="https://res.cloudinary.com/dvudfdhoi/image/upload/f_auto,q_auto/main-juanpabloloaiza-regresion-vidas-pasadas_u6gseu"
        // @ts-expect-error fetchpriority valid HTML not yet in React types
        fetchpriority="high"
      />
      <Header />
      <div className="pt-16">
        <section id="home">
          <HeroSection />
        </section>
        <section id="ComoFunciona">
          <ProcessSection />
        </section>
        <section id="origen">
          <OriginSection />
        </section>
        <section id="QueEsTRVP">
          <TherapySection />
        </section>
        <section id="PreguntasFrecuentes">
          <FAQSection />
        </section>
        <section id="liberacion">
          <EntityLiberationSection />
        </section>
        <section id="ListaDeAdmision">
          <AdmissionSection />
        </section>
        <section id="blog">
          <BlogSection />
        </section>
        <section id="contacto">
          <ContactSection />
        </section>
      </div>
      <Footer />
    </main>
  );
}
