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
