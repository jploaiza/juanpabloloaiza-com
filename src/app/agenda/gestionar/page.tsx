import { Suspense } from "react";
import GestionarContent from "./GestionarContent";
import Header from "@/components/Header";

export const metadata = { title: "Gestionar Reserva — Juan Pablo Loaiza", robots: "noindex" };

export default function GestionarPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen w-full bg-[#0a1628] pt-24" style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <Suspense fallback={<div className="text-gray-500 font-crimson text-center py-20">Cargando…</div>}>
            <GestionarContent />
          </Suspense>
        </div>
      </main>
    </>
  );
}
