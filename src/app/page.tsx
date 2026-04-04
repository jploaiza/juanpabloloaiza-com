import Header from "@/components/Header";
import HeroSection from "@/components/sections/HeroSection";
import ServicesSection from "@/components/sections/ServicesSection";
import BlogSection from "@/components/sections/BlogSection";
import AdmissionForm from "@/components/sections/AdmissionForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Header />
      <div className="pt-16">
        <section id="home">
          <HeroSection />
        </section>
        <section id="services">
          <ServicesSection />
        </section>
        <section id="blog">
          <BlogSection />
        </section>
        <section id="admission">
          <AdmissionForm />
        </section>
      </div>
      <Footer />
    </main>
  );
}
