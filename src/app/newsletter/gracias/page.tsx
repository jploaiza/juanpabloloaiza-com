import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Suscripción confirmada — Juan Pablo Loaiza",
  robots: { index: false, follow: false },
};

export default async function GraciasPage({ searchParams }: { searchParams: Promise<{ already?: string }> }) {
  const { already } = await searchParams;

  return (
    <main className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="border border-[#C5A059]/20 bg-[#16213e] p-10 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#C5A059]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#C5A059]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#C5A059]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#C5A059]" />

          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-4">
            {already ? "Ya confirmado" : "Suscripción confirmada"}
          </p>
          <h1 className="font-cinzel text-2xl text-white mb-4 leading-snug">
            {already ? "Ya formas parte" : "Bienvenido/a"}
          </h1>
          <p className="font-crimson text-base text-gray-400 leading-relaxed mb-8">
            {already
              ? "Tu correo ya estaba confirmado. Seguirás recibiendo artículos sobre terapia de regresión, hipnoterapia y autoconocimiento."
              : "Recibirás artículos sobre terapia de regresión, hipnoterapia y autoconocimiento directamente en tu correo. Sin spam, solo lo que vale la pena."}
          </p>
          <Link
            href="/blog"
            className="inline-block bg-[#C5A059] hover:bg-[#d4b06a] text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-8 py-3 transition"
          >
            Explorar el blog
          </Link>
        </div>
      </div>
    </main>
  );
}
