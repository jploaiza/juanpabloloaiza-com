export const revalidate = 3600;

import dynamic from "next/dynamic";
import Header from "@/components/Header";
import HeroSection from "@/components/sections/HeroSection";
import OriginSection from "@/components/sections/OriginSection";
import Footer from "@/components/Footer";

const ProcessSection = dynamic(() => import("@/components/sections/ProcessSection"));
const TherapySection = dynamic(() => import("@/components/sections/TherapySection"));
const FAQSection = dynamic(() => import("@/components/sections/FAQSection"));
const EntityLiberationSection = dynamic(() => import("@/components/sections/EntityLiberationSection"));
const AdmissionSection = dynamic(() => import("@/components/sections/AdmissionSection"));
const BlogSection = dynamic(() => import("@/components/sections/BlogSection"));
const ContactSection = dynamic(() => import("@/components/sections/ContactSection"));
import { createClient } from "@/lib/supabase/server";
import { toDisplayPost, type SupabasePost } from "@/lib/supabase/blog";

async function getBlogPosts() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, content, featured_image_url, tags, status, seo_title, seo_description, published_at, created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    return (data ?? []).map((p) => toDisplayPost(p as SupabasePost));
  } catch {
    return [];
  }
}

export default async function Home() {
  const blogPosts = await getBlogPosts();
  return (
    <main className="min-h-screen bg-black">
      {/* Preload LCP hero image only on the homepage */}
      <link
        rel="preload"
        as="image"
        href="https://res.cloudinary.com/dvudfdhoi/image/upload/w_1920,f_webp,q_80/main-juanpabloloaiza-regresion-vidas-pasadas_u6gseu"
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
          <BlogSection initialPosts={blogPosts} />
        </section>
        <section id="contacto">
          <ContactSection />
        </section>
      </div>
      <Footer />
    </main>
  );
}
